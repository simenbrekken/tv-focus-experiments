/**
 * @typedef {'down'|'left'|'right'|'up' } Direction
 */

export const CONTAINER_SELECTOR = '[data-spatial-navigation-contain]';
export const FOCUSABLE_SELECTOR = '[tabindex], a[href], button:not([disabled])';

/** @enum {string} */
const DIRECTION_BY_KEY = {
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
};

/**
 * Retrieve spatial navigation direction from KeyboardEvent
 * @param {KeyboardEvent} event
 * @returns {Direction | undefined}
 */
export function getSpatialNavigationDirectionFromEvent(event) {
  if (
    event.defaultPrevented ||
    // Ignore if entering text into input/textarea
    event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLTextAreaElement
  ) {
    return;
  }

  const direction =
    DIRECTION_BY_KEY[/** @type {keyof typeof DIRECTION_BY_KEY} */ (event.key)];

  return /** @type {Direction} */ (direction);
}

/**
 * Given an element, retrieve a spatial navigation candidate for a given direction
 * @param {HTMLElement} fromElement
 * @param {Direction} direction
 * @returns {HTMLElement | undefined}
 */
export function getSpatialNavigationCandidate(fromElement, direction) {
  const container = /** @type {HTMLElement}*/ (fromElement.closest(
    CONTAINER_SELECTOR
  ));

  if (!container) {
    return;
  }

  const focusable = findFocusable(container, fromElement, direction);

  if (focusable) {
    focusable.focus();
  }
}

/**
 * Given an element and parent container, locate focusable element in a given direction
 * @param {HTMLElement} container
 * @param {HTMLElement} searchOrigin
 * @param {Direction} direction
 * @param {string} [candidateSelector] If specified returns first candidate matching selector
 * @returns {HTMLElement | undefined}
 */
function findFocusable(container, searchOrigin, direction, candidateSelector) {
  // Find all focusable siblings that are valid for the given direction
  const candidates = getValidCandidatesForDirection(
    container.querySelectorAll(FOCUSABLE_SELECTOR),
    searchOrigin,
    direction
  );

  if (candidates.length === 0) {
    // There are no valid candidates for the current container,
    // so we climb up to the closest container for the given direction
    const closestContainer = getClosestContainer(
      container,
      searchOrigin,
      direction
    );

    if (!closestContainer) {
      return;
    }

    return findFocusable(
      closestContainer,
      searchOrigin,
      direction,
      // When switching containers attempt to use enter selector
      closestContainer.dataset.spatialNavigationEnterSelector
    );
  } else if (candidates.length === 1) {
    return candidates[0];
  }

  if (candidateSelector) {
    const candidate = candidates.find((candidate) =>
      candidate.matches(candidateSelector)
    );

    if (candidate) {
      return candidate;
    }
  }

  return getClosestCandidate(candidates, searchOrigin, direction);
}

/**
 * Given an element and set of candidates, find the closest in a given direction
 * @param {Array<HTMLElement>} candidates
 * @param {HTMLElement} searchOrigin
 * @param {Direction} direction
 * @returns {HTMLElement | undefined}
 */
function getClosestCandidate(candidates, searchOrigin, direction) {
  const searchOriginRect = searchOrigin.getBoundingClientRect();

  let closestCandidate;
  let minDistance = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    if (candidate !== searchOrigin) {
      const candidateRect = candidate.getBoundingClientRect();
      let distance = getDistanceInDirection(
        searchOriginRect,
        candidateRect,
        direction
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestCandidate = candidate;
      }
    }
  }

  return closestCandidate;
}

/**
 * Retrieve closest sibling container in a give direction
 * @param {HTMLElement} container
 * @param {HTMLElement} searchOrigin
 * @param {Direction} direction
 * @returns {HTMLElement | undefined}
 */
function getClosestContainer(container, searchOrigin, direction) {
  const parentContainer = container.parentElement?.closest(CONTAINER_SELECTOR);

  if (parentContainer) {
    const containers = getValidCandidatesForDirection(
      parentContainer.querySelectorAll(CONTAINER_SELECTOR),
      container,
      direction
    );

    return getClosestCandidate(containers, searchOrigin, direction);
  }
}

/**
 * Given an element and set of candidates, return those that are valid for the given direction
 * @param {NodeListOf<HTMLElement>} candidates
 * @param {HTMLElement} searchOrigin
 * @param {Direction} direction
 * @returns {Array<HTMLElement>}
 */
function getValidCandidatesForDirection(candidates, searchOrigin, direction) {
  const searchOriginRect = searchOrigin.getBoundingClientRect();
  /** @type {Array<HTMLElement>} */
  const validCandidates = [];

  for (const candidate of Array.from(candidates)) {
    const candidateRect = candidate.getBoundingClientRect();

    if (
      candidate !== searchOrigin &&
      isVisibleRect(candidateRect) &&
      isValidForDirection(searchOriginRect, candidateRect, direction)
    ) {
      validCandidates.push(candidate);
    }
  }

  return validCandidates;
}

/**
 * Determine if a Rect belongs to a visible element (including hidden parent containers)
 * @param {DOMRect} rect
 * @see https://github.com/jquery/jquery/blob/a503c691dc06c59acdafef6e54eca2613c6e4032/src/css/hiddenVisibleSelectors.js
 */
function isVisibleRect(rect) {
  return rect.width !== 0 || rect.height !== 0;
}

/**
 * @param {DOMRect} rectA
 * @param {DOMRect} rectB
 * @param {Direction} direction
 */
function isValidForDirection(rectA, rectB, direction) {
  switch (direction) {
    case 'up':
      return rectB.bottom <= rectA.top;
    case 'down':
      return rectB.top >= rectA.bottom;
    case 'left':
      return rectB.right <= rectA.left;
    case 'right':
      return rectB.left >= rectA.right;
  }
}

/**
 * @param {DOMRect} rectA
 * @param {DOMRect} rectB
 * @param {Direction} direction
 */
function getDistanceInDirection(rectA, rectB, direction) {
  const { sideA, sideB, distance } = getRectSidesForDirection(
    rectA,
    rectB,
    direction
  );
  const isOverlaping =
    (sideA[0] >= sideB[0] && sideA[0] <= sideB[1]) ||
    (sideA[1] >= sideB[0] && sideA[1] <= sideB[1]);

  // If sides are overlapping in one axis, shortest distance is length of tangent (d)
  if (isOverlaping) {
    return distance;
  }

  // If A side is right of B, measure distance between left-most A point and right-most B point
  if (sideA[0] > sideB[1]) {
    return Math.hypot(sideA[0] - sideB[1], distance);
  } else {
    return Math.hypot(sideA[1] - sideB[0], distance);
  }
}

/**
 * Retrieve nearest sides of two rects based on a given direction
 * @param {DOMRect} rectA
 * @param {DOMRect} rectB
 * @param {Direction} direction
 */
function getRectSidesForDirection(rectA, rectB, direction) {
  switch (direction) {
    case 'up':
      return {
        sideA: [rectA.left, rectA.right],
        sideB: [rectB.left, rectB.right],
        distance: rectA.top - rectB.bottom,
      };
    case 'down':
      return {
        sideA: [rectA.left, rectA.right],
        sideB: [rectB.left, rectB.right],
        distance: rectB.top - rectA.bottom,
      };
    case 'left':
      return {
        sideA: [rectA.top, rectA.bottom],
        sideB: [rectB.top, rectB.bottom],
        distance: rectA.left - rectB.right,
      };
    case 'right':
      return {
        sideA: [rectA.top, rectA.bottom],
        sideB: [rectB.top, rectB.bottom],
        distance: rectB.left - rectA.right,
      };
  }
}
