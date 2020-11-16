const activeSelector = '[data-active]';
const containerSelector = '[data-container]';
const focusableSelector = '[data-focusable]';

const directionByKey = {
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
};

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
      return targetRect.bottom <= sourceRect.top;
    case 'down':
      return targetRect.top >= sourceRect.bottom;
    case 'left':
      return targetRect.right <= sourceRect.left;
    case 'right':
      return targetRect.left >= sourceRect.right;
  }
}

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

function findFocusable(container, searchOrigin, direction, preferActive) {
  const candidates = Array.from(container.querySelectorAll(focusableSelector));
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
      containerSelector
    );
    const containers = Array.from(
      closestContainerFromParent.querySelectorAll(containerSelector)
    );

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
      direction,
      true
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
      (candidate) => candidate.matches(activeSelector)
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

function handleKeyDown(event) {
  const direction = directionByKey[event.key];

  if (!direction) {
    return;
  }

  const searchOrigin = event.target;
  const container = searchOrigin.closest(containerSelector);

  if (!container) {
    return;
  }

  const focusable = findFocusable(container, searchOrigin, direction);

  if (focusable) {
    focusable.focus();
  }
}

document.addEventListener('keydown', handleKeyDown);
