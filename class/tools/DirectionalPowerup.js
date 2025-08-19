import Powerup from "./Powerup.js";

export default class extends Powerup {
	onStroke() {
		this.mouse.down ? (this.powerup.rotation = Math.round(180 * Math.atan2(-(this.mouse.raw.x - this.mouse.raw.old.x), this.mouse.raw.y - this.mouse.raw.old.y) / Math.PI)) : super.onStroke();
	}

	draw(ctx) {
		super.draw(ctx);
		if (!this.scene.camera.locked) return;
		ctx.beginPath();
		const { position } = this.mouse;
		ctx.arc(position.x, position.y, Math.round(Math.max(2 * this.scene.camera.zoom, .5)), 0, 2 * Math.PI);
		const fill = ctx.fillStyle;
		ctx.fillStyle = this.powerup.constructor.color;
		ctx.fill();
		ctx.stroke();

		ctx.fillStyle = fill;
	}
}