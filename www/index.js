// @ts-check
const ACTIVE_SELECTOR = '[data-active]';
const CONTAINER_SELECTOR = '[data-spatial-navigation-contain]';
const FOCUSABLE_SELECTOR = '[tabindex], a[href], button:not([disabled])';
const DIRECTION_BY_KEY = {
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
};

document.addEventListener('keydown', handleKeyDown);

/**
 * @param {KeyboardEvent} event
 */
function handleKeyDown(event) {
  const direction = DIRECTION_BY_KEY[event.key];

  if (!direction) {
    return;
  }

  const searchOrigin = /** @type {HTMLElement}*/ (event.target);
  const container = /** @type {HTMLElement}*/ (searchOrigin.closest(
    CONTAINER_SELECTOR
  ));

  if (!container) {
    return;
  }

  const focusable = findFocusable(container, searchOrigin, direction);

  if (focusable) {
    focusable.focus();
  }
}

/**
 * @param {HTMLElement} container
 * @param {HTMLElement} searchOrigin
 * @param {string} direction
 * @param {boolean} [preferActive]
 */
function findFocusable(container, searchOrigin, direction, preferActive) {
  // Find all focusable siblings that are valid for the given direction
  const candidates = getValidCandidatesForDirection(
    container.querySelectorAll(FOCUSABLE_SELECTOR),
    searchOrigin,
    direction
  );

  if (candidates.length == 0) {
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

    return findFocusable(closestContainer, searchOrigin, direction, true);
  } else if (candidates.length === 1) {
    return candidates[0];
  }

  if (preferActive) {
    const activeCandidate = candidates.find((candidate) =>
      candidate.matches(ACTIVE_SELECTOR)
    );

    if (activeCandidate) {
      return activeCandidate;
    }
  }

  return getClosestCandidate(candidates, searchOrigin, direction);
}

/**
 * Given an element and set of candidates, find the closest in a given direction
 * @param {Array<HTMLElement>} candidates
 * @param {HTMLElement} searchOrigin
 * @param {string} direction
 * @returns {HTMLElement}
 */
function getClosestCandidate(candidates, searchOrigin, direction) {
  const sourceRect = searchOrigin.getBoundingClientRect();

  let closestCandidate;
  let minDistance = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    if (candidate !== searchOrigin) {
      const candidateRect = candidate.getBoundingClientRect();

      let distance = getDistanceInDirection(
        sourceRect,
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
 * @param {HTMLElement} container
 * @param {HTMLElement} searchOrigin
 * @param {string} direction
 */
function getClosestContainer(container, searchOrigin, direction) {
  const parentContainer = container.parentElement.closest(CONTAINER_SELECTOR);
  const containers = getValidCandidatesForDirection(
    parentContainer.querySelectorAll(CONTAINER_SELECTOR),
    container,
    direction
  );

  return getClosestCandidate(containers, searchOrigin, direction);
}

/**
 * Given an element and set of candidates, return those that are valid for the given direction
 * @param {NodeListOf<Element>} candidates
 * @param {HTMLElement} searchOrigin
 * @param {string} direction
 * @returns {Array<HTMLElement>}
 */
function getValidCandidatesForDirection(candidates, searchOrigin, direction) {
  const searchOriginRect = searchOrigin.getBoundingClientRect();
  const validCandidates = [];

  for (const candidate of candidates) {
    if (
      candidate !== searchOrigin &&
      isValidForDirection(
        searchOriginRect,
        candidate.getBoundingClientRect(),
        direction
      )
    ) {
      validCandidates.push(candidate);
    }
  }

  return /** @type {Array<HTMLElement>} */ (validCandidates);
}

/**
 * @param {DOMRect} rectA
 * @param {DOMRect} rectB
 * @param {string} direction
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
 * @param {string} direction
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
 * @param {string} direction
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
