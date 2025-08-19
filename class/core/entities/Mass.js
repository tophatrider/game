import { DRAG } from "../../core/constants.js";
import Entity from "../../core/entities/Entity.js";
import Vector from "../geometry/Vector2.js";

export default class extends Entity {
	force = new Vector;
	motor = 0;
	tangible = true;
	touching = false;
	addFriction(vector) {
		this.real.add(vector.clone().scale(-vector.dot(this.velocity) * this.motor));
	}

	drive(vector) {
		this.addFriction(vector);
		this.touching = true;
	}

	fixedUpdate() {
		this.real.add(this.velocity.add(this.parent.player.gravity).add(this.force).scale(DRAG));
		this.force.set(0, 0);
		this.touching = false;
		this.tangible && this.parent.player.scene.track.collide(this);
		this.velocity.set(this.real.clone().sub(this.old));
		super.fixedUpdate();
	}
}