import BasePowerup from "./BasePowerup.js";
import Vector from "../../core/geometry/Vector2.js";

export default class Triangle extends BasePowerup {
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
		const position = this.scene.camera.toScreen(this.position);
		ctx.translate(position.x, position.y);
		ctx.rotate(this.rotation * Math.PI / 180);
		ctx.moveTo(-7 * this.scene.camera.zoom, -10 * this.scene.camera.zoom);
		ctx.lineTo(0, 10 * this.scene.camera.zoom);
		ctx.lineTo(7 * this.scene.camera.zoom, -10 * this.scene.camera.zoom);
		ctx.closePath();
		ctx.fillStyle = this.constructor.color;
		ctx.fill();
		ctx.restore();
		ctx.stroke();
	}

	collide(part) {
		if (part.real.distanceToSquared(this.position) > 1e3) return;
		this.activate(part);
	}

	toString() {
		return super.toString() + ' ' + (this.rotation - 180).toString(32)
	}
}