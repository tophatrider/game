import EventEmitter from "./EventEmitter.js";
import TrackParserBridge from "./TrackParserBridge.js";
import PhysicsLine from "../objects/line/PhysicsLine.js";
import SceneryLine from "../objects/line/SceneryLine.js";
import Target from "../objects/powerups/Target.js";
import Checkpoint from "../objects/powerups/Checkpoint.js";
import Boost from "../objects/powerups/Boost.js";
import Gravity from "../objects/powerups/Gravity.js";
import Bomb from "../objects/powerups/Bomb.js";
import Slowmo from "../objects/powerups/Slowmo.js";
import Antigravity from "../objects/powerups/Antigravity.js";
import Teleporter from "../objects/powerups/Teleporter.js";
import GravitationalField from "../objects/powerups/GravitationalField.js";
import UndoManager from "./history/UndoManager.js";

const P = {
	Antigravity,
	Bomb,
	Boost,
	Checkpoint,
	GravitationalField,
	Gravity,
	Slowmo,
	Target,
	Teleporter
};

export default class Track extends EventEmitter {
	static Modes = {
		View: 'view',              // can't interact
		ReadOnly: 'readonly',      // can select / inspect only
		Edit: 'edit',              // full editing mode
		Transform: 'transform',    // scaling, rotating, moving
		Playtest: 'playtest',      // simulate
	};

	#parsingProgress = {
		physicsLines: 0,
		sceneryLines: 0,
		powerups: 0,
		sum: 0
	};

	history = new UndoManager;
	mode = this.constructor.Modes.Edit; // mode -- transformMode
	parser = new TrackParserBridge();
	// state = 'parsing';
	constructor(parent) {
		super();
		Object.defineProperty(this, 'scene', { value: parent || null });
		Object.defineProperty(this, 'writable', { value: false, writable: true });
		this.parser.on('complete', this._handleComplete.bind(this));
		this.parser.on('parsed', this._handleParsed.bind(this));
		this.parser.on('progress', this._handleProgress.bind(this));
		this.clear();
	}

	get length() {
		return this.physicsLines.length + this.sceneryLines.length
	}

	_addLine(x1, y1, x2, y2, scenery) {
		this._addPoints([x1, y1, x2, y2], scenery);
	}

	_addPoints(view, scenery) {
		const target = (scenery ? 'scenery' : 'physics') + 'Lines'
			, old = this[target] || new Int32Array(0)
			, newArr = new Int32Array(old.length + view.length);
		newArr.set(old);
		newArr.set(view, old.length);
		this[target] = newArr;
	}

	_handleComplete() {
		this.processing = false;
		// this.game.mouse.listen();
		// this.emit('parse');
		// for (const sector of this.scene.sectors)
		// 	sector.push();
		this.scene.game.emit('load');
	}

	_handleParsed(data) {
		if (data?.sceneryLines?.byteLength > 0) {
			const intView = new Int32Array(data.sceneryLines);
			this._addPoints(intView, true);
			for (let i = 0; i < intView.length; i += 4) {
				this.addLine(
					intView[i], intView[i + 1],
					intView[i + 2], intView[i + 3],
					true
				);
			}
		}

		if (data?.physicsLines?.byteLength > 0) {
			const intView = new Int32Array(data.physicsLines);
			this._addPoints(intView);
			for (let i = 0; i < intView.length; i += 4) {
				this.addLine(
					intView[i], intView[i + 1],
					intView[i + 2], intView[i + 3]
				);
			}
		}

		if (data?.powerups?.length > 0) {
			for (const p of data.powerups) {
				const constructor = P[p.type];
				if (!constructor) {
					console.warn('Unrecognized powerup type:', p.type);
					break;
				}

				const powerup = new constructor(this.scene, ...p.args);
				this.addPowerup(powerup);
			}
		}
	}

	_handleProgress(value, type) {
		this.#parsingProgress[type] = value;
		this.#parsingProgress.sum = Math.floor((this.#parsingProgress.physicsLines + this.#parsingProgress.sceneryLines + this.#parsingProgress.powerups) / 3);
	}

	get isEditable() {
		return this.mode === Track.Modes.Edit;
	}

	get isReadOnly() {
		return this.mode === Track.Modes.ReadOnly || this.mode === Track.Modes.View;
	}

	get targets() {
		return this.powerupTypes[Target.type]?.length ?? 0;
	}

	addLine(x1, y1, x2, y2, scenery, setDirty) {
		let line = new (scenery ? SceneryLine : PhysicsLine)(x1, y1, x2, y2, this.scene);
		if (line.length >= 2 && line.length < 1e5) {
			!this.processing && this._addLine(...arguments);
			this.emit('lineCreate', line);

			this.scene.sectors.addItem(line, setDirty);

			const cache = arguments[3];
			if (cache !== false) {
				this.history.record(
					() => line.remove(),
					() => this.scene.sectors.addItem(line)
				);
			}
		}
	}

	addPowerup(powerup) {
		this.powerupTypes[powerup.constructor.type] ||= [];
		this.powerupTypes[powerup.constructor.type].push(powerup);
		this.emit('powerupAdd', powerup);

		const invScale = 1 / this.scene.sectors.scale;

		let x = Math.floor(powerup.position.x * invScale)
		  , y = Math.floor(powerup.position.y * invScale);

		const sector = this.scene.sectors.sector(x, y, true);
		sector.powerups.push(powerup);
		if (powerup instanceof Teleporter) {
			x = Math.floor(powerup.alt.x * invScale);
			y = Math.floor(powerup.alt.y * invScale);
			sector.powerups.push(powerup);
		}

		const cache = arguments[3];
		if (cache !== false) {
			this.history.record(
				() => powerup.remove(),
				() => this.scene.sectors.addItem(powerup)
			);
		}
	}

	clear() {
		this.powerupTypes = {};
		this.processing = false;
		// this.physicsLines.splice(0);
		// this.sceneryLines.splice(0);
		this.physicsLines = new Int32Array();
		this.sceneryLines = new Int32Array();
	}

	// cache bitmaps
	cache() { }
	// draw(ctx) { }

	collide(part) {
		const scene = this.scene
			, sectors = scene.sectors
			, scale = sectors.scale
			, x = Math.floor(part.real.x / scale - .5)
			, y = Math.floor(part.real.y / scale - .5)
			, a = sectors.sector(x, y)
			, b = sectors.sector(x, y + 1)
			, c = sectors.sector(x + 1, y)
			, d = sectors.sector(x + 1, y + 1);
		if (!a && !b && !c && !d) return;

		a?.fix();
		b?.fix();
		c?.fix();
		d?.fix();

		a?.collide(part);
		c?.collide(part);
		d?.collide(part);
		b?.collide(part);
	}

	erase(vector) {
		if (this.isReadOnly) return;
		let x = Math.floor(vector.x / this.scene.sectors.scale - .5)
		  , y = Math.floor(vector.y / this.scene.sectors.scale - .5)
		  , cache = [];
		for (let i = 0; i < 4; i % 2 == 0 ? x += 1 - i % 4 : y += i % 2, i++) {
			const sector = this.scene.sectors.sector(x, y);
			sector && cache.push(...(sector.erase(vector) || []));
		}

		cache = Array.from(new Set(cache));
		for (const item of cache) {
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

		this.history.record(
			() => cache.forEach(item => this.scene.sectors.addItem(item)),
			() => cache.forEach(item => item.remove())
		)
	}

	write(data = '-18 1i 18 1i###BMX', { overwrite } = {}) {
		if (typeof data != 'string')
			throw new TypeError('First positional argument, data, must be of type: string');
		overwrite && this.clear();
		this.processing = true;
		this.parser.parse(data);
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
		// let sectorsInView = this.scene.sectors.sectors.filter();
		// Only move objects in sectors that are visible, and objects that will be visible
		// Before filtering sectors, convert offset units to sectors and add to the range
		// If the size of a sector is 100 and the track is being moved 200 units, when filtering the sectors, subtract 2 from the min and add 2 to the max?

		// Maybe have worker move the rest after the visible sections are moved?

		// let physics = [];
		// let scenery = [];
		// let powerups = [];
		// for (const sector of this.scene.sectors.sectors) {
		// 	physics.push(...sector.physics.filter(line => (line = this.scene.sectors.coords(line.a)) && line.x == sector.row && line.y == sector.column));
		// 	scenery.push(...sector.scenery.filter(line => (line = this.scene.sectors.coords(line.a)) && line.x == sector.row && line.y == sector.column));
		// 	powerups.push(...sector.powerups.map(powerup => powerup.position.add(offset) && powerup));
		// }

		// this.init({ write: true });
		// this.write(Array(Array.from(new Set(physics)).map(line => line.a.add(offset) && line.b.add(offset) && line).join(','), scenery.map(line => line.a.add(offset) && line.b.add(offset) && line).join(','), powerups.join(','), this.firstPlayer.vehicle.name).join('#'));
	}

	toString() {
		let physics = ''
		  , scenery = ''
		  , powerups = '';
		// for (let i = 0; i < this.physicsLines.length; i += 4) {
		// 	// find connected lines -- polyline
		// }

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

		return physics + '#' + scenery + '#' + powerups;
	}

	static extract(raw) {
		const match = raw.match(/(?:([\da-v\s,-]+)?#){2}([\da-w\s,-]+)?(?:#(BMX|MTB)(?:#\d+)?)?/gi);
		return match && match[0] || null;
	}
}