import Tool from "./Tool.js";
import Antigravity from "../objects/powerups/Antigravity.js";
import Bomb from "../objects/powerups/Bomb.js";
import Boost from "../objects/powerups/Boost.js";
import Checkpoint from "../objects/powerups/Checkpoint.js";
import Gravity from "../objects/powerups/Gravity.js";
import Slowmo from "../objects/powerups/Slowmo.js";
import Target from "../objects/powerups/Target.js";
import Teleporter from "../objects/powerups/Teleporter.js";
import GravitationalField from "../objects/powerups/GravitationalField.js";

const P = {
	antigravity: Antigravity,
	bomb: Bomb,
	boost: Boost,
	checkpoint: Checkpoint,
	gravity: Gravity,
	'slow-mo': Slowmo,
	goal: Target,
	teleporter: Teleporter,
	'gravitational-field': GravitationalField
};

export default class extends Tool {
	onActivate() {
		this.powerup = new P[this.parent.selected](this.scene, ...this.scene.camera.toWorld(this.mouse.raw));
	}

	onPress() {
		this.powerup.position.set(this.scene.camera.toWorld(this.mouse.raw.old));
	}

	onStroke() {
		if (this.mouse.down) return;
		this.powerup.position.set(this.scene.camera.toWorld(this.mouse.raw));
	}

	onClip() {
		this.addPowerup(this.powerup);
		this.onActivate();
	}

	addPowerup(powerup) {
		this.scene.track.addPowerup(powerup);
	}

	draw(ctx) {
		const fill = ctx.fillStyle;
		this.powerup.draw(ctx);
		ctx.fillStyle = fill;
	}
}