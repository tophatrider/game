import Collectable from "./Collectable.js";

export default class Checkpoint extends Collectable {
	type = 'C';
	static color = '#00f';
	activate(part) {
		super.activate(part);
		if (part.parent.parent.ghost) return;
		part.parent.parent.pendingConsumables |= 1;
		// part.parent.parent.discreteEvents.add('checkpointReached');
	}
}