import EventEmitter from "./EventEmitter.js";
import PhysicsLine from "../items/line/PhysicsLine.js";
import SceneryLine from "../items/line/SceneryLine.js";
import Target from "../items/Target.js";
import Checkpoint from "../items/Checkpoint.js";
import Boost from "../items/Boost.js";
import Gravity from "../items/Gravity.js";
import Bomb from "../items/Bomb.js";
import Slowmo from "../items/Slowmo.js";
import Antigravity from "../items/Antigravity.js";
import Teleporter from "../items/Teleporter.js";
import UndoManager from "./history/UndoManager.js";

export default class extends EventEmitter {
	consumables = new WeakSet;
	history = new UndoManager;
	physicsLines = [];
	powerupTypes = {};
	sceneryLines = [];
	mode = 'readwrite'; // mode -- transformMode
	parser = new Worker(new URL('./workers/parser.js', import.meta.url));
	constructor(parent) {
		super();
		Object.defineProperty(this, 'scene', { value: parent || null });
		Object.defineProperty(this, 'writable', { value: false, writable: true });
		this.parser.addEventListener('message', ({ data }) => {
			switch(data.code) {
			case 1:
				// emit event
				// exportProgress?
				this.emit('export', data.data.code);
				break;
			}
		});
		this.clear()
	}

	get targets() {
		return this.powerupTypes.targets.length;
	}

	addLine(start, end, scenery) {
		let line = new (scenery ? SceneryLine : PhysicsLine)(start.x, start.y, end.x, end.y);
		if (line.length >= 2 && line.length < 1e5) {
			this[scenery ? 'sceneryLines' : 'physicsLines'].push(line);
			this.emit('lineAdd');

			const cache = arguments[3];
			if (cache !== false) {
				// this.history.push({
				// 	undo: line.remove.bind(line),
				// 	redo: () => this.scene.grid.addItem(line)
				// });
			}
		}
	}

	addPowerup(powerup) {
		this.powerupTypes[powerup.type] ||= [];
		this.powerupTypes[powerup.type].push(powerup);
		this.emit('powerupAdd');

		const cache = arguments[3];
		if (cache !== false) {
			// this.history.push({
			// 	undo: line.remove.bind(line),
			// 	redo: () => this.scene.grid.addItem(line)
			// });
		}
	}

	clear() {
		clearTimeout(this.processingPhysics);
		clearTimeout(this.processingScenery);
		this.processingPhysics = null;
		this.processingScenery = null;
		this.powerupTypes = {};
		this.processing = false;
		this.physicsProgress = 100;
		this.sceneryProgress = 100;
		this.consumables = new WeakSet();
		this.physicsLines.splice(0);
		this.sceneryLines.splice(0);
	}

	// cache bitmaps
	cache() { }
	// draw(ctx) { }

	erase(vector) {
		// check if is readonly
		if (this.state === 'readonly') return;
		let i = this.scene.grid.scale - 0.5
		  , x = Math.floor(vector.x / i)
		  , y = Math.floor(vector.y / i)
		  , cache = [];
		for (let i = 0; i < 4; i % 2 == 0 ? x += 1 - i % 4 : y += i % 2, i++) {
			let sector = this.scene.grid.sector(x, y);
			sector && cache.push(...sector.erase(vector));
		}

		for (let item of cache) {
			if (this.physicsLines.indexOf(item) !== -1) {
				this.physicsLines.splice(item, 1);
			} else if (this.sceneryLines.indexOf(item) !== -1) {
				this.sceneryLines.splice(item, 1);
			} else {
				for (let type in this.powerupTypes) {
					if (this.powerupTypes[type].indexOf(item) !== -1) {
						this.powerupTypes[type].splice(item, 1)
					}
				}
			}
		}

		this.history.push({
			undo: () => cache.forEach(item => this.grid.addItem(item)),
			redo: () => cache.forEach(item => item.remove())
		})
	}

	write(data, { overwrite } = {}) {
		overwrite && this.clear();
		data ||= '-18 1i 18 1i###BMX';
		this.processing = true;
		this.parser.postMessage({
			cmd: 'PARSE',
			code: data
		});
	}

	compile() { // read
		this.postMessage({
			code: 1,
			data: {
				physicsLines: this.physicsLines.map(obj => obj.toJSON()),
				sceneryLines: this.sceneryLines.map(obj => obj.toJSON()),
				powerups: Object.values(this.powerupTypes).flatMap(type => type.map(obj => obj.toJSON()))
			}
		});
		this.emit('compiling');
	}

	rotate() { }
	scale() { }
	transform(scaleX, translateX, rotateX, scaleY, translateY, rotateY) {
		this.scale(scaleX, scaleY);
		this.translate(translateX, translateY);
		this.rotate(rotateX, rotateY)
	}

	translate(x, y) {
		// Filter sectors that are currently visible
		// let sectorsInView = this.scene.grid.sectors.filter();
		// Only move objects in sectors that are visible, and objects that will be visible
		// Before filtering sectors, convert offset units to sectors and add to the range
		// If the size of a sector is 100 and the track is being moved 200 units, when filtering the sectors, subtract 2 from the min and add 2 to the max?

		// Maybe have worker move the rest after the visible sections are moved?

		// let physics = [];
		// let scenery = [];
		// let powerups = [];
		// for (const sector of this.grid.sectors) {
		// 	physics.push(...sector.physics.filter(line => (line = this.grid.coords(line.a)) && line.x == sector.row && line.y == sector.column));
		// 	scenery.push(...sector.scenery.filter(line => (line = this.grid.coords(line.a)) && line.x == sector.row && line.y == sector.column));
		// 	powerups.push(...sector.powerups.map(powerup => powerup.position.add(offset) && powerup));
		// }

		// this.init({ write: true });
		// this.read(Array(Array.from(new Set(physics)).map(line => line.a.add(offset) && line.b.add(offset) && line).join(','), scenery.map(line => line.a.add(offset) && line.b.add(offset) && line).join(','), powerups.join(','), this.firstPlayer.vehicle.name).join('#'));
	}

	close() {
		this.terminate()
	}

	toString() {
		if (this.physicsLines.length > 5e3 || this.sceneryLines.length > 5e3) {
			this.compile();
			return 'Track too large! Loading...';
		}
		let physics = ''
		  , scenery = ''
		  , powerups = '';
		for (const line of this.physicsLines)
			line.recorded || (physics.length > 0 && (physics += ','),
			physics += line.toString());
		for (const line of this.physicsLines)
			delete line.recorded;
		for (const line of this.sceneryLines)
			line.recorded || (scenery.length > 0 && (scenery += ','),
			scenery += line.toString());
		for (const line of this.sceneryLines)
			delete line.recorded;
		for (const powerupType in this.powerupTypes) {
			for (const powerup of this.powerupTypes[powerupType]) {
				powerups.length > 0 && (powerups += ',');
				powerups += powerup.toString();
			}
		}

		let code = physics + '#' + scenery + '#' + powerups;
		this.emit('export', code);
		return code
	}
}