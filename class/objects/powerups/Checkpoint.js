import Consumable from "./Consumable.js";

export default class Checkpoint extends Consumable {
	static color = '#00f';
	static type = 'C';
	activate(part) {
		if (part.parent.player.ghost) return;
		part.parent.player.pendingConsumables |= 1;
		// part.parent.player.discreteEvents.add('checkpointReached');
	}
}