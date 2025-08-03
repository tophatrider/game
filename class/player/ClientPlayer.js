// import DeviceOrientationHandler from "../core/input/DeviceOrientationHandler.js";
import KeyboardHandler from "../core/input/KeyboardHandler.js";
import BasePlayer from "./BasePlayer.js";

export default class Player extends BasePlayer {
	gamepad = new KeyboardHandler;
	ghost = false;
	// virtualGamepad = new DeviceOrientationHandler;
	constructor() {
		super(...arguments);
		this.gamepad.listen();
		this.gamepad.on('down', this.updateRecords.bind(this));
		this.gamepad.on('up', this.updateRecords.bind(this));
		// this.virtualGamepad.listen();
	}

	updateRecords(keys) {
		if (!keys || keys.size === 0 || this.dead || this.scene.processing || this.scene.ghostInFocus) return;
		this.scene.camera.controller.setFocalPoint(this.vehicle.hitbox);
		this.scene.game.settings.autoPause && (this.scene.frozen = false);
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
			this.scene.game.emit('trackComplete', {
				code: `${this.scene.firstPlayer.records.map(record => Array.from(record).join(' ')).join(',')},${this.scene.currentTime},${this.vehicle.name}`,
				id: this.scene.id ?? location.pathname.split('/')[2],
				time: this.scene.currentTime,
				vehicle: this.vehicle.name
			});
		}
	}

	restore(snapshot) {
		super.restore(...arguments);

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

	reset() {
		this.records.forEach(set => set.clear());
		this.updateRecords(this.gamepad.downKeys);
		super.reset(...arguments);
	}

	destroy() {
		this.gamepad.destroy();
	}
}