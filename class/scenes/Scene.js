import Events from "../core/Events.js";

import ClientPlayer from "../player/ClientPlayer.js";
import GhostPlayer from "../player/GhostPlayer.js";

import ToolHandler from "../handler/Tool.js";
import UndoManager from "../core/history/UndoManager.js";

import Track from "../core/Track.js";

import Vector from "../core/geometry/Vector.js";
import PhysicsLine from "../items/line/PhysicsLine.js";
import SceneryLine from "../items/line/SceneryLine.js";

// import SectorManager from "../grid/SectorManager.js";
import SectorManager from "../grid/Grid.js";

import Antigravity from "../items/Antigravity.js";
import Bomb from "../items/Bomb.js";
import Boost from "../items/Boost.js";
import Checkpoint from "../items/Checkpoint.js";
import Gravity from "../items/Gravity.js";
import Slowmo from "../items/Slowmo.js";
import Target from "../items/Target.js";
import Teleporter from "../items/Teleporter.js";
import Camera from "../core/render/camera/Camera.js";

const P = {
	Antigravity,
	Bomb,
	Boost,
	Checkpoint,
	Gravity,
	Slowmo,
	Target,
	Teleporter
};

// implement Track class w/ draw/move/scale/flip methods etc..
export default class Scene {
	#parsingProgress = {
		physicsLines: 0,
		sceneryLines: 0,
		powerups: 0,
		sum: 0
	};

	collectables = [];
	currentTime = 0;
	discreteEvents = new Set();
	editMode = false;
	frozen = false;
	ghosts = [];
	history = new UndoManager();
	parser = new Worker(new URL('../core/workers/parser.js', import.meta.url));
	paused = false;
	pictureMode = false;
	players = [];
	processing = true;
	// state = 'parsing';
	track = new Track();
	toolHandler = new ToolHandler(this);
	// transformMode = false;
	canvasPool = [];
	constructor(parent) {
		Object.defineProperty(this, 'game', { value: parent, writable: true });
		this.camera = new Camera(parent.canvas?.width || 1000, parent.canvas?.height || 1000);
		this.camera.on('move', () => this.sectors.updateVisible(this.camera));
		this.camera.on('zoom', zoom => {
			this.game.ctx.lineWidth = Math.max(2 * zoom, 0.5);
			// this.camera.applyTransform(this.game.ctx);
			// this.game.applyTransform();
			this.sectors.config();
			this.sectors.updateVisible(this.camera);
		});
		this.sectors = new SectorManager(this);
		parent.on('checkpoint', this.checkpoint.bind(this));
		parent.on('removeCheckpoint', this.checkpoint.bind(this));
		parent.on('restoreCheckpoint', this.checkpoint.bind(this));
		this.parser.addEventListener('message', this._handleParserMessage.bind(this));
	}

	_handleParserMessage({ data }) {
		const { payload } = data;
		switch (data.cmd) {
		case 'PARSED':
			if (payload?.physicsLines?.length > 0) {
				for (const line of payload.physicsLines)
					this.addLine(...line);
			}

			if (payload?.sceneryLines?.length > 0) {
				for (const line of payload.sceneryLines)
					this.addLine(...line, true);
			}

			if (payload?.powerups?.length > 0) {
				for (const p of payload.powerups) {
					const constructor = P[p.type];
					if (!constructor) {
						console.warn('Unrecognized powerup type:', p.type);
						break;
					}

					const powerup = new constructor(this, ...p.args);
					switch (powerup.type) {
					case Target:
						// this.targets.add(powerup);
					case Checkpoint:
					case Teleporter:
						this.collectables.push(powerup);
					}

					let x = Math.floor(powerup.position.x / this.sectors.scale)
					, y = Math.floor(powerup.position.y / this.sectors.scale);
					this.sectors.sector(x, y, true).powerups.push(powerup);
					if (powerup instanceof Teleporter) {
						x = Math.floor(powerup.alt.x / this.sectors.scale);
						y = Math.floor(powerup.alt.y / this.sectors.scale);
						this.sectors.sector(x, y, true).powerups.push(powerup);
					}
				}
			}

			data.partial || (this.processing = false); /* ,
			this.game.mouse.listen()); */
			break;
		case 'PROGRESS':
			this.#parsingProgress[data.type] = data.value;
			this.#parsingProgress.sum = Math.floor((this.#parsingProgress.physicsLines + this.#parsingProgress.sceneryLines + this.#parsingProgress.powerups) / 3);
		}
	}

	#transformMode = false;
	get transformMode() {
		return this.#transformMode;
	}

	set transformMode(value) {
		this.#transformMode = value;
		if (!value) {
			const cameraTool = this.toolHandler.cache.get('camera');
			cameraTool.trackOffset.length > 0 && this.moveTrack(cameraTool.trackOffset);
		} else {
			this.toolHandler.setTool('camera');
			this.reset();
		}
	}

	get targets() {
		return this.collectables.filter(({ type }) => type === 'T').length;
	}

	get timeText() {
		const t = (this.ghostInFocus ? this.ghostInFocus.playbackTicks : (this.currentTime / this.game._updateInterval)) / .03;
		return Math.floor(t / 6e4) + ':' + String((t % 6e4 / 1e3).toFixed(2)).padStart(5, '0');
	}

	get firstPlayer() {
		return this.players[0] ?? null;
	}

	get ghostInFocus() {
		return this.ghosts.find(({ vehicle }) => vehicle.hitbox == this.camera.controller.focalPoint);
	}

	init(options = {}) {
		options = Object.assign({ vehicle: 'BMX' }, arguments[0]);
		if (!/^bmx|mtb$/i.test(options.vehicle))
			throw new TypeError("Invalid vehicle type.");

		'id' in options && (this.id = options.id);
		clearInterval(this.processingTimeout);
		clearInterval(this.sprocessingTimeout);
		this.dispose();
		this.players.push(new ClientPlayer(this, { vehicle: options.vehicle }));
		this.processing = false;
		this.editMode = options.write ?? this.editMode;
		this.toolHandler.setTool(this.editMode ? 'line' : 'camera');
		this.reset();
	}

	switchBike() {
		this.firstPlayer.setVehicle(this.firstPlayer.vehicle.name != 'BMX' ? 'BMX' : 'MTB');
	}

	checkpoint() {
		this.paused = false;
		this.game.emit('stateChange', this.paused);
		this.game.settings.autoPause && (this.frozen = true);
		this.camera.controller.setFocalPoint(this.firstPlayer.vehicle.hitbox);
		this.camera.controller.snapToTarget();
	}

	returnToCheckpoint(noemit) {
		let checkpointExists = this.firstPlayer.gotoCheckpoint();
		if (checkpointExists) {
			for (const playerGhost of this.ghosts) {
				playerGhost.gotoCheckpoint();
			}
		} else {
			this.reset();
		}

		noemit || this.game.emit('checkpoint');
	}

	removeCheckpoint() {
		this.firstPlayer.removeCheckpoint();
		for (const playerGhost of this.ghosts)
			playerGhost.removeCheckpoint();

		this.returnToCheckpoint(true);
		this.game.emit('removeCheckpoint');
	}

	restoreCheckpoint() {
		this.firstPlayer.restoreCheckpoint();
		for (const playerGhost of this.ghosts)
			playerGhost.restoreCheckpoint();

		this.returnToCheckpoint(true);
		this.game.emit('restoreCheckpoint');
	}

	watchGhost(data, { id, vehicle = 'BMX' } = {}) {
		const parts = data.trim().split(/\s*,\s*/g);
		let v = parts.pop();
		let time = parts.at(-1);

		/^(BMX|MTB)$/i.test(v) && (vehicle = v);

		const records = parts.map(item => item.split(/\s+/g).reduce((newArr, arr) => isNaN(arr) ? arr : newArr.add(parseInt(arr)), new Set()));
		let player = id && this.ghosts.find(player => player.id == id);
		if (!id || !player) {
			player = new GhostPlayer(this, {
				records,
				time,
				vehicle
			});
			player.id = id;
			this.ghosts.push(player);
		}

		this.reset();
		this.camera.controller.setFocalPoint(player.vehicle.hitbox);
		this.camera.controller.snapToTarget();
		this.frozen = false;
		this.paused = false;
		this.game.emit(Events.ReplayAdd, player, arguments);
	}

	collide(part) {
		const x = Math.floor(part.real.x / this.sectors.scale - .5)
			, y = Math.floor(part.real.y / this.sectors.scale - .5);

		this.sectors.sector(x, y)?.fix();
		this.sectors.sector(x, y + 1)?.fix();
		this.sectors.sector(x + 1, y)?.fix();
		this.sectors.sector(x + 1, y + 1)?.fix();

		this.sectors.sector(x, y)?.collide(part);
		this.sectors.sector(x + 1, y)?.collide(part);
		this.sectors.sector(x + 1, y + 1)?.collide(part);
		this.sectors.sector(x, y + 1)?.collide(part);
	}

	fixedUpdate() {
		this.game.settings.autoPause && this.firstPlayer.gamepad.downKeys.size > 0 && (this.frozen = false);
		if (!this.paused && !this.processing && !this.frozen) {
			for (const player of this.players)
				player.fixedUpdate();
			for (const playerGhost of this.ghosts.filter(ghostPlayer => ghostPlayer.targetsCollected !== this.targets)) {
				playerGhost.ghostIterator.next();
				// playerGhost.fixedUpdate();
			}

			this.currentTime += this.game._updateInterval;
			// this.currentTime++
		}

		for (const event of this.discreteEvents) {
			switch (event) {
			case 'PAUSE':
				this.paused = true;
				this.game.emit('stateChange', this.paused);
				break;
			case 'UNPAUSE':
				this.paused = false;
				this.frozen = false
				this.game.emit('stateChange', this.paused);
			}

			this.discreteEvents.delete(event);
		}
	}

	update() {
		this.toolHandler.update();
		if (!this.paused && !this.processing && !this.frozen) {
			let players = this.players;
			this.targets > 0 && (players = players.filter(player => player.targetsCollected !== this.targets));
			for (const player of players)
				player.update(...arguments);
			for (const playerGhost of this.ghosts.filter(ghostPlayer => ghostPlayer.targetsCollected !== this.targets))
				playerGhost.update(...arguments);
		}
	}

	lateUpdate() {
		this.camera.controller.update();
	}

	render(ctx) {
		this.draw(ctx);
		if (!this.transformMode) {
			// ctx.save();
			for (const playerGhost of this.ghosts)
				playerGhost.draw(ctx);
			for (let i = this.players.length - 1; i >= 0; i--)
				this.players[i].draw(ctx);

			// ctx.restore();
		}

		this.camera.controller.focalPoint || this.toolHandler.draw(ctx);
	}

	draw(ctx) {
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		// ctx.fillRect(this.camera.x, this.camera.y, ctx.canvas.width / this.camera.zoom, ctx.canvas.height / this.camera.zoom);

		// const min = this.camera.toWorld(0, 0)
		// 	.downScale(this.sectors.scale)
		// 	.map(Math.floor);
		// const max = this.camera.toWorld(this.camera.viewportWidth, this.camera.viewportHeight)
		// 	.downScale(this.sectors.scale)
		// 	.map(Math.floor);
		// const minx = this.camera.toWorld(0, 0)
		// 	.downScale(this.sectors.scale)
		// 	.map(Math.floor);
		// const max = this.camera.toWorld(this.camera.viewportWidth, this.camera.viewportHeight)
		// 	.downScale(this.sectors.scale)
		// 	.map(Math.floor);

		const min = Vector.zero()
			.toCanvas(ctx.canvas)
			.downScale(this.sectors.scale);
		const max = new Vector(ctx.canvas.width, ctx.canvas.height)
			.toCanvas(ctx.canvas)
			.downScale(this.sectors.scale)
			.map(Math.floor);

		const sectors = this.sectors.range(min, max);
		for (const sector of sectors.filter(sector => sector.physics.length + sector.scenery.length > 0))
			sector.render(ctx);

		// for (const sector of this.sectors.visible.filter(sector => sector.physics.length + sector.scenery.length > 0))
		// 	sector.render(ctx);

		if (this.pictureMode) return;
		for (const sector of this.sectors.visible.filter(sector => sector.powerups.length > 0)) {
			for (const powerup of sector.powerups) {
				powerup.draw(ctx);
			}
		}
	}

	renderHUD(ctx) {
		// if (this.pictureMode) {
		// 	const imageData = ctx.getImageData(ctx.canvas.width / 2 - this.pictureMode.width / 2, ctx.canvas.height / 2 - this.pictureMode.height / 2, this.pictureMode.width, this.pictureMode.height);
		// 	ctx.save();
		// 	ctx.fillStyle = 'hsla(0, 0%, 0%, 0.4)';
		// 	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		// 	ctx.lineWidth = 2;
		// 	ctx.strokeRect(ctx.canvas.width / 2 - this.pictureMode.width / 2 - ctx.lineWidth / 2, ctx.canvas.height / 2 - this.pictureMode.height / 2 - ctx.lineWidth / 2, this.pictureMode.width + ctx.lineWidth, this.pictureMode.height + ctx.lineWidth);
		// 	ctx.putImageData(imageData, ctx.canvas.width / 2 - this.pictureMode.width / 2, ctx.canvas.height / 2 - this.pictureMode.height / 2);
		// 	ctx.fillStyle = 'red';
		// 	let fontSize = Math.max(12, Math.min(16, Math.min(ctx.canvas.width, ctx.canvas.height) * (4 / 100)));
		// 	ctx.font = fontSize + 'px Arial';
		// 	ctx.textAlign = 'center';
		// 	ctx.textBaseline = 'top';
		// 	ctx.fillText('Use your mouse to drag & fit an interesting part of your track in the thumbnail', ctx.canvas.width / 2, ctx.canvas.height * (2 / 100));
		// 	ctx.restore();
		// } else if (!this.transformMode) {
		// 	// // centered timer
		// 	// ctx.save()
		// 	// // ctx.font = '16px Arial';
		// 	// ctx.textAlign = 'center';
		// 	// ctx.fillText(this.timeText, ctx.canvas.width / 2, 10);
		// 	// ctx.restore()

		// 	// replace with message display system
		// 	let i = this.timeText;
		// 	if (this.track.processing) {
		// 		i = "Loading, please wait... " + Math.floor((this.track.physicsProgress + this.track.sceneryProgress) / 2);
		// 	} else if (this.paused) {
		// 		i += " - Game paused";
		// 	} else if (this.firstPlayer && this.firstPlayer.dead && this.camera.focusPoint == this.firstPlayer.hitbox) {
		// 		i = "Press ENTER to restart";
		// 		if (this.firstPlayer.snapshots.length > 1) {
		// 			i += " or BACKSPACE to cancel Checkpoint"
		// 		}
		// 	} else if (this.track.writable) {
		// 		i += " - " + this.toolHandler.selected.replace(/^\w/, char => char.toUpperCase());
		// 		if (this.toolHandler.selected === 'brush') {
		// 			i += " ( size " + this.toolHandler.currentTool.length + " )";
		// 		}
		// 	}

		// 	let text = ctx.measureText(i)
		// 	const goalRadius = (text.fontBoundingBoxAscent + text.fontBoundingBoxDescent) / 2;
		// 	const left = 12;
		// 	const rectPadding = 5;
		// 	ctx.beginPath()
		// 	ctx.roundRect(left - goalRadius / 2, 12 - goalRadius / 2 - rectPadding, text.width + rectPadding * 2, goalRadius + rectPadding * 2, 40);
		// 	ctx.save()
		// 	ctx.fillStyle = 'hsl(0deg 0% 50% / 50%)'
		// 	ctx.fill()
		// 	ctx.restore()
		// 	ctx.fillText(i, left + rectPadding / 2, 12)
		// 	ctx.save()

		// 	// add target progress bar
		// 	const progressHeight = 4;
		// 	const progressWidth = Math.max(150, ctx.canvas.width / 10);
		// 	ctx.beginPath();
		// 	ctx.roundRect(ctx.canvas.width / 2 - progressWidth / 2, 12 - rectPadding, progressWidth, progressHeight + rectPadding * 2, 40);
		// 	ctx.save();
		// 	ctx.fillStyle = 'hsl(0deg 0% 50% / 50%)';
		// 	ctx.fill();
		// 	const playerInFocus = this.camera.focusPoint === this.firstPlayer.hitbox ? this.firstPlayer : this.ghostInFocus;
		// 	if (playerInFocus) {
		// 		const maxWidth = progressWidth - 4;
		// 		const valueWidth = maxWidth * (this.firstPlayer.targetsCollected / this.track.targets);
		// 		const targets = this.track.powerupTypes['T'];
		// 		const quadrantWidth = targets && maxWidth / targets.length;
		// 		const calculatedDistanceRemaining = targets && targets.length > 0 && playerInFocus && this.calculateRemainingDistance(playerInFocus);
		// 		const predictedAdditionalValueWidth = calculatedDistanceRemaining && Math.max(0, Math.min(quadrantWidth, quadrantWidth - calculatedDistanceRemaining * quadrantWidth));
		// 		ctx.beginPath();
		// 		ctx.roundRect(ctx.canvas.width / 2 - progressWidth / 2 + rectPadding / 2, 14 - rectPadding, valueWidth + predictedAdditionalValueWidth, progressHeight - 4 + rectPadding * 2, 40);
		// 		ctx.fillStyle = 'hsl(40deg 50% 50% / 50%)';
		// 		ctx.fill();
		// 	}

		// 	ctx.restore();
		// 	const targetProgress = this.firstPlayer.targetsCollected + ' / ' + this.track.targets;
		// 	const targetProgressText = ctx.measureText(targetProgress);
		// 	ctx.fillText(this.firstPlayer.targetsCollected + ' / ' + this.track.targets, ctx.canvas.width / 2 - targetProgressText.width / 2, 14);

		// 	if (this.ghosts.length > 0) {
		// 		ctx.save();
		// 		ctx.textAlign = 'right';
		// 		for (const index in this.ghosts) {
		// 			let playerGhost = this.ghosts[index];
		// 			i = (playerGhost.name || 'Ghost') + (playerGhost.targetsCollected === this.track.targets ? " finished!" : ": " + playerGhost.targetsCollected + " / " + this.track.targets);
		// 			text = ctx.measureText(i)
		// 			let textHeight = text.actualBoundingBoxAscent + text.actualBoundingBoxDescent;
		// 			let rectPadding = 5;
		// 			ctx.beginPath()
		// 			ctx.roundRect(ctx.canvas.width - 12 - text.width - rectPadding, 12 + textHeight * index + index * 12 - textHeight / 2 - rectPadding, text.width + rectPadding * 2, (text.fontBoundingBoxAscent + text.fontBoundingBoxDescent) / 2 + rectPadding * 2, 40);
		// 			ctx.save()
		// 			ctx.fillStyle = 'hsl(0deg 0% 50% / 50%)' // if ghost is in focus, make it apparent
		// 			ctx.fill()
		// 			ctx.restore()
		// 			ctx.fillText(i, ctx.canvas.width - 12, 12 + textHeight * index + index * 12)
		// 		}

		// 		ctx.restore()
		// 	}
		// }
	}

	erase(vector) {
		let x = Math.floor(vector.x / this.sectors.scale - .5);
		let y = Math.floor(vector.y / this.sectors.scale - .5);
		let cache = [];
		cache.push(...(this.sectors.sector(x, y)?.erase(vector) || []));
		cache.push(...(this.sectors.sector(x + 1, y)?.erase(vector) || []));
		cache.push(...(this.sectors.sector(x + 1, y + 1)?.erase(vector) || []));
		cache.push(...(this.sectors.sector(x, y + 1)?.erase(vector) || []));
		cache = Array.from(new Set(cache));
		this.history.record(
			() => cache.forEach(item => this.sectors.addItem(item)),
			() => cache.forEach(item => item.remove())
		);
	}

	addLine(start, end, type) {
		const line = new (type ? SceneryLine : PhysicsLine)(start.x, start.y, end.x, end.y, this);
		if (line.length >= 2 && line.length < 1e5) {
			this.sectors.addItem(line);
			if (arguments[3] !== false) {
				this.history.record(
					line.remove.bind(line),
					() => this.sectors.addItem(line)
				);
			}

			return line;
		}
	}

	read(code = "-18 1i 18 1i###BMX") {
		this.processing = true;
		this.parser.postMessage({
			cmd: 'PARSE',
			code
		});
	}

	// moveTrack(offset) {
	// 	let physics = [];
	// 	let scenery = [];
	// 	let powerups = [];
	// 	for (const sector of this.sectors.sectors) {
	// 		physics.push(...sector.physics.filter(line => (line = this.sectors.coords(line.a)) && line.x == sector.row && line.y == sector.column));
	// 		scenery.push(...sector.scenery.filter(line => (line = this.sectors.coords(line.a)) && line.x == sector.row && line.y == sector.column));
	// 		powerups.push(...sector.powerups.map(powerup => powerup.pos.add(offset) && powerup));
	// 	}

	// 	this.init({ write: true });
	// 	this.read(Array(Array.from(new Set(physics)).map(line => line.a.add(offset) && line.b.add(offset) && line).join(','), scenery.map(line => line.a.add(offset) && line.b.add(offset) && line).join(','), powerups.join(','), this.firstPlayer.vehicle.name).join('#'));
	// }

	reset() {
		this.currentTime = 0;
		for (const player of this.players)
			player.reset(...arguments);
		for (const playerGhost of this.ghosts)
			playerGhost.reset();

		this.camera.controller.setFocalPoint(this.firstPlayer.vehicle.hitbox);
		this.camera.controller.snapToTarget();
		this.paused = false;
		this.game.settings.autoPause && (this.frozen = true);
		this.game.emit(Events.Reset);
	}

	toString() {
		let physics = [];
		let scenery = [];
		let powerups = [];
		for (const sector of this.sectors.sectors) {
			physics.push(...sector.physics.filter(line => (line = this.sectors.coords(line.a)) && line.x == sector.row && line.y == sector.column));
			scenery.push(...sector.scenery.filter(line => (line = this.sectors.coords(line.a)) && line.x == sector.row && line.y == sector.column));
			powerups.push(...sector.powerups);
		}

		return Array(physics.join(','), scenery.join(','), powerups.join(','), this.firstPlayer.vehicle.name).join('#');
	}

	dispose() {
		this.collectables.splice(0);
		this.sectors.columns.clear();
		this.ghosts.splice(0);
		for (const player of this.players.splice(0))
			player.destroy();
	}

	destroy() {
		this.dispose();
		this.parser.terminate();
		this.parser = null;
		this.game = null;
	}
}