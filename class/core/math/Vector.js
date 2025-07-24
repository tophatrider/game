import BaseVector from "./BaseVector.js";
import StaticVector from "./StaticVector.js";

export default class Vector extends BaseVector {
	set(v) {
		this.x = v.x;
		this.y = v.y;
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

	toCanvas(canvas) {
		return this.constructor.from(Math.round((this.x - canvas.width / 2) / window.game.scene.zoom + window.game.scene.camera.x), Math.round((this.y - canvas.height / 2) / window.game.scene.zoom + window.game.scene.camera.y));
	}

	toPixel() {
		return this.constructor.from((this.x - window.game.scene.camera.x) * window.game.scene.zoom + window.game.canvas.width / 2, (this.y - window.game.scene.camera.y) * window.game.scene.zoom + window.game.canvas.height / 2);
	}

	toStatic() {
		return StaticVector.from(this);
	}
}