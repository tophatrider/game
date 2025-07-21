import Triangle from "./Directional.js";

export default class Gravity extends Triangle {
	type = 'G';
	static color = '#0f0';
	activate(part) {
		part.parent.parent.gravity.set(this.dir.scale(.3));
	}
}