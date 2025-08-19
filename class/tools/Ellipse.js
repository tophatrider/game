import Shape from "./Shape.js";

export default class extends Shape {
	onStroke() {
		if (!this.mouse.down || this.mouse.raw.old.distanceTo(this.mouse.raw) < 4) return;
		for (const line of this.lines.splice(0))
			line.remove();

		const points = [];
		for (let i = 0; i <= 360; i += this.length) {
			points.push(this.mouse.raw.old.sum({
				x: Math.sqrt((this.mouse.raw.x - this.mouse.raw.old.x) ** 2) * Math.cos(i * Math.PI / 180),
				y: Math.sqrt((this.mouse.raw.y - this.mouse.raw.old.y) ** 2) * Math.sin(i * Math.PI / 180)
			}));
		}

		points.push(points[0]);
		for (let i = 0; i < points.length - 1; i++)
			this.lines.push(this.scene.addLine(points[i], points[i + 1], this.scenery));
	}
}