import Vector from "../core/math/Vector.js";
import Tool from "./Tool.js";

export default class extends Tool {
	trackOffset = new Vector();
	press(event) {
		this.trackOffset.set(new Vector());
	}

	scroll(event) {
		this.scene['zoom' + (event.wheelDelta > 0 ? 'In' : 'Out')]();
	}

	stroke(event) {
		let offset = new Vector(event.movementX * window.devicePixelRatio / this.scene.zoom, event.movementY * window.devicePixelRatio / this.scene.zoom);
		if (this.scene.transformMode) {
			this.trackOffset.add(offset);
		}

		this.mouse.down && (this.scene.camera.sub(offset),
		this.mouse.position.sub(offset));
	}
}