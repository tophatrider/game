import EventEmitter from "../EventEmitter.js";
import Vector from "../Vector.js";

export default class extends EventEmitter {
	#lock = false;
	down = false;
	old = new Vector();
	position = new Vector();
	rawPosition = new Vector();
	target = null;
	stroke = new Vector();
	get locked() {
		return document.pointerLockElement === this.target;
	}

	setTarget(target) {
		this.target !== null && this.close();
		this.target = target;
		this.target.addEventListener('click', this.click = this.click.bind(this));
		this.target.addEventListener('pointerdown', this.pointerdown = this.pointerdown.bind(this));
		this.target.addEventListener('pointermove', this.move = this.move.bind(this));
		this.target.addEventListener('pointerup', this.up = this.up.bind(this));
		this.target.addEventListener('contextmenu', this.menu = this.menu.bind(this));
		this.target.addEventListener('wheel', this.wheel = this.wheel.bind(this));
		// document.addEventListener('pointerlockchange', this.lockChangeAlert.bind(this), false);
	}

	async click(event) {
		event.preventDefault();
		if (event.ctrlKey && event.shiftKey) {
			await this.lock();
		}

		this.emit('click', event);
	}

	lock(options = {}) {
		return this.target.requestPointerLock(Object.assign({ unadjustedMovement: true }, arguments[0]));
	}

	pointerdown(event) {
		event.preventDefault();
		this.down = true;
		this.old.set(this.position);
		if (!this.locked) {
			this.rawPosition.set(new Vector(event.offsetX * window.devicePixelRatio, event.offsetY * window.devicePixelRatio));
			this.position.set(this.rawPosition.toCanvas(this.target));
			this.target.setPointerCapture(event.pointerId);
		}

		this.emit('down', event);
	}

	move(event) {
		event.preventDefault();
		if (this.locked) {
			this.rawPosition.add(new Vector(event.movementX * window.devicePixelRatio, event.movementY * window.devicePixelRatio));
		} else {
			this.rawPosition.set(new Vector(event.offsetX * window.devicePixelRatio, event.offsetY * window.devicePixelRatio));
		}

		this.position.set(this.rawPosition.toCanvas(this.target));
		this.emit('move', event);
	}

	up(event) {
		event.preventDefault();
		this.down = false;
		if (!this.locked) {
			this.rawPosition.set(new Vector(event.offsetX * window.devicePixelRatio, event.offsetY * window.devicePixelRatio));
			this.position.set(this.rawPosition.toCanvas(this.target));
			this.target.releasePointerCapture(event.pointerId);
		}

		this.emit('up', event);
	}

	wheel(event) {
		event.preventDefault();
		this.emit('wheel', event);
	}

	menu(event) {
		event.preventDefault();
		this.emit('menu', event);
	}

	close() {
		this.target.removeEventListener('click', this.click);
		this.target.removeEventListener('pointerdown', this.pointerdown);
		this.target.removeEventListener('pointermove', this.move);
		this.target.removeEventListener('pointerup', this.up);
		this.target.removeEventListener('contextmenu', this.menu);
		this.target.removeEventListener('mousewheel', this.wheel);
		this.target = null;
	}
}