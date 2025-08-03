export default class BaseVector {
	constructor(x = 0, y = 0, normalize = false) {
		if (typeof x == 'object') {
			normalize = y;
			if (x instanceof Array) {
				[x, y] = x;
			} else {
				y = x.y || x[1];
				x = x.x || x[0];
			}
		}

		this.x = parseFloat(x) || 0;
		this.y = parseFloat(y) || 0;
		if (normalize) {
			const dpr = window.devicePixelRatio;
			this.x *= dpr;
			this.y *= dpr;
		}
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

	clone(...args) {
		return new this.constructor(this.x, this.y, ...args);
	}

	toArray() {
		return [this.x, this.y];
	}

	toCanvas(canvas) {
		return this.constructor.from(Math.round((this.x - canvas.width / 2) / game.scene.camera.zoom + game.scene.camera.x), Math.round((this.y - canvas.height / 2) / game.scene.camera.zoom + game.scene.camera.y));
	}

	toJSON() {
		return { x: this.x, y: this.y };
	}

	toPixel(game = window.game) {
		return this.constructor.from((this.x - game.scene.camera.x) * game.scene.camera.zoom + game.canvas.width / 2, (this.y - game.scene.camera.y) * game.scene.camera.zoom + game.canvas.height / 2);
	}

	toString() {
		return this.x.toString(32) + ' ' + this.y.toString(32);
	}

	static from() {
		return new this(...arguments);
	}

	static fromScreen(...args) {
		return new this(...args, true);
	}

	static isVector(obj) {
		return obj && typeof obj.x === 'number' && typeof obj.y === 'number';
	}

	static zero() {
		return new this(0, 0);
	}
}