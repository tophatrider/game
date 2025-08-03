class SmartLabel extends HTMLElement {
	static observedAttributes = ['checked', 'name'];

	get checked() { return this.hasAttribute('checked') }
	set checked(value) { this.toggleAttribute('checked', Boolean(value)) }

	get name() { return this.getAttribute('name') }
	set name(value) { this.setAttribute('name', value) }

	constructor() {
		super();

		const input = document.createElement('input');
		input.hidden = true;
		input.addEventListener('change', () => {
			this.toggleAttribute('checked', this._input.checked);
			this.dispatchEvent(new CustomEvent('change', {
				bubbles: true,
				detail: this._input.checked
			}));
		});
		input.addEventListener('input', () => this.dispatchEvent(new CustomEvent('input', { bubbles: true })));

		Object.defineProperty(this, '_input', { value: input, writable: true });
	}

	connectedCallback() {
		this.prepend(this._input);
		this.#upgrade('checked');
		this.#upgrade('name');
		this.#apply();
		this.addEventListener('click', this.#handleClick);
	}

	disconnectedCallback() {
		this.removeEventListener('click', this.#handleClick);
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) return;
		switch (name) {
		case 'checked':
			this._input.checked = newValue;
		}
		this.#apply();
	}

	#upgrade(prop) {
		if (this.hasOwnProperty(prop)) {
			const val = this[prop];
			delete this[prop];
			this[prop] = val;
		}
	}

	#apply() {
		const name = this.getAttribute('name');
		this._input.type = name ? 'radio' : 'checkbox';
		this._input.name = name || '';
		this._input.checked = this.checked;
	}

	#handleClick() {
		if (this._input.type === 'radio') {
			this._input.checked = true;
		} else {
			this._input.checked = !this._input.checked;
		}
		this._input.dispatchEvent(new Event('change', { bubbles: true }));
	}
}

customElements.define('smart-label', SmartLabel);