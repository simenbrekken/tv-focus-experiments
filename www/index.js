// @ts-check
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

/**
 * @param {HTMLElement} element
 * @returns {NodeListOf<HTMLElement>}
 */
function getChildren(element) {
  return element.querySelectorAll(':scope > [data-focus]');
}

/**
 * @param {HTMLElement} element
 * @returns {HTMLElement}
 */
function getContainer(element) {
  return element.parentElement.closest('[data-focus]');
}

/**
 * @param {HTMLElement} element
 */
function getBehavior(element) {
  return element.dataset.behavior;
}

/**
 * @param {HTMLElement} element
 */
function getOrientation(element) {
  return element.dataset.orientation || 'horizontal';
}

/**
 * @param {HTMLElement} element
 * @returns {number}
 */
function getActiveIndex(element) {
  return Number(element.dataset.activeIndex) || 0;
}

/**
 * @param {HTMLElement} element
 * @param {number} activeIndex
 */
function setActiveIndex(element, activeIndex) {
  element.dataset.activeIndex = activeIndex.toString();
}

/**
 * @param {HTMLElement} element
 */
function isFocusable(element) {
  return element.dataset.focusable !== undefined;
}

/**
 * @param {HTMLElement} element
 */
function hasFocusableChildren(element) {
  return element.querySelector('[data-focusable]') !== null;
}

/**
 * Get the next child of a container in the given direction
 *
 * @param {HTMLElement} element
 * @param {string} direction
 * @returns {HTMLElement}
 */
function getNextChildInDirection(element, direction) {
  const children = getChildren(element);
  const activeIndex = getActiveIndex(element);
  const activeChild = children.item(activeIndex);
  const nextChild = children.item(activeIndex + offsetByDirection[direction]);

  return nextChild || activeChild;
}

/**
 * Climb up the focus tree from the given element
 *
 * @param {HTMLElement} element
 * @param {string} direction
 * @returns {HTMLElement | undefined}
 */
function climb(element, direction) {
  if (!element) {
    return;
  }

  // We're on a focusable leaf node so climb up
  if (isFocusable(element)) {
    return climb(getContainer(element), direction);
  }

  // If the node we're on contains no focusable children, climb up
  if (!hasFocusableChildren(element)) {
    return climb(getContainer(element), direction);
  }

  const orientation = getOrientation(element);

  // We have children, but the orientation doesn't match, so try our parent
  if (orientation !== orientationByDirection[direction]) {
    return climb(getContainer(element), direction);
  }

  const children = getChildren(element);
  const activeIndex = getActiveIndex(element);
  const activeChild = children.item(activeIndex);
  const next = getNextChildInDirection(element, direction);

  if (next === activeChild) {
    return climb(getContainer(element), direction);
  }

  return element;
}

/**
 * Dig down the focus tree from the given element
 *
 * @param {HTMLElement} element
 * @param {string} direction
 * @returns {HTMLElement | undefined}
 */
function dig(element, direction) {
  if (isFocusable(element)) {
    return element;
  }

  if (!hasFocusableChildren(element)) {
    const container = getContainer(element);
    const nextSibling = getNextChildInDirection(container, direction);

    // Prevent infinite loop
    if (nextSibling === element) {
      return;
    }

    return dig(nextSibling, direction);
  }

  const children = getChildren(element);
  const activeIndex = getActiveIndex(element);
  const activeChild = children.item(activeIndex);

  if (!isFocusable(activeChild)) {
    return dig(activeChild, direction);
  }

  return activeChild;
}

/**
 * Update active index for the current element and all its ancestors
 *
 * @param {HTMLElement} element
 */
function setActive(element) {
  const container = getContainer(element);

  if (!container) {
    return;
  }

  const children = Array.from(getChildren(container));
  const index = children.indexOf(element);

  setActiveIndex(container, index);

  return setActive(container);
}

/**
 * @param {Element} element
 */
export function getCenterPoint(element) {
  const rect = element.getBoundingClientRect();

  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

/**
 * @param {Element} a
 * @param {Element} b
 */
function getDistance(a, b) {
  const centerA = getCenterPoint(a);
  const centerB = getCenterPoint(b);

  return Math.sqrt(
    Math.pow(centerA.x - centerB.x, 2) + Math.pow(centerA.y - centerB.y, 2)
  );
}

/**
 *
 * @param {HTMLElement} source
 * @param {string} direction
 */
function findFocusable(source, direction) {
  const container = climb(source, direction);

  if (!container) {
    return;
  }

  const nextContainer = getNextChildInDirection(container, direction);

  if (getBehavior(nextContainer) === 'closest') {
    let closestChild;
    let minDistance = Number.POSITIVE_INFINITY;

    const children = nextContainer.querySelectorAll('[data-focusable]');

    for (const child of children) {
      const distance = getDistance(source, child);

      if (distance < minDistance) {
        minDistance = distance;
        closestChild = child;
      }
    }

    return closestChild;
  }

  return dig(nextContainer, direction);
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

  const focusable = findFocusable(element, direction);

  if (focusable) {
    focusable.focus();
  }
}

function handleFocusIn(event) {
  setActive(event.target);
}

function handleFocusOut(event) {
  if (event.relatedTarget === null) {
    console.warn('Lost focus, recapturing!');
    event.target.focus();
  }
}

document.addEventListener('focusin', handleFocusIn);
document.addEventListener('focusout', handleFocusOut);
document.addEventListener('keydown', handleKeyDown);

document.querySelector('[data-focusable]').focus();
