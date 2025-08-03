import EventEmitter from "../../EventEmitter.js";
import CameraController from "./CameraController.js";
import Vector from "../../geometry/Vector.js";

export default class Camera extends EventEmitter {
	#locked = false;
	#zoom = window.devicePixelRatio ?? 1;
	
	controller = new CameraController(this);
	rotation = 0;
	x = 0;
	y = 0;
	constructor(viewportWidth = 600, viewportHeight = 400) {
		super();
		this.setViewport(viewportWidth, viewportHeight);
	}

	get locked() { return this.#locked }
	set locked(value) {
		this.#locked = value;
		this.emit('lockStateChange', this.#locked);
	}

	get zoom() { return this.#zoom }
	set zoom(value) {
		const clamped = Math.min(
			window.devicePixelRatio * 4,
			Math.max(window.devicePixelRatio / 5, Math.round(value * 10) / 10)
		);
		if (clamped === this.#zoom) return
		this.#zoom = clamped;
		this.emit('zoom', clamped);
	}

	setPosition(x, y) {
		if (this.x === x && this.y === y) return;
		this.x = x;
		this.y = y;
		this.emit('move', { x, y });
	}

	move(dx, dy) {
		this.setPosition(this.x + dx, this.y + dy);
	}

	lock() {
		this.locked = true;
	}

	unlock() {
		this.locked = false;
	}

	setViewport(width, height) {
		this.viewportWidth = width;
		this.viewportHeight = height;
		this.emit('viewportChange', this.viewportWidth, this.viewportHeight);
	}

	setZoom(zoom) {
		this.zoom = zoom;
	}

	applyTransform(ctx) {
		ctx.setTransform(
			this.zoom, 0,
			0, this.zoom,
			this.viewportWidth / 2 - this.x * this.zoom,
			this.viewportHeight / 2 - this.y * this.zoom
		);
	}

	resetTransform(ctx) {
		ctx.setTransform(1, 0, 0, 1, 0, 0);
	}

	toWorld(x, y) {
		return new Vector(
			(x - this.viewportWidth / 2) / this.zoom + this.x,
			(y - this.viewportHeight / 2) / this.zoom + this.y
		);
	}
}