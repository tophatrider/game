import ClientPlayer from "../player/ClientPlayer.js";
import GhostPlayer from "../player/GhostPlayer.js";

import ToolHandler from "../handler/Tool.js";
import UndoManager from "../core/history/UndoManager.js";

import Vector from "../core/math/Vector.js";
import PhysicsLine from "../items/line/PhysicsLine.js";
import SceneryLine from "../items/line/SceneryLine.js";

import Grid from "../grid/Grid.js";

import Target from "../items/Target.js";
import Checkpoint from "../items/Checkpoint.js";
import Bomb from "../items/Bomb.js";
import Boost from "../items/Boost.js";
import Gravity from "../items/Gravity.js";
import Antigravity from "../items/Antigravity.js";
import Slowmo from "../items/Slowmo.js";
import Teleporter from "../items/Teleporter.js";
import Events from "../core/Events.js";

// implement Track class w/ draw/move/scale/flip methods etc..
export default class {
	camera = new Vector();
	cameraLock = false;
	cameraFocus = null;
	collectables = [];
	currentTime = 0;
	discreteEvents = new Set();
	editMode = false;
	frozen = false;
	ghosts = [];
	grid = new Grid(this);
	history = new UndoManager();
	parent = null;
	paused = false;
	pictureMode = false;
	players = [];
	processing = false;
	progress = 100;
	sprogress = 100;
	toolHandler = new ToolHandler(this);
	// transformMode = false;
	zoomFactor = 1 * window.devicePixelRatio;
	canvasPool = [];
	constructor(parent) {
		Object.defineProperty(this, 'game', { value: parent, writable: true });
		this.parent = parent;
		parent.on('checkpoint', this.checkpoint.bind(this));
		parent.on('removeCheckpoint', this.checkpoint.bind(this));
		parent.on('restoreCheckpoint', this.checkpoint.bind(this));
		// this.helper.postMessage({ canvas: this.parent.canvas.transferControlToOffscreen() }, [offscreen]);
		// this.helper.addEventListener('message', ({ data }) => {
		// 	switch (data.cmd) {
		// 	case 'ADD_LINE':
		// 		this.addLine(...data.args);
		// 		break;
		// 	case 'ADD_LINES':
		// 		// this.addLine(...data.args);
		// 		console.log(data)
		// 		data.combined.forEach(line => {
		// 			this.addLine(...line);
		// 		});

		// 		this.processing = false;
		// 	}
		// });
		this.grid.helper.addEventListener('message', ({ data }) => {
			switch(data.cmd) {
			case 'CANVAS_POOL':
				this.canvasPool = Array.from(data.pool);
			}
		})
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
		const t = (this.ghostInFocus ? this.ghostInFocus.playbackTicks : (this.currentTime / this.parent._updateInterval)) / .03;
		return Math.floor(t / 6e4) + ':' + String((t % 6e4 / 1e3).toFixed(2)).padStart(5, '0');
	}

	get firstPlayer() {
		return this.players[0] ?? null;
	}

	get ghostInFocus() {
		return this.ghosts.find(({ vehicle }) => vehicle.hitbox == this.cameraFocus);
	}

	get zoom() {
		return this.zoomFactor;
	}

	set zoom(value) {
		this.zoomFactor = Math.min(window.devicePixelRatio * 4, Math.max(window.devicePixelRatio / 5, Math.round(value * 10) / 10));
		this.parent.ctx.lineWidth = Math.max(2 * this.zoom, 0.5);
		// this.parent.ctx.setTransform(this.zoom, 0, 0, this.zoom, 0, 0);
		// this.grid.resize();
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
		this.progress = this.sprogress = 100;
		this.editMode = options.write ?? this.editMode;
		this.toolHandler.setTool(this.editMode ? 'line' : 'camera');
		this.reset();
	}

	zoomIn() {
		this.zoom += .2;
	}

	zoomOut() {
		this.zoom -= .2;
	}

	switchBike() {
		this.firstPlayer.setVehicle(this.firstPlayer.vehicle.name != 'BMX' ? 'BMX' : 'MTB');
	}

	checkpoint() {
		this.paused = false;
		this.parent.emit('stateChange', this.paused);
		this.parent.settings.autoPause && (this.frozen = true);
		this.cameraFocus = this.firstPlayer.vehicle.hitbox;
		this.camera.set(this.cameraFocus.pos);
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

		noemit || this.parent.emit('checkpoint');
	}

	removeCheckpoint() {
		this.firstPlayer.removeCheckpoint();
		for (const playerGhost of this.ghosts) {
			playerGhost.removeCheckpoint();
		}

		this.returnToCheckpoint(true);
		this.parent.emit('removeCheckpoint');
	}

	restoreCheckpoint() {
		this.firstPlayer.restoreCheckpoint();
		for (const playerGhost of this.ghosts) {
			playerGhost.restoreCheckpoint();
		}

		this.returnToCheckpoint(true);
		this.parent.emit('restoreCheckpoint');
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
		this.cameraFocus = player.vehicle.hitbox;
		this.camera.set(this.cameraFocus.pos);
		this.frozen = false;
		this.paused = false;
		this.parent.emit(Events.ReplayAdd, player, arguments);
	}

	collide(part) {
		const x = Math.floor(part.real.x / this.grid.scale - .5)
			, y = Math.floor(part.real.y / this.grid.scale - .5);

		this.grid.sector(x, y).fix();
		this.grid.sector(x, y + 1).fix();
		this.grid.sector(x + 1, y).fix();
		this.grid.sector(x + 1, y + 1).fix();

		this.grid.sector(x, y).collide(part);
		this.grid.sector(x + 1, y).collide(part);
		this.grid.sector(x + 1, y + 1).collide(part);
		this.grid.sector(x, y + 1).collide(part);
	}

	fixedUpdate() {
		this.parent.settings.autoPause && this.firstPlayer.gamepad.downKeys.size > 0 && (this.frozen = false);
		if (!this.paused && !this.processing && !this.frozen) {
			for (const player of this.players)
				player.fixedUpdate();
			for (const playerGhost of this.ghosts.filter(ghostPlayer => ghostPlayer.targetsCollected !== this.targets)) {
				playerGhost.ghostIterator.next();
				// playerGhost.fixedUpdate();
			}

			this.currentTime += this.parent._updateInterval;
			// this.currentTime++
		}

		for (const event of this.discreteEvents) {
			switch (event) {
			case 'PAUSE':
				this.paused = true;
				this.parent.emit('stateChange', this.paused);
				break;
			case 'UNPAUSE':
				this.paused = false;
				this.frozen = false
				this.parent.emit('stateChange', this.paused);
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
		// this.cameraFocus && this.camera.add(this.cameraFocus.pos.diff(this.camera).scale(delta / 100));
		if (this.cameraFocus) {
			const { pos: target } = this.cameraFocus
				, diff = target.diff(this.camera)
				, distance = diff.length
				, speed = 3
				, smoothing = 1 - Math.exp(-speed * (distance / 500));
			this.camera.lerpTo(target, smoothing)
		}
	}

	render(ctx) {
		this.draw(ctx);
		if (!this.transformMode) {
			for (const playerGhost of this.ghosts)
				playerGhost.draw(ctx);
			for (let i = this.players.length - 1; i >= 0; i--)
				this.players[i].draw(ctx);
		}

		this.cameraFocus || this.toolHandler.draw(ctx);
	}

	draw(ctx) {
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		let min = new Vector().toCanvas(ctx.canvas).downScale(this.grid.scale);
		let max = new Vector(ctx.canvas.width, ctx.canvas.height).toCanvas(ctx.canvas).downScale(this.grid.scale).map(Math.floor);
		let sectors = this.grid.range(min, max);
		for (const sector of sectors.filter(sector => sector.physics.length + sector.scenery.length > 0)) {
			sector.render(ctx);
		}

		// for (const sector of this.canvasPool) {
		// 	// sector.render(ctx);
		// 	ctx.drawImage(sector.canvas.image, Math.floor(sector.canvas.width / 2 - this.camera.x * this.zoom + sector.row * this.zoom), Math.floor(sector.canvas.height / 2 - this.camera.y * this.zoom + sector.column * this.zoom));
		// }

		if (this.pictureMode) {
			const imageData = ctx.getImageData(ctx.canvas.width / 2 - this.pictureMode.width / 2, ctx.canvas.height / 2 - this.pictureMode.height / 2, this.pictureMode.width, this.pictureMode.height);
			ctx.save();
			ctx.fillStyle = 'hsla(0, 0%, 0%, 0.4)';
			ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			ctx.lineWidth = 2;
			ctx.strokeRect(ctx.canvas.width / 2 - this.pictureMode.width / 2 - ctx.lineWidth / 2, ctx.canvas.height / 2 - this.pictureMode.height / 2 - ctx.lineWidth / 2, this.pictureMode.width + ctx.lineWidth, this.pictureMode.height + ctx.lineWidth);
			ctx.putImageData(imageData, ctx.canvas.width / 2 - this.pictureMode.width / 2, ctx.canvas.height / 2 - this.pictureMode.height / 2);
			ctx.fillStyle = 'red';
			let fontSize = Math.max(12, Math.min(16, Math.min(ctx.canvas.width, ctx.canvas.height) * (4 / 100)));
			ctx.font = fontSize + 'px Arial';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'top';
			ctx.fillText('Use your mouse to drag & fit an interesting part of your track in the thumbnail', ctx.canvas.width / 2, ctx.canvas.height * (2 / 100));
			ctx.restore();
			return;
		}

		for (const sector of sectors.filter(sector => sector.powerups.length > 0)) {
			for (const powerup of sector.powerups) {
				powerup.draw(ctx);
			}
		}
		
		if (!this.transformMode) {
			// // centered timer
			// ctx.save()
			// // ctx.font = '20px Arial';
			// ctx.textAlign = 'center';
			// ctx.fillText(this.timeText, ctx.canvas.width / 2, 10);
			// ctx.restore()

			// replace with message display system
			let i = this.timeText;
			if (this.processing) {
				i = "Loading, please wait... " + Math.floor((this.progress + this.sprogress) / 2);
			} else if (this.paused) {
				i += " - Game paused";
			} else if (this.firstPlayer && this.firstPlayer.dead && this.cameraFocus == this.firstPlayer.vehicle.hitbox) {
				i = "Press ENTER to restart";
				if (this.firstPlayer.snapshots.length > 1) {
					i += " or BACKSPACE to cancel Checkpoint"
				}
			} else if (this.editMode) {
				i += " - " + this.toolHandler.selected.replace(/^\w/, char => char.toUpperCase());
				if (this.toolHandler.selected === 'brush') {
					i += " ( size " + this.toolHandler.currentTool.length + " )";
				}
			}

			i = this.firstPlayer.targetsCollected + ` / ${this.targets}  -  ` + i
			let text = ctx.measureText(i)
			const goalRadius = (text.fontBoundingBoxAscent + text.fontBoundingBoxDescent) / 2;
			const goalStrokeWidth = 1;
			const left = 12;
			const padding = 5;
			ctx.beginPath();
			ctx.roundRect(left - goalRadius / 2 - padding, 12 - goalRadius / 2 - padding, text.width + goalRadius + goalStrokeWidth / 2 + 10 + padding * 2, goalRadius + padding * 2, 40);
			ctx.save()
			ctx.fillStyle = 'hsl(0deg 0% 50% / 50%)'
			ctx.fill()
			ctx.restore()
			ctx.fillText(i, left + goalRadius * 2, 12)
			ctx.save()
			// drawImage for powerups
			ctx.beginPath()
			ctx.fillStyle = '#ff0'
			ctx.lineWidth = goalStrokeWidth
			ctx.arc(left, 12, goalRadius / 1.5, 0, 2 * Math.PI)
			ctx.fill()
			ctx.stroke()
			ctx.restore()
			if (this.ghosts.length > 0) {
				ctx.save();
				ctx.textAlign = 'right'
				for (const index in this.ghosts) {
					let playerGhost = this.ghosts[index];
					i = (playerGhost.name || 'Ghost') + (playerGhost.targetsCollected === this.targets ? " finished!" : ": " + playerGhost.targetsCollected + " / " + this.targets);
					text = ctx.measureText(i)
					const textHeight = text.actualBoundingBoxAscent + text.actualBoundingBoxDescent;
					ctx.roundRect(ctx.canvas.width - 12 - text.width, 12 + textHeight * index + index * 12 - textHeight / 2, text.width, (text.fontBoundingBoxAscent + text.fontBoundingBoxDescent) / 2, 40, { padding: 5 });
					ctx.save()
					ctx.fillStyle = 'hsl(0deg 0% 50% / 50%)' // if ghost is in focus, make it apparent
					ctx.fill()
					ctx.restore()
					ctx.fillText(i, ctx.canvas.width - 12, 12 + textHeight * index + index * 12)
				}

				ctx.restore()
			}
		}
	}

	erase(vector) {
		let x = Math.floor(vector.x / this.grid.scale - 0.5);
		let y = Math.floor(vector.y / this.grid.scale - 0.5);
		let cache = [];
		cache.push(...this.grid.sector(x, y).erase(vector));
		cache.push(...this.grid.sector(x + 1, y).erase(vector));
		cache.push(...this.grid.sector(x + 1, y + 1).erase(vector));
		cache.push(...this.grid.sector(x, y + 1).erase(vector));
		cache = Array.from(new Set(cache));
		this.history.record(
			() => cache.forEach(item => this.grid.addItem(item)),
			() => cache.forEach(item => item.remove())
		);
	}

	addLine(start, end, type) {
		const line = new (type ? SceneryLine : PhysicsLine)(start.x, start.y, end.x, end.y, this);
		if (line.length >= 2 && line.length < 1e5) {
			// this.offscreenGrid.postMessage({
			// 	cmd: 'ADD_LINE',
			// 	args: { start, end, type }
			// });
			this.grid.addItem(line);
			if (arguments[3] !== false) {
				this.history.record(
					line.remove.bind(line),
					() => this.grid.addItem(line)
				);
			}

			return line;
		}
	}

	// Fix this garbage.
	read(a = "-18 1i 18 1i###BMX") {
		// this.grid.helper.postMessage({
		// 	cmd: 'PARSE_TRACK',
		// 	code: arguments[0]
		// });
		// return;
		this.processing = true;
		const [physics, scenery, powerups] = String(a).split('#');
		physics && (this.progress = 0, this.processChunk(physics.split(/,+/g)));
		scenery && (this.sprogress = 0, this.processChunk(scenery.split(/,+/g), 1));
		if (powerups) {
			for (let powerup of powerups.split(/,+/g)) {
				powerup = powerup.split(/\s+/g);
				let x = parseInt(powerup[1], 32);
				let y = parseInt(powerup[2], 32);
				let a = parseInt(powerup[3], 32);
				switch (powerup[0]) {
				case "T":
					powerup = new Target(this, x, y);
					this.collectables.push(powerup);
					break;
				case "C":
					powerup = new Checkpoint(this, x, y);
					this.collectables.push(powerup);
					break;
				case "B":
					powerup = new Boost(this, x, y, a + 180);
					break;
				case "G":
					powerup = new Gravity(this, x, y, a + 180);
					break;
				case "O":
					powerup = new Bomb(this, x, y);
					break;
				case "S":
					powerup = new Slowmo(this, x, y);
					break;
				case "A":
					powerup = new Antigravity(this, x, y);
					break;
				case "W":
					powerup = new Teleporter(this, x, y);
					powerup.createAlt(a, parseInt(powerup[4], 32));
					this.collectables.push(powerup);
				}

				if (powerup) {
					x = Math.floor(x / this.grid.scale);
					y = Math.floor(y / this.grid.scale);
					this.grid.sector(x, y, true).powerups.push(powerup);
					if (powerup instanceof Teleporter) {
						x = Math.floor(powerup.alt.x / this.grid.scale);
						y = Math.floor(powerup.alt.y / this.grid.scale);
						this.grid.sector(x, y, true).powerups.push(powerup);
					}
				}
			}
		}
	}

	processChunk(array, scenery = false, index = 0) {
		let chunk = 100; // 100
		while (chunk-- && index < array.length) {
			let coords = array[index].split(/\s+/g);
			if (coords.length < 4) continue; // return; // ?
			for (let o = 0; o < coords.length - 2; o += 2) {
				let x = parseInt(coords[o], 32),
					y = parseInt(coords[o + 1], 32),
					l = parseInt(coords[o + 2], 32),
					c = parseInt(coords[o + 3], 32);
				isNaN(x + y + l + c) || this.addLine({ x, y }, { x: l, y: c }, scenery, false)
			}
			++index;
		}

		this[(scenery ? 's' : '') + 'progress'] = Math.round(index * 100 / array.length);
		if (index < array.length) {
			this[(scenery ? 's' : '') + 'processingTimeout'] = setTimeout(this.processChunk.bind(this), 0, array, scenery, index);
			return;
		}

		this.processing = this.progress < 100 || this.sprogress < 100;
		this.processing || this.parent.emit('load');
	}

	moveTrack(offset) {
		let physics = [];
		let scenery = [];
		let powerups = [];
		for (const sector of this.grid.sectors) {
			physics.push(...sector.physics.filter(line => (line = this.grid.coords(line.a)) && line.x == sector.row && line.y == sector.column));
			scenery.push(...sector.scenery.filter(line => (line = this.grid.coords(line.a)) && line.x == sector.row && line.y == sector.column));
			powerups.push(...sector.powerups.map(powerup => powerup.pos.add(offset) && powerup));
		}

		this.init({ write: true });
		this.read(Array(Array.from(new Set(physics)).map(line => line.a.add(offset) && line.b.add(offset) && line).join(','), scenery.map(line => line.a.add(offset) && line.b.add(offset) && line).join(','), powerups.join(','), this.firstPlayer.vehicle.name).join('#'));
	}

	reset() {
		this.currentTime = 0;
		for (const player of this.players)
			player.reset(...arguments);
		for (const playerGhost of this.ghosts)
			playerGhost.reset();

		this.cameraFocus = this.firstPlayer.vehicle.hitbox;
		this.camera.set(this.cameraFocus.pos);
		this.paused = false;
		this.parent.settings.autoPause && (this.frozen = true);
		this.parent.emit(Events.Reset);
	}

	toString() {
		let physics = [];
		let scenery = [];
		let powerups = [];
		for (const sector of this.grid.sectors) {
			physics.push(...sector.physics.filter(line => (line = this.grid.coords(line.a)) && line.x == sector.row && line.y == sector.column));
			scenery.push(...sector.scenery.filter(line => (line = this.grid.coords(line.a)) && line.x == sector.row && line.y == sector.column));
			powerups.push(...sector.powerups);
		}

		return Array(physics.join(','), scenery.join(','), powerups.join(','), this.firstPlayer.vehicle.name).join('#');
	}

	dispose() {
		this.collectables.splice(0);
		this.grid.rows.clear();
		this.ghosts.splice(0);
		this.firstPlayer && this.firstPlayer.gamepad.dispose();
		this.players.splice(0);
	}

	destroy() {
		this.dispose();
		this.game = null;
	}
}