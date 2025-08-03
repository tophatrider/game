export default class CameraController {
	#focalPoint = null;

	bounds = null;
	offsetX = 0;
	offsetY = 0;
	smooth = .1; // 0 = instant, closer to 1 = slower
	speed = 3;
	target = null;
	constructor(camera) {
		Object.defineProperty(this, 'camera', { value: camera, writable: true });
	}

	get focalPoint() { return this.#focalPoint }
	set focalPoint(value) {
		if (value === this.focalPoint) return;
		this.#focalPoint = value ?? null;
		if (value) this.follow(value.pos);
		else this.target = null;
		this.camera.emit('focalPointChange', value);
	}

	snapToTarget() {
		if (!this.target) return;
		this.camera.setPosition(
			this.target.x + this.offsetX,
			this.target.y + this.offsetY
		);
	}

	follow(target, offsetX = 0, offsetY = 0) {
		this.target = target ?? null;
		this.offsetX = offsetX;
		this.offsetY = offsetY;
	}

	setFocalPoint(entity) {
		this.focalPoint = entity;
	}

	update() {
		if (!this.target) return;

		this.target !== this.focalPoint.pos && (this.target = this.focalPoint.pos);

		const targetX = this.target.x + this.offsetX;
		const targetY = this.target.y + this.offsetY;

		const distance = this.target.distanceTo(this.camera);

		const speed = this.speed;
		const smoothing = 1 - Math.exp(-speed * (distance / 500));

		this.camera.move(
			(targetX - this.camera.x) * smoothing, // this.smooth,
			(targetY - this.camera.y) * smoothing // this.smooth
		);

		if (this.bounds) {
			const hw = this.camera.viewportWidth / 2;
			const hh = this.camera.viewportHeight / 2;
			const maxX = this.bounds.width - hw;
			const maxY = this.bounds.height - hh;
			this.camera.x = Math.max(hw, Math.min(maxX, this.camera.x));
			this.camera.y = Math.max(hh, Math.min(maxY, this.camera.y));
		}
	}

	setBounds(width, height) {
		this.bounds = { width, height };
	}
}