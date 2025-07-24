import Triangle from "./Directional.js";

export default class Gravity extends Triangle {
	type = 'G';
	static color = '#0f0';
	activate(part) {
		part.parent.player.gravity.set(this.dir.scale(.3));
	}
}