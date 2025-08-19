import TemporalVector from "../geometry/TemporalVector.js";

export default class Pointer {
	down = false;
	id = null;
	initial = null;
	isPrimary = null;
	locked = false;
	position = new TemporalVector;
	raw = new TemporalVector;
	constructor(event) {
		this.id = event.pointerId;
		this.initial = Object.freeze({ x: event.offsetX, y: event.offsetY });
		this.isPrimary = event.isPrimary;
		this._update(...arguments);
	}

	_update(event) {
		if (this.locked) {
			this.raw.add(event.movementX, event.movementY, TemporalVector.SKIP_OLD);
			this.down || (this.initial = this.raw.toStatic());
		} else {
			this.raw.set(event.offsetX, event.offsetY, TemporalVector.SKIP_OLD);
		}

		this.position.set(this.raw, true, TemporalVector.SKIP_OLD);
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