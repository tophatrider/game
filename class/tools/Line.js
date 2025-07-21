import Tool from "./Tool.js";

export default class extends Tool {
	anchor = null;
	scenery = false;
	clip() {
		if (this.anchor !== null) {
			this.scene.addLine(this.anchor, this.mouse.position, this.scenery);
			this.mouse.old.set(this.mouse.position);
			this.anchor = null;
		}
	}

	draw(ctx) {
		if (!this.scene.cameraLock || !this.anchor) {
			return;
		}

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
		let old = this.anchor.toPixel();
		ctx.moveTo(old.x, old.y)
		ctx.lineTo(position.x, position.y)
		ctx.save()
		ctx.strokeStyle = this.mouse.position.distanceTo(this.mouse.old) >= 2 ? '#0f0' : '#f00'
		ctx.stroke()
		ctx.restore();
	}

	press(event) {
		// if (event.ctrlKey) {
		// 	this.anchor = this.mouse.old.clone();
		// 	return;
		// }

		this.anchor = this.mouse.position.clone();
	}
}