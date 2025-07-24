export default class BaseVector {
	constructor(x = 0, y = 0) {
		if (typeof x == 'object') {
			if (x instanceof Array)
				return new this.constructor(...x);

			y = x.y || x[1];
			x = x.x || x[0];
		}

		this.x = parseFloat(x) || 0;
		this.y = parseFloat(y) || 0;
	}

	get length() {
		return Math.sqrt(this.lengthSquared());
	}

	angleTo(v) {
		return Math.atan2(v.y - this.y, v.x - this.x);
	}

	distanceTo(v) {
		return Math.sqrt(this.distanceToSquared(v));
	}

	distanceToSquared(v) {
		return (this.x - v.x) ** 2 + (this.y - v.y) ** 2;
	}

	dot(v) {
		return this.x * v.x + this.y * v.y;
	}

	equ(v, ε = 1e-10) {
		return Math.abs(this.x - v.x) < ε && Math.abs(this.y - v.y) < ε;
	}

	lengthSquared() {
		return this.x ** 2 + this.y ** 2;
	}

	normalize() {
		const len = this.length;
		return len > 0 ? new this.constructor(this.x / len, this.y / len) : this.clone();
	}

	clone() {
		return new this.constructor(this.x, this.y);
	}

	toArray() {
		return [this.x, this.y];
	}

	toJSON() {
		return { x: this.x, y: this.y };
	}

	toString() {
		return this.x.toString(32) + ' ' + this.y.toString(32);
	}

	static from() {
		return new this(...arguments);
	}

	static isVector(obj) {
		return obj && typeof obj.x === 'number' && typeof obj.y === 'number';
	}

	static zero() {
		return new this(0, 0);
	}
}