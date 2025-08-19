import Line from "./Line.js";

export default class extends Line {
	length = 20;
	onStroke(event, pointer) {
		if (!this.mouse.down) return;
		const anchor = this.anchors.get(pointer.id)
			, position = this.scene.camera.toWorld(pointer.raw);
		if (anchor.distanceTo(position) >= this.length) {
			this.scene.track.addLine(anchor, position, this.scenery);
			this.anchors.set(pointer.id, position);
		}
	}

	onScroll(event) {
		if (this.length > 4 && (0 < event.detail || event.wheelDelta < 0)) {
			this.length -= 8;
		} else if (this.length < 200 && (0 > event.detail || event.wheelDelta > 0)) {
			this.length += 8;
		}
	}
}