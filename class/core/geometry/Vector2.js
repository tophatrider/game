import BaseVector from "./BaseVector.js";

export default class Vector2 extends BaseVector {
	applyPixelRatio(pixelRatio = window.devicePixelRatio) {
		return this.scale(pixelRatio);
	}

	set() {
		this.constructor.assignParsed(this, ...arguments);
		return this;
	}

	copy(v) {
		v.x = this.x;
		v.y = this.y;
		return v;
	}

	add() {
		const [x, y] = this.constructor.parseAsArray(...arguments);
		this.x += x;
		this.y += y;
		return this;
	}

	sub() {
		const [x, y] = this.constructor.parseAsArray(...arguments);
		this.x -= x;
		this.y -= y;
		return this;
	}

	scale(factor, normalize = false) {
		if (typeof factor != 'number' || !Number.isFinite(factor)) {
			console.warn('Vector2.scale() called with invalid factor:', factor);
			return this;
		}

		normalize && (factor *= window.devicePixelRatio);
		this.x *= factor;
		this.y *= factor;
		return this;
	}

	downScale(factor, normalize) {
		normalize && (factor *= window.devicePixelRatio);
		this.x /= factor;
		this.y /= factor;
		return this;
	}

	floor() {
		this.x = Math.floor(this.x);
		this.y = Math.floor(this.y);
		return this;
	}

	lerp(target, alpha) {
		this.x += (target.x - this.x) * alpha;
		this.y += (target.y - this.y) * alpha;
		return this;
	}

	map(callback = v => v) {
		this.x = callback(this.x, 'x');
		this.y = callback(this.y, 'y');
		return this;
	}

	// static get [Symbol.species]() { return BaseVector }
}