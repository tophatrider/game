import Tool from "./Tool.js";

export default class extends Tool {
	size = 15;
	ignoring = new Set();
	scroll(event) {
		if (this.size > 5 && (0 < event.detail || 0 > event.wheelDelta)) {
			this.size -= 5;
		} else {
			if (40 > this.size && (0 > event.detail || 0 < event.wheelDelta)) {
				this.size += 5
			}
		}
	}

	press() {
		this.scene.erase(this.mouse.position);
	}

	stroke() {
		this.mouse.down && this.scene.erase(this.mouse.position);
	}

	draw(ctx) {
		ctx.beginPath()
		let position = this.mouse.position.toPixel();
		ctx.arc(position.x, position.y, (this.size - 1) * this.scene.zoom, 0, 2 * Math.PI)
		ctx.save()
		ctx.fillStyle = '#ffb6c199'
		ctx.fill()
		ctx.restore();
	}
}