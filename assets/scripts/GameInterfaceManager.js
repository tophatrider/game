const gameContainer = document.querySelector('#game-container')
	, shadowRoot = gameContainer.shadowRoot || gameContainer.attachShadow({ mode: 'open' });

shadowRoot.appendChild(document.createElement('slot'));

const sheet = new CSSStyleSheet();
await sheet.replace(await fetch('assets/styles/gui.css').then(r => r.text()));
shadowRoot.adoptedStyleSheets.push(sheet);

shadowRoot.innerHTML += await fetch('assets/components/shadow.htm').then(r => r.text());