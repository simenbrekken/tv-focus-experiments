const activeSelector = '[data-active]';
const containerSelector = '[data-container]';
const focusableSelector = '[data-focusable]';

const verticalOrthogonalWeight = 30;
const horizontalOrthogonalWeight = 2;

const directionByKey = {
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
};

function getCenterPoint(rect) {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

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

function isValidForDirection(targetRect, sourceRect, direction) {
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

      if (isValidForDirection(candidateRect, sourceRect, direction)) {
        let distance = getDistanceInDirection(
          candidateRect,
          sourceRect,
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
        candidate.getBoundingClientRect(),
        searchOriginRect,
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
          candidate.getBoundingClientRect(),
          containerRect,
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
