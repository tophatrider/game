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

	get length() {
		return this.physics.length + this.scenery.length + this.powerups.length
	}

	add(...items) {
		if (items[0] instanceof Array) return this.add(...items[0], items.slice(1));
		for (const item of items.filter(item => typeof item == 'object' && item !== null && !this.has(item))) {
			if (item.constructor.type === 'physics') {
				this.physics.push(item);
				// this.parent.scene.track.processing || this.parent.renderer.addItem(this.column, this.row, item.serialize());
				// this.parent.scene.track.processing || this.parent.renderer.addPhysics(this.column, this.row, item.serialize());
			} else if (item.constructor.type === 'scenery') {
				this.scenery.push(item);
				// this.parent.scene.track.processing || this.parent.renderer.addScenery(this.column, this.row, item.serialize());
			} else {
				this.powerups.push(item);
			}
		}

		if (this.parent.scene.track.processing) return;
		const lines = items.filter(item => item.constructor.type === 'physics' || item.constructor.type === 'scenery');
		if (lines.length < 1) return;
		const view = new Int32Array(lines.length * 4);
		for (let i = 0; i < lines.length; i++) {
			const {a, b} = lines[i];
			view[i*4]   = a.x;
			view[i*4+1] = a.y;
			view[i*4+2] = b.x;
			view[i*4+3] = b.y;
		}
		this.parent.renderer.push(this.column, this.row, view.buffer);
	}

	has(item) {
		return this.physics.includes(item) || this.scenery.includes(item) || this.powerups.includes(item)
	}

	cache() {
		if (this._rendering) return;
		this._rendering = true;
		this.dirty && this.push();
		this.parent.renderer.render(this.column, this.row);
	}

	push() {
		this.dirty = false;
		const view = new Int32Array(this.physics.length * 4);
		for (let i = 0; i < this.physics.length; i++) {
			const l = this.physics[i];
			view[i*4]   = l.a.x;
			view[i*4+1] = l.a.y;
			view[i*4+2] = l.b.x;
			view[i*4+3] = l.b.y;
		}

		this.parent.renderer.push(this.column, this.row, view.buffer);
	}

	render(ctx) {
		const offsetX = this.column * this.parent.scale
			, offsetY = this.row * this.parent.scale
			, camera = this.parent.scene.camera;
		this.cached || this.cache(); // remove -- cache when new item is added
		this.bitmap && ctx.drawImage(this.bitmap, Math.floor(camera.viewportWidth * .5 + (offsetX - camera.x) * camera.zoom), Math.floor(camera.viewportHeight * .5 + (offsetY - camera.y) * camera.zoom), this.parent.scale * camera.zoom, this.parent.scale * camera.zoom);
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

	serialize() {
		return {
			physicsLines: this.physics.map(line => line.serialize()),
			sceneryLines: this.scenery.map(line => line.serialize()),
			powerups: this.powerups.map(p => p.serialize?.() ?? null).filter(Boolean)
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

		// this.parent.renderer.removeItem(this.column, this.row, item.serialize());

		item.removed = true;
		if (this.length < 1) this.delete();
		else this.cached = false;
		return item;
	}

	delete() {
		const visibleIndex = this.parent.visible.indexOf(this);
		visibleIndex !== -1 && this.parent.visible.splice(visibleIndex, 1);
		return this.parent.delete(this.column, this.row);
	}
}