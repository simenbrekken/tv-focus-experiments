import { FocusManager } from './focus-manager.js';
import { PageOne } from './page-one.js';

customElements.define('page-one', PageOne);

(async function main() {
  await customElements.whenDefined('page-one');
  const pageOneElement = document.querySelector('page-one');
  await pageOneElement.readyComplete;
  await pageOneElement.updateComplete;
  const focusManager = new FocusManager(document.body);
  focusManager.activate();
})();
