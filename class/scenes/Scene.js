import Events from "../core/Events.js";

import Camera from "../core/render/camera/Camera.js";
import HUDRenderer from "../core/render/HUDRenderer.js";
import Track from "../core/Track.js";
import ToolHandler from "../handler/Tool.js";
import ClientPlayer from "../player/ClientPlayer.js";
import GhostPlayer from "../player/GhostPlayer.js";

// import SectorManager from "../grid/SectorManager.js";
import SectorManager from "../grid/Grid.js";

export default class Scene {
	currentTime = 0;
	discreteEvents = new Set();
	frozen = false;
	ghosts = [];
	hudRenderer = new HUDRenderer(this);
	paused = false;
	pictureMode = false;
	players = [];
	track = new Track(this);
	toolHandler = new ToolHandler(this);
	constructor(parent) {
		Object.defineProperty(this, 'game', { value: parent, writable: true });
		this.camera = new Camera(parent.canvas?.width || 1000, parent.canvas?.height || 1000);
		this.camera.on('focalPointChange', focalPoint => {
			const firstPlayerInFocus = this.firstPlayer.hitbox === focalPoint;
			this.game.container.classList.toggle('input', firstPlayerInFocus && !ToolHandler.isTouchScreen());
			// this.game.emit('focalPointChange', focalPoint);
		});
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
	}

	#transformMode = false;
	get transformMode() { return this.#transformMode }
	set transformMode(value) {
		this.#transformMode = value;
		if (!value) {
			const cameraTool = this.toolHandler.cache.get('camera');
			cameraTool.trackOffset.length > 0 && this.moveTrack(cameraTool.trackOffset);
		} else {
			this.toolHandler.set('camera');
			this.reset();
		}
	}

	get timeText() {
		const t = (this.ghostInFocus ? this.ghostInFocus.playbackTicks : (this.currentTime / this.game._updateInterval)) / .03;
		return Math.floor(t / 6e4) + ':' + String((t % 6e4 / 1e3).toFixed(2)).padStart(5, '0');
	}

	get firstPlayer() {
		return this.players[0] ?? null;
	}

	get ghostInFocus() {
		return this.ghosts.find(({ hitbox }) => hitbox == this.camera.controller.focalPoint);
	}

	init(options = {}) {
		options = Object.assign({ vehicle: 'BMX' }, arguments[0]);
		if (!/^bmx|mtb$/i.test(options.vehicle))
			throw new TypeError("Invalid vehicle type.");

		'id' in options && (this.id = options.id);
		this.dispose();
		this.players.push(new ClientPlayer(this, { vehicle: options.vehicle }));
		this.track.history.clear();
		// this.track.processing = false;
		this.track.mode = options.write ? Track.Modes.Edit : Track.Modes.ReadOnly;
		this.toolHandler.set(this.track.mode === Track.Modes.Edit ? 'line' : 'camera');
		this.reset();
	}

	switchBike() {
		this.firstPlayer.setVehicle(this.firstPlayer.vehicle.name != 'BMX' ? 'BMX' : 'MTB');
	}

	checkpoint() {
		this.paused = false;
		this.game.emit('stateChange', this.paused);
		this.game.settings.autoPause && (this.frozen = true);
		this.camera.controller.setFocalPoint(this.firstPlayer.hitbox);
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
		const parts = data.trim().split(/\s*,\s*/g)
			, recordData = parts.splice(0, 5);
		const v = parts.pop();
		const time = parts.at(-1);

		/^(BMX|MTB)$/i.test(v) && (vehicle = v);

		const records = GhostPlayer.parseRecords(recordData);
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

		this.currentTime > 0 && this.reset();
		this.camera.controller.setFocalPoint(player.hitbox);
		this.camera.controller.snapToTarget();
		this.frozen = false;
		this.paused = false;
		this.game.emit(Events.ReplayAdd, player, arguments);
	}

	fixedUpdate() {
		this.game.settings.autoPause && this.firstPlayer.gamepad.downKeys.size > 0 && (this.frozen = false);
		if (!this.paused && !this.track.processing && !this.frozen) {
			for (const player of this.players)
				player.fixedUpdate();
			for (const playerGhost of this.ghosts.filter(({ targetsCollected: t }) => t !== this.targets)) {
				playerGhost.iterator.next();
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
		if (!this.paused && !this.track.processing && !this.frozen) {
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
		ctx.fillRect(0, 0, this.camera.viewportWidth, this.camera.viewportHeight);
		// ctx.fillRect(this.camera.x, this.camera.y, this.camera.viewportWidth / this.camera.zoom, this.camera.viewportHeight / this.camera.zoom);

		for (const sector of this.sectors.visible.filter(sector => sector.physics.length + sector.scenery.length > 0))
			sector.render(ctx);

		if (this.pictureMode) return;
		for (const sector of this.sectors.visible.filter(sector => sector.powerups.length > 0)) {
			const fill = ctx.fillStyle;
			for (const powerup of sector.powerups)
				powerup.draw(ctx);
			ctx.fillStyle = fill;
		}
	}

	renderHUD() {
		this.hudRenderer.render(...arguments);
	}

	reset() {
		this.currentTime = 0;
		for (const player of this.players)
			player.reset(...arguments);
		for (const playerGhost of this.ghosts)
			playerGhost.reset();

		this.camera.controller.setFocalPoint(this.firstPlayer.hitbox);
		this.camera.controller.snapToTarget();
		this.paused = false;
		this.game.settings.autoPause && (this.frozen = true);
		this.game.emit(Events.Reset);
	}

	dispose() {
		this.track.clear();
		this.sectors.columns.clear();
		this.ghosts.splice(0);
		for (const player of this.players.splice(0))
			player.destroy();
	}

	destroy() {
		this.dispose();
		this.track.parser.terminate();
		this.track = null;
		this.parser = null;
		this.game = null;
	}
}