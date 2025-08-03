import EventRelay from "./core/EventRelay.js";
import Events from "./core/Events.js";
import ColorScheme from "./core/services/ColorScheme.js";
import ConfigStorage from "./core/storage/ConfigStorage.js";
import PointerHandler from "./core/input/PointerHandler.js";
import Vector from "./core/geometry/Vector.js";
import Scene from "./scenes/Scene.js";
import FileSystemStorage from "./core/storage/FileSystemStorage.js";

export default class Game extends EventRelay {
	static Events = Events;

	#openFile = null;

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
	fileSystemStorage = new FileSystemStorage;
	mouse = new PointerHandler;
	scene = new Scene(this);
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
		this.mouse.on('cancel', this._handlePointerUp.bind(this));
		this.mouse.on('down', this._handlePointerDown.bind(this));
		this.mouse.on('move', this._handlePointerMove.bind(this));
		this.mouse.on('up', this._handlePointerUp.bind(this));
		this.mouse.on('wheel', this._handleScroll.bind(this));

		this.colorScheme.on('paletteChange', this._handleColorPaletteChange.bind(this));
		this._handleSettingsChange(this.settings);
		// this.fileSystemStorage.on('open', async () => {
		// 	if (!this.settings.autoSave) return;
		// 	await this.fileSystemStorage.open('savedState', { cache: true });
		// 	if (this.settings.autoSaveInterval > 0) {
		// 		const date = new Intl.DateTimeFormat(navigator.language, { dateStyle: 'short', timeStyle: 'medium' }).format().replace(/[/\\?%*:|"<>]/g, '-').replace(/,+\s*/, '_').replace(/\s+.*$/, '');
		// 		this.fileSystemStorage.open(date, { overwrite: false });
		// 		setInterval(() => {
		// 			this.fileSystemStorage.write(date, this.scene.toString(), { saveAndReplace: true });
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
		// 	// 				this.scene.read(code);
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

	_handleColorPaletteChange(palette) {
		this.ctx.fillStyle = palette.background;
		this.ctx.strokeStyle = palette.track;
		this.scene.sectors.config();
	}

	async _handleKeydown(event) {
		switch (event.key.toLowerCase()) {
		case 'arrowleft': {
			const focusedPlayerGhost = this.scene.ghosts.find(playerGhost => playerGhost.vehicle.hitbox == this.scene.camera.controller.focalPoint);
			if (focusedPlayerGhost) {
				this.scene.paused = true;
				focusedPlayerGhost.playbackTicks = Math.max(0, focusedPlayerGhost.playbackTicks - 5);
				focusedPlayerGhost.ghostIterator.next(focusedPlayerGhost.playbackTicks);
			}
			break;
		}

		case 'arrowright': {
			const focusedPlayerGhost = this.scene.ghosts.find(playerGhost => playerGhost.vehicle.hitbox == this.scene.camera.controller.focalPoint);
			if (focusedPlayerGhost) {
				this.scene.paused = true;
				focusedPlayerGhost.ghostIterator.next(focusedPlayerGhost.playbackTicks + 5);
			}
			break;
		}

		case 'backspace':
			if (event.shiftKey) {
				this.scene.restoreCheckpoint();
				break;
			}

			this.scene.removeCheckpoint();
			break;
		case 'enter':
			event.preventDefault();
			if (event.shiftKey) {
				this.scene.restoreCheckpoint();
				break;
			}

			this.scene.returnToCheckpoint();
			break;
		case 'r':
			if (event.ctrlKey) {
				if (event.shiftKey) {
					this.mediaRecorder.stop();
				}

				this.createRecorder();
				this.mediaRecorder.start();
				if ('recorder' in window) {
					recorder.style.removeProperty('display');
				}
			}
			break;
		case 'tab': {
			event.preventDefault();
			let playersToFocus = Array(...this.scene.players, ...this.scene.ghosts).map(player => player.vehicle.hitbox);
			let index = playersToFocus.indexOf(this.scene.camera.controller.focalPoint) + 1;
			if (playersToFocus.length <= index) {
				index = 0;
			}

			// if player is a ghost, show time-progress bar on the bottom
			this.scene.camera.controller.setFocalPoint(playersToFocus[index]);
			this.scene.paused = false;
			this.scene.frozen = false;

			this.emit(Events.PlayerFocusChange, playersToFocus[index]);
			break;
		}

		case '-':
			event.ctrlKey && event.preventDefault();
			this.scene.camera.zoom -= .2;
			break;
		case '+':
		case '=':
			event.ctrlKey && event.preventDefault();
			this.scene.camera.zoom += .2;
			break;
		case 'p':
		case ' ':
			event.preventDefault();
			this.scene.paused = !this.scene.paused || (this.scene.frozen = false),
			this.emit(Events.StateChange, this.scene.paused);
			// this.scene.discreteEvents.add((this.scene.paused ? 'UN' : '') + 'PAUSE');
		}

		if (!this.scene.editMode) return;
		switch (event.key.toLowerCase()) {
		case 'c': {
			event.preventDefault();
			if (!event.ctrlKey || this.scene.toolHandler.selected != 'select') break;
			const selectedCode = this.scene.toolHandler.currentTool.selected.toString();
			// selectedCode.length > 3 && navigator.clipboard.writeText(selectedCode);
			const type = 'text/plain';
			selectedCode.length > 3 && navigator.clipboard.write([new ClipboardItem({ [type]: new Blob([selectedCode], { type }) })]);
			break;
		}

		case 'control':
			this.scene.toolHandler.ctrlKey = true;
			break;
		case 'delete':
			if (this.scene.toolHandler.selected != 'select') break;
			this.scene.toolHandler.currentTool.deleteSelected();
			break;
		case 'shift':
			this.scene.toolHandler.shiftKey = true;
			break;
		// store arrays of hotkeys in each tool, then compare
		// let tools = Object.fromEntries(this.scene.toolHandler.cache.entries());
		// for (const key in tools) {
		// 	if (tools[key].shortcuts.has(event.key.toLowerCase())) {
		// 		this.scene.toolHandler.setTool(key, '?');
		// 		break;
		// 	}
		// 	console.log(key, tools[key])
		// }
		// break;
		case 'a':
			this.scene.toolHandler.setTool('brush', false);
			break;
		case 'o':
			event.ctrlKey && this.openFile({ multiple: event.shiftKey });
			break;
		case 's':
			if (event.ctrlKey) {
				if (event.shiftKey) {
					this.saveAs();
					break;
				}

				this.save();
				break;
			}

			this.scene.toolHandler.setTool('brush', true);
			break;
		case 'q':
			this.scene.toolHandler.setTool('line', event.shiftKey);
			break;
		case 'e':
			this.scene.toolHandler.setTool('eraser');
			break;
		case 'r':
			this.scene.toolHandler.setTool(this.scene.toolHandler.selected != 'camera' ? 'camera' : this.scene.toolHandler.old);
			break;
		case 'z':
			if (!event.ctrlKey) break;
			event.preventDefault();
			this.scene.history[(event.shiftKey ? 're' : 'un') + 'do']();
		}
	}

	_handleKeyup(event) {
		switch (event.key.toLowerCase()) {
		case 'b':
			if (!event.ctrlKey) break;
			event.preventDefault();
			this.scene.switchBike();
			break;
		case 'f':
		case 'f11':
			event.preventDefault();
			this.toggleFullscreen();
		}

		if (!this.scene.editMode) return;
		switch (event.key.toLowerCase()) {
		case 'control':
			this.scene.toolHandler.ctrlKey = false;
			break;
		case 'g':
			this.gui.querySelector('.grid > input').checked = (this.scene.sectors.size = 11 - this.scene.sectors.size) > 1;
			break;
		case 'shift':
			this.scene.toolHandler.shiftKey = false;
		}
	}

	_handlePointerDown(event) {
		if (this.scene.processing) return;
		this.scene.camera.locked = !event.shiftKey;
		this.scene.camera.controller.focalPoint = null;
		if (event.shiftKey) return;
		else if (event.ctrlKey) {
			this.scene.toolHandler.selected != 'select' && this.scene.toolHandler.setTool('select');
		} else if (this.scene.toolHandler.selected == 'select') {
			this.scene.toolHandler.setTool(this.scene.toolHandler.old);
		}

		if (!/^(camera|eraser|select)$/i.test(this.scene.toolHandler.selected)) {
			this.mouse.position.x = Math.round(this.mouse.position.x / this.scene.sectors.size) * this.scene.sectors.size;
			this.mouse.position.y = Math.round(this.mouse.position.y / this.scene.sectors.size) * this.scene.sectors.size;
		}

		this.scene.toolHandler.press(...arguments);
	}

	_handlePointerMove(event) {
		if (this.scene.processing) return;
		this.scene.toolHandler.selected != 'camera' && (this.scene.camera.controller.focalPoint = null);
		if (event.shiftKey && this.mouse.down) {
			this.scene.toolHandler.cache.get('camera').stroke(...arguments);
			return;
		}

		if (!/^(camera|eraser|select)$/i.test(this.scene.toolHandler.selected)) {
			this.mouse.position.x = Math.round(this.mouse.position.x / this.scene.sectors.size) * this.scene.sectors.size;
			this.mouse.position.y = Math.round(this.mouse.position.y / this.scene.sectors.size) * this.scene.sectors.size;
		}

		this.scene.toolHandler.stroke(...arguments);
	}

	_handlePointerUp(event) {
		if (this.scene.processing) return;
		this.scene.camera.locked = false;
		if (!/^(camera|eraser|select)$/i.test(this.scene.toolHandler.selected)) {
			this.mouse.position.x = Math.round(this.mouse.position.x / this.scene.sectors.size) * this.scene.sectors.size;
			this.mouse.position.y = Math.round(this.mouse.position.y / this.scene.sectors.size) * this.scene.sectors.size;
		}

		event.shiftKey || this.scene.toolHandler.clip(...arguments);
	}

	_handleSettingsChange(settings) {
		for (const setting in settings) {
			let value = settings[setting];
			switch (setting) {
			case 'brightness':
				this.canvas.style[(value === 100 ? 'remove' : 'set') + 'Property']('backdrop-filter', 'brightness(' + value + '%)');
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

	_handleScroll(event) {
		if (!event.ctrlKey) {
			this.scene.toolHandler.scroll(...arguments);
		} else {
			this.scene.toolHandler.cache.get('camera').scroll(...arguments);
		}

		const y = new Vector(event.clientX - this.canvas.offsetLeft, event.clientY - this.canvas.offsetTop + window.pageYOffset).toCanvas(this.canvas);
		if (!this.scene.camera.controller.focalPoint) {
			const diff = this.mouse.position.diff(y);
			this.scene.camera.move(diff.x, diff.y);
		}
	}

	listen() {
		super.listen(document, 'fullscreenchange', () => navigator.keyboard.lock(['Escape']), { passive: true });
		super.listen(document, 'keydown', this._handleKeydown.bind(this));
		super.listen(document, 'keyup', this._handleKeyup.bind(this));

		'navigation' in window && super.listen(navigation, 'navigate', this.destroy.bind(this), { passive: true });		
		super.listen(window, 'load', () => window.dispatchEvent(new Event('online')));
		super.listen(window, 'beforeunload', async event => {
			if (!this.settings.autoSave || !this.fileSystemStorage.writables.has('savedState')) return;
			event.preventDefault();
			event.returnValue = false;
			const writable = this.fileSystemStorage.writables.get('savedState');
			// const writer = await writable.getWriter();
			// console.log(writable)
			await writable.write(this.scene.toString());
			await writable.close();
			return event.returnValue;
		});
		super.listen(window, 'pagehide', e => !e.persisted && this.destroy());
		super.listen();
		console.debug('[Game] Listeners bound');
	}

	init(options = {}) {
		this.#lastFrame && cancelAnimationFrame(this.#lastFrame);
		options = Object.assign({}, arguments[0]);
		this.#openFile = null;
		this.scene.init(options);
		options.default && this.scene.read('-18 1i 18 1i###BMX');
		options.code && this.scene.read(options.code);
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
			!this.scene.processing && this.scene.fixedUpdate();
			this.#updates++
		}

		if (!this.config.maxFrameRate || time - this.#lastFrameTime >= this._frameInterval) {
			this.config.maxFrameRate && (this.#lastFrameTime = time);
			this.scene.update(this._progress);
			this.scene.lateUpdate(this._progress);
			this.scene.render(this.ctx);
			this.scene.renderHUD(this.ctx);
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
		this.scene.camera.setViewport(this.canvas.width, this.canvas.height);
		this.scene.sectors.updateVisible();
		// this.scene.camera.applyTransform(this.ctx);
		this.ctx.fillStyle = this.colorScheme.palette.background;
		this.ctx.lineWidth = Math.max(2 * this.scene.camera.zoom, .5);
		this.ctx.lineCap = 'round';
		this.ctx.lineJoin = 'round';
		this.ctx.strokeStyle = this.colorScheme.palette.track; // accent?
		// this.ctx.font = '20px Arial';
		// this.ctx.textAlign = 'center';
		this.ctx.textBaseline = 'middle';
		// if shrinking sectors via drawImage:
		this.ctx.imageSmoothingEnabled = !1,
		this.ctx.mozImageSmoothingEnabled = !1,
		this.ctx.oImageSmoothingEnabled = !1,
		this.ctx.webkitImageSmoothingEnabled = !1;
	}

	setContainer(container) {
		this.container = container;
		this.gui = this.container.shadowRoot || this.container.attachShadow({ mode: 'open' });
	}

	async showRecentFiles() {
		if ('loadrecenttracks' in window && this.fileSystemStorage.readyState === 1) {
			loadrecenttracks.showModal();
			if ('recenttracks' in window) {
				const results = [];
				for (const [fileName, fileHandle] of this.fileSystemStorage.cache) {
					const fileData = await fileHandle.getFile();
					const wrapper = document.createElement('div');
					wrapper.style = 'display: flex;gap: 0.25rem;width: -webkit-fill-available;';
					const button = wrapper.appendChild(document.createElement('button'));
					button.addEventListener('click', async event => {
						this.init({ code: await fileData.text() });
					});
					button.innerText = fileName;
					button.style = 'width: -webkit-fill-available;';
					const remove = wrapper.appendChild(document.createElement('button'));
					remove.addEventListener('click', async event => {
						this.fileSystemStorage.cache.delete(fileHandle.name);
						this.fileSystemStorage.writables.delete(fileHandle.name);
						fileHandle.remove();
						wrapper.remove();
					});
					remove.innerText = '🗑'; // 🗙
					remove.style = 'background-color: hsl(0 40% 40% / calc(50% + 10% * var(--brightness-multiplier)));';
					results.push(wrapper);
				}

				recenttracks.replaceChildren(...results);
			}
		}
	}

	load(code) {
		if (!code) {
			return this.openFile();
		}

		this.init({ write: true });
		this.scene.read(code);
	}

	async openFile(options = {}) {
		if ('fileHandles' in options || 'showOpenFilePicker' in window) {
			// store files in private local storage:
			// const root = await navigator.storage.getDirectory();
			// const fileHandle = await root.getFileHandle('Untitled.txt', { create: true });
			const fileHandles = options.fileHandles || await window.showOpenFilePicker(Object.assign({
				multiple: false, // allow multiple & merge tracks?
				types: [{
					description: 'BHR File',
					accept: { 'text/plain': ['.txt'] }
				}]
			}, arguments[0])).catch(() => []);
			if (fileHandles.length > 0) {
				this.init({ write: true });
				for (const fileHandle of fileHandles) {
					const fileData = await fileHandle.getFile();
					this.scene.read(await fileData.text());
					// auto-save opened file:
					if (fileHandles.length < 2) {
						this.#openFile = fileHandle;
					}

					if (!options.multiple) {
						break;
					}
				}
			}

			return true;
		}

		const picker = document.createElement('input');
		picker.setAttribute('accept', 'text/plain');
		picker.setAttribute('type', 'file');
		picker.toggleAttribute('multiple', options.multiple);
		picker.addEventListener('change', async () => {
			this.init({ write: true });
			for (const file of this.files) {
				this.scene.read(await file.text());
				if (!options.multiple) {
					break;
				}
			}
		});
		picker.click();
	}

	save() {
		if (this.#openFile) {
			this.#openFile.createWritable().then(writable => {
				writable.write(this.scene.toString()).then(() => {
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

	async saveAs() {
		// if ('showSaveFilePicker' in window) {
		// 	const fileHandle = await window.showSaveFilePicker({
		// 		suggestedName: 'bhr_track-' + new Intl.DateTimeFormat('en-CA', { dateStyle: 'short', timeStyle: 'medium' }).format().replace(/[/\\?%*:|"<>]/g, '-').replace(/,+\s*/, '_').replace(/\s+.*$/, ''),
		// 		types: [{
		// 			description: 'BHR File',
		// 			accept: { 'text/plain': ['.txt'] }
		// 		}]
		// 	}).catch(() => null);
		// 	if (fileHandle !== null && verifyPermission(fileHandle, true)) {
		// 		const writable = await fileHandle.createWritable();
		// 		await writable.write(this.scene.toString());
		// 		await writable.close();
		// 		return true;
		// 	}
		// }

		const link = document.createElement('a');
		link.setAttribute('download', 'bhr_track-' + new Intl.DateTimeFormat('en-CA', { dateStyle: 'short', timeStyle: 'medium' }).format().replace(/[/\\?%*:|"<>]/g, '-').replace(/,+\s*/, '_').replace(/\s+.*$/, ''));
		link.setAttribute('href', URL.createObjectURL(new Blob([this.scene.toString()], { type: 'text/plain' })));
		link.click();
		return true;
	}

	reset() {
		this.init({ default: true, write: true });
	}

	destroy() {
		cancelAnimationFrame(this.#lastFrame);
		super.destroy();
		this.mouse.dispose();
		this.mouse = null;
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

async function verifyPermission(fileHandle, withWrite) {
	const opts = {};
	if (withWrite) {
		opts.mode = "readwrite";
	}

	// Check if we already have permission, if so, return true.
	if ((await fileHandle.queryPermission(opts)) === "granted") {
		return true;
	}

	// Request permission to the file, if the user grants permission, return true.
	if ((await fileHandle.requestPermission(opts)) === "granted") {
		return true;
	}

	// The user did not grant permission, return false.
	return false;
}