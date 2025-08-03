import Powerup from "./Powerup.js";

export default class extends Powerup {
	draw(ctx) {
		super.draw(ctx);
		if (this.scene.camera.locked) {
			ctx.beginPath();
			let position = this.mouse.position.toPixel();
			ctx.arc(position.x, position.y, Math.round(Math.max(2 * this.parent.scene.camera.zoom, 0.5)), 0, 2 * Math.PI);
			ctx.save();
			ctx.fillStyle = this.powerup.constructor.color;
			ctx.fill();
			ctx.restore();
			ctx.stroke();
		}
	}

	stroke() {
		this.mouse.down ? (this.powerup.rotation = Math.round(180 * Math.atan2(-(this.mouse.position.x - this.mouse.old.x), this.mouse.position.y - this.mouse.old.y) / Math.PI)) : super.stroke();
	}
}