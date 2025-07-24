import BaseVector from "./BaseVector.js";

export default class StaticVector extends BaseVector {
	constructor() {
		super(...arguments);
		Object.freeze(this);
		Reflect.preventExtensions(this);
	}

	add(v) {
		return new this.constructor(this.x + v.x, this.y + v.y);
	}

	sub(v) {
		return new this.constructor(this.x - v.x, this.y - v.y);
	}

	scale(factor) {
		return new this.constructor(this.x * factor, this.y * factor);
	}

	downScale(factor) {
		return new this.constructor(this.x / factor, this.y / factor);
	}

	lerp(to, alpha) {
		return new this.constructor(
			this.x + (to.x - this.x) * alpha,
			this.y + (to.y - this.y) * alpha
		)
	}
}