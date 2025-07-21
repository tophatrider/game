# Top Hat Rider

A modern revival of the classic browser game once known as *Black Hat Rider*.  
The original game has been lost to time, but thanks to a preserved copy of the source code, this reimagined version is being rebuilt from the ground up with contemporary web technologies and development patterns.

This project is not just a restoration — it's a complete evolution.

## About the Game

Top Hat Rider is a physics-based side-scrolling game where the player controls a rider navigating dynamic terrain. Precision, timing, and smooth motion are at the heart of the experience.

Originally built with early JavaScript practices, the new version aims to be performant, maintainable, and extensible using modern approaches.

## Modern Enhancements and Changes

### Architectural Improvements

- Rewritten using modular, component-based JavaScript (ES6+)
- Isolated rendering via **Web Workers**, offloading draw logic from the main thread
- Game logic and rendering are sandboxed for better performance and security

### Graphics and Rendering

- Use of **Shadow DOM** and **Constructable Stylesheets** for scoped UI styling
- Canvas-based rendering with separation of UI and game loop
- Responsive design considerations for modern screens

### Gameplay & Physics

- **Linear interpolation** (lerp) implemented for smoother motion and animation transitions
- Frame-independent physics updates using `requestAnimationFrame` and time delta calculations
- Future-ready for mobile touch support and gamepad input

### Codebase and Tooling

- Clear file structure for game engine, rendering, assets, and utilities
- Scalable design for future features like multiplayer

## Installation

Clone the repository and run the development server:

```bash
git clone https://github.com/tophatrider/game.git
cd game
npm install
npm run dev
```

To build for production:
```bash
npm run build
```

## Contributing
This is a personal passion project, but contributors who share a love for browser-based games are welcome. Please open an issue before submitting a pull request.

## License
This project is licensed under the GNU General Public License. See the LICENSE file for details.

## Acknowledgments
Special thanks to the original Black Hat Rider developers and the community of browser game enthusiasts who inspired this revival.