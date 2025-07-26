import Line from "./Line.js";

export default class extends Line {
	active = false;
	anchorA = null;
	anchorB = null;
	length = 2;
	lines = [];
	scroll(event) {
		if (this.length > 4 && (0 < event.detail || event.wheelDelta < 0)) {
			this.length -= 8;
		} else if (this.length < 200 && (0 > event.detail || event.wheelDelta > 0)) {
			this.length += 8;
		}
	}

	press() {
		if (this.active) return;

		this.anchorA = this.mouse.position.toStatic();
	}

	stroke() {
		if (!this.active) return;
		for (const line of this.lines.splice(0))
			line.remove();

		const points = [];
		for (let i = 0; i < 1; i += this.length / 100) {
			points.push({
				x: Math.pow((1 - i), 2) * this.anchorA.x + 2 * (1 - i) * i * this.mouse.position.x + Math.pow(i, 2) * this.anchorB.x,
				y: Math.pow((1 - i), 2) * this.anchorA.y + 2 * (1 - i) * i * this.mouse.position.y + Math.pow(i, 2) * this.anchorB.y
			});
		}

		points.push(this.anchorB);
		for (let i = 0; i < points.length - 1; i++) {
			this.lines.push(this.scene.addLine(points[i], points[i + 1], this.scenery));
		}
	}

	clip() {
		if (this.anchorA.distanceTo(this.mouse.position) < 1) return;

		this.active = !this.active;
		if (this.active) {
			this.anchorB = this.mouse.position.toStatic();
			return;
		}

		this.lines.splice(0);
	}
}