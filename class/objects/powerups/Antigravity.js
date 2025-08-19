import BasePowerup from "./BasePowerup.js";

export default class Antigravity extends BasePowerup {
	static color = '#0ff';
	static type = 'A';
	activate(part) {
		part.parent.player.gravity.set(0, 0);
	}
}