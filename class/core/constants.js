export const GRAVITY = Object.freeze({ x: 0, y: .3 });
export const DRAG = .99;

export const KEYMAP = Object.freeze({
	down: ['arrowdown', 's'],
	left: ['arrowleft', 'a'],
	right: ['arrowright', 'd'],
	up: ['arrowup', 'w'],
	z: ['z']
});

// Used for mapped key input states using Uint8Array for memory optimizations
// export const KEYMAP = Object.freeze([
// 	['arrowdown', 's'],
// 	['arrowleft', 'a'],
// 	['arrowright', 'd'],
// 	['arrowup', 'w'],
// 	['z']
// ]);

export const DEFAULTS = Object.freeze({
	autoPause: false,
	autoSave: false,
	autoSaveInterval: 5,
	brightness: 100,
	displayFPS: false,
	restorePreviousSession: false,
	theme: 'system'
});

import Color from "./utils/Color.js";

// Create core/constants
// Create core/constants/colors -- or palette -- or colorPalettes.js
export const PALETTES = Object.freeze({
	dark: Object.freeze({
		accent: new Color('#333'),
		background: new Color('#1b1b1b'),
		foreground: new Color('#666'),
		track: new Color('#fbfbfb')
	}),
	light: Object.freeze({
		accent: new Color('#333'),
		background: new Color('#fff'),
		foreground: new Color('#aaa'),
		track: new Color('#000')
	}),
	midnight: Object.freeze({
		accent: new Color('#2a323f'),
		background: new Color('#252b31'),
		foreground: new Color('#666'),
		track: new Color('#ccc')
	})
});

export * as default from "./constants.js";