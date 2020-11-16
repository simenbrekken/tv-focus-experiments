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

  const focusable = findFocusable(container, searchOrigin, direction, true);

  if (focusable) {
    focusable.focus();
  }
}

/**
 * @param {HTMLElement} container
 * @param {HTMLElement} searchOrigin
 * @param {string} direction
 * @param {boolean} preferActive
 */
function findFocusable(container, searchOrigin, direction, preferActive) {
  const candidates = /** @type {Array<HTMLElement>}*/ (Array.from(
    container.querySelectorAll(FOCUSABLE_SELECTOR)
  ));
  const candidatesExcludingSearchOrigin = candidates.filter(
    (candidate) => candidate !== searchOrigin
  );

  const searchOriginRect = searchOrigin.getBoundingClientRect();

  const candidatesExcludingSourceOriginAndInvalidForDirection = candidatesExcludingSearchOrigin.filter(
    (candidate) =>
      isValidForDirection(
        searchOriginRect,
        candidate.getBoundingClientRect(),
        direction
      )
  );

  if (candidatesExcludingSourceOriginAndInvalidForDirection.length == 0) {
    const closestContainerFromParent = container.parentElement.closest(
      CONTAINER_SELECTOR
    );
    const containers = /** @type {Array<HTMLElement>}*/ (Array.from(
      closestContainerFromParent.querySelectorAll(CONTAINER_SELECTOR)
    ));

    const containersExcludingCurrentContainer = containers.filter(
      (candidate) => candidate !== container
    );

    const containerRect = container.getBoundingClientRect();

    const containersExcludingCurrentContainerAndInvalidForDirection = containersExcludingCurrentContainer.filter(
      (candidate) =>
        isValidForDirection(
          containerRect,
          candidate.getBoundingClientRect(),
          direction
        )
    );

    const closestContainer = getClosestCandidate(
      searchOrigin,
      containersExcludingCurrentContainerAndInvalidForDirection,
      direction
    );

    if (!closestContainer) {
      return;
    }

    return findFocusable(closestContainer, searchOrigin, direction, true);
  } else if (
    candidatesExcludingSourceOriginAndInvalidForDirection.length === 1
  ) {
    return candidatesExcludingSourceOriginAndInvalidForDirection[0];
  }

  if (preferActive) {
    const activeCandidate = candidatesExcludingSourceOriginAndInvalidForDirection.find(
      (candidate) => candidate.matches(ACTIVE_SELECTOR)
    );

    if (activeCandidate) {
      return activeCandidate;
    }
  }

  return getClosestCandidate(
    searchOrigin,
    candidatesExcludingSourceOriginAndInvalidForDirection,
    direction
  );
}

/**
 * Given an element and set of candidates, find the closest in a given direction
 * @param {HTMLElement} searchOrigin
 * @param {Array<HTMLElement>} candidates
 * @param {string} direction
 * @returns {HTMLElement}
 */
function getClosestCandidate(searchOrigin, candidates, direction) {
  const sourceRect = searchOrigin.getBoundingClientRect();
  let closestCandidate;
  let minDistance = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    if (candidate !== searchOrigin) {
      const candidateRect = candidate.getBoundingClientRect();

      if (isValidForDirection(sourceRect, candidateRect, direction)) {
        let distance = getDistanceInDirection(
          sourceRect,
          candidateRect,
          direction
        );

        console.debug(
          'Distance from',
          searchOrigin.title,
          'to',
          candidate.title,
          'going',
          direction,
          'is',
          distance
        );

        if (distance < minDistance) {
          minDistance = distance;
          closestCandidate = candidate;
        }
      }
    }
  }

  return closestCandidate;
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
