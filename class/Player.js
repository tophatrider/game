import SnapshotHandler from "./handler/Snapshot.js";
import Gamepad from "./Gamepad.js";
import Vector from "./Vector.js";
import MTB from "./bike/MTB.js";
import BMX from "./bike/BMX.js";
import Ragdoll from "./bike/part/Ragdoll.js";
import Explosion from "./effect/Explosion.js";
import Shard from "./effect/Shard.js";

const Bike = {
	MTB,
	BMX
}

export default class Player {
	dead = false;
	explosion = null;
	gamepad = new Gamepad();
	ghostIterator = null;
	gravity = new Vector(0, .3);
	itemsCollected = new Set();
	pendingConsumables = 0;
	ragdoll = null;
	records = Array.from({ length: 5 }, () => new Set());
	slow = false;
	slowParity = 0;
	snapshots = new SnapshotHandler();
	constructor(parent, { records, time, vehicle }) {
		this.scene = parent;
		if (records !== void 0) {
			this.ghostIterator = this.ghostPlayer();
			this.records = records;
			this.runTime = time;
			// this.playbackTicks = 0;
		} else {
			this.gamepad.init();
			this.gamepad.on('down', this.updateRecords.bind(this));
			this.gamepad.on('up', this.updateRecords.bind(this));
		}

		this.createCosmetics();
		this.createVehicle(vehicle);
		this.createRagdoll();
	}

	get ghost() {
		return this.ghostIterator !== null;
	}

	get targetsCollected() {
		return this.scene.collectables.filter(item => item.type == 'T' && this.itemsCollected.has(item.id)).length;
	}

	get trackComplete() {
		return this.targetsCollected === this.scene.targets;
	}

	createCosmetics() {
		this.cosmetics = this._user != void 0 ? this._user.cosmetics : { head: 'hat' }
	}

	createVehicle(vehicle = 'BMX') {
		this.vehicle = new Bike[vehicle](this);
	}

	createRagdoll() {
		if (this.dead) {
			this.ragdoll.setVelocity(this.vehicle.hitbox.velocity, this.vehicle.rearWheel.velocity);
			this.hat = new Shard(this.vehicle, this.vehicle.hitbox.pos);
			this.hat.velocity.set(this.vehicle.hitbox.velocity);
			this.hat.size = 10;
			this.hat.rotationSpeed = .1;
			return;
		}

		this.ragdoll = new Ragdoll(this, this.vehicle.rider);
	}

	createExplosion(part) {
		this.explosion = new Explosion(this, part);
		this.dead = true;
	}

	setVehicle(vehicle) {
		this.scene.reset(vehicle || (this.vehicle.name != 'BMX' ? 'BMX' : 'MTB'));
		this.scene.cameraFocus = this.vehicle.hitbox;
	}

	draw(ctx) {
		ctx.save();
		if (this.explosion) {
			this.explosion.draw(ctx);
		} else {
			this.vehicle.draw(ctx);
			this.ragdoll.draw(ctx);
			if (this.dead) {
				this.hat && this.hat.draw(ctx);
			}
		}

		ctx.restore();
	}

	gotoCheckpoint() {
		let snapshotExists = this.snapshots.length > 0;
		snapshotExists && this.restore(this.snapshots.at(-1));
		return snapshotExists;
	}

	removeCheckpoint() {
		this.snapshots.length > 0 && this.snapshots.cache.push(this.snapshots.pop());
		// this.gotoCheckpoint();
	}

	restoreCheckpoint() {
		this.snapshots.cache.length > 0 && this.snapshots.push(this.snapshots.cache.pop());
		// this.gotoCheckpoint();
	}

	save() {
		return {
			currentTime: this.scene.currentTime,
			dead: this.dead,
			downKeys: new Set(this.gamepad.downKeys),
			gravity: this.gravity.clone(),
			itemsCollected: new Set(this.itemsCollected),
			playbackTicks: this.playbackTicks ?? this.scene.currentTime,
			records: this.records.map(record => new Set(record)),
			slow: this.slow,
			vehicle: this.vehicle.clone()
		}
	}

	fixedUpdate() {
		if (this.pendingConsumables) {
			if (this.pendingConsumables & 2) this.checkComplete();
			if (this.pendingConsumables & 1) {
				this.snapshots.push(this.save());
				for (const playerGhost of this.scene.ghosts) {
					playerGhost.snapshots.push(playerGhost.save());
				}
			}

			this.pendingConsumables = 0;
		}

		if (this.scene.targets > 0 && this.targetsCollected === this.scene.targets) {
			return;
		} else if (this.explosion) {
			this.explosion.fixedUpdate();
			return;
		}

		// if (this.ghost) {
		// 	this.records[0].has(this.scene.currentTime) && this.gamepad.toggle('left');
		// 	this.records[1].has(this.scene.currentTime) && this.gamepad.toggle('right');
		// 	this.records[2].has(this.scene.currentTime) && this.gamepad.toggle('up');
		// 	this.records[3].has(this.scene.currentTime) && this.gamepad.toggle('down');
		// 	this.records[4].has(this.scene.currentTime) && this.vehicle.swap();
		// }

		this.vehicle.fixedUpdate();
		if (this.dead) {
			this.ragdoll.fixedUpdate();
			this.hat && this.hat.fixedUpdate();
		} else {
			this.ragdoll.setPosition(this.vehicle.rider);
		}
	}

	update() {
		if (this.explosion) {
			this.explosion.update(...arguments);
			return;
		}

		this.vehicle.update(...arguments);
		if (this.dead) {
			this.ragdoll.update(...arguments);
			this.hat && this.hat.update(...arguments);
		} else {
			this.ragdoll.setPosition(this.vehicle.rider);
		}
	}

	lateUpdate() {
		if (this.explosion) {
			this.explosion.lateUpdate?.(...arguments);
			return;
		}

		this.vehicle.lateUpdate(...arguments);
		if (this.dead) {
			this.ragdoll.lateUpdate?.(...arguments);
			this.hat && this.hat.lateUpdate(...arguments);
		}
	}

	// #ticks = 0;
	// set currentTime(value) {
	// 	if (this.ghost) {
	// 		this.records[0].has(this.#ticks * this.scene.parent.max) && this.gamepad.toggle('left');
	// 		this.records[1].has(this.#ticks * this.scene.parent.max) && this.gamepad.toggle('right');
	// 		this.records[2].has(this.#ticks * this.scene.parent.max) && this.gamepad.toggle('up');
	// 		this.records[3].has(this.#ticks * this.scene.parent.max) && this.gamepad.toggle('down');
	// 		this.records[4].has(this.#ticks * this.scene.parent.max) && this.vehicle.swap();
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

					this.scene.cameraFocus = this.vehicle.hitbox;
					this.scene.camera.set(this.scene.cameraFocus.pos);
					nextTick = value;
					continue;
				} else {
					nextTick = this.playbackTicks + 1;
				}
			}

			this.records[0].has(this.playbackTicks * this.scene.parent.max) && this.gamepad.toggle('left');
			this.records[1].has(this.playbackTicks * this.scene.parent.max) && this.gamepad.toggle('right');
			this.records[2].has(this.playbackTicks * this.scene.parent.max) && this.gamepad.toggle('up');
			this.records[3].has(this.playbackTicks * this.scene.parent.max) && this.gamepad.toggle('down');
			this.records[4].has(this.playbackTicks * this.scene.parent.max) && this.vehicle.swap();

			this.fixedUpdate();
			this.playbackTicks++;
			progress && progress.setAttribute('value', this.playbackTicks);
		}

		return snapshots;
	}

	updateRecords(keys) {
		if (!keys || keys.size === 0 || this.dead || this.scene.processing || this.scene.ghostInFocus) return;
		this.scene.cameraFocus = this.vehicle.hitbox;
		this.scene.parent.settings.autoPause && (this.scene.frozen = false);
		typeof keys == 'string' && (keys = new Set([keys]));
		let t = this.scene.currentTime;
		keys.has('left') && !this.records[0].delete(t) && this.records[0].add(t);
		keys.has('right') && !this.records[1].delete(t) && this.records[1].add(t);
		keys.has('up') && !this.records[2].delete(t) && this.records[2].add(t);
		keys.has('down') && !this.records[3].delete(t) && this.records[3].add(t);
		if (keys.has('z') && this.gamepad.downKeys.has('z')) {
			this.records[4].delete(t) || this.records[4].add(t);
			this.vehicle.swap();
		}
	}

	checkComplete() {
		if (this.targetsCollected === this.scene.targets && this.scene.currentTime > 0 && !this.scene.editMode) {
			if (!navigator.onLine) {
				this.scene.parent.once('trackComplete', function(record) {
					const TEMP_KEY = 'bhr-temp';
					let data = localStorage.getItem(TEMP_KEY) || {};
					data.savedGhosts ||= [];
					data.savedGhosts.push(record);
					localStorage.setItem(TEMP_KEY, JSON.stringify(data));
				});
			}

			this.scene.parent.emit('trackComplete', {
				code: `${this.scene.firstPlayer.records.map(record => Array.from(record).join(' ')).join(',')},${this.scene.currentTime},${this.vehicle.name}`,
				id: this.scene.id ?? location.pathname.split('/')[2],
				time: this.scene.currentTime,
				vehicle: this.vehicle.name
			});
		}
	}

	restore(snapshot) {
		if (!this.ghost) {
			this.scene.currentTime = snapshot.currentTime;
		}

		this.explosion = null;
		this.slow = snapshot.slow;
		this.dead = snapshot.dead;
		this.itemsCollected = new Set(snapshot.itemsCollected);
		this.records = snapshot.records.map(record => new Set(record));
		this.gravity = snapshot.gravity.clone();
		this.vehicle = snapshot.vehicle.clone();
		this.createRagdoll();
		if (this.ghost) {
			this.gamepad.downKeys = new Set(snapshot.downKeys);
			this.playbackTicks = snapshot.playbackTicks;
			return;
		}

		let changed = new Set();
		for (const key of snapshot.downKeys) {
			if (!this.gamepad.downKeys.has(key)) {
				changed.add(key);
			}
		}

		for (const key of this.gamepad.downKeys) {
			if (!snapshot.downKeys.has(key)) {
				changed.add(key);
			}
		}

		this.updateRecords(changed);
	}

	reset(vehicle) {
		this.dead = false;
		this.explosion = null;
		this.gravity = new Vector(0, .3);
		this.hat = null;
		this.itemsCollected = new Set();
		this.pendingConsumables = 0;
		this.slow = false;
		this.snapshots.reset();
		if (this.ghost) {
			this.gamepad.downKeys.clear();
			this.playbackTicks = 0;
			this.ghostIterator = this.ghostPlayer();
		} else {
			this.records.forEach(set => set.clear());
			this.updateRecords(this.gamepad.downKeys);
		}

		this.createVehicle(vehicle || this.vehicle.name);
		this.ragdoll.setPosition(this.vehicle.rider);
	}
}