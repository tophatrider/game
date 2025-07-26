import EventRelay from "../EventRelay.js";
import StaticVector from "../math/StaticVector.js";
// import SmartVector from "../math/SmartVector.js";
import Vector from "../math/Vector.js";
import Pointer from "./Pointer.js";

export default class PointerHandler extends EventRelay {
	_pointers = new Map();
	down = false;
	old = new StaticVector;
	position = new Vector; // new SmartVector;
	primary = null;
	rawPosition = new Vector;
	stroke = new Vector;
	get locked() {
		return document.pointerLockElement === this.target;
	}

	get pointers() {
		return Array.from(this._pointers.values());
	}

	constructor() {
		super();
		Object.defineProperty(this, 'lockedPointerId', { value: null, writable: true });
		Object.defineProperty(this, 'target', { value: null, writable: true });
	}

	async _handleClick(event) {
		event.preventDefault();
		const pointer = this._pointers.get(event.pointerId);
		if (event.ctrlKey && event.shiftKey) {
			await this.lock(event.pointerId);
		}

		this.emit('click', event, pointer ?? null);
	}

	_handleContextMenu(event) {
		event.preventDefault();
		this.emit('menu', event);
	}

	_handlePointerCancel(event) {
		const pointer = this._pointers.get(event.pointerId);
		pointer && (pointer._update(event, this.target),
		this._pointers.delete(event.pointerId));
		this.emit('cancel', event, pointer ?? null);
	}

	_handlePointerDown(event) {
		event.preventDefault();
		let pointer = this._pointers.get(event.pointerId);
		if (!pointer) {
			pointer = new Pointer(event, this.target);
			this.locked && event.pointerId === this.lockedPointerId && (pointer.locked = true);
		}

		pointer._setPointerDown(event, this.target);
		this._pointers.set(event.pointerId, pointer);
		if (event.isPrimary) {
			this.down = true;
			this.primary = pointer;
			this.old = this.position.toStatic();
			this.isPrimary = event.button === 0;
			if (!this.locked) {
				this.rawPosition.set(new Vector(event.offsetX, event.offsetY, true));
				this.position.set(this.rawPosition.toCanvas(this.target));
				this.target.setPointerCapture(event.pointerId);
			}
		}

		this.emit('down', event, pointer);
	}

	_handlePointerLockChange(event) {
		const pointer = this.pointers.find(({ locked }) => locked);
		if (!this.locked) {
			pointer && (pointer.locked = false);
			this.lockedPointerId = null;
		}

		this.emit('lockChange', event, pointer ?? null);
	}

	_handlePointerMove(event) {
		const pointer = this._pointers.get(event.pointerId);
		pointer?._setPointerUp(event, this.target);
		if (event.isPrimary) {
			if (this.locked) {
				this.rawPosition.add(new Vector(event.movementX, event.movementY, true));
			} else {
				this.rawPosition.set(new Vector(event.offsetX, event.offsetY, true));
			}

			this.stroke.set(this.position).sub(this.old);
			this.position.set(this.rawPosition.toCanvas(this.target));
		}

		this.emit('move', event, pointer ?? null);
	}

	_handlePointerUp(event) {
		const pointer = this._pointers.get(event.pointerId);
		pointer && (pointer._setPointerUp(event, this.target),
		event.pointerId !== this.lockedPointerId && this._pointers.delete(event.pointerId));
		if (this.down && event.isPrimary) {
			this.down = false;
			this.primary = null;
			if (!this.locked) {
				this.rawPosition.set(new Vector(event.offsetX, event.offsetY, true));
				this.position.set(this.rawPosition.toCanvas(this.target));
				this.target.releasePointerCapture(event.pointerId);
			}
		}

		this.emit('up', event, pointer ?? null);
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
		const target = this.target || window;
		super.listen(target, 'click', this._handleClick.bind(this));
		super.listen(target, 'contextmenu', this._handleContextMenu.bind(this));
		super.listen(target, 'pointercancel', this._handlePointerCancel.bind(this), { passive: true });
		super.listen(target, 'pointerdown', this._handlePointerDown.bind(this));
		super.listen(document, 'pointerlockchange', this._handlePointerLockChange.bind(this));
		super.listen(target, 'pointermove', this._handlePointerMove.bind(this), { passive: true });
		super.listen(target, 'pointerup', this._handlePointerUp.bind(this), { passive: true });
		super.listen(target, 'wheel', this._handleScroll.bind(this));
		super.listen();
		console.debug('[PointerHandler] Listeners bound');
	}

	lock(pointerId, options = {}) {
		return this.target?.requestPointerLock?.({
			unadjustedMovement: true,
			...options
		}).then(res => {
			this.lockedPointerId = pointerId;
			const pointer = this._pointers.get(pointerId);
			pointer && (pointer.locked = true);
			return res
		});
	}

	dispose() {
		this.unlisten();
		this.target = null;
	}

	static get isTouchScreen() {
		return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
	}
}