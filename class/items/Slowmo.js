import Item from "./Item.js";

export default class Slowmo extends Item {
	type = 'S';
	static color = '#eee';
	activate(part) {
		part.parent.parent.slow = true;
	}
}