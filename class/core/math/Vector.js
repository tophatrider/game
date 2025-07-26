import BaseVector from "./BaseVector.js";
import StaticVector from "./StaticVector.js";

export default class Vector extends BaseVector {
	static Static = StaticVector;

	set(v, normalize = false) {
		this.x = v.x;
		this.y = v.y;
		normalize && this.scaleSelf(window.devicePixelRatio);
		return this;
	}

	add(v) {
		this.x += v.x;
		this.y += v.y;
		return this;
	}

	sub(v) {
		this.x -= v.x;
		this.y -= v.y;
		return this;
	}

	scaleSelf(factor) {
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
}