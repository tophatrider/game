class HUDManager {
	constructor(container, bindings = {}) {
		this.root = document.createElement('div');
		this.root.className = 'hud-root';
		Object.assign(this.root.style, {
			position: 'absolute',
			top: 0,
			left: 0,
			width: '100%',
			height: '100%',
			pointerEvents: 'none'
		});
		container.appendChild(this.root);

		this.elements = {};
		this.bindings = bindings; // id → () => value
	}

	createText(id, options = {}) {
		const el = document.createElement('div');
		Object.assign(el.style, {
			position: 'absolute',
			color: options.color || '#fff',
			font: options.font || 'bold 16px Arial',
			top: options.top || '0px',
			left: options.left || '0px',
			transform: 'translate(-50%, -50%)'
		});
		this.root.appendChild(el);
		this.elements[id] = el;
	}

	createBar(id, options = {}) {
		const wrapper = document.createElement('div');
		Object.assign(wrapper.style, {
			position: 'absolute',
			width: options.width || '200px',
			height: options.height || '20px',
			top: options.top || '0px',
			left: options.left || '0px',
			background: options.bg || 'rgba(255,255,255,0.2)',
			borderRadius: '10px',
			overflow: 'hidden'
		});

		const fill = document.createElement('div');
		Object.assign(fill.style, {
			width: '0%',
			height: '100%',
			background: options.color || 'orange'
		});
		wrapper.appendChild(fill);

		this.root.appendChild(wrapper);
		this.elements[id] = { wrapper, fill };
	}

	update() {
		for (const [id, getter] of Object.entries(this.bindings)) {
			const value = getter();
			const el = this.elements[id];

			if (typeof value === 'string') {
				if (el.textContent !== value) {
					el.textContent = value;
				}
			} else if (typeof value === 'number' && el.fill) {
				el.fill.style.width = Math.max(0, Math.min(1, value)) * 100 + '%';
			}
		}
	}
}