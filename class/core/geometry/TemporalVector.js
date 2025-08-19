import Vector from "./Vector2.js";

export default class TemporalVector extends Vector {
	static SKIP_OLD = Symbol('skip_old');

	constructor(...args) {
		super(...args);
		this.old = new Vector(this.x, this.y);
	}
}

const proto = Vector.prototype;
for (const key of Object.getOwnPropertyNames(proto)
	.filter(k => typeof proto[k] === 'function' && k !== 'constructor' && !k.startsWith('to'))) {

	TemporalVector.prototype[key] = function(...args) {
		if (!args.includes(TemporalVector.SKIP_OLD)) {
			this.old.set(this);
		} else {
			args.splice(args.indexOf(TemporalVector.SKIP_OLD), 1);
		}
		return proto[key].apply(this, args);
	};
}