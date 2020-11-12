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
function getNextChildInDirection(element, direction, action) {
  const children = getChildren(element);
  const activeIndex = getActiveIndex(element);
  const activeChild = children.item(activeIndex);
  const nextChild = children.item(activeIndex + offsetByDirection[direction]);

  if (nextChild) {
    console.debug(
      'Next child',
      action,
      direction,
      'from',
      element.title,
      'is',
      nextChild.title
    );
  } else {
    console.debug(
      'Next child',
      action,
      direction,
      'from',
      element.title,
      'does not exist'
    );
  }

  return nextChild || activeChild;
}

/**
 *
 * @param {HTMLElement} focusable
 */
function setFocused(focusable) {
  /** @type {HTMLElement} */
  const focused = document.querySelector('[data-focused]');

  if (focused !== focusable) {
    if (focused) {
      delete focused.dataset.focused;
    }

    focusable.dataset.focused = '';
  }

  // updateActiveIndex(focusable);
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
    console.debug('Climbing from', element.title, 'that is not a container');

    return climb(getContainer(element), direction);
  }

  // If the node we're on contains no focusable children, climb up
  if (!hasFocusableChildren(element)) {
    console.debug(
      'Climbing from',
      element.title,
      'that contains no focusable children'
    );

    return climb(getContainer(element), direction);
  }

  const orientation = getOrientation(element);

  // We have children, but the orientation doesn't match, so try our parent
  if (orientation !== orientationByDirection[direction]) {
    console.debug(
      'Climbing from',
      element.title,
      'that has orientation',
      orientation,
      'but we are going',
      orientationByDirection[direction] + 'ly'
    );

    return climb(getContainer(element), direction);
  }

  const children = getChildren(element);
  const activeIndex = getActiveIndex(element);
  const activeChild = children.item(activeIndex);
  const next = getNextChildInDirection(element, direction, 'climb');

  if (next === activeChild) {
    console.debug(
      'Climbing from',
      element.title,
      'as the next focusable child',
      next.title,
      'is the same as the currently focused child'
    );

    return climb(getContainer(element), direction);
  }

  console.debug('Reached top', element.title);

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
    console.debug('Stopping digging as', element.title, 'is focusable');

    return element;
  }

  if (!hasFocusableChildren(element)) {
    const container = getContainer(element);
    const nextSibling = getNextChildInDirection(container, direction, 'dig');

    // Prevent infinite loop
    if (nextSibling === element) {
      console.debug(
        'Preventing infinite loop as next sibling is current element',
        element.title
      );

      return;
    }

    console.debug(
      'Digging from',
      nextSibling.title,
      'as',
      element.title,
      'has no focusable children'
    );

    return dig(nextSibling, direction);
  }

  const children = getChildren(element);
  const activeIndex = getActiveIndex(element);
  const activeChild = children.item(activeIndex);

  if (!isFocusable(activeChild)) {
    console.debug('Digging from', activeChild.title, 'that is not focusable');

    return dig(activeChild, direction);
  }

  console.debug('Reached bottom', activeChild.title);

  return activeChild;
}

/**
 * Update active index for the current element and all its ancestors
 *
 * @param {HTMLElement} element
 */
function updateActiveIndex(element) {
  const container = getContainer(element);

  if (!container) {
    return;
  }

  const children = Array.from(getChildren(container));
  const index = children.indexOf(element);

  console.debug('Setting active index of', container.title, 'to', index);

  setActiveIndex(container, index);

  return updateActiveIndex(container);
}

/**
 * @param {Element} element
 */
export function getCenterPoint2(element) {
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
  const centerA = getCenterPoint2(a);
  const centerB = getCenterPoint2(b);

  return Math.sqrt(
    Math.pow(centerA.x - centerB.x, 2) + Math.pow(centerA.y - centerB.y, 2)
  );
}

/**
 *
 * @param {DOMRect} rect
 */
function getCenterPoint(rect) {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

/**
 * @param {DOMRect} rectA
 * @param {DOMRect} rectB
 * @param {string} direction
 */
function getDistanceInDirection(rectA, rectB, direction) {
  const centerA = getCenterPoint(rectA);
  const centerB = getCenterPoint(rectB);
  const verticalOrthogonalWeight = 30;
  const horizontalOrthogonalWeight = 2;

  switch (direction) {
    case 'up':
      return Math.hypot(
        (centerB.x - centerA.x) * horizontalOrthogonalWeight,
        rectB.bottom - rectA.top
      );
    case 'down':
      return Math.hypot(
        (centerB.x - centerA.x) * horizontalOrthogonalWeight,
        rectB.top - rectA.bottom
      );
    case 'left':
      return Math.hypot(
        rectB.right - rectA.left,
        (centerB.y - centerA.y) * verticalOrthogonalWeight
      );
    case 'right':
      return Math.hypot(
        rectB.left - rectA.right,
        (centerB.y - centerA.y) * verticalOrthogonalWeight
      );
  }
}
/**
 * @param {DOMRect} targetRect
 * @param {DOMRect} sourceRect
 * @param {string} direction
 */

function isValidForDirection(targetRect, sourceRect, direction) {
  switch (direction) {
    case 'up':
      return targetRect.bottom < sourceRect.top;
    case 'down':
      return targetRect.top > sourceRect.bottom;
    case 'left':
      return targetRect.right < sourceRect.left;
    case 'right':
      return targetRect.left > sourceRect.right;
  }
}

/**
 * @param {HTMLElement} source
 * @param {Iterable<HTMLElement>} candidates
 * @param {string} direction
 * @returns {HTMLElement}
 */
function getClosestInDirection(source, candidates, direction) {
  const sourceRect = source.getBoundingClientRect();

  let closest;
  let minDistance = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    if (candidate !== source) {
      const candidateRect = candidate.getBoundingClientRect();

      if (isValidForDirection(candidateRect, sourceRect, direction)) {
        const distance = getDistanceInDirection(
          candidateRect,
          sourceRect,
          direction
        );

        console.debug(
          'Distance from',
          source.title,
          'to',
          candidate.title,
          'is',
          distance
        );

        if (distance < minDistance) {
          minDistance = distance;
          closest = candidate;
        }
      }
    }
  }

  return closest;
}

/**
 * @param {HTMLElement} source
 * @param {string} direction
 * @returns {HTMLElement}
 */
function findFocusable(source, direction) {
  const container = climb(source, direction);

  if (!container) {
    console.debug('No container found after climbing up, aborting');

    return;
  }

  const nextContainer = getNextChildInDirection(
    container,
    direction,
    'findFocusable'
  );

  if (getBehavior(nextContainer) === 'closest') {
    let closestChild;
    let minDistance = Number.POSITIVE_INFINITY;

    /** @type {NodeListOf<HTMLElement>} */
    const children = nextContainer.querySelectorAll('[data-focusable]');

    for (const child of children) {
      const distance = getDistance(source, child);

      if (distance < minDistance) {
        minDistance = distance;
        closestChild = child;
      }
    }

    if (closestChild) {
      console.debug(
        'Found closest child',
        closestChild.title,
        'of',
        nextContainer.title
      );
    } else {
      console.debug('Could not find closest child of', nextContainer.title);
    }

    return closestChild;
  }

  return dig(nextContainer, direction);
}

/**
 * @param {HTMLElement} focused
 * @param {string} direction
 * @returns {HTMLElement}
 */
function findFocusable2(focused, direction) {
  /** @type {HTMLElement} */
  const container = focused.closest('[data-focus-container]');

  const focusedRect = focused.getBoundingClientRect();

  /** @type {HTMLElement[]} */
  const focusable = Array.from(container.querySelectorAll('[data-focusable]'));
  const candidates = focusable.filter((candidate) => {
    const rect = candidate.getBoundingClientRect();

    switch (direction) {
      case 'up':
        return rect.bottom < focusedRect.top;
      case 'down':
        return rect.top > focusedRect.bottom;
      case 'left':
        return rect.right < focusedRect.left;
      case 'right':
        return rect.left > focusedRect.right;
    }
  });

  console.debug(
    'Finding focusable',
    direction,
    'candidates',
    candidates.map((candidate) => candidate.title).join(', ')
  );

  const next = getClosestInDirection(focused, candidates, direction);

  return next;

  // const closest = get;
  // const sections =
}

function handleKeyDown(event) {
  const direction = directionByKey[event.key];

  if (!direction) {
    return;
  }

  /** @type {HTMLElement} */
  const focused = document.querySelector('[data-focused]');
  const focusable = findFocusable2(focused, direction);

  if (focusable) {
    setFocused(focusable);
  }
}

function handleFocusIn(event) {
  if (isFocusable(event.target)) {
    setFocused(event.target);
  }
}

document.addEventListener('focusin', handleFocusIn);
document.addEventListener('keydown', handleKeyDown);
