import Line from "./Line.js";

export default class extends Line {
	length = 20;
	scroll(event) {
		if (this.length > 4 && (0 < event.detail || event.wheelDelta < 0)) {
			this.length -= 8;
		} else if (this.length < 200 && (0 > event.detail || event.wheelDelta > 0)) {
			this.length += 8;
		}
	}

	stroke() {
		if (!this.mouse.down) return;

		this.anchor ??= this.mouse.old.clone();
		if (this.anchor.distanceTo(this.mouse.position) >= this.length) {
			this.scene.addLine(this.anchor, this.mouse.position, this.scenery);
			this.mouse.old.set(this.mouse.position);
			this.anchor = null;
		}
	}
}