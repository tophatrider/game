import Powerup from "./Powerup.js";

export default class extends Powerup {
	static minRadius = 30;
	static maxRadius = 90;
	onActivate() {
		super.onActivate(...arguments);
		this.powerup.radius = 0;
	}

	onStroke() {
		super.onStroke(...arguments);
		if (!this.mouse.down) return;
		this.powerup.radius = Math.min(this.constructor.maxRadius, this.powerup.position.distanceTo(this.scene.camera.toWorld(this.mouse.raw)));
	}

	onClip() {
		if (this.powerup.radius < this.constructor.minRadius) {
			this.powerup.radius = 0;
			return;
		}

		super.onClip(...arguments);
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