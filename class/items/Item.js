import Vector from "../core/geometry/Vector.js";

export default class {
	scene = null;
	size = 7;
	constructor(scene, x, y) {
		Object.defineProperty(this, 'scene', { value: scene, writable: true });
		this.position = new Vector(x, y);
	}

	draw(ctx, position = this.position.toPixel()) {
		ctx.beginPath();
		ctx.arc(position.x, position.y, 7 * this.scene.camera.zoom, 0, 2 * Math.PI);
		ctx.save();
		ctx.fillStyle = this.constructor.color;
		ctx.fill();
		ctx.restore();
		ctx.stroke();
	}

	collide(part) {
		part.real.distanceToSquared(this.position) < 500 && this.activate(part);
	}

	erase(vector) {
		return vector.distanceTo(this.position) < this.scene.toolHandler.currentTool.size + this.size;
	}

	remove() {
		this.scene.grid.removeItem(this);
		this.removed = true;
		return this;
	}

	toString() {
		return this.type + ' ' + this.position.toString();
	}

	static clip() {}
	static draw(ctx) {
		this.prototype.draw.call(this, ctx);
		return;
		// let position = this.mouse.position.toPixel();
		ctx.beginPath();
		ctx.arc(position.x, position.y, 7 * this.scene.camera.zoom, 0, 2 * Math.PI);
		ctx.save();
		ctx.fillStyle = this.constructor.color;
		ctx.fill();
		ctx.restore();
		ctx.stroke();
	}

	static press() {
		this.anchor = this.mouse.position.clone();
		this.addPowerup(new this(this.scene, this.mouse.old.x, this.mouse.old.y));
	}

	static scroll() {}
	static stroke() {}
}