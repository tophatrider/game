import PhysicsLine from "../objects/line/PhysicsLine.js";
import SceneryLine from "../objects/line/SceneryLine.js";

export default class ObjectSpawner {
	static spawn(type, ...coords) {
		const { variant } = coords[coords.length - 1] instanceof Object && coords.at(-1) || {};
		switch (type) {
		case 'line':
			return new [variant === 'scenery' ? SceneryLine : PhysicsLine](...coords);
		case 'powerup':
			// return new Antigravity(...coords);
		default:
			throw new Error('Invalid object type')
		}
	}
}