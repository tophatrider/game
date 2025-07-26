import StaticVector from "./math/StaticVector.js";

export const GRAVITY = Object.freeze(new StaticVector(0, 0.3));
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
	theme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
});

export * as default from "./constants.js";