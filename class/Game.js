import RecursiveProxy from "./RecursiveProxy.js";
import EventEmitter from "./core/EventEmitter.js";
import Events from "./core/Events.js";
import Scene from "./scenes/Scene.js";
import Mouse from "./core/input/PointerHandler.js";
import Vector from "./core/math/Vector.js";
import TrackStorage from "./TrackStorage.js";

const DEFAULTS = {
	autoPause: false,
	autoSave: false,
	autoSaveInterval: 5,
	theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const defaultsFilter = (key, value) => (typeof value == 'object' || DEFAULTS.hasOwnProperty(key)) ? value : void 0;

export default class extends EventEmitter {
	#openFile = null;

	// game loop related variables
	#frames = 0;
	#lastFrameTime = performance.now();
	#timer = performance.now();
	#updates = 0;
	stats = { fps: 0, ups: 0 };
	config = { maxFrameRate: null, tickRate: 50 };
	frameInterval = 1e3 / this.config.maxFrameRate;
	interpolation = true;
	updateInterval = 1e3 / this.config.tickRate;

	accentColor = '#000000'; // for themes
	lastFrame = null;
	lastTime = performance.now();
	progress = 0;
	ups = 25; // 50;
	mouse = new Mouse();
	scene = new Scene(this);
	settings = new RecursiveProxy(Object.assign(DEFAULTS, JSON.parse(localStorage.getItem('bhr-settings'), defaultsFilter)), {
		set: (...args) => {
			Reflect.set(...args);
			localStorage.setItem('bhr-settings', JSON.stringify(this.settings, defaultsFilter));
			this.emit(Events.SettingsChange, this.settings);
			return true;
		},
		deleteProperty() {
			Reflect.deleteProperty(...arguments);
			localStorage.setItem('bhr-settings', JSON.stringify(this, defaultsFilter));
			return true;
		}
	});
	trackStorage = new TrackStorage();
	constructor(canvas) {
		super();

		this.setCanvas(canvas);
		this.mouse.on('down', this.press.bind(this));
		this.mouse.on('move', this.stroke.bind(this));
		this.mouse.on('up', this.clip.bind(this));
		this.mouse.on('wheel', this.scroll.bind(this));

		document.addEventListener('fullscreenchange', () => navigator.keyboard.lock(['Escape']));
		document.addEventListener('keydown', this.keydown.bind(this));
		document.addEventListener('keyup', this.keyup.bind(this));
		// document.addEventListener('paste', this.paste.bind(this)); // open load-track dialog with pasted code in it
		document.addEventListener('pointerlockchange', () => {
			if (!document.pointerLockElement) {
				const checkbox = this.container.querySelector('.bhr-game-overlay > input');
				this.scene.paused = checkbox !== null && (checkbox.checked = !checkbox.checked);
			}
		});

		this.on('settingsChange', settings => {
			let element;
			for (const setting in settings) {
				const value = settings[setting];
				switch (setting) {
				case 'theme':
					let stylesheet = document.querySelector('#game-theme'), href;
					if (stylesheet && (href = stylesheet.href.replace(/[^/]*(\.css)$/, `${value}$1`)) && href !== stylesheet.href) {
						stylesheet.setAttribute('href', href);
						this.ctx.fillStyle = '#'.padEnd(7, value == 'dark' ? 'fb' : value == 'midnight' ? 'c' : '0');
						this.ctx.strokeStyle = this.ctx.fillStyle;
						this.scene.grid.sectors.forEach(sector => sector.resize());
					}

					(element = document.getElementById(value)) && (element.checked = true);
					break;
				default:
					if (typeof value != 'boolean') continue;
					(element = document.getElementById(setting.replace(/([A-Z])/g, '-$1').toLowerCase())) && (element.checked = value);
				}
			}
		});
		this.emit(Events.SettingsChange, this.settings);
		this.trackStorage.on('open', async () => {
			if (!this.settings.autoSave) return;
			await this.trackStorage.open('savedState', { cache: true });
			if (this.settings.autoSaveInterval > 0) {
				const date = new Intl.DateTimeFormat(navigator.language, { dateStyle: 'short', timeStyle: 'medium' }).format().replace(/[/\\?%*:|"<>]/g, '-').replace(/,+\s*/, '_').replace(/\s+.*$/, '');
				this.trackStorage.open(date, { overwrite: false });
				setInterval(() => {
					this.trackStorage.write(date, this.scene.toString(), { saveAndReplace: true });
				}, this.settings.autoSaveInterval * 1e3);
			}

			// Only show toast if the game wasn't closed properly!
			// if ('toasts' in window) {
			// 	const toast = Object.assign(document.createElement('div'), {
			// 		className: 'toast',
			// 		innerText: 'Would you like to restore the track you were last working on? '
			// 	});
			// 	toast.append(Object.assign(document.createElement('button'), {
			// 		innerText: 'Yes',
			// 		onclick: () => {
			// 			toast.remove();
			// 			fileData.text().then(code => {
			// 				this.init();
			// 				this.scene.read(code);
			// 			});
			// 			// fileHandle.createWritable()
			// 		}
			// 	}), Object.assign(document.createElement('button'), {
			// 		innerText: 'No',
			// 		onclick: () => toast.remove()
			// 	}));
			// 	this.constructor.serveToast(toast);
			// }
		});

		'navigation' in window && navigation.addEventListener('navigate', this._onnavigate = this.destroy.bind(this));
		window.addEventListener('load', this._onload = () => window.dispatchEvent(new Event('online')));
		// new ResizeObserver(this.setCanvasSize.bind(this)).observe(this.canvas);
		window.addEventListener('resize', this._onresize = this.setCanvasSize.bind(this));
		window.addEventListener('beforeunload', this._onbeforeunload = async event => {
			event.preventDefault();
			event.returnValue = false;

			if (this.trackStorage.writables.has('savedState')) {
				const writable = this.trackStorage.writables.get('savedState');
				// const writer = await writable.getWriter();
				// console.log(writable)
				await writable.write(this.scene.toString());
				await writable.close();
			}
		});
		window.addEventListener('unload', this._onunload = this.destroy.bind(this));
	}

	get max() {
		return 1000 / this.ups;
	}

	init(options = {}) {
		this.lastFrame && cancelAnimationFrame(this.lastFrame);
		options = Object.assign({}, arguments[0]);
		this.#openFile = null;
		this.scene.init(options);
		options.default && this.scene.read('-18 1i 18 1i###BMX');
		options.code && this.scene.read(options.code);
		this.lastFrame = requestAnimationFrame(this.render.bind(this));
	}

	resetFrameProgress() {
		this.lastTime = performance.now();
		this.progress = 0;
		this.config.maxFrameRate && (this.#lastFrameTime = this.lastTime)
	}

	// ups = 50;
	render(time) {
		// DEBUG
		if (this._lastRafTime !== null) {
			let rafDelta = time - this._lastRafTime;
			(this._rafDeltaHist ||= []).push(rafDelta);
			if (this._rafDeltaHist.length > 300) this._rafDeltaHist.shift();
			if (rafDelta > 20) console.warn(`Slow rAF frame: ${Math.round(rafDelta)}ms`);
		}
		this._lastRafTime = time;
		// DEBUG END

		this.updateCallback = requestAnimationFrame(this.render.bind(this));
		if (this._wasPaused !== this.scene.paused) {
			this._wasPaused = this.scene.paused;
			!this.scene.paused && this.resetFrameProgress();
			this.lastTime = time;
		}

		let delta = time - this.lastTime;
		if (delta >= 1e3) {
			delta = this.updateInterval;
		}

		this.progress += delta / this.updateInterval;
		// if (this.progress >= 1 && this.scene.paused) {
		// 	this.freeze();
		// 	return;
		// }

		this.lastTime = time;
		while (this.progress >= 1) {
			this.progress--;
			if (this.emit(Events.Tick, this.scene.currentTime)) continue;
			!this.scene.processing && this.scene.fixedUpdate();
			this.#updates++
		}

		if (!this.config.maxFrameRate || time - this.#lastFrameTime >= this.frameInterval) {
			this.config.maxFrameRate && (this.#lastFrameTime = time);
			this.scene.update(this.progress);
			this.scene.lateUpdate(this.progress);
			this.scene.render(this.ctx);
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

	createRecorder() {
		const lastArgument = arguments[arguments.length - 1];
		this.mediaRecorder = new MediaRecorder(this.canvas.captureStream(50));
		this.mediaRecorder.addEventListener('dataavailable', ({ data }) => {
			const objectURL = URL.createObjectURL(data);
			typeof lastArgument == 'function' && lastArgument(objectURL);
			this.emit(Events.RecorderStop, objectURL);
		});
		this.mediaRecorder.addEventListener('start', event => {
			this.emit(Events.RecorderStart, event);
		})
		return this.mediaRecorder;
	}

	setCanvas(canvas) {
		this.canvas = canvas;
		// const offscreen = this.canvas.transferControlToOffscreen();
		// this.scene.helper.postMessage({ canvas: offscreen }, [offscreen]);
		this.ctx = this.canvas.getContext('2d');
		this.container = canvas.parentElement;
		this.setCanvasSize();
		this.mouse.setTarget(canvas);
	}

	// create a separate overlaying canvas for scenery lines with a transparent background
	setCanvasSize() {
		const computedStyle = getComputedStyle(this.canvas);
		this.canvas.setAttribute('height', parseFloat(computedStyle.height) * window.devicePixelRatio);
		this.canvas.setAttribute('width', parseFloat(computedStyle.width) * window.devicePixelRatio);
		this.ctx.fillStyle = '#'.padEnd(7, this.settings.theme == 'dark' ? 'fb' : this.settings.theme == 'midnight' ? 'c' : '0');
		this.ctx.lineWidth = Math.max(2 * this.scene.zoom, 0.5);
		this.ctx.lineCap = 'round';
		this.ctx.lineJoin = 'round';
		this.ctx.strokeStyle = this.ctx.fillStyle;
		// this.ctx.font = '20px Arial';
		// this.ctx.textAlign = 'center';
		this.ctx.textBaseline = 'middle';
		// if shrinking sectors via drawImage:
		this.ctx.imageSmoothingEnabled = !1,
		this.ctx.mozImageSmoothingEnabled = !1,
		this.ctx.oImageSmoothingEnabled = !1,
		this.ctx.webkitImageSmoothingEnabled = !1;
		// this.ctx.scale(-1, 1); // for 'left-hand' mode
	}

	async showRecentFiles() {
		if ('loadrecenttracks' in window && this.trackStorage.readyState === 1) {
			loadrecenttracks.showModal();
			if ('recenttracks' in window) {
				const results = [];
				for (const [fileName, fileHandle] of this.trackStorage.cache) {
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
						this.trackStorage.cache.delete(fileHandle.name);
						this.trackStorage.writables.delete(fileHandle.name);
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

	press(event) {
		if (this.scene.processing) return;
		this.scene.cameraLock = !event.shiftKey;
		this.scene.cameraFocus = false;
		if (event.shiftKey) return;
		else if (event.ctrlKey) {
			this.scene.toolHandler.selected != 'select' && this.scene.toolHandler.setTool('select');
		} else if (this.scene.toolHandler.selected == 'select') {
			this.scene.toolHandler.setTool(this.scene.toolHandler.old);
		}

		if (!/^(camera|eraser|select)$/i.test(this.scene.toolHandler.selected)) {
			this.mouse.position.x = Math.round(this.mouse.position.x / this.scene.grid.size) * this.scene.grid.size;
			this.mouse.position.y = Math.round(this.mouse.position.y / this.scene.grid.size) * this.scene.grid.size;
		}

		this.scene.toolHandler.press(event);
	}

	stroke(event) {
		if (this.scene.processing) return;
		this.scene.toolHandler.selected != 'camera' && (this.scene.cameraFocus = false);
		if (event.shiftKey && this.mouse.down) {
			this.scene.toolHandler.cache.get('camera').stroke(event);
			return;
		}

		if (!/^(camera|eraser|select)$/i.test(this.scene.toolHandler.selected)) {
			this.mouse.position.x = Math.round(this.mouse.position.x / this.scene.grid.size) * this.scene.grid.size;
			this.mouse.position.y = Math.round(this.mouse.position.y / this.scene.grid.size) * this.scene.grid.size;
		}

		this.scene.toolHandler.stroke(event);
	}

	clip(event) {
		if (this.scene.processing) return;
		this.scene.cameraLock = false;
		if (!/^(camera|eraser|select)$/i.test(this.scene.toolHandler.selected)) {
			this.mouse.position.x = Math.round(this.mouse.position.x / this.scene.grid.size) * this.scene.grid.size;
			this.mouse.position.y = Math.round(this.mouse.position.y / this.scene.grid.size) * this.scene.grid.size;
		}

		event.shiftKey || this.scene.toolHandler.clip(event);
	}

	async keydown(event) {
		event.preventDefault();
		switch (event.key.toLowerCase()) {
			case 'arrowleft': {
				const focusedPlayerGhost = this.scene.ghosts.find(playerGhost => playerGhost.vehicle.hitbox == this.scene.cameraFocus);
				if (focusedPlayerGhost) {
					this.scene.paused = true;
					focusedPlayerGhost.playbackTicks = Math.max(0, focusedPlayerGhost.playbackTicks - 5);
					focusedPlayerGhost.ghostIterator.next(focusedPlayerGhost.playbackTicks);
				}
				break;
			}

			case 'arrowright': {
				const focusedPlayerGhost = this.scene.ghosts.find(playerGhost => playerGhost.vehicle.hitbox == this.scene.cameraFocus);
				if (focusedPlayerGhost) {
					this.scene.paused = true;
					focusedPlayerGhost.ghostIterator.next(focusedPlayerGhost.playbackTicks + 5);
				}
				break;
			}

			case 'backspace': {
				if (event.shiftKey) {
					this.scene.restoreCheckpoint();
					break;
				}

				this.scene.removeCheckpoint();
				break;
			}

			case 'enter': {
				if (event.shiftKey) {
					this.scene.restoreCheckpoint();
					break;
				}

				this.scene.returnToCheckpoint();
				break;
			}

			case 'tab': {
				let playersToFocus = Array(...this.scene.players, ...this.scene.ghosts).map(player => player.vehicle.hitbox);
				let index = playersToFocus.indexOf(this.scene.cameraFocus) + 1;
				if (playersToFocus.length <= index) {
					index = 0;
				}

				// if player is a ghost, show time-progress bar on the bottom
				this.scene.cameraFocus = playersToFocus[index];
				this.scene.paused = false;
				this.scene.frozen = false;

				let progress = document.querySelector('.replay-progress');
				progress && index === 0 ? progress.style.setProperty('display', 'none') : (progress.style.removeProperty('display'),
				progress.setAttribute('max', playersToFocus[index].parent.parent.runTime ?? 100),
				progress.setAttribute('value', playersToFocus[index].parent.parent.playbackTicks));
				break;
			}

			case '-':
				this.scene.zoomOut();
				break;
			case '+':
			case '=':
				this.scene.zoomIn();
				break;
			case 'p':
			case ' ':
				this.ups !== 25 ? this.scene.discreteEvents.add((this.scene.paused ? 'UN' : '') + 'PAUSE') : (this.scene.paused = !this.scene.paused || (this.scene.frozen = false),
				this.emit(Events.StateChange, this.scene.paused));
				break;
		}

		if (this.scene.editMode) {
			switch (event.key.toLowerCase()) {
				case 'c': {
					if (!event.ctrlKey || this.scene.toolHandler.selected != 'select') {
						break;
					}

					const selectedCode = this.scene.toolHandler.currentTool.selected.toString();
					// selectedCode.length > 3 && navigator.clipboard.writeText(selectedCode);
					const type = 'text/plain';
					selectedCode.length > 3 && navigator.clipboard.write([new ClipboardItem({ [type]: new Blob([selectedCode], { type }) })]);
					break;
				}

				case 'delete': {
					if (this.scene.toolHandler.selected != 'select') {
						break;
					}

					this.scene.toolHandler.currentTool.deleteSelected();
					break;
				}

				case 'v': {
					if (!event.ctrlKey) {
						break;
					}

					const queryOpts = { name: 'clipboard-read', allowWithoutGesture: false };
					const permissionStatus = await navigator.permissions.query(queryOpts).then(permissionStatus => {
						permissionStatus.onchange = ({ target }) => {
							target.state == 'granted' && navigator.clipboard.readText().then(console.log);
						};

						return permissionStatus.state;
					});

					if (permissionStatus == 'deined') {
						alert('NotAllowedError: Read permission denied.');
						break;
					}

					navigator.clipboard.readText().then(console.log).catch(alert);
					break;
				}

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
				case 'r': {
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
				}
				case 's': {
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
				}

				case 'q':
					this.scene.toolHandler.setTool('line', false);
					break;
				case 'w':
					this.scene.toolHandler.setTool('line', true);
					break;
				case 'e':
					this.scene.toolHandler.setTool('eraser');
					break;
				case 'r':
					this.scene.toolHandler.setTool(this.scene.toolHandler.selected != 'camera' ? 'camera' : this.scene.toolHandler.old);
					break;
				case 'z':
					event.ctrlKey && this.scene.history[(event.shiftKey ? 're' : 'un') + 'do']();
					break;
			}
		}
	}

	keyup(event) {
		event.preventDefault();
		switch (event.key.toLowerCase()) {
			case 'b':
				event.ctrlKey && this.scene.switchBike();
				break;
			case 'f':
			case 'f11':
				document.fullscreenElement ? document.exitFullscreen() : this.container.requestFullscreen();
				break;
			case 'escape':
				const checkbox = this.container.querySelector('.bhr-game-overlay > input');
				this.scene.paused = checkbox !== null && (checkbox.checked = !checkbox.checked);
				break;
		}

		if (this.scene.editMode) {
			switch (event.key.toLowerCase()) {
				case 'g':
					document.querySelector('.grid > input').checked = (this.scene.grid.size = 11 - this.scene.grid.size) > 1;
					break;
			}
		}
	}

	paste(event) {}
	scroll(event) {
		if (!event.ctrlKey) {
			this.scene.toolHandler.scroll(event);
		} else {
			this.scene.toolHandler.cache.get('camera').scroll(event);
		}

		let y = new Vector(event.clientX - this.canvas.offsetLeft, event.clientY - this.canvas.offsetTop + window.pageYOffset).toCanvas(this.canvas);
		this.scene.cameraFocus || this.scene.camera.add(this.mouse.position.diff(y));
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

	destroy(event) {
		cancelAnimationFrame(this.lastFrame);
		this.mouse.close();
		// this.scene.close();
		this.scene.firstPlayer?.gamepad?.close();
		'navigation' in window && navigation.removeEventListener('navigate', this._onnavigate);
		window.removeEventListener('beforeunload', this._onbeforeunload);
		window.removeEventListener('load', this._onload);
		window.removeEventListener('resize', this._onresize);
		window.removeEventListener('unload', this._onunload);
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