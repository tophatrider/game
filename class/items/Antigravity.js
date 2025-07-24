import Item from "./Item.js";

export default class Antigravity extends Item {
	type = 'A';
	static color = '#0ff';
	activate(part) {
		part.parent.player.gravity.set({ x: 0, y: 0 });
	}
}