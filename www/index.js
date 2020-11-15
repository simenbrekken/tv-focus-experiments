// @ts-check
const containerSelector = '[data-spatial-navigation-contain]';
const focusableSelector = '[tabindex], a[href], button:not([disabled])';

const directionByKey = {
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
};

/**
 * @param {HTMLElement} element
 */
function isFocusable(element) {
  return element.matches(focusableSelector);
}

/**
 * @param {HTMLElement} element
 * @returns {HTMLElement}
 */
function getSpatialNavigationContainer(element) {
  return element.closest(containerSelector);
}

/**
 * @param {HTMLElement} container
 * @returns {NodeListOf<HTMLElement>}
 */
function getSpatialNavigationCandidates(container) {
  return container.querySelectorAll(focusableSelector);
}

/**
 * @param {HTMLElement} container
 * @returns {HTMLElement}
 */
function getFocused(container) {
  return container.querySelector('[data-focused]');
}

/**
 * @param {HTMLElement} focusable
 */
function setFocused(focusable) {
  const container = getSpatialNavigationContainer(focusable);
  const focused = getFocused(container);

  if (focused !== focusable) {
    if (focused) {
      delete focused.dataset.focused;
    }

    focusable.dataset.focused = '';
    focusable.focus();
  }
}

/**
 * @param {DOMRect} rectA
 * @param {DOMRect} rectB
 * @param {string} direction
 */
function getSpatialPlanesForDirection(rectA, rectB, direction) {
  switch (direction) {
    case 'up':
      return {
        s1: [rectA.left, rectA.right],
        s2: [rectB.left, rectB.right],
        d: rectA.top - rectB.bottom,
      };
    case 'down':
      return {
        s1: [rectA.left, rectA.right],
        s2: [rectB.left, rectB.right],
        d: rectB.top - rectA.bottom,
      };
    case 'left':
      return {
        s1: [rectA.top, rectA.bottom],
        s2: [rectB.top, rectB.bottom],
        d: rectA.left - rectB.right,
      };
    case 'right':
      return {
        s1: [rectA.top, rectA.bottom],
        s2: [rectB.top, rectB.bottom],
        d: rectB.left - rectA.right,
      };
  }
}

/**
 * @param {DOMRect} rectA
 * @param {DOMRect} rectB
 * @param {string} direction
 */
function getDistanceInDirection(rectA, rectB, direction) {
  const { s1, s2, d } = getSpatialPlanesForDirection(rectA, rectB, direction);
  const isOverlaping =
    (s1[0] >= s2[0] && s1[0] <= s2[1]) || (s1[1] >= s2[0] && s1[1] <= s2[1]);

  // If segments are overlapping, shortest distance is length of tangent (d)
  if (isOverlaping) {
    return d;
  }

  // If A is right of B, measure distance between left-most A point and right-most B point
  if (s1[0] > s2[1]) {
    return Math.hypot(s1[0] - s2[1], d);
  } else {
    return Math.hypot(s1[1] - s2[0], d);
  }
}

/**
 * @param {DOMRect} sourceRect
 * @param {DOMRect} targetRect
 * @param {string} direction
 */
function isValidForDirection(sourceRect, targetRect, direction) {
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

      if (isValidForDirection(sourceRect, candidateRect, direction)) {
        let distance = getDistanceInDirection(
          sourceRect,
          candidateRect,
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

function handleKeyDown(event) {
  const direction = directionByKey[event.key];

  if (!direction) {
    return;
  }

  const focused = /** @type {HTMLElement} */ (document.activeElement);
  const container = getSpatialNavigationContainer(focused);
  const candidates = getSpatialNavigationCandidates(container);
  const focusable = getClosestInDirection(focused, candidates, direction);

  if (focusable) {
    setFocused(focusable);
  }
}

function handleFocusIn(event) {
  if (isFocusable(event.target)) {
    setFocused(event.target);
  }
}

function handleClick(event) {
  if (!isFocusable(event.target)) {
    const container = getSpatialNavigationContainer(event.target);
    const focused = getFocused(container);

    if (focused) {
      focused.focus();
    }
  }
}

document.addEventListener('click', handleClick);
document.addEventListener('focusin', handleFocusIn);
document.addEventListener('keydown', handleKeyDown);
