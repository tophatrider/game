import PhysicsLine from "../../items/line/PhysicsLine.js";
import SceneryLine from "../../items/line/SceneryLine.js";

export default class {
	physics = []
	scenery = []
	powerups = []
	rendered = false;
	canvas = document.createElement('canvas');
	ctx = this.canvas.getContext('2d');
	constructor(parent, row, column) {
		this.parent = parent;
		this.row = row;
		this.column = column;
		this.resize();

		// const offscreen = this.canvas.transferControlToOffscreen();
		// this.parent.helper.postMessage({
		// 	cmd: 'INIT_SECTOR',
		// 	row, column,
		// 	size: this.parent.scale * this.parent.scene.zoom,
		// 	lineWidth: Math.max(2 * this.parent.scene.zoom, 0.5),
		// 	strokeStyle: /^dark$/i.test(this.parent.scene.parent.settings.theme) ? '#fbfbfb' : /^midnight$/i.test(this.parent.scene.parent.settings.theme) ? '#ccc' : '#000',
		// 	offscreen
		// }, [offscreen]);

		// this.parent.helper.postMessage({
		// 	cmd: 'CREATE_SECTOR',
		// 	row, column
		// });
	}

	get resized() {
		return (this.canvas.width + this.canvas.height) / 2 !== this.parent.scale * this.parent.scene.zoom;
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
		} else if (item.type == 'scenery') {
			this.scenery.push(item);
		} else {
			this.powerups.push(item);
		}

		return this;
	}

	cache(offsetX = this.row * this.parent.scale, offsetY = this.column * this.parent.scale) {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		if (this.scenery.length > 0) {
			let strokeStyle = this.ctx.strokeStyle;
			this.ctx.strokeStyle = '#'.padEnd(7, /^(dark|midnight)$/i.test(this.parent.scene.parent.settings.theme) ? '6' : 'a');
			for (const line of this.scenery)
				line.draw(this.ctx, offsetX, offsetY);

			this.ctx.strokeStyle = strokeStyle;
		}

		for (const line of this.physics)
			line.draw(this.ctx, offsetX, offsetY);

		this.rendered = true;
	}

	render(ctx) {
		let offsetX = this.row * this.parent.scale;
		let offsetY = this.column * this.parent.scale;
		this.resized && this.resize();
		this.rendered || this.cache(offsetX, offsetY);
		ctx.drawImage(/*this.image || */this.canvas, Math.floor(ctx.canvas.width / 2 + (offsetX - this.parent.scene.camera.x) * this.parent.scene.zoom), Math.floor(ctx.canvas.height / 2 + (offsetY - this.parent.scene.camera.y) * this.parent.scene.zoom), this.parent.scale * this.parent.scene.zoom, this.parent.scale * this.parent.scene.zoom);
	}

	resize() {
		this.canvas.width = this.parent.scale * this.parent.scene.zoom;
		this.canvas.height = this.parent.scale * this.parent.scene.zoom;
		this.ctx.lineCap = 'round';
		this.ctx.lineJoin = 'round';
		this.ctx.lineWidth = Math.max(2 * this.parent.scene.zoom, 0.5);
		this.ctx.strokeStyle = '#'.padEnd(7, /^dark$/i.test(this.parent.scene.parent.settings.theme) ? 'fb' : /^midnight$/i.test(this.parent.scene.parent.settings.theme) ? 'c' : '0');
		// this.ctx.transform(this.parent.scene.zoom, 0, 0, this.parent.scene.zoom, 0, 0);
		this.rendered = false;
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
		this.rendered = false;
		return item;
	}

	delete() {
		return this.parent.delete(this.row, this.column);
	}
}