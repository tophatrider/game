import Tool from "./Tool.js";

export default class extends Tool {
	anchor = null;
	scenery = false;
	clip() {
		if (this.anchor === null) return;
		this.scene.addLine(this.anchor, this.mouse.position, this.scenery);
		this.mouse.old.set(this.mouse.position);
		this.anchor = null;
	}

	draw(ctx) {
		if (!this.scene.cameraLock || !this.anchor) return;

		const pos = this.mouse.position.toPixel()
			, margin = 50;
		let dirX = (pos.x > this.scene.parent.canvas.width - margin) - (pos.x < margin);
		if (dirX !== 0) {
			this.scene.camera.x += 4 / this.scene.zoom * dirX;
			this.mouse.position.x += 4 / this.scene.zoom * dirX;
		}

		let dirY = (pos.y > this.scene.parent.canvas.height - margin) - (pos.y < margin);
		if (dirY !== 0) {
			this.scene.camera.y += 4 / this.scene.zoom * dirY;
			this.mouse.position.y += 4 / this.scene.zoom * dirY;
		}

		ctx.beginPath()
		const old = this.anchor.toPixel();
		ctx.moveTo(old.x, old.y);
		ctx.lineTo(pos.x, pos.y);
		const strokeStyle = ctx.strokeStyle;
		ctx.strokeStyle = this.mouse.position.distanceTo(this.mouse.old) >= 2 ? '#0f0' : '#f00'
		ctx.stroke();
		ctx.strokeStyle = strokeStyle;
	}

	press(event) {
		// if (event.ctrlKey) {
		// 	this.anchor = this.mouse.old.clone();
		// 	return;
		// }

		this.anchor = this.mouse.position.clone();
	}
}