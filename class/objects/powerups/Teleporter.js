import Consumable from "./Consumable.js";
import Vector2 from "../../core/geometry/Vector2.js";

export default class Teleporter extends Consumable {
	static color = '#f0f';
	static type = 'W';

	alt = null;
	constructor() {
		super(...arguments);
		arguments.length > 3 && this.createAlt(arguments[arguments.length - 2], arguments[arguments.length - 1]);
	}

	createAlt(x, y) {
		this.alt = new Vector2(x, y);
	}

	draw(ctx) {
		super.draw(ctx);
		if (this.alt) {
			super.draw(ctx, this.scene.camera.toScreen(this.alt));
		}
	}

	collide(part) {
		if (this.alt === null) return;
		if (part.parent.player.itemsConsumed.has(this.id)) return;
		if (part.real.distanceToSquared(this.alt) < 500 && !part.parent.player.dead) {
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
		return super.toString() + ' ' + this.alt.toString();
	}
}