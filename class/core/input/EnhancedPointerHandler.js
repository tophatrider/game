import PointerHandler from "./PointerHandler.js";

export default class EnhancedPointerHandler extends PointerHandler {
	#pinch = {
		active: false,
		pointerIds: [],
		initialDistance: 0,
		lastDistance: 0,
		scale: 1
	};

	_handlePinch(syntheticEvent) {
		this.emit('pinch', syntheticEvent);
		this._handleScroll(syntheticEvent);
	}

	_handlePointerCancel() {
		super._handlePointerCancel(...arguments);
		if (this._pointers.size < 2 && this.#pinch.active) {
			this.#pinch.active = false;
			this.#pinch.pointerIds = [];
		}
	}

	_handlePointerDown() {
		super._handlePointerDown(...arguments);
		if (this._pointers.size === 2) {
			const [a, b] = this.pointers
				, dist = a.position.distanceTo(b.position);
			this.#pinch = {
				active: true,
				pointerIds: [a.id, b.id],
				initialDistance: dist,
				lastDistance: dist,
				scale: 1
			};
		}
	}

	_handlePointerMove() {
		super._handlePointerMove(...arguments);
		if (this.#pinch.active) {
			const [idA, idB] = this.#pinch.pointerIds;
			const a = this.pointers.find(p => p.id === idA);
			const b = this.pointers.find(p => p.id === idB);

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
	}

	_handlePointerUp() {
		super._handlePointerUp(...arguments);
		if (this._pointers.size < 2 && this.#pinch.active) {
			this.#pinch.active = false;
			this.#pinch.pointerIds = [];
		}
	}
}