import Directional from "./Directional.js";

export default class Gravity extends Directional {
	static color = '#0f0';
	static type = 'G';
	activate(part) {
		part.parent.player.gravity.set(this.dir.scale(.3));
	}
}