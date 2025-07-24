import Item from "./Item.js";

export default class GravitationalField extends Item {
	type = 'F';
	static color = '#0f0';
	// activate(part) {
	// 	part.parent.player.gravity.set(this.dir.scale(.3));
	// }

	update() {
		// constantly pull masses in radius
	}
}