// @ts-check
// import { ReactiveElement } from '@nrk/reactive-element';
// import { html, render } from '../node_modules/lit-html/lit-html.js';

// class SeriesPageElement extends ReactiveElement {
//   connectedCallback() {
//     super.connectedCallback();

//     setTimeout(() => {
//       this.items = [1, 2, 3];
//     }, 25);

//     setTimeout(() => {
//       this.items = [1, 2, 3, 4, 5, 6];
//     }, 75);
//   }

//   updated() {
//     // render(this.render(), this);

//     const candidate =
//       document.activeElement.dataset.focusable === undefined &&
//       this.querySelector('[data-focusable]');

//     if (candidate) {
//       candidate.focus();
//     }
//   }
// }

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
  if (!element) {
    console.debug('Cannot climb, element is not defined');
    return;
  }

  console.debug('Climbing from', element.dataset.focus);

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

  const orientation = element.dataset.orientation || 'horizontal';

  // We have children, but the orientation doesn't match, so try our parent
  if (orientation !== orientationByDirection[direction]) {
    console.debug('Orientation does not match');
    console.debug(
      element.dataset.focus,
      'is',
      orientation,
      'but we are moving',
      orientationByDirection[direction] + 'ly'
    );
    return climb(element.parentElement.closest('[data-focus]'), direction);
  }

  const candidates = Array.from(
    element.querySelectorAll(':scope > [data-focus]')
  );
  const next = getNextChildInDirection(element, direction);
  const activeIndex = Number(element.dataset.focusActiveIndex) || 0;
  const activeChild = candidates[activeIndex];

  if (next === activeChild) {
    console.debug(
      'Next and active are the same, climbing from',
      element.parentElement.dataset.focus
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

export function getElementCenterRect(element) {
  const rect = element.getBoundingClientRect();

  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

export function getDistanceBetween(a, b) {
  const centerA = getElementCenterRect(a);
  const centerB = getElementCenterRect(b);

  return Math.sqrt(
    Math.pow(centerA.x - centerB.x, 2) + Math.pow(centerA.y - centerB.y, 2)
  );
}

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

  const candidates = next.querySelectorAll('[data-focusable]');

  let minDistance = Number.POSITIVE_INFINITY;
  let candidate = focusable;

  for (let i = 0; i < candidates.length; i++) {
    const child = candidates.item(i);
    const distance = getDistanceBetween(element, child);

    if (distance < minDistance) {
      minDistance = distance;
      candidate = child;
    }
  }

  console.debug(
    'Moving from',
    element.dataset.focus,
    // 'inside',
    // closestContainer.dataset.focus,
    'to',
    candidate.dataset.focus
    // 'inside',
    // container.dataset.focus
  );

  candidate.focus();

  setActive(candidate);
}

function handleFocusOut(event) {
  if (event.relatedTarget === null) {
    console.warn('Lost focus, recapturing');
    event.target.focus();
  }
}

document.addEventListener('focusout', handleFocusOut);
document.addEventListener('keydown', handleKeyDown);

document.querySelector('[data-focusable]').focus();

// customElements.define('tv-series-page', SeriesPageElement);
