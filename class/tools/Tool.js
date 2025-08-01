export default class {
	constructor(parent) {
		Object.defineProperties(this, {
			parent: { value: parent, writable: true },
			scene: { value: parent.scene, writable: true }
		});
	}

	get mouse() {
		return this.scene.parent.mouse;
	}

	clip() {}
	draw() {}
	press() {}
	scroll() {}
	stroke() {}
	update() {}
}