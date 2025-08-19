import { GRAVITY } from "../core/constants.js";
import SnapshotHandler from "../core/history/SnapshotManager.js";
import Vector from "../core/geometry/Vector2.js";
import MTB from "../bike/MTB.js";
import BMX from "../bike/BMX.js";
import Ragdoll from "../bike/part/Ragdoll.js";
import Explosion from "../core/effect/Explosion.js";
import Shard from "../core/entities/Shard.js";
import Mass from "../core/entities/Mass.js";

const Bike = {
	MTB,
	BMX
};

export default class BasePlayer {
	dead = false;
	explosion = null;
	gravity = Vector.from(GRAVITY);
	itemsConsumed = new Set();
	pendingConsumables = 0;
	ragdoll = null;
	records = [];
	slow = false;
	snapshots = new SnapshotHandler();
	constructor(parent, { vehicle }) {
		Object.defineProperty(this, 'scene', { value: parent, writable: true });
		Object.defineProperty(this, '_slowParity', { value: 0, writable: true });
		this.createCosmetics();
		this.createVehicle(vehicle);
		this.createRagdoll();
	}

	get targetsCollected() {
		return this.scene.track.powerupTypes.T?.filter(item => this.itemsConsumed.has(item.id)).length ?? 0;
	}

	get trackComplete() {
		return this.targetsCollected === this.scene.targets;
	}

	createCosmetics() {
		this.cosmetics = this._user != void 0 ? this._user.cosmetics : { head: 'hat' }
	}

	createVehicle(vehicle = 'BMX') {
		this.hitbox = new Mass(this);
		this.hitbox.drive = this.crash.bind(this);
		// this.hitbox.tangible = false;
		this.vehicle = new Bike[vehicle](this);
		this.hitbox.parent = this.vehicle;
	}

	createRagdoll() {
		this.ragdoll = new Ragdoll(this, this.vehicle.rider);
	}

	createExplosion(part) {
		this.explosion = new Explosion(this, part);
		this.dead = true;
	}

	crash() {
		this.dead = true;
		this.hitbox.tangible = false;
		this.vehicle.rearWheel.speed = 0;
		this.ragdoll.setVelocity(this.hitbox.velocity, this.vehicle.rearWheel.velocity);
		this.hat = new Shard(this.vehicle, this.hitbox.pos);
		this.hat.velocity.set(this.hitbox.velocity);
		this.hat.size = 10;
		this.hat.rotationSpeed = .1;
	}

	setVehicle(vehicle) {
		this.scene.reset(vehicle || (this.vehicle.name != 'BMX' ? 'BMX' : 'MTB'));
		this.scene.camera.controller.setFocalPoint(this.hitbox);
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
		snapshotExists && this.apply(this.snapshots.at(-1));
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

	fixedUpdate() {
		if (this.pendingConsumables) {
			if (this.pendingConsumables & 2) this.checkComplete();
			if (this.pendingConsumables & 1) {
				this.snapshots.push(this.serialize());
				for (const playerGhost of this.scene.ghosts)
					playerGhost.snapshots.push(playerGhost.serialize());
			}

			this.pendingConsumables = 0;
		}

		if (this.explosion) {
			this.explosion.fixedUpdate();
			return;
		}

		this.vehicle.fixedUpdate();
		// this.ragdoll.fixedUpdate();
		if (this.dead) {
			this.ragdoll.fixedUpdate();
			this.hat && this.hat.fixedUpdate();
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

	serialize() {
		return {
			// buffer,
			currentTime: this.scene.currentTime,
			downKeys: new Set(this.gamepad.downKeys),
			gravity: this.gravity.serialize(),
			hitbox: {
				old: this.hitbox.old.serialize(),
				real: this.hitbox.real.serialize(),
				velocity: this.hitbox.velocity.serialize()
			},
			itemsConsumed: new Set(this.itemsConsumed),
			playbackTicks: this.playbackTicks ?? this.scene.currentTime,
			slow: this.slow,
			vehicle: this.vehicle.serialize()
		}
	}

	apply(snapshot) {
		this.dead = false;
		this.explosion = null;
		this.gravity.set(snapshot.gravity);
		this.hitbox.tangible = true;
		this.hitbox.setPosition(snapshot.hitbox.real);
		this.hitbox.old.set(snapshot.hitbox.old);
		this.hitbox.velocity.set(snapshot.hitbox.velocity);
		this.itemsConsumed = new Set(snapshot.itemsConsumed);
		this.slow = snapshot.slow;
		this.vehicle.deserialize(snapshot.vehicle);
		this.ragdoll.setPosition(this.vehicle.rider);
	}

	reset(vehicle) {
		this.dead = false;
		this.explosion = null;
		this.gravity.set(GRAVITY);
		this.hat = null;
		this.itemsConsumed.clear();
		this.pendingConsumables = 0;
		this.slow = false;
		this.snapshots.reset();
		this.hitbox.tangible = true;
		vehicle ? this.createVehicle(vehicle) : this.vehicle.reset();
		this.ragdoll.setPosition(this.vehicle.rider);
	}
}