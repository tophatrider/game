import BasePlayer from "./BasePlayer.js";
import StaticInput from "../core/input/StaticInput.js";

export default class GhostPlayer extends BasePlayer {
	gamepad = new StaticInput;
	playbackTicks = 0;
	constructor(parent, config = {}) {
		super(...arguments);
		Object.defineProperty(this, 'ghost', { value: true });
		Object.defineProperty(this, 'iterator', { value: this.#createIterator(), writable: true });
		for (const key in config) {
			const val = config[key];
			switch(key) {
			case 'records':
				this.records.splice(0, this.records.length, ...val);
			}
		}

		this.duration = parseInt(config.time) || Math.max(...this.records.flatMap(s => Array.from(s)));
	}

	*#createIterator(nextTick = 0) {
		// const progress = document.querySelector('.replay-progress');
		const snapshots = new Map();
		this.playbackTicks = 0;
		while (this.targetsCollected !== this.scene.targets) {
			snapshots.has(this.playbackTicks) || snapshots.set(this.playbackTicks, this.serialize());
			if (this.playbackTicks >= nextTick) {
				const value = parseInt(yield this.playbackTicks);
				if (isFinite(value)) {
					// create new ghost player and skip to previous tick to rewind
					if (snapshots.has(value)) {
						this.restore(snapshots.get(value));
						this.playbackTicks = value;
					}

					this.scene.camera.controller.setFocalPoint(this.hitbox);
					this.scene.camera.controller.snapToTarget();
					nextTick = value;
					continue;
				} else {
					nextTick = this.playbackTicks + 1;
				}
			}

			this.fixedUpdate();
			this.playbackTicks++;
			this.scene.game.emit('playbackTick', this.playbackTicks);
			// progress && progress.setAttribute('value', this.playbackTicks);
		}

		return snapshots;
	}

	seek(time) {
		this.iterator.next(time);
	}

	fixedUpdate() {
		const t = this.playbackTicks;
		this.records[0].has(t) && this.gamepad._toggle('left');
		this.records[1].has(t) && this.gamepad._toggle('right');
		this.records[2].has(t) && this.gamepad._toggle('up');
		this.records[3].has(t) && this.gamepad._toggle('down');
		this.records[4].has(t) && this.vehicle.swap();
		super.fixedUpdate();
	}

	restore(snapshot) {
		super.restore(...arguments);
		this.gamepad.downKeys = new Set(snapshot.downKeys);
		this.playbackTicks = snapshot.playbackTicks;
	}

	reset() {
		this.gamepad.downKeys.clear();
		this.playbackTicks = 0;
		this.iterator = this.#createIterator();
		super.reset(...arguments);
	}

	static parseRecords(parts, ups = 50) {
		const upi = 1e3 / ups;
		const records = [];
		for (const input in parts) {
			const entries = parts[input].split(/\s+/g);
			const record = new Set;
			for (const i in entries) {
				const t = entries[i];
				if (isNaN(t)) {
					console.warn(`[GhostPlayer::parseRecords] Playback time entry is NaN: ${JSON.stringify(val)}`);
					continue;
				}

				record.add(parseInt(t) / upi);
			}

			records.push(record);
		}

		return records;
	}
}