import Powerup from "./Powerup.js";

export default class extends Powerup {
	static minLength = 40;
	onActivate() {
		super.onActivate(...arguments);
		this.powerup.createAlt(...this.mouse.raw);
	}

	onStroke() {
		super.onStroke(...arguments);
		this.mouse.down && this.powerup.alt.set(this.scene.camera.toWorld(this.mouse.raw));
	}

	onClip() {
		if (this.powerup.position.distanceTo(this.powerup.alt) > this.constructor.minLength) {
			super.onClip(...arguments);
			return;
		}

		this.powerup.alt.set(this.mouse.raw);
	}

	draw(ctx) {
		const { camera } = this.scene;
		if (camera.locked) {
			const stroke = ctx.strokeStyle;
			const old = camera.toScreen(this.powerup.position);
			const { position } = this.mouse;
			ctx.beginPath();
			ctx.moveTo(old.x, old.y);
			ctx.lineTo(position.x, position.y);
			ctx.strokeStyle = this.mouse.raw.distanceTo(this.mouse.raw.old) > this.constructor.minLength ? '#0f0' : '#f00';
			ctx.stroke();

			ctx.strokeStyle = stroke;
		}

		super.draw(ctx);
	}

	update() {
		if (!this.scene.camera.locked) return;
		let offsetX = 0, offsetY = 0;
		const pos = this.mouse.raw
			, margin = 50 * window.devicePixelRatio
			, maxSpeed = 7
			, dirX = (pos.x > this.scene.game.canvas.width - margin) - (pos.x < margin);
		if (dirX !== 0) {
			const deltaX = margin - (dirX > 0 ? this.scene.game.canvas.width - pos.x : pos.x);
			offsetX = maxSpeed * (deltaX / margin) / this.scene.camera.zoom * dirX;
		}

		const dirY = (pos.y > this.scene.game.canvas.height - margin) - (pos.y < margin);
		if (dirY !== 0) {
			const deltaY = margin - (dirY > 0 ? this.scene.game.canvas.height - pos.y : pos.y);
			offsetY = maxSpeed * (deltaY / margin) / this.scene.camera.zoom * dirY;
		}

		this.scene.camera.move(offsetX, offsetY);
		this.mouse.down && this.powerup.alt.add(offsetX, offsetY);
	}
}