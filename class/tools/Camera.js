import Vector from "../core/geometry/Vector2.js";
import CSSCursor from "../core/ui/CSSCursor.js";
import Tool from "./Tool.js";

export default class extends Tool {
	// static cursor = 'move';
	static cursor = new CSSCursor([
		['circle', {
			cx: 8,
			cy: 8,
			r: 5.5,
			fill: 'none'
		}],
		['path', {
			d: 'M6.5 2.5 8 1l1.5 1.5m-3 11L8 15l1.5-1.5m-7-7L1 8l1.5 1.5m11-3L15 8l-1.5 1.5',
			strokeLineCap: 'round',
			strokeLineJoin: 'round'
		}]
	], {
		size: 16,
		strokeWidth: 2
	});

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

	trackOffset = new Vector;
	onPress() {
		if (this.mouse._pointers.size === 2) {
			const [a, b] = this.mouse.pointers
				, dist = a.raw.distanceTo(b.raw);
			this.#pinch = {
				active: true,
				pointerIds: [a.id, b.id],
				initialDistance: dist,
				lastDistance: dist,
				scale: 1
			};
		}

		this.trackOffset.set(0, 0);
	}

	onStroke(event) {
		if (this.#pinch.active) {
			const [idA, idB] = this.#pinch.pointerIds;
			const a = this.mouse.pointers.find(p => p.id === idA);
			const b = this.mouse.pointers.find(p => p.id === idB);

			if (a && b) {
				const current = a.raw.distanceTo(b.raw);
				const last = this.#pinch.lastDistance;
				const scale = current / last;

				this.#pinch.scale *= scale;
				this.#pinch.lastDistance = current;

				const center = a.raw.clone().add(b.raw).scale(0.5);

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

		const offset = new Vector(event.movementX, event.movementY).scale(window.devicePixelRatio ?? 1).downScale(this.scene.camera.zoom);
		if (this.scene.transformMode) {
			this.trackOffset.add(offset);
		}

		if (!this.mouse.down) return;
		this.scene.camera.move(-offset.x, -offset.y);
		this.mouse.raw.sub(offset);
	}

	onClip() {
		if (this.mouse._pointers.size < 2 && this.#pinch.active) {
			this.#pinch.active = false;
			this.#pinch.pointerIds.splice(0);
		}
	}

	onScroll(event) {
		const camera = this.scene.camera
			, oldZoom = camera.zoom
			// , delta = event.wheelDelta > 0 ? .2 : -.2
			, delta = (event.wheelDelta > 0 ? 1 : -1) * camera.zoom * 0.1
			, newZoom = oldZoom + delta;
		if (newZoom === oldZoom || newZoom <= 0) return;
		if (camera.controller.focalPoint) {
			camera.zoom = newZoom;
			return;
		}

		const mouseWorldBefore = camera.toWorld(event.offsetX, event.offsetY, true);
		camera.zoom = newZoom;
		const mouseWorldAfter = camera.toWorld(event.offsetX, event.offsetY, true);

		const dx = mouseWorldBefore.x - mouseWorldAfter.x
			, dy = mouseWorldBefore.y - mouseWorldAfter.y;

		camera.move(dx, dy);
	}
}