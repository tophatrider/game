import Consumable from "./Consumable.js";

export default class Target extends Consumable {
	static color = '#ff0'
	static type = 'T';

	id = crypto.randomUUID(); // generate ID based on position?
	activate(part) {
		if (part.parent.player.ghost) return;
		part.parent.player.pendingConsumables |= 2;
	}
}