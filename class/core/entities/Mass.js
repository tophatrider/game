import { DRAG } from "../../core/constants.js";
import Entity from "../../core/entities/Entity.js";

export default class extends Entity {
	motor = 0;
	tangible = true;
	touching = false;
	addFriction(vector) {
		this.real.add(vector.scale(-vector.dot(this.velocity) * this.motor));
	}

	drive(vector) {
		this.addFriction(vector);
		this.touching = true;
	}

	fixedUpdate() {
		this.velocity.add(this.parent.player.gravity).scaleSelf(DRAG);
		this.real.add(this.velocity);
		this.touching = false;
		this.tangible && this.parent.player.scene.collide(this);
		this.velocity = this.real.diff(this.old);
		this.lastFixedPos.set(this.old);
		this.old.set(this.real);
		super.fixedUpdate();
	}
}