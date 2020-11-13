// @ts-check
const verticalOrthogonalWeight = 30;
const horizontalOrthogonalWeight = 2;
const activeWeight = 100;

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
        (rectB.x - rectA.x) * horizontalOrthogonalWeight,
        rectB.bottom - rectA.top
      );
    case 'down':
      return Math.hypot(
        (rectB.x - rectA.x) * horizontalOrthogonalWeight,
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
        let distance = getDistanceInDirection(
          candidateRect,
          sourceRect,
          direction
        );

        if (candidate.dataset.active !== undefined) {
          distance /= activeWeight;
        }

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
