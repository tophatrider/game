import StaticVector from "./geometry/StaticVector.js";

export const GRAVITY = new StaticVector(0, .3);
export const DRAG = 0.99;

export const KEYMAP = Object.freeze({
	down: ['arrowdown', 's'],
	left: ['arrowleft', 'a'],
	right: ['arrowright', 'd'],
	up: ['arrowup', 'w'],
	z: ['z']
});

export const DEFAULTS = Object.freeze({
	autoPause: false,
	autoSave: false,
	autoSaveInterval: 5,
	brightness: 100,
	restorePreviousSession: false,
	theme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
});

export const PALETTES = Object.freeze({
	dark: Object.freeze({
		accent: '#333333',
		background: '#1b1b1b',
		foreground: '#666666',
		track: '#fbfbfb'
	}),
	light: Object.freeze({
		accent: '#333333',
		background: '#ffffff',
		foreground: '#aaaaaa',
		track: '#000000'
	}),
	midnight: Object.freeze({
		accent: '#2a323f',
		background: '#252b31',
		foreground: '#666666',
		track: '#cccccc'
	})
});

export * as default from "./constants.js";