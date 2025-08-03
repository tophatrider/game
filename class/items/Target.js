import Collectable from "./Collectable.js";

export default class Target extends Collectable {
	type = 'T';
	static color = '#ff0'
	activate(part) {
		super.activate(part);
		if (part.parent.player.ghost) return;
		part.parent.player.pendingConsumables |= 2;
	}
}