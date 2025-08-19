import Grid from "../core/geometry/Grid.js";
import CSSCursor from "../core/ui/CSSCursor.js";
import Line from "../tools/Line.js";
import Brush from "../tools/Brush.js";
import Camera from "../tools/Camera.js";
import Circle from "../tools/Circle.js";
import Curve from "../tools/Curve.js";
import Ellipse from "../tools/Ellipse.js";
import Eraser from "../tools/Eraser.js";
import Powerup from "../tools/Powerup.js";
import Rectangle from "../tools/Rectangle.js";
import Select from "../tools/Select.js";
import DirectionalPowerup from "../tools/DirectionalPowerup.js";
import Teleporter from "../tools/Teleporter.js";
import GravitationalField from "../tools/GravitationalField.js";

const TOOL_REGISTRY = {
	brush: Brush,
	camera: Camera,
	circle: Circle,
	curve: Curve,
	ellipse: Ellipse,
	eraser: Eraser,
	gravitationalField: GravitationalField,
	line: Line,
	powerup: Powerup,
	rectangle: Rectangle,
	select: Select,
	teleporter: Teleporter,
	directionalPowerup: DirectionalPowerup
};
const GRID_CURSOR_TOOLS = new Set(['brush', 'circle', 'curve', 'ellipse', 'line', 'rectangle', 'select']);
const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) 
	|| (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export default class ToolHandler {
	// #cache = new Map(
	// 	Object.entries(TOOL_REGISTRY).map(([key, Tool]) => [key, new Tool(this)])
	// );

	grid = new Grid();
	old = 'camera';
	position = null;
	selected = 'camera';
	constructor(parent) {
		Object.defineProperty(this, 'scene', { value: parent, writable: true });
		Object.defineProperty(this, 'cache', {
			value: new Map(
				Object.entries(TOOL_REGISTRY).map(([key, Tool]) => [key, new Tool(this)])
			),
			writable: true
		});
	}

	get currentTool() {
		return this.cache.get(this.constructor._resolveAlias(this.selected));
	}

	get snappedPosition() {
		return this.grid.getSnappedScreenPosition(this.scene.game.mouse.raw, this.scene.camera);
	}

	_handleInput(eventName, event, ...args) {
		if (['press', 'stroke'].includes(eventName)) this.position = this.snappedPosition;
		const methodName = 'on' + eventName[0].toUpperCase() + eventName.slice(1);
		if (typeof this.currentTool[methodName] === 'function') {
			this.currentTool[methodName](event, ...args);
		}
	}

	register(name, constructor) {
		if (typeof name != 'string')
			throw new TypeError('name must be of type: string');
		if (typeof constructor != 'function')
			throw new TypeError('constructor must be of type: Function');
		this.cache.set(name, constructor);
	}

	set(name, style = null) {
		if (!this.cache.has(name) && !this.cache.has(this.constructor._resolveAlias(name)))
			throw new RangeError(`Tool "${name}" does not exist`);

		const old = this.currentTool;
		typeof old.onDeactivate == 'function' && old.onDeactivate();

		this.old = this.selected;
		this.selected = name;

		const tool = this.currentTool;
		if (style !== null) tool.scenery = style;
		typeof tool.onActivate == 'function' && tool.onActivate();

		this._setCursor(this._resolveCursor(tool, style));
		this.scene.game.emit('toolSelectionChange', name, this.old);
	}

	update() {
		typeof this.currentTool.update == 'function' && this.currentTool.update();
	}

	_drawGridCursor(ctx) {
		if (!this.position) return;
		const size = 10 - 1.5 * this.scene.game.mouse.down;
		const { x, y } = this.position;

		const lineWidth = ctx.lineWidth;
		ctx.lineWidth = 1.5;

		ctx.beginPath();
		ctx.moveTo(x - size, y); ctx.lineTo(x + size, y);
		ctx.moveTo(x, y - size); ctx.lineTo(x, y + size);
		ctx.stroke();

		ctx.lineWidth = lineWidth;
	}

	draw(ctx) {
		typeof this.currentTool.draw == 'function' && this.currentTool.draw(ctx);
		// if (/* !this.scene.game.mouse.locked || */ this.scene.game.mouse.down) return;
		if (!GRID_CURSOR_TOOLS.has(this.selected)) return;
		!this.constructor.isTouchScreen() && this._drawGridCursor(ctx);
	}

	_resolveCursor(tool, style) {
		const baseCursor = tool.constructor.cursor || (
			GRID_CURSOR_TOOLS.has(this.selected)
				? Line.cursor : null
		);

		if (baseCursor instanceof CSSCursor) {
			baseCursor.stroke = this.scene.game.colorScheme.palette[style ? 'foreground' : 'track'];
		}

		return baseCursor || 'none';
	}

	_setCursor(cursor) {
		this.scene.game.canvas.style.setProperty('cursor', cursor || 'none');
	}

	_dispatchSyntheticScroll(delta) {
		const { mouse } = this.scene.game;
		this._handleInput('scroll', {
			offsetX: mouse.raw.x,
			offsetY: mouse.raw.y,
			wheelDelta: delta
		});
	}

	static _resolveAlias(toolName) {
		switch (toolName.toLowerCase()) {
		case 'anti-gravity':
		case 'antigravity':
		case 'bomb':
		case 'checkpoint':
		case 'goal':
		case 'slow-mo':
		case 'slowmo':
			return 'powerup';
		case 'boost':
		case 'gravity':
			return 'directionalPowerup';
		case 'gravitational-field':
		case 'gravitationalfield':
		case 'gravitational-force':
		case 'gravitationalforce':
			return 'gravitationalField';
		}
		return toolName ?? null;
	}

	static isTouchScreen() {
		return IS_IOS || ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
	}
}