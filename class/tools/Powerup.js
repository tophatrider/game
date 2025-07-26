import Tool from "./Tool.js";
import Antigravity from "../items/Antigravity.js";
import Bomb from "../items/Bomb.js";
import Boost from "../items/Boost.js";
import Checkpoint from "../items/Checkpoint.js";
import Gravity from "../items/Gravity.js";
import Slowmo from "../items/Slowmo.js";
import Target from "../items/Target.js";
import Teleporter from "../items/Teleporter.js";

const P = {
	antigravity: Antigravity,
	bomb: Bomb,
	boost: Boost,
	checkpoint: Checkpoint,
	gravity: Gravity,
	'slow-mo': Slowmo,
	goal: Target,
	teleporter: Teleporter
};

export default class extends Tool {
	addPowerup(powerup) {
		let x = Math.floor(powerup.position.x / this.scene.grid.scale);
		let y = Math.floor(powerup.position.y / this.scene.grid.scale);
		this.scene.grid.sector(x, y, true).powerups.push(powerup);
		if (/^(checkpoint|goal|teleporter)$/i.test(this.parent.selected)) {
			this.scene.collectables.push(powerup);
			if (powerup instanceof Teleporter) {
				x = Math.floor(powerup.alt.x / this.scene.grid.scale);
				y = Math.floor(powerup.alt.y / this.scene.grid.scale);
				this.scene.grid.sector(x, y, true).powerups.push(powerup);
			}
		}
	}

	clip() {
		this.addPowerup(this.powerup);
		this.update();
	}

	draw(ctx) {
		this.powerup.draw(ctx);
	}

	press() {
		this.powerup.position.set(this.mouse.old);
	}

	stroke() {
		this.powerup.position.set(this.mouse.position);
	}

	update() {
		this.powerup = new P[this.parent.selected](this.scene, this.mouse.position.x, this.mouse.position.y);
	}
}