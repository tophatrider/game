import Vector from "../core/math/Vector.js";
import Collectable from "./Collectable.js";

export default class Teleporter extends Collectable {
	alt = null;
	type = 'W';
	constructor() {
		super(...arguments);
		arguments.length > 3 && this.createAlt(arguments[arguments.length - 2], arguments[arguments.length - 1]);
	}

	createAlt(x, y) {
		this.alt = new Vector(x, y);
	}

	draw(ctx) {
		super.draw(ctx);
		if (this.alt) {
			super.draw(ctx, this.alt.toPixel());
		}
	}

	collide(part) {
		if (this.alt === null) return;
		if (part.real.distanceToSquared(this.alt) < 500 && !part.parent.player.dead && !part.parent.player.itemsCollected.has(this.id)) {
			part.parent.player.itemsCollected.add(this.id);
			this.activate(part, true);
			return;
		}

		super.collide(part);
	}

	activate(part, alt = false) {
		if (alt) {
			part.parent.move(this.position.x - this.alt.x, this.position.y - this.alt.y);
			return;
		}

		part.parent.move(this.alt.x - this.position.x, this.alt.y - this.position.y);
	}

	erase(vector) {
		if (vector.distanceTo(this.alt) < this.scene.toolHandler.currentTool.size + this.size) {
			return this.remove();
		}

		return super.erase(vector);
	}

	remove() {
		super.remove();
		this.scene.remove(this.alt);
		return this;
	}

	toString() {
		return this.type + ' ' + this.position.toString() + ' ' + this.alt.toString();
	}

	static color = '#f0f';
}