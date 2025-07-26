import Tool from "./Tool.js";

export default class extends Tool {
	lines = [];
	scenery = false;
	clip() {
		this.lines.splice(0);
	}

	draw(ctx) {
		if (this.points.length < 1) return;

		ctx.beginPath()
		ctx.rect(...this.points)
		ctx.stroke()
	}

	rect(x, y, width, height) {
		const points = [
			{ x: x, y: y },
			{ x: x, y: y + height },
			{ x: x + width, y: y + height },
			{ x: x + width, y: y }
		];

		return points.concat(points[0]);
	}

	stroke() {
		if (!this.mouse.down || this.mouse.old.distanceTo(this.mouse.position) < 4) return;
		for (const line of this.lines)
			line.remove();

		this.lines.splice(0);
		let x = this.mouse.position.x - this.mouse.old.x > 0 ? this.mouse.old.x : this.mouse.position.x;
		let y = this.mouse.position.y - this.mouse.old.y > 0 ? this.mouse.old.y : this.mouse.position.y;
		let points = this.rect(x, y, Math.abs(this.mouse.position.x - this.mouse.old.x), Math.abs(this.mouse.position.y - this.mouse.old.y));
		for (let i = 0; i < points.length - 1; i++) {
			this.lines.push(this.scene.addLine(points[i], points[i + 1], this.scenery));
		}
	}
}