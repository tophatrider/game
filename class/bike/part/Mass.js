import Entity from "./Entity.js";

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
		this.velocity.add(this.parent.parent.gravity).scaleSelf(.99);
		this.real.add(this.velocity);
		this.touching = false;
		this.tangible && this.parent.parent.scene.collide(this);
		this.velocity = this.real.difference(this.old);
		this.lastFixedPos.recorded && (this.lastFixedPos.set(this.old),
		this.lastFixedPos.recorded = false,
		this.lastFixedPos.rendered = false,
		this.lastTime = 0);
		this.old.set(this.real);
		super.fixedUpdate();
	}
}