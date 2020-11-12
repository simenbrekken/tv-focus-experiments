// @ts-check
const verticalOrthogonalWeight = 30;
const horizontalOrthogonalWeight = 2;

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
  return element.dataset.focusable !== undefined;
}

/**
 * @param {HTMLElement} focusable
 */
function setFocused(focusable) {
  /** @type {HTMLElement} */
  const container = focusable.closest('[data-focus-container]');

  /** @type {HTMLElement} */
  const focused = container.querySelector('[data-focused]');

  if (focused !== focusable) {
    if (focused) {
      delete focused.dataset.focused;
    }

    focusable.dataset.focused = '';
  }
}

/**
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

function handleKeyDown(event) {
  const direction = directionByKey[event.key];

  if (!direction) {
    return;
  }

  /** @type {HTMLElement} */
  const focused = document.querySelector('[data-focused]');

  /** @type {HTMLElement} */
  const container = focused.closest('[data-focus-container]');
  /** @type {NodeListOf<HTMLElement>} */
  const candidates = container.querySelectorAll('[data-focusable]');
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

document.addEventListener('focusin', handleFocusIn);
document.addEventListener('keydown', handleKeyDown);
