import BaseVector from "./BaseVector.js";
import StaticVector from "./StaticVector.js";

export default class Vector extends BaseVector {
	static Static = StaticVector;

	applyPixelRatio(pixelRatio = window.devicePixelRatio) {
		return this.scaleSelf(pixelRatio);
	}

	set() {
		const [x, y, normalize = false] = this.constructor.parseArgs(...arguments);
		this.x = x;
		this.y = y;
		normalize && this.applyPixelRatio();
		return this;
	}

	add() {
		const [x, y, normalize = false] = this.constructor.parseArgs(...arguments);
		this.x += x;
		this.y += y;
		normalize && this.applyPixelRatio();
		return this;
	}

	sub() {
		const [x, y, normalize = false] = this.constructor.parseArgs(...arguments);
		this.x -= x;
		this.y -= y;
		normalize && this.applyPixelRatio();
		return this;
	}

	scaleSelf(factor, normalize = false) {
		normalize && (factor *= window.devicePixelRatio);
		this.x *= factor;
		this.y *= factor;
		return this;
	}

	sum(v) {
		return new this.constructor(this.x + v.x, this.y + v.y);
	}

	diff(v) { // delta
		return new this.constructor(this.x - v.x, this.y - v.y);
	}

	scale(factor) {
		return new this.constructor(this.x * factor, this.y * factor);
	}

	downScale(factor) {
		return new this.constructor(this.x / factor, this.y / factor);
	}

	floor() {
		this.x = Math.floor(this.x);
		this.y = Math.floor(this.y);
		return this;
	}

	lerp(to, alpha) {
		return new this.constructor(
			this.x + (to.x - this.x) * alpha,
			this.y + (to.y - this.y) * alpha
		)
	}

	lerpTo(target, alpha) {
		this.x += (target.x - this.x) * alpha;
		this.y += (target.y - this.y) * alpha;
		return this;
	}

	map(callback = value => value) {
		return this.constructor.from(callback(this.x), callback(this.y));
	}

	toStatic() {
		return StaticVector.from(this);
	}

	static parseArgs(x, y, normalize) {
		if (typeof x == 'object') {
			typeof y == 'boolean' && (normalize = y);
			if (x instanceof Array) {
				[x, y] = x;
			} else {
				y = x.y || x[1];
				x = x.x || x[0];
			}
		}

		x = parseFloat(x) || 0;
		y = parseFloat(y) || 0;
		return [x, y, normalize];
	}
}