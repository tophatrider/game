import { GRAVITY } from "../core/constants.js";
import SnapshotHandler from "../core/history/SnapshotManager.js";
import Vector from "../core/math/Vector.js";
import MTB from "../bike/MTB.js";
import BMX from "../bike/BMX.js";
import Ragdoll from "../bike/part/Ragdoll.js";
import Explosion from "../core/effect/Explosion.js";
import Shard from "../core/entities/Shard.js";

const Bike = {
	MTB,
	BMX
};

export default class BasePlayer {
	dead = false;
	explosion = null;
	gravity = Vector.from(GRAVITY);
	itemsCollected = new Set();
	pendingConsumables = 0;
	ragdoll = null;
	records = Array.from({ length: 5 }, () => new Set());
	slow = false;
	slowParity = 0;
	snapshots = new SnapshotHandler();
	constructor(parent, { vehicle }) {
		Object.defineProperty(this, 'scene', { value: parent, writable: true });
		this.createCosmetics();
		this.createVehicle(vehicle);
		this.createRagdoll();
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
		const snapshotExists = this.snapshots.length > 0;
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
	}

	reset(vehicle) {
		this.dead = false;
		this.explosion = null;
		this.gravity = Vector.from(GRAVITY);
		this.hat = null;
		this.itemsCollected = new Set();
		this.pendingConsumables = 0;
		this.slow = false;
		this.snapshots.reset();
		this.createVehicle(vehicle || this.vehicle.name);
		this.ragdoll.setPosition(this.vehicle.rider);
	}
}