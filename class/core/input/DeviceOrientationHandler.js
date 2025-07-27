import StaticInput from "./StaticInput.js";

export default class KeyboardHandler extends StaticInput {
	_handleBlur() {
		this.downKeys.clear();
	}

	_handleMotion(event) {
		const x = event.accelerationIncludingGravity.x;
		const y = event.accelerationIncludingGravity.y;
		const z = event.accelerationIncludingGravity.z;

		// Do something awesome.
		('game' in window && game.canvas || document.body).style.setProperty('background', 'green !important');
	}

	_handleOrientation(event) {
		const rotateDegrees = event.alpha; // alpha: rotation around z-axis
		const leftToRight = event.gamma; // gamma: left to right
		const frontToBack = event.beta; // beta: front back motion

		// Do something awesome.
		('game' in window && game.canvas || document.body).style.setProperty('background', 'green !important');
	}

	async listen() {
		if (await this.constructor.awaitPermission() === false) {
			('game' in window && game.canvas || document.body).style.setProperty('background', 'red !important');
			throw new RangeError('Insufficient permissions; Client user declined device orientation tracking permissions');
		}

		super.listen(window, 'blur', this._handleBlur.bind(this));
		super.listen(window, 'devicemotion', this._handleMotion.bind(this), true);
		super.listen(window, 'deviceorientation', this._handleOrientation.bind(this));
		super.listen();
		console.debug('[DeviceOrientationHandler] Listeners bound');
	}

	dispose() {
		this.unlisten();
		super.dispose();
	}

	static async awaitPermission() {
		if (typeof DeviceOrientationEvent.requestPermission != 'function') return;
		return DeviceOrientationEvent.requestPermission()
			.then(permissionState => permissionState === 'granted')
			.catch(error => {
				// Handle any errors during the permission request
				console.error('Error requesting device orientation permission:', error);
			});
	}
}