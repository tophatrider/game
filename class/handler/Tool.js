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
import TrianglePowerup from "../tools/TrianglePowerup.js";
import Teleporter from "../tools/Teleporter.js";

export default class ToolHandler {
	cache = new Map();
	old = 'camera';
	selected = 'camera';
	constructor(parent) {
		Object.defineProperty(this, 'scene', { value: parent, writable: true });
		this.cache.set('brush', new Brush(this));
		this.cache.set('camera', new Camera(this));
		this.cache.set('circle', new Circle(this));
		this.cache.set('curve', new Curve(this));
		this.cache.set('ellipse', new Ellipse(this));
		this.cache.set('eraser', new Eraser(this));
		this.cache.set('line', new Line(this));
		this.cache.set('powerup', new Powerup(this));
		this.cache.set('rectangle', new Rectangle(this));
		this.cache.set('select', new Select(this));
		this.cache.set('teleporter', new Teleporter(this));
		this.cache.set('trianglepowerup', new TrianglePowerup(this));
	}

	get currentTool() {
		if (['antigravity', 'bomb', 'boost', 'checkpoint', 'goal', 'gravity', 'slow-mo'].includes(this.selected)) {
			if (['boost', 'gravity'].includes(this.selected))
				return this.cache.get('trianglepowerup');

			return this.cache.get('powerup');
		}

		return this.cache.get(this.selected);
	}

	_setCursor(cursor) {
		this.scene.parent.canvas.style.setProperty('cursor', cursor || 'none');
	}

	setTool(name, style = null) {
		this.old = this.selected;
		this.selected = name;
		if (style !== null) {
			this.currentTool.scenery = style;
		}

		this.currentTool.update();
		// const powerups = this.scene.parent.gui.querySelector('#powerups');
		// powerups !== null && powerups.style.setProperty('display', /^(antigravity|bo(mb|ost)|checkpoint|g(oal|ravity)|slow-mo|teleporter)$/i.test(this.selected) ? 'contents' : 'none');

		let settings = this.scene.parent.gui.querySelector('.toolbar #tool-settings');
		settings.style.setProperty('display', /^(brush|camera|circle|eraser)$/i.test(this.selected) ? 'contents' : 'none'),
		settings = settings.querySelector('div[data-id=eraser]'),
		settings.style.setProperty('display', this.selected == 'eraser' ? 'contents' : 'none');

		const tool = this.scene.parent.gui.querySelector(`.toolbar-item${style ? '.scenery' : ''}.${name} > input[type=radio]`);
		tool !== null && tool.checked !== true && (tool.checked = true);

		const cursor = this.currentTool.constructor.cursor || (['brush', 'circle', 'curve', 'ellipse', 'rectangle', 'select'].includes(this.selected) ? Line.cursor : null);
		if (cursor === Line.cursor) {
			const theme = this.scene.parent.settings.theme
				, physics = '#'.padEnd(7, /^dark$/i.test(theme) ? 'fb' : /^midnight$/i.test(theme) ? 'c' : '0')
				, scenery = '#'.padEnd(7, /^(dark|midnight)$/i.test(theme) ? '6' : 'a');
			cursor.stroke = style ? scenery : physics;
		}

		this._setCursor(cursor || 'none');
	}

	scroll() {
		this.currentTool.scroll(...arguments);
	}

	press(event) {
		this.currentTool.press(...arguments);
		event.button === 0 && this.scene.parent.container.classList.add('pointer-down');
	}

	stroke() {
		this.currentTool.stroke(...arguments);
	}

	clip(event) {
		this.currentTool.clip(...arguments);
		event.button === 0 && this.scene.parent.container.classList.remove('pointer-down');
	}

	update() {
		this.currentTool.update();
	}

	draw(ctx) {
		this.currentTool.draw(ctx);
		if (!this.scene.parent.mouse.locked) return;
		const position = this.scene.parent.mouse.rawPosition;
		ctx.beginPath()
		ctx.moveTo(position.x - 10 * window.devicePixelRatio, position.y)
		ctx.lineTo(position.x + 10 * window.devicePixelRatio, position.y)
		ctx.moveTo(position.x, position.y + 10 * window.devicePixelRatio)
		ctx.lineTo(position.x, position.y - 10 * window.devicePixelRatio)
		ctx.save()
		ctx.lineWidth = 2 * window.devicePixelRatio
		ctx.stroke()
		ctx.restore();
	}
}