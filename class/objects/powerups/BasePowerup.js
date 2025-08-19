import Vector2 from "../../core/geometry/Vector2.js";

export default class {
	size = 7;
	constructor(scene, x, y) {
		Object.defineProperty(this, 'scene', { value: scene, writable: true });
		this.position = new Vector2(x, y);
	}

	draw(ctx, position = this.scene.camera.toScreen(this.position)) {
		ctx.beginPath();
		ctx.arc(position.x, position.y, 7 * this.scene.camera.zoom, 0, 2 * Math.PI);
		ctx.fillStyle = this.constructor.color;
		ctx.fill();
		ctx.stroke();
	}

	collide(part) {
		part.real.distanceToSquared(this.position) < 500 && this.activate(part);
	}

	erase(vector) {
		return vector.distanceTo(this.position) < this.scene.toolHandler.currentTool.size + this.size;
	}

	serialize() {
		return {
			position: this.position.serialize(),
			type: this.constructor.type
		}
	}

	remove() {
		this.scene.grid.removeItem(this);
		this.removed = true;
		return this;
	}

	toString() {
		return this.constructor.type + ' ' + this.position.toString();
	}

	static draw(ctx, pos, zoom) {
		this.prototype.draw.call(this, ctx);
		// ctx.beginPath();
		// ctx.arc(pos.x, pos.y, 7 * zoom, 0, 2 * Math.PI);
		// ctx.fillStyle = this.color;
		// ctx.fill();
		// ctx.stroke();
	}
}