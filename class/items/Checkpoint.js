import Collectable from "./Collectable.js";

export default class Checkpoint extends Collectable {
	type = 'C';
	static color = '#00f';
	activate(part) {
		super.activate(part);
		if (part.parent.player.ghost) return;
		part.parent.player.pendingConsumables |= 1;
		// part.parent.player.discreteEvents.add('checkpointReached');
	}
}