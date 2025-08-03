import PhysicsLine from "../items/line/PhysicsLine.js";
import SceneryLine from "../items/line/SceneryLine.js";

export default class {
	bitmap = null;
	cached = false;
	physics = [];
	scenery = [];
	powerups = [];
	constructor(parent, x, y) {
		if (typeof x !== 'number' || typeof y !== 'number')
			throw new TypeError(`Sector initialized with invalid coordinates: (${x}, ${y})`);

		Object.defineProperties(this, {
			_rendering: { value: false, writable: true },
			parent: { value: parent, writable: true }
		});
		this.column = x;
		this.row = y;
		this.parent.renderer.createSector(this.column, this.row);
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

		if (item.type == 'physics') {
			this.physics.push(item);
			// this.parent.scene.processing || this.parent.renderer.addItem(this.column, this.row, item.toJSON());
		} else if (item.type == 'scenery') {
			this.scenery.push(item);
			this.parent.scene.processing || this.parent.renderer.addScenery(this.column, this.row, item.toJSON());
		} else {
			this.powerups.push(item);
		}
	}

	cache() {
		if (this._rendering) return;
		this._rendering = true;
		this.parent.renderer.render({
			column: this.column,
			row: this.row,
			// data: this.serialize()
			data: {
				physicsLines: this.physics.map(line => line.toJSON())
			}
		});
	}

	render(ctx) {
		const offsetX = this.column * this.parent.scale
			, offsetY = this.row * this.parent.scale;
		this.cached || this.cache();
		this.bitmap && ctx.drawImage(this.bitmap, Math.floor(ctx.canvas.width / 2 + (offsetX - this.parent.scene.camera.x) * this.parent.scene.camera.zoom), Math.floor(ctx.canvas.height / 2 + (offsetY - this.parent.scene.camera.y) * this.parent.scene.camera.zoom), this.parent.scale * this.parent.scene.camera.zoom, this.parent.scale * this.parent.scene.camera.zoom);
	}

	/* reset() { */ fix() { // escape collision
		for (const line of this.physics.filter(line => line.collided))
			line.collided = false;
	}

	collide(part) {
		const physics = this.physics.filter(line => !line.collided);
		for (let line = physics.length - 1; line >= 0; line--) {
			physics[line].collide(part);
		}

		if (!part.parent.dead) {
			const powerups = this.powerups.filter(powerup => !powerup.used);
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

	serialize() {
		return {
			physicsLines: this.physics.map(line => line.toJSON()),
			sceneryLines: this.scenery.map(line => line.toJSON()),
			powerups: this.powerups.map(p => p.toJSON?.() ?? null).filter(Boolean)
		};
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

		// this.parent.renderer.removeItem(this.column, this.row, item.toJSON());

		item.removed = true;
		this.cached = false;
		return item;
	}

	delete() {
		return this.parent.delete(this.row, this.column);
	}
}