import EventBinder from "../EventBinder.js";
import Events from "../Events.js";

export default class GameInputManager extends EventBinder {
	constructor(game) {
		super();
		Object.defineProperty(this, 'game', { value: game });
		Object.defineProperty(this, 'scene', { value: game.scene, writable: true });
		game.mouse.on('cancel', this._handlePointerUp.bind(this));
		game.mouse.on('down', this._handlePointerDown.bind(this));
		game.mouse.on('move', this._handlePointerMove.bind(this));
		game.mouse.on('up', this._handlePointerUp.bind(this));
		game.mouse.on('wheel', this._handleScroll.bind(this));
	}

	listen() {
		super.listen(document, 'fullscreenchange', () => navigator.keyboard.lock(['Escape']), { passive: true });
		super.listen(document, 'keydown', this._handleKeydown.bind(this));
		super.listen(document, 'keyup', this._handleKeyup.bind(this));
		super.listen();
	}

	async _handleKeydown(event) {
		switch (event.key.toLowerCase()) {
		case 'arrowleft': {
			const focusedPlayerGhost = this.game.scene.ghosts.find(playerGhost => playerGhost.hitbox == this.game.scene.camera.controller.focalPoint);
			if (focusedPlayerGhost) {
				this.game.scene.paused = true;
				focusedPlayerGhost.playbackTicks = Math.max(0, focusedPlayerGhost.playbackTicks - 5);
				focusedPlayerGhost.iterator.next(focusedPlayerGhost.playbackTicks);
			}
			break;
		}

		case 'arrowright': {
			const focusedPlayerGhost = this.game.scene.ghosts.find(playerGhost => playerGhost.hitbox == this.game.scene.camera.controller.focalPoint);
			if (focusedPlayerGhost) {
				this.game.scene.paused = true;
				focusedPlayerGhost.iterator.next(focusedPlayerGhost.playbackTicks + 5);
			}
			break;
		}

		case 'backspace':
			if (event.shiftKey) {
				this.game.scene.restoreCheckpoint();
				break;
			}

			this.game.scene.removeCheckpoint();
			break;
		case 'enter':
			event.preventDefault();
			if (event.shiftKey) {
				this.game.scene.restoreCheckpoint();
				break;
			}

			this.game.scene.returnToCheckpoint();
			break;
		case 'r':
			if (event.ctrlKey) {
				if (event.shiftKey) {
					this.game.mediaRecorder.stop();
				}

				this.game.createRecorder();
				this.game.mediaRecorder.start();
				if ('recorder' in window) {
					recorder.style.removeProperty('display');
				}
			}
			break;
		case 'tab': {
			event.preventDefault();
			let playersToFocus = Array(...this.game.scene.players, ...this.game.scene.ghosts).map(({ hitbox }) => hitbox);
			let index = playersToFocus.indexOf(this.game.scene.camera.controller.focalPoint) + 1;
			if (playersToFocus.length <= index) {
				index = 0;
			}

			// if player is a ghost, show time-progress bar on the bottom
			this.game.scene.camera.controller.setFocalPoint(playersToFocus[index]);
			this.game.scene.paused = false;
			this.game.scene.frozen = false;
			break;
		}

		case '-':
			event.ctrlKey && event.preventDefault();
			this.game.scene.toolHandler.cache.get('camera').onScroll({
				offsetX: this.game.mouse.raw.x,
				offsetY: this.game.mouse.raw.y,
				wheelDelta: -1
			});
			break;
		case '+':
		case '=':
			event.ctrlKey && event.preventDefault();
			this.game.scene.toolHandler.cache.get('camera').onScroll({
				offsetX: this.game.mouse.raw.x,
				offsetY: this.game.mouse.raw.y,
				wheelDelta: 1
			});
			break;
		case 'p':
		case ' ':
			event.preventDefault();
			this.game.scene.paused = !this.game.scene.paused || (this.game.scene.frozen = false),
			this.game.emit(Events.StateChange, this.game.scene.paused);
			// this.game.scene.discreteEvents.add((this.game.scene.paused ? 'UN' : '') + 'PAUSE');
		}

		if (this.game.scene.track.mode !== this.game.scene.track.constructor.Modes.Edit) return;
		switch (event.key.toLowerCase()) {
		case 'c': {
			event.preventDefault();
			if (!event.ctrlKey || this.game.scene.toolHandler.selected != 'select') break;
			const selectedCode = this.game.scene.toolHandler.currentTool.selected.toString();
			// selectedCode.length > 3 && navigator.clipboard.writeText(selectedCode);
			const type = 'text/plain';
			selectedCode.length > 3 && navigator.clipboard.write([new ClipboardItem({ [type]: new Blob([selectedCode], { type }) })]);
			break;
		}

		case 'control': this.game.scene.toolHandler.ctrlKey = true; break;
		case 'delete':
			if (this.game.scene.toolHandler.selected != 'select') break;
			this.game.scene.toolHandler.currentTool.deleteSelected();
			break;
		case 'shift': this.game.scene.toolHandler.shiftKey = true; break;
		// store arrays of hotkeys in each tool, then compare
		// let tools = Object.fromEntries(this.game.scene.toolHandler.cache.entries());
		// for (const key in tools) {
		// 	if (tools[key].shortcuts.has(event.key.toLowerCase())) {
		// 		this.game.scene.toolHandler.set(key, '?');
		// 		break;
		// 	}
		// 	console.log(key, tools[key])
		// }
		// break;
		case 'a': this.game.scene.toolHandler.set('brush', false); break;
		case 'o': event.ctrlKey && this.game.openFile({ multiple: event.shiftKey }); break;
		case 's':
			if (event.ctrlKey) {
				if (event.shiftKey) {
					this.game.saveAs();
					break;
				}

				this.game.save();
				break;
			}

			this.game.scene.toolHandler.set('brush', true);
			break;
		case 'q': this.game.scene.toolHandler.set('line', event.shiftKey); break;
		case 'e': this.game.scene.toolHandler.set('eraser'); break;
		case 'r': this.game.scene.toolHandler.set(this.game.scene.toolHandler.selected != 'camera' ? 'camera' : this.game.scene.toolHandler.old); break;
		case 'z':
			if (!event.ctrlKey) break;
			event.preventDefault();
			this.game.scene.track.history[(event.shiftKey ? 're' : 'un') + 'do']();
		}
	}

	_handleKeyup(event) {
		switch (event.key.toLowerCase()) {
		case 'b':
			if (!event.ctrlKey) break;
			event.preventDefault();
			this.game.scene.switchBike();
			break;
		case 'f':
		case 'f11':
			event.preventDefault();
			this.game.toggleFullscreen();
		}

		if (this.game.scene.track.mode !== this.game.scene.track.constructor.Modes.Edit) return;
		switch (event.key.toLowerCase()) {
		case 'control': this.game.scene.toolHandler.ctrlKey = false; break;
		case 'g': this.game.gui.querySelector('.grid > input').checked = (this.game.scene.sectors.size = 11 - this.game.scene.sectors.size) > 1; break;
		case 'shift': this.game.scene.toolHandler.shiftKey = false;
		}
	}

	_handlePointerDown(event) {
		if (this.game.scene.track.processing) return;
		event.button === 0 && this.game.container.classList.toggle('input', true);
		this.game.scene.camera.locked = !event.shiftKey;
		this.game.scene.camera.controller.focalPoint = null;
		if (event.shiftKey) return;
		else if (event.ctrlKey) {
			this.game.scene.toolHandler.selected != 'select' && this.game.scene.toolHandler.set('select');
		} else if (this.game.scene.toolHandler.selected == 'select') {
			this.game.scene.toolHandler.set(this.game.scene.toolHandler.old);
		}

		// if (!/^(camera|eraser|select)$/i.test(this.game.scene.toolHandler.selected)) {
		// 	this.game.mouse.position.x = Math.round(this.game.mouse.position.x / this.game.scene.sectors.size) * this.game.scene.sectors.size;
		// 	this.game.mouse.position.y = Math.round(this.game.mouse.position.y / this.game.scene.sectors.size) * this.game.scene.sectors.size;
		// }

		this.game.scene.toolHandler._handleInput('press', ...arguments);
	}

	_handlePointerMove(event) {
		if (this.game.scene.track.processing) return;
		this.game.scene.toolHandler.selected != 'camera' && (this.game.scene.camera.controller.focalPoint = null);
		if (event.shiftKey && this.game.mouse.down) {
			this.game.scene.toolHandler.cache.get('camera').stroke(...arguments);
			return;
		}

		// if (!/^(camera|eraser|select)$/i.test(this.game.scene.toolHandler.selected)) {
		// 	this.game.mouse.position.x = Math.round(this.game.mouse.position.x / this.game.scene.sectors.size) * this.game.scene.sectors.size;
		// 	this.game.mouse.position.y = Math.round(this.game.mouse.position.y / this.game.scene.sectors.size) * this.game.scene.sectors.size;
		// }

		this.game.scene.toolHandler._handleInput('stroke', ...arguments);
	}

	_handlePointerUp(event) {
		if (this.game.scene.track.processing) return;
		event.button === 0 && this.game.container.classList.toggle('input', false);
		this.game.scene.camera.locked = false;
		// if (!/^(camera|eraser|select)$/i.test(this.game.scene.toolHandler.selected)) {
		// 	this.game.mouse.position.x = Math.round(this.game.mouse.position.x / this.game.scene.sectors.size) * this.game.scene.sectors.size;
		// 	this.game.mouse.position.y = Math.round(this.game.mouse.position.y / this.game.scene.sectors.size) * this.game.scene.sectors.size;
		// }

		event.shiftKey || this.game.scene.toolHandler._handleInput('clip', ...arguments);
	}

	_handleScroll(event) {
		if (!event.ctrlKey) {
			this.game.scene.toolHandler._handleInput('scroll', ...arguments);
		} else {
			this.game.scene.toolHandler.cache.get('camera').onScroll(...arguments);
		}
	}
}