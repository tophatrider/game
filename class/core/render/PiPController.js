export default class PiPController {
	constructor(canvas, fps = 60) {
		this.canvas = canvas;
		this.fps = fps;
		this.pipVideo = null;
	}

	async enter(options) {
		if (!this.pipVideo) {
			await this.#initVideo();
		}

		if (!document.pictureInPictureElement) {
			await this.pipVideo.requestPictureInPicture(options);
		}
	}

	async exit() {
		if (document.pictureInPictureElement === this.pipVideo) {
			await document.exitPictureInPicture();
		}
	}

	async toggle(options) {
		if (document.pictureInPictureElement === this.pipVideo) {
			await this.exit();
		} else {
			await this.enter(options);
		}
	}

	#initVideo() {
		const stream = this.canvas.captureStream(this.fps);
		const video = document.createElement('video');

		video.srcObject = stream;
		video.muted = true;
		video.playsInline = true;
		return new Promise(async (resolve, reject) => {
			try {
				await video.play();
			} catch (e) {
				return reject(e);
			}

			this.pipVideo = video;
			resolve();
		});
	}
}