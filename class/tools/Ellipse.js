import Line from "./Line.js";

export default class extends Line {
	length = 2;
	lines = [];
	scroll(event) {
		if (this.length > 4 && (0 < event.detail || event.wheelDelta < 0)) {
			this.length -= 8;
		} else if (this.length < 200 && (0 > event.detail || event.wheelDelta > 0)) {
			this.length += 8;
		}
	}

	stroke() {
		if (!this.mouse.down || this.mouse.old.distanceTo(this.mouse.position) < 4) {
			return;
		}

		for (const line of this.lines) {
			line.remove();
		}

		const points = []; this.lines = [];
		for (let i = 0; i <= 360; i += this.length) {
			points.push(this.mouse.old.sum({
				x: Math.sqrt((this.mouse.position.x - this.mouse.old.x) ** 2) * Math.cos(i * Math.PI / 180),
				y: Math.sqrt((this.mouse.position.y - this.mouse.old.y) ** 2) * Math.sin(i * Math.PI / 180)
			}));
		}

		points.push(points[0]);
		for (let i = 0; i < points.length - 1; i++) {
			this.lines.push(this.scene.addLine(points[i], points[i + 1], this.scenery));
		}
	}

	clip() {
		this.lines = [];
	}
}