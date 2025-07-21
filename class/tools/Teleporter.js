import Powerup from "./Powerup.js";

export default class extends Powerup {
	clip() {
		if (this.powerup.position.distanceTo(this.mouse.old) > 40) {
			this.powerup.createAlt(this.mouse.old.x, this.mouse.old.y);
			super.clip();
		} else {
			this.powerup.alt.set(this.mouse.position);
		}
	}

	draw(ctx) {
		if (this.scene.cameraLock) {
			let position = this.mouse.position.toPixel();
			let margin = 50;
			let dirX = (position.x > this.scene.parent.canvas.width - margin) - (position.x < margin);
			if (dirX !== 0) {
				this.scene.camera.x += 4 / this.scene.zoom * dirX;
				this.mouse.position.x += 4 / this.scene.zoom * dirX;
			}

			let dirY = (position.y > this.scene.parent.canvas.height - margin) - (position.y < margin);
			if (dirY !== 0) {
				this.scene.camera.y += 4 / this.scene.zoom * dirY;
				this.mouse.position.y += 4 / this.scene.zoom * dirY;
			}

			ctx.beginPath()
			let old = this.mouse.old.toPixel();
			ctx.moveTo(old.x, old.y)
			ctx.lineTo(position.x, position.y)
			ctx.save()
			ctx.strokeStyle = this.mouse.position.distanceTo(this.mouse.old) > 40 ? '#0f0' : '#f00'
			ctx.stroke()
			ctx.restore();
		}

		super.draw(ctx);
	}

	stroke() {
		super.stroke(...arguments);
		this.mouse.down && this.powerup.alt.set(this.mouse.old);
	}

	update() {
		super.update(...arguments);
		this.powerup.createAlt(this.mouse.position.x, this.mouse.position.y);
	}
}