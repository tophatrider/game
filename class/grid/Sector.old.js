import PhysicsLine from "../objects/line/PhysicsLine.js";
import SceneryLine from "../objects/line/SceneryLine.js";

export default class {
	bitmap = null;
	physics = []
	scenery = []
	powerups = []
	rendered = false;
	resized = false;
	canvas = document.createElement('canvas');
	// ctx = this.canvas.getContext('2d'/*, { desynchronized: true }*/);
	ctx = this.canvas.getContext('2d', { alpha: false });
	constructor(parent, x, y) {
		Object.defineProperty(this, 'parent', { value: parent, writable: true });
		this.column = x;
		this.row = y;
		this._onResize();
	}

	_onResize() {
		this.resized = false;
		this.canvas.width = this.parent.scale * this.parent.scene.camera.zoom * window.devicePixelRatio;
		this.canvas.height = this.parent.scale * this.parent.scene.camera.zoom * window.devicePixelRatio;
		this.ctx.setTransform(this.parent.scene.camera.zoom * window.devicePixelRatio, 0, 0, this.parent.scene.camera.zoom * window.devicePixelRatio, -this.column * this.canvas.width, -this.row * this.canvas.height);
		this.ctx.fillStyle = this.parent.scene.game.colorScheme.palette.background;
		this.ctx.lineCap = 'round';
		this.ctx.lineJoin = 'round';
		this.ctx.lineWidth = 2;
		// console.trace('?')
		this.ctx.strokeStyle = this.parent.scene.game.colorScheme.palette.track;
		// this.ctx.transform(this.parent.scene.camera.zoom, 0, 0, this.parent.scene.camera.zoom, 0, 0);
		this.rendered = false;
	}

	get length() {
		return this.physics.length + this.scenery.length + this.powerups.length
	}

	add(item) {
		if (arguments.length > 1) {
			for (const item of arguments)
				this.add(item);
			return this;
		} else if (item instanceof Array) {
			return this.add(...item);
		} else if (this.physics.includes(item) || this.scenery.includes(item) || this.powerups.includes(item)) {
			return this;
		}

		if (item.constructor.type == 'physics') {
			this.physics.push(item);
		} else if (item.constructor.type == 'scenery') {
			this.scenery.push(item);
		} else {
			this.powerups.push(item);
		}
	}

	async cache() {
		// this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.fillRect(this.column * this.parent.scale, this.row * this.parent.scale, this.canvas.width / (this.parent.scene.camera.zoom * window.devicePixelRatio), this.canvas.height / (this.parent.scene.camera.zoom * window.devicePixelRatio));
		if (this.scenery.length > 0) {
			let strokeStyle = this.ctx.strokeStyle;
			this.ctx.strokeStyle = this.parent.scene.game.colorScheme.palette.foreground;
			for (const line of this.scenery)
				line.draw(this.ctx);

			this.ctx.strokeStyle = strokeStyle;
		}

		for (const line of this.physics)
			line.draw(this.ctx);

		this.rendered = true;
		this.bitmap = await createImageBitmap(this.canvas);
	}

	render(ctx) {
		const offsetX = this.column * this.parent.scale
			, offsetY = this.row * this.parent.scale
			, camera = this.parent.scene.camera;
		this.resized && this._onResize();
		// this.rendered || this.cache(offsetX, offsetY);
		this.rendered || (this.rendered = true,
		setTimeout(() => this.cache(), 0));
		this.bitmap && ctx.drawImage(this.bitmap, Math.floor(camera.viewportWidth * .5 + (offsetX - camera.x) * camera.zoom), Math.floor(camera.viewportHeight * .5 + (offsetY - camera.y) * camera.zoom), this.parent.scale * camera.zoom, this.parent.scale * camera.zoom);
	}

	fix() { // escape collision
		for (const line of this.physics.filter(line => line.collided))
			line.collided = false;
	}

	collide(part) {
		const physics = this.physics.filter(line => !line.collided);
		for (let line = physics.length - 1; line >= 0; line--) {
			physics[line].collide(part);
		}

		if (!part.parent.dead) {
			const powerups = this.powerups.filter(powerup => !part.parent.player.itemsConsumed.has(powerup.id));
			for (let powerup = powerups.length - 1; powerup >= 0; powerup--) {
				powerups[powerup].collide(part);
			}
		}
	}

	search(min, max) {
		const filter = ({ a, b }) => (min.x < a.x && a.x < max.x && min.y < a.y && a.y < max.y) || (min.x < b.x && b.x < max.x && min.y < b.y && b.y < max.y);
		return {
			physics: this.physics.filter(filter),
			scenery: this.scenery.filter(filter),
			powerups: this.powerups.filter(({ position }) => min.x < position.x && position.x < max.x && min.y < position.y && position.y < max.y)
		}
	}

	erase(vector) {
		let cache = [];
		if (!this.parent.scene.toolHandler.currentTool.ignoring.has('physics')) {
			for (const line of this.physics.filter(line => line.removed || line.erase(vector))) {
				cache.push(this.remove(line));
			}
		}

		if (!this.parent.scene.toolHandler.currentTool.ignoring.has('scenery')) {
			for (const line of this.scenery.filter(line => line.removed || line.erase(vector))) {
				cache.push(this.remove(line));
			}
		}

		if (!this.parent.scene.toolHandler.currentTool.ignoring.has('powerups')) {
			for (const item of this.powerups.filter(item => item.removed || item.erase(vector))) {
				cache.push(this.remove(item));
			}
		}

		return cache;
	}

	remove(item) {
		if (item instanceof PhysicsLine) {
			this.physics.splice(this.physics.indexOf(item), 1);
		} else if (item instanceof SceneryLine) {
			this.scenery.splice(this.scenery.indexOf(item), 1);
		} else {
			this.powerups.splice(this.powerups.indexOf(item), 1);
			const collectable = this.parent.scene.collectables.indexOf(item);
			if (collectable !== -1) {
				this.parent.scene.collectables.splice(collectable, 1);
			}
		}

		item.removed = true;
		if (this.length < 1) this.delete();
		else this.rendered = false;
		return item;
	}

	delete() {
		const visibleIndex = this.parent.visible.indexOf(this);
		visibleIndex !== -1 && this.parent.visible.splice(visibleIndex, 1);
		return this.parent.delete(this.column, this.row);
	}
}