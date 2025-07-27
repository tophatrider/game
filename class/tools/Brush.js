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

	stroke(event, pointer) {
		if (!this.mouse.down) return;

		const anchor = this.anchors.get(pointer.id);
		if (anchor.distanceTo(this.mouse.position) >= this.length) {
			this.scene.addLine(anchor, pointer.position, this.scenery);
			this.anchors.set(pointer.id, pointer.position.toStatic());
		}
	}
}