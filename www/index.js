import { FocusManager } from './focus-manager.js';
import { PageOne } from './page-one.js';

customElements.define('page-one', PageOne);

document.body.addEventListener('mousedown', (event) => {
  event.preventDefault();
  event.stopImmediatePropagation();
});

new FocusManager(document.body);
