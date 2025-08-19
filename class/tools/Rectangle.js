import BaseShape from "./BaseShape.js";

export default class extends BaseShape {
	onStroke() {
		if (!this.mouse.down || this.mouse.raw.old.distanceTo(this.mouse.raw) < 4) return;
		for (const line of this.lines)
			line.remove();

		this.lines.splice(0);
		// super.onClip();
		let x = this.mouse.raw.x - this.mouse.raw.old.x > 0 ? this.mouse.raw.old.x : this.mouse.raw.x;
		let y = this.mouse.raw.y - this.mouse.raw.old.y > 0 ? this.mouse.raw.old.y : this.mouse.raw.y;
		let points = this.rect(x, y, Math.abs(this.mouse.raw.x - this.mouse.raw.old.x), Math.abs(this.mouse.raw.y - this.mouse.raw.old.y));
		for (let i = 0; i < points.length - 1; i++) {
			this.lines.push(this.scene.addLine(points[i], points[i + 1], this.scenery));
		}
	}

	draw(ctx) {
		if (this.points.length < 1) return;
		ctx.beginPath();
		ctx.rect(...this.points);
		ctx.stroke();
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
}