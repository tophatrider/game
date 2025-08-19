import EventRelay from "./core/EventRelay.js";
import Events from "./core/Events.js";
import ColorScheme from "./core/services/ColorScheme.js";
import FileManager from "./core/services/FileManager.js";
import ConfigStorage from "./core/storage/ConfigStorage.js";
import GameInputManager from "./core/input/GameInputManager.js";
import PointerHandler from "./core/input/PointerHandler.js";
import Scene from "./scenes/Scene.js";
import FileSystemStorage from "./core/storage/FileSystemStorage.js";

export default class Game extends EventRelay {
	static Events = Events;

	#openFile = null; // workingFile

	// game loop related variables
	#frames = 0;
	#lastFrame = null;
	#lastFrameTime = performance.now();
	#lastTime = performance.now();
	#timer = performance.now();
	#updates = 0;
	config = { maxFrameRate: null, tickRate: 50 };
	interpolation = true;
	stats = { fps: 0, ups: 0 };

	colorScheme = new ColorScheme;
	fileManager = new FileManager;
	fileSystemStorage = new FileSystemStorage;
	mouse = new PointerHandler;
	scene = new Scene(this);
	inputManager = new GameInputManager(this);
	settings = new ConfigStorage(this._handleSettingsChange.bind(this));
	constructor(canvas) {
		super();

		Object.defineProperties(this, {
			_frameInterval: { value: 1e3 / this.config.maxFrameRate, writable: true },
			_progress: { value: 0, writable: true },
			_updateInterval: { value: 1e3 / this.config.tickRate, writable: true },
			_wasPaused: { value: null, writable: true }
		});

		this.setCanvas(canvas);
		this.colorScheme.on('paletteChange', this._handleColorPaletteChange.bind(this));
		this.scene.camera.on('focalPointChange', this._handleCameraFocalPointChange.bind(this));
		this._handleSettingsChange(this.settings);
		// this.fileSystemStorage.on('open', async () => {
		// 	if (!this.settings.autoSave) return;
		// 	await this.fileSystemStorage.open('savedState', { cache: true });
		// 	if (this.settings.autoSaveInterval > 0) {
		// 		const date = new Intl.DateTimeFormat(navigator.language, { dateStyle: 'short', timeStyle: 'medium' }).format().replace(/[/\\?%*:|"<>]/g, '-').replace(/,+\s*/, '_').replace(/\s+.*$/, '');
		// 		this.fileSystemStorage.open(date, { overwrite: false });
		// 		setInterval(() => {
		// 			this.fileSystemStorage.write(date, this.scene.track.toString(), { saveAndReplace: true });
		// 		}, this.settings.autoSaveInterval * 1e3);
		// 	}

		// 	// Only show toast if the game wasn't closed properly!
		// 	// if ('toasts' in window) {
		// 	// 	const toast = Object.assign(document.createElement('div'), {
		// 	// 		className: 'toast',
		// 	// 		innerText: 'Would you like to restore the track you were last working on? '
		// 	// 	});
		// 	// 	toast.append(Object.assign(document.createElement('button'), {
		// 	// 		innerText: 'Yes',
		// 	// 		onclick: () => {
		// 	// 			toast.remove();
		// 	// 			fileData.text().then(code => {
		// 	// 				this.init();
		// 	// 				this.scene.track.write(code);
		// 	// 			});
		// 	// 			// fileHandle.createWritable()
		// 	// 		}
		// 	// 	}), Object.assign(document.createElement('button'), {
		// 	// 		innerText: 'No',
		// 	// 		onclick: () => toast.remove()
		// 	// 	}));
		// 	// 	this.constructor.serveToast(toast);
		// 	// }
		// });

		this.listen();
	}

	_handleCameraFocalPointChange(focalPoint) {
		if (!focalPoint) {
			this.emit(Events.PlayerFocusLost);
			return;
		}

		this.emit(Events.PlayerFocusChange, focalPoint.parent.player);
	}

	_handleColorPaletteChange(palette) {
		this.ctx.fillStyle = palette.background;
		this.ctx.strokeStyle = palette.track;
		this.scene.sectors.config();
	}

	_handleSettingsChange(settings) {
		for (const setting in settings) {
			let value = settings[setting];
			switch (setting) {
			case 'brightness':
				// this.canvas.style[(value === 100 ? 'remove' : 'set') + 'Property']('backdrop-filter', 'brightness(' + value + '%)');
				this.canvas.style[(value === 100 ? 'remove' : 'set') + 'Property']('filter', 'brightness(' + value + '%)');
				break;
			case 'restorePreviousSession':
				// restore session..
				value && console.warn('Failed to restore session.');
				break;
			case 'theme':
				this.colorScheme.set(value);
			}
		}

		this.emit(Events.SettingsChange, this.settings);
	}

	listen() {
		super.listen(document, 'fullscreenchange', () => navigator.keyboard.lock(['Escape']), { passive: true });

		'navigation' in window && super.listen(navigation, 'navigate', this.destroy.bind(this), { passive: true });
		super.listen(window, 'load', () => window.dispatchEvent(new Event('online')));
		super.listen(window, 'beforeunload', async event => {
			if (!this.settings.autoSave || !this.fileSystemStorage.writables.has('savedState')) return;
			event.preventDefault();
			event.returnValue = false;
			const writable = this.fileSystemStorage.writables.get('savedState');
			// const writer = await writable.getWriter();
			// console.log(writable)
			await writable.write(this.scene.track.toString());
			await writable.close();
			return event.returnValue;
		});
		super.listen(window, 'pagehide', e => !e.persisted && this.destroy());
		super.listen();
		this.inputManager.listen();
		console.debug('[Game] Listeners bound');
	}

	init(options = {}) {
		this.#lastFrame && cancelAnimationFrame(this.#lastFrame);
		options = Object.assign({}, arguments[0]);
		this.#openFile = null;
		this.scene.init(options);
		options.default && this.scene.track.write('-18 1i 18 1i###BMX');
		options.code && this.scene.track.write(options.code);
		this.#lastFrame = requestAnimationFrame(this.render.bind(this));
	}

	resetFrameProgress() {
		this.#lastTime = performance.now();
		this._progress = 0;
		this.config.maxFrameRate && (this.#lastFrameTime = this.#lastTime)
	}

	#lastRafTime = null;
	#rafDeltaHist = [];
	render(time) {
		// DEBUG
		if (this.#lastRafTime !== null) {
			let rafDelta = time - this.#lastRafTime;
			(this.#rafDeltaHist ||= []).push(rafDelta);
			if (this.#rafDeltaHist.length > 300) this.#rafDeltaHist.shift();
			if (rafDelta > 20) console.warn(`Slow rAF frame: ${Math.round(rafDelta)}ms`);
		}
		this.#lastRafTime = time;
		// DEBUG END

		this.#lastFrame = requestAnimationFrame(this.render.bind(this));
		if (this._wasPaused !== this.scene.paused) {
			this._wasPaused = this.scene.paused;
			!this.scene.paused && this.resetFrameProgress();
			this.#lastTime = time;
		}

		let delta = time - this.#lastTime;
		if (delta >= 1e3) {
			delta = this._updateInterval;
		}

		this._progress += delta / this._updateInterval;
		// if (this._progress >= 1 && this.scene.paused) {
		// 	this.freeze();
		// 	return;
		// }

		this.#lastTime = time;
		while (this._progress >= 1) {
			this._progress--;
			if (this.emit(Events.Tick, this.scene.currentTime)) continue;
			!this.scene.track.processing && this.scene.fixedUpdate();
			this.#updates++
		}

		if (!this.config.maxFrameRate || time - this.#lastFrameTime >= this._frameInterval) {
			this.config.maxFrameRate && (this.#lastFrameTime = time);
			this.scene.update(this._progress);
			this.scene.lateUpdate(this._progress);
			this.scene.render(this.ctx, this.colorScheme.palette);
			this.scene.renderHUD(this.ctx, this.colorScheme.palette);
			this.emit(Events.Draw, this.ctx);
			this.#frames++;
		}

		if (time - this.#timer >= 1e3) {
			this.#timer = time,
			this.stats.ups = this.#updates,
			this.stats.fps = this.#frames,
			this.#updates = 0,
			this.#frames = 0;
			this.emit(Events.Stats, {
				fps: this.stats.fps,
				ups: this.stats.ups
			})
		}
	}

	createRecorder(callback) {
		this.mediaRecorder = new MediaRecorder(this.canvas.captureStream(50));
		this.mediaRecorder.addEventListener('dataavailable', ({ data }) => {
			const objectURL = URL.createObjectURL(data);
			typeof callback == 'function' && callback(objectURL);
			this.emit(Events.RecorderStop, objectURL);
		});
		this.mediaRecorder.addEventListener('start', event => {
			this.emit(Events.RecorderStart, event);
		});
		return this.mediaRecorder;
	}

	toggleFullscreen() {
		document.fullscreenElement ? document.exitFullscreen() : this.container.requestFullscreen();
	}

	async togglePictureInPicture(options) {
		if (document.pictureInPictureElement) {
			await this.pip.pause();
			await document.exitPictureInPicture();
			return;
		}

		const stream = this.canvas.captureStream(60);
		if (!this.pip) {
			const video = document.createElement('video');
			Object.defineProperty(this, 'pip', { value: video, writable: true });
			video.srcObject = stream;
			video.muted = true;
			video.playsInline = true;
		}

		await this.pip.play();
		return this.pip.requestPictureInPicture(options);
	}

	setCanvas(canvas) {
		this.canvas = canvas;
		// const offscreen = this.canvas.transferControlToOffscreen();
		// this.scene.helper.postMessage({ canvas: offscreen }, [offscreen]);
		this.ctx = this.canvas.getContext('2d', {
			alpha: false,
			desynchronized: true
		});
		// this.container = canvas.parentElement;
		// this.gui = this.container.shadowRoot || this.container.attachShadow({ mode: 'open' });
		this.configCanvas();
		this.mouse.setTarget(canvas);
	}

	// create a separate overlaying canvas for scenery lines with a transparent background
	configCanvas() {
		this.scene.camera.setViewport(this.canvas.width / window.devicePixelRatio, this.canvas.height / window.devicePixelRatio);
		this.scene.sectors.updateVisible();
		// this.scene.camera.applyTransform(this.ctx);
		this.ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
		this.ctx.fillStyle = this.colorScheme.palette.background;
		this.ctx.lineWidth = Math.max(2 * this.scene.camera.zoom, .5);
		this.ctx.lineCap = 'round';
		this.ctx.lineJoin = 'round';
		this.ctx.strokeStyle = this.colorScheme.palette.track; // accent?
		// this.ctx.font = '20px Arial';
		// this.ctx.textAlign = 'center';
		this.ctx.textBaseline = 'middle';
		// if shrinking sectors via drawImage:
		this.ctx.imageSmoothingEnabled = !1;
		this.ctx.imageSmoothingQuality = 'low';
		this.ctx.mozImageSmoothingEnabled = !1;
		this.ctx.oImageSmoothingEnabled = !1;
		this.ctx.webkitImageSmoothingEnabled = !1;
	}

	setContainer(container) {
		this.container = container;
		this.gui = this.container.shadowRoot || this.container.attachShadow({ mode: 'open' });
	}

	load(...codes) {
		if (codes.length < 1) return this.openFile();
		if (Array.isArray(codes[0])) return this.load(...codes[0]);
		this.init({ write: true });
		for (const code of codes.filter(code => typeof code == 'string'))
			this.scene.track.write(code);
	}

	async loadFile(...blobs) {
		if (Array.isArray(blobs[0])) return this.loadFile(...blobs[0]);
		this.load(await Promise.all(blobs
			.filter(blob => blob instanceof Blob)
			.map(blob => blob.text())
		));
	}

	async openFile({ multiple = false } = {}) {
		if ('showOpenFilePicker' in window) {
			const fileHandles = await this.fileManager.io.open({ multiple, persistent: true });
			if (!fileHandles?.length) return;

			await this.loadFile(...await Promise.all(fileHandles.map(handle => handle.getFile())));
			if (!multiple) this.#openFile = fileHandles[0];
			return;
		}

		this.loadFile(...await this.fileManager.io.upload(...arguments));
	}

	async save() {
		if (this.#openFile) {
			await this.#openFile.createWritable().then(writable => {
				writable.write(this.scene.track.toString()).then(() => {
					if ('toasts' in window) {
						this.constructor.serveToast(Object.assign(document.createElement('div'), {
							className: 'toast',
							innerText: 'Changes successfully saved!'
						}), 3e3);
					}

					return writable.close();
				});
			});
			return true;
		}

		return this.saveAs();
	}

	saveAs() {
		const dateTime = new Intl.DateTimeFormat('en-CA', { dateStyle: 'short', timeStyle: 'medium' })
			.format()
			.replace(/[/\\?%*:|"<>]/g, '-')
			.replace(/,+\s*/, '_')
			.replace(/\s+.*$/, '');
		return this.fileManager.io.save(this.scene.track.toString(), 'bhr_track-' + dateTime);
	}

	reset() {
		this.init({ default: true, write: true });
	}

	destroy() {
		cancelAnimationFrame(this.#lastFrame);
		super.destroy();
		this.mouse.destroy();
		this.mouse = null;
		this.inputManager.destroy();
		this.canvas = null;
		this.ctx = null;
		this.container = null;
		this.gui = null;
		this.scene.destroy();
		this.scene = null;
		this.settings = null;
		this.fileSystemStorage.destroy();
		this.fileSystemStorage = null;
	}

	static serveToast(toast, timeout) {
		if ('toasts' in window) {
			toasts.appendChild(toast).scrollIntoView({ block: 'end' });
			timeout && setTimeout(() => toast.remove(), timeout);
		}
	}
}