import Shape from "./Shape.js";

export default class extends Shape {
	active = false;
	anchorA = null;
	anchorB = null;
	onPress() {
		if (this.active) return;
		this.anchorA = this.mouse.raw.toStatic();
	}

	onStroke() {
		if (!this.active) return;
		for (const line of this.lines.splice(0))
			line.remove();

		const points = [];
		for (let i = 0; i < 1; i += this.length / 100) {
			points.push({
				x: Math.pow((1 - i), 2) * this.anchorA.x + 2 * (1 - i) * i * this.mouse.raw.x + Math.pow(i, 2) * this.anchorB.x,
				y: Math.pow((1 - i), 2) * this.anchorA.y + 2 * (1 - i) * i * this.mouse.raw.y + Math.pow(i, 2) * this.anchorB.y
			});
		}

		points.push(this.anchorB);
		for (let i = 0; i < points.length - 1; i++) {
			this.lines.push(this.scene.addLine(points[i], points[i + 1], this.scenery));
		}
	}

	onClip() {
		if (this.anchorA.distanceTo(this.mouse.raw) < 1) return;
		this.active = !this.active;
		if (this.active) {
			this.anchorB = this.mouse.raw.toStatic();
			return;
		}

		super.onClip();
	}
}