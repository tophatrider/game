import BasePowerup from "./BasePowerup.js";

export default class Slowmo extends BasePowerup {
	static color = '#eee';
	static type = 'S';
	activate(part) {
		part.parent.player.slow = true;
	}
}