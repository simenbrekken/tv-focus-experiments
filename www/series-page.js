import { ReactiveElement } from '../node_modules/@nrk/reactive-element/index.mjs';
import { html, render } from '../node_modules/lit-html/lit-html.js';

class SeriesPageElement extends ReactiveElement {
  static get reactiveProperties() {
    return {
      items: Object,
    };
  }

  items = [];

  constructor() {
    super();

    this.handleSpatial = this.handleSpatial.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();

    setTimeout(() => {
      this.items = [1, 2, 3];
    }, 25);

    setTimeout(() => {
      this.items = [1, 2, 3, 4, 5, 6];
    }, 75);

    // setTimeout(() => {
    //   this.items = [4, 5, 6, 7, 8, 9];
    // }, 1000);

    this.addEventListener('spatial', this.handleSpatial.bind(this));
  }

  handleSpatial(event) {
    console.log('Handling spatial', event);
  }

  updated() {
    render(this.render(), this);

    const candidate =
      document.activeElement.dataset.focusable === undefined &&
      this.querySelector('[data-focusable]');

    if (candidate) {
      candidate.focus();
    }
  }

  render() {
    return html`<div>
      <h1>Series page</h1>
      <div data-focus="sections" data-orientation="vertical">
        <div data-focus="section-1" data-orientation="horizontal">
          ${this.items
            .slice(0, 3)
            .map(
              (item) =>
                html`<a href="#${item}" data-focus="item-${item}" data-focusable
                  >${item}</a
                >`
            )}
        </div>
        <div data-focus="section-2" data-orientation="horizontal">
          ${this.items
            .slice(3)
            .map(
              (item) =>
                html`<a href="#${item}" data-focus="item-${item}" data-focusable
                  >${item}</a
                >`
            )}
        </div>
      </div>
    </div>`;
  }
}

const directionByKey = {
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
};

const orientationByDirection = {
  down: 'vertical',
  left: 'horizontal',
  right: 'horizontal',
  up: 'vertical',
};

const offsetByDirection = {
  down: 1,
  left: -1,
  right: 1,
  up: -1,
};

function getNextChildInDirection(container, direction) {
  const offset = offsetByDirection[direction];
  const candidates = container.querySelectorAll(':scope > [data-focus]');
  const activeIndex = Number(container.dataset.focusActiveIndex) || 0;
  const activeChild = candidates.item(activeIndex);
  const nextChild = candidates.item(activeIndex + offset);

  if (!nextChild) {
    console.debug(
      'Could not find',
      offset > 0 ? 'next' : 'previous',
      'sibling of',
      activeChild.dataset.focus,
      'in',
      container.dataset.focus
    );

    return activeChild;
  }

  console.debug(
    'Found',
    nextChild.dataset.focus,
    'being',
    offset > 0 ? 'next' : 'previous',
    'sibling of',
    activeChild.dataset.focus,
    'in',
    container.dataset.focus
  );

  return nextChild || activeChild;
}

function climb(element, direction) {
  console.debug('Climbing from', element.dataset.focus);

  if (!element) {
    console.debug('Cannot climb, element is not defined');
    return;
  }

  // If we're on a leaf, climb up
  if (element.dataset.focusable !== undefined) {
    console.debug(element.dataset.focus, 'is focusable/leaf');
    return climb(element.parentElement.closest('[data-focus]'), direction);
  }

  // If the node we're on contains no focusable children, climb up
  if (!element.querySelector('[data-focusable]')) {
    console.debug(element.dataset.focus, 'has no focusable children');
    return climb(element.parentElement.closest('[data-focus]'), direction);
  }

  // We have children, but the orientation doesn't match, so try our parent
  if (element.dataset.orientation !== orientationByDirection[direction]) {
    console.debug('Orientation does not match');
    console.debug(
      element.dataset.focus,
      'is',
      element.dataset.orientation,
      'but we are moving',
      orientationByDirection[direction] + 'ly'
    );
    return climb(element.parentElement.closest('[data-focus]'), direction);
  }

  console.debug('Returning', element.dataset.focus);

  return element;
}

function dig(element, direction) {
  console.debug('Digging from', element.dataset.focus);

  if (element.dataset.focusable !== undefined) {
    console.debug(element.dataset.focus, 'is focusable/leaf');
    return element;
  }

  if (!element.querySelector('[data-focusable]')) {
    console.debug(element.dataset.focus, 'has no focusable children');
    const container = element.parentElement.closest('[data-focus]');
    const nextSibling = getNextChildInDirection(container, direction);

    if (nextSibling === element) {
      return;
    }

    return dig(nextSibling, direction);
  }

  const candidates = element.querySelectorAll(':scope > [data-focus]');
  const activeIndex = Number(element.dataset.focusActiveIndex) || 0;
  const activeChild = candidates.item(activeIndex);

  if (activeChild.dataset.focusable === undefined) {
    console.debug(element.dataset.focus, 'is not focusable');

    return dig(activeChild, direction);
  }

  return activeChild;
}

function setActive(element) {
  const container = element.parentElement.closest('[data-focus]');

  if (!container) {
    return;
  }

  const candidates = Array.from(
    container.querySelectorAll(':scope > [data-focus]')
  );
  const index = candidates.indexOf(element);

  console.debug('Setting', container.dataset.focus, 'active index to', index);

  container.dataset.focusActiveIndex = index;

  return setActive(container);
}

// https://github.com/bbc/lrud/blob/master/src/index.ts#L650
function handleKeyDown(event) {
  const element = event.target;

  if (element.dataset.focus === undefined) {
    return;
  }

  const direction = directionByKey[event.key];

  if (!direction) {
    return;
  }

  console.debug('Moving', direction, 'from', element.dataset.focus);

  const container = climb(element, direction);

  if (!container) {
    return;
  }

  const next = getNextChildInDirection(container, direction);
  const focusable = dig(next, direction);

  if (!focusable) {
    console.debug('No focusable element found');
    return;
  }

  console.debug('Focusing', focusable.dataset.focus);

  focusable.focus();

  /*
  const spatialEvent = new CustomEvent('spatial', {
    bubbles: true,
    cancelable: true,
    detail: { direction },
  });
  event.target.dispatchEvent(spatialEvent);

  console.log(event.defaultPrevented);
  */

  setActive(focusable);
}

function handleFocusOut(event) {
  if (event.relatedTarget === null) {
    console.warn('Lost focus, recapturing');
    event.target.focus();
  }
}

document.addEventListener('focusout', handleFocusOut);
document.addEventListener('keydown', handleKeyDown);

customElements.define('tv-series-page', SeriesPageElement);
