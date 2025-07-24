import EventEmitter from "../EventEmitter.js";
// import SmartVector from "../math/SmartVector.js";
import Vector from "../math/Vector.js";

export default class PointerHandler extends EventEmitter {
	#handlers = [];
	#bindListeners(target) {
		if (this.#handlers.length > 0) return;
		this.#handlers.push([target, 'click', this._handleClick.bind(this)]);
		this.#handlers.push([target, 'contextmenu', this._handleContextMenu.bind(this)]);
		this.#handlers.push([target, 'pointerdown', this._handlePointerDown.bind(this)]);
		this.#handlers.push([document, 'pointerlockchange', this._handlePointerLockChange.bind(this)]);
		this.#handlers.push([target, 'pointermove', this._handlePointerMove.bind(this), { passive: true }]);
		this.#handlers.push([target, 'pointerup', this._handlePointerUp.bind(this)]);
		this.#handlers.push([target, 'wheel', this._handleScroll.bind(this)]);
		console.debug('[MouseHandler] Listeners bound');
	}

	down = false;
	old = new Vector;
	position = new Vector; // new SmartVector;
	rawPosition = new Vector;
	stroke = new Vector;
	get locked() {
		return document.pointerLockElement === this.target;
	}

	constructor() {
		super();
		Object.defineProperty(this, 'target', { value: null, writable: true });
	}

	async _handleClick(event) {
		event.preventDefault();
		if (event.ctrlKey && event.shiftKey) {
			await this.lock();
		}

		this.emit('click', event);
	}

	_handleContextMenu(event) {
		event.preventDefault();
		this.emit('menu', event);
	}

	_handlePointerDown(event) {
		event.preventDefault();
		this.down = true;
		this.old.set(this.position);
		if (!this.locked) {
			this.rawPosition.set(new Vector(event.offsetX, event.offsetY).scaleSelf(window.devicePixelRatio));
			this.position.set(this.rawPosition.toCanvas(this.target));
			this.target.setPointerCapture(event.pointerId);
		}

		this.emit('down', event);
	}

	_handlePointerLockChange(event) {
		this.emit('lockchange', event);
		if (this.locked)
			this.emit('lock', event);
		else
			this.emit('unlock', event);
	}

	_handlePointerMove(event) {
		if (this.locked) {
			this.rawPosition.add(new Vector(event.movementX, event.movementY).scaleSelf(window.devicePixelRatio));
		} else {
			this.rawPosition.set(new Vector(event.offsetX, event.offsetY).scaleSelf(window.devicePixelRatio));
		}

		this.stroke.set(this.position).sub(this.old);
		this.position.set(this.rawPosition.toCanvas(this.target));
		this.emit('move', event);
	}

	_handlePointerUp(event) {
		event.preventDefault();
		this.down = false;
		if (!this.locked) {
			this.rawPosition.set(new Vector(event.offsetX, event.offsetY).scaleSelf(window.devicePixelRatio));
			this.position.set(this.rawPosition.toCanvas(this.target));
			this.target.releasePointerCapture(event.pointerId);
		}

		this.emit('up', event);
	}

	_handleScroll(event) {
		event.preventDefault();
		this.emit('wheel', event);
	}

	setTarget(target) {
		this.target !== null && this.dispose();
		this.target = target;
		this.listen();
	}

	listen() {
		this.#bindListeners(this.target || window);
		for (const [target, ...params] of this.#handlers)
			target.addEventListener(...params);
	}

	lock(options = {}) {
		return this.target?.requestPointerLock(Object.assign({ unadjustedMovement: true }, options));
	}

	unlisten() {
		for (const [target, event, handler] of this.#handlers)
			target.removeEventListener(event, handler);
		this.#handlers.splice(0);
	}

	dispose() {
		this.unlisten();
		this.target = null;
	}
}