import StaticVector from "../geometry/StaticVector.js";
import Vector from "../geometry/Vector.js";

export default class Pointer {
	down = false;
	id = null;
	initial = null;
	isPrimary = null;
	locked = false;
	old = null;
	position = new Vector;
	raw = new Vector;
	stroke = new Vector;
	constructor(event, target) {
		// Object.defineProperty(this, 'event', { value: event, writable: true });

		this.id = event.pointerId;
		this.initial = new StaticVector(event.offsetX, event.offsetY, true);
		this.isPrimary = event.isPrimary;

		this._update(event, target);
	}

	_update(event, target) {
		this.old = this.position.toStatic();
		if (this.locked) {
			this.raw.add(event.movementX, event.movementY, true);
			this.down || (this.initial = this.raw.toStatic());
		} else {
			this.raw.set(event.offsetX, event.offsetY, true);
		}

		this.position.set(this.raw.toCanvas(target));
		this.stroke.set(this.position).sub(this.old);
	}

	_setPointerDown() {
		this.down = true;
		this._update(...arguments);
	}

	_setPointerUp() {
		this.down = false;
		this._update(...arguments);
	}
}