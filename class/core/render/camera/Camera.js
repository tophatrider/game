import EventEmitter from "../../EventEmitter.js";
import CameraController from "./CameraController.js";
import Vector from "../../geometry/Vector2.js";

export default class Camera extends EventEmitter {
	#locked = false;
	#zoom = 1;
	
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
			1 * 4,
			Math.max(1 / 5, Math.round(value * 10) / 10)
		);
		if (clamped === this.#zoom) return
		this.#zoom = clamped;
		this.emit('zoom', clamped);
	}

	setPosition(x, y) {
		if ((!x && !y) || (this.x === x && this.y === y)) return;
		if (isNaN(x) || isNaN(y))
			throw new TypeError(`Coordinates resolved NaN: (${x}, ${y})`);
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

	// toScreen() {
	// 	const [x, y] = Vector.parseAsArray(...arguments);
	// 	// if arguments[0] != instanceof Vector return modified x, y arguments
	// 	return new Vector(
	// 		(x - this.x) * this.zoom + this.viewportWidth / 2,
	// 		(y - this.y) * this.zoom + this.viewportHeight / 2
	// 	);
	// }

	toScreen() {
		const [x, y] = Vector.parseAsArray(...arguments);

		const sx = (x - this.x) * this.zoom + this.viewportWidth * .5;
		const sy = (y - this.y) * this.zoom + this.viewportHeight * .5;

		if (!(arguments[0] instanceof Vector))
			return { x: sx, y: sy };

		return new Vector(sx, sy);
	}

	toWorld() {
		const [x, y] = Vector.parseAsArray(...arguments);
		const invZoom = 1 / this.zoom;
		return new Vector(
			(x - this.viewportWidth * .5) * invZoom + this.x,
			(y - this.viewportHeight * .5) * invZoom + this.y
		);
	}

	// toWorld(...args) {
	// 	const [x, y] = Vector.parseAsArray(...args);

	// 	const wx = (x - this.viewportWidth / 2) / this.zoom + this.x;
	// 	const wy = (y - this.viewportHeight / 2) / this.zoom + this.y;

	// 	// Optimization: if not a Vector instance, return plain object
	// 	if (!(args[0] instanceof Vector))
	// 		return { x: wx, y: wy };

	// 	return new Vector(wx, wy);
	// }
}