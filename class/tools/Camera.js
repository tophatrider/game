import Vector from "../core/math/Vector.js";
import Tool from "./Tool.js";

export default class extends Tool {
	static cursor = 'move';

	#pinch = {
		active: false,
		pointerIds: [],
		initialDistance: 0,
		lastDistance: 0,
		scale: 1
	};

	_handlePinch(syntheticEvent) {
		this.mouse.emit('pinch', syntheticEvent);
		this.mouse._handleScroll(syntheticEvent);
	}

	trackOffset = new Vector();
	press() {
		if (this.mouse._pointers.size === 2) {
			const [a, b] = this.mouse.pointers
				, dist = a.position.distanceTo(b.position);
			this.#pinch = {
				active: true,
				pointerIds: [a.id, b.id],
				initialDistance: dist,
				lastDistance: dist,
				scale: 1
			};
		}

		this.trackOffset.set(new Vector());
	}

	scroll(event) {
		this.scene['zoom' + (event.wheelDelta > 0 ? 'In' : 'Out')]();
	}

	stroke(event) {
		if (this.#pinch.active) {
			const [idA, idB] = this.#pinch.pointerIds;
			const a = this.mouse.pointers.find(p => p.id === idA);
			const b = this.mouse.pointers.find(p => p.id === idB);

			if (a && b) {
				const current = a.position.distanceTo(b.position);
				const last = this.#pinch.lastDistance;
				const scale = current / last;

				this.#pinch.scale *= scale;
				this.#pinch.lastDistance = current;

				const center = a.position.clone().add(b.position).scale(0.5);

				this._handlePinch({
					type: "wheel",
					deltaY: -(scale - 1) * 300,
					scale,
					pinch: true,
					origin: "pinch",
					center
				});
			}
		}

		const offset = new Vector(event.movementX * window.devicePixelRatio / this.scene.zoom, event.movementY * window.devicePixelRatio / this.scene.zoom);
		if (this.scene.transformMode) {
			this.trackOffset.add(offset);
		}

		this.mouse.down && (this.scene.camera.sub(offset),
		this.mouse.position.sub(offset));
	}

	clip() {
		if (this.mouse._pointers.size < 2 && this.#pinch.active) {
			this.#pinch.active = false;
			this.#pinch.pointerIds.splice(0);
		}
	}
}