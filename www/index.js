import { FocusManager } from './focus-manager.js';
import { Menu } from './menu.js';
import { PageOne } from './page-one.js';

customElements.define('page-one', PageOne);
customElements.define('m-enu', Menu);

document.body.addEventListener('mousedown', (event) => {
  event.preventDefault();
  event.stopImmediatePropagation();
});

new FocusManager(document.body, 'vertical', 'm-enu, page-one');
