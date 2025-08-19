export default class BaseVector extends Float64Array {
	static ApplyPixelRatio = Symbol('apply_dpr');

	constructor(x = 0, y = 0, ...flags) {
		super(2);
		if (x instanceof PointerEvent || x instanceof MouseEvent || x instanceof Touch) {
			y = x.offsetY;
			x = x.offsetX;
			flags.includes(BaseVector.ApplyPixelRatio) || flags.push(BaseVector.ApplyPixelRatio);
		}

		this.constructor.assignParsed(this, x, y, ...flags);
	}

	get x() { return this[0] }
	set x(v) { this[0] = v }
	get y() { return this[1] }
	set y(v) { this[1] = v }

	// get copy() {
	// 	return this.clone();
	// }

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

	clone(...args) {
		return new this.constructor(this.x, this.y, ...args);
	}

	serialize() {
		return { x: this.x, y: this.y };
	}

	toJSON() {
		return this.serialize();
	}

	toStatic() {
		return Object.freeze(this.serialize());
	}

	toString() {
		return this.x.toString(32) + ' ' + this.y.toString(32);
	}

	// [Symbol.isConcatSpreadable] = true;
	// *[Symbol.iterator]() {
	// 	yield this[0];
	// 	yield this[1];
	// }

	static assign(v1, v2) {
		v1.x = v2.x;
		v1.y = v2.y;
		return v1;
	}

	static assignParsed(target, x, y, ...flags) {
		if (typeof x === 'object') {
			if (x === null) throw new TypeError(`Invalid entry: ${x}`);
			flags.unshift(y);
			// flags = [y, ...flags]; // possibly faster
			if (Array.isArray(x)) {
				if (x.length < 2) throw new RangeError(`Invalid length: ${x.length}`);
				y = x[1];
				x = x[0];
			} else {
				y = x.y;
				x = x.x;
			}
		}

		let px = parseFloat(x)
		  , py = parseFloat(y);
		if (isNaN(px) || isNaN(py)) throw new TypeError(`Non-numeric: (${x}, ${y})`);
		if (flags.includes(BaseVector.ApplyPixelRatio)) {
			const dpr = window.devicePixelRatio;
			px *= dpr;
			py *= dpr;
		}

		if (Array.isArray(target)) {
			target[0] = px;
			target[1] = py;
		} else {
			target.x = px;
			target.y = py;
		}

		return target;
	}

	static from() {
		return new this(...arguments);
	}

	static fromScreen(...args) {
		return new this(...args, this.ApplyPixelRatio);
	}

	static isVector(obj) {
		return obj && typeof obj.x === 'number' && typeof obj.y === 'number';
	}

	static parseAsArray() {
		return this.assignParsed([], ...arguments);
	}

	static parseAsJSON() {
		return this.assignParsed({}, ...arguments);
	}

	static [Symbol.hasInstance](instance) {
		return instance && typeof instance.x === 'number' && typeof instance.y === 'number';
	}
}