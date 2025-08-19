import BasePowerup from "./BasePowerup.js";

export default class Bomb extends BasePowerup {
	static color = '#f00';
	static type = 'O';
	activate(part) {
		part.parent.player.dead || part.parent.player.createExplosion(part);
	}
}