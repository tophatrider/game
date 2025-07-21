import Vector from "../Vector.js";
import Item from "./Item.js";

export default class Triangle extends Item {
	constructor() {
		super(...arguments);
		this.rotation = Math.max(arguments[3], 0);
	}

	get dir() {
		return new Vector(-Math.sin(this.rotation * Math.PI / 180), Math.cos(this.rotation * Math.PI / 180));
	}

	draw(ctx) {
		ctx.beginPath();
		ctx.save();
		let position = this.position.toPixel();
		ctx.translate(position.x, position.y);
		ctx.rotate(this.rotation * Math.PI / 180);
		ctx.moveTo(-7 * this.scene.zoom, -10 * this.scene.zoom);
		ctx.lineTo(0, 10 * this.scene.zoom);
		ctx.lineTo(7 * this.scene.zoom, -10 * this.scene.zoom);
		ctx.closePath();
		ctx.fillStyle = this.constructor.color;
		ctx.fill();
		ctx.restore();
		ctx.stroke();
	}

	collide(part) {
		if (part.real.distanceToSquared(this.position) > 1e3) {
			return;
		}

		this.activate(part);
	}

	toString() {
		return this.type + ' ' + this.position.toString() + ' ' + (this.rotation - 180).toString(32)
	}
}