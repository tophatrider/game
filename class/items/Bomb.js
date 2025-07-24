import Item from "./Item.js";

export default class Bomb extends Item {
	type = 'O';
	static color = '#f00';
	activate(part) {
		part.parent.player.dead || part.parent.player.createExplosion(part);
	}
}