import StaticInput from "../core/input/StaticInput.js";
import BasePlayer from "./BasePlayer.js";

export default class GhostPlayer extends BasePlayer {
	gamepad = new StaticInput();
	ghost = true;
	ghostIterator = null;
	runTime = 0;
	// playbackTicks = 0;
	constructor(parent, { records, time }) {
		super(...arguments);
		this.ghostIterator = this.ghostPlayer();
		this.records = records;
		this.runTime = time;
		// this.playbackTicks = 0;
	}

	// fixedUpdate() {
	// 	if (this.pendingConsumables) {
	// 		if (this.pendingConsumables & 2) this.checkComplete();
	// 		if (this.pendingConsumables & 1) {
	// 			this.snapshots.push(this.save());
	// 			for (const playerGhost of this.scene.ghosts) {
	// 				playerGhost.snapshots.push(playerGhost.save());
	// 			}
	// 		}

	// 		this.pendingConsumables = 0;
	// 	}

	// 	if (this.scene.targets > 0 && this.targetsCollected === this.scene.targets) {
	// 		return;
	// 	} else if (this.explosion) {
	// 		this.explosion.fixedUpdate();
	// 		return;
	// 	}

	// 	// if (this.ghost) {
	// 	// 	this.records[0].has(this.scene.currentTime) && this.gamepad._toggle('left');
	// 	// 	this.records[1].has(this.scene.currentTime) && this.gamepad._toggle('right');
	// 	// 	this.records[2].has(this.scene.currentTime) && this.gamepad._toggle('up');
	// 	// 	this.records[3].has(this.scene.currentTime) && this.gamepad._toggle('down');
	// 	// 	this.records[4].has(this.scene.currentTime) && this.vehicle.swap();
	// 	// }

	// 	this.vehicle.fixedUpdate();
	// 	if (this.dead) {
	// 		this.ragdoll.fixedUpdate();
	// 		this.hat && this.hat.fixedUpdate();
	// 	} else {
	// 		this.ragdoll.setPosition(this.vehicle.rider);
	// 	}
	// }

	// #ticks = 0;
	// set currentTime(value) {
	// 	if (this.ghost) {
	// 		this.records[0].has(this.#ticks * this.scene.game.max) && this.gamepad._toggle('left');
	// 		this.records[1].has(this.#ticks * this.scene.game.max) && this.gamepad._toggle('right');
	// 		this.records[2].has(this.#ticks * this.scene.game.max) && this.gamepad._toggle('up');
	// 		this.records[3].has(this.#ticks * this.scene.game.max) && this.gamepad._toggle('down');
	// 		this.records[4].has(this.#ticks * this.scene.game.max) && this.vehicle.swap();
	// 	}

	// 	this.fixedUpdate();
	// 	this.#ticks = value;
	// }

	*ghostPlayer(nextTick = 0) {
		const progress = document.querySelector('.replay-progress');
		const snapshots = new Map();
		this.playbackTicks = 0;
		while (this.targetsCollected !== this.scene.targets) {
			snapshots.has(this.playbackTicks) || snapshots.set(this.playbackTicks, this.save());
			if (this.playbackTicks >= nextTick) {
				const value = parseInt(yield this.playbackTicks);
				if (isFinite(value)) {
					// create new ghost player and skip to previous tick to rewind
					if (snapshots.has(value)) {
						this.restore(snapshots.get(value));
						this.playbackTicks = value;
					}

					this.scene.camera.controller.setFocalPoint(this.vehicle.hitbox);
					this.scene.camera.controller.snapToTarget();
					nextTick = value;
					continue;
				} else {
					nextTick = this.playbackTicks + 1;
				}
			}

			this.records[0].has(this.playbackTicks * this.scene.game._updateInterval) && this.gamepad._toggle('left');
			this.records[1].has(this.playbackTicks * this.scene.game._updateInterval) && this.gamepad._toggle('right');
			this.records[2].has(this.playbackTicks * this.scene.game._updateInterval) && this.gamepad._toggle('up');
			this.records[3].has(this.playbackTicks * this.scene.game._updateInterval) && this.gamepad._toggle('down');
			this.records[4].has(this.playbackTicks * this.scene.game._updateInterval) && this.vehicle.swap();

			this.fixedUpdate();
			this.playbackTicks++;
			progress && progress.setAttribute('value', this.playbackTicks);
		}

		return snapshots;
	}

	restore(snapshot) {
		super.restore(...arguments);
		this.gamepad.downKeys = new Set(snapshot.downKeys);
		this.playbackTicks = snapshot.playbackTicks;
	}

	reset() {
		this.gamepad.downKeys.clear();
		this.playbackTicks = 0;
		this.ghostIterator = this.ghostPlayer();
		super.reset(...arguments);
	}
}