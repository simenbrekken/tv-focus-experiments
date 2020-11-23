// @ts-check
import {
  getSpatialNavigationCandidate,
  getSpatialNavigationDirectionFromEvent,
  FOCUSABLE_SELECTOR,
} from './spatial-navigation.js';

document.addEventListener('click', handleClick);
document.addEventListener('focusin', handleFocusIn);
document.addEventListener('keydown', (event) => {
  const direction = getSpatialNavigationDirectionFromEvent(event);

  if (direction) {
    event.preventDefault();
    getSpatialNavigationCandidate(
      /** @type {HTMLElement}*/ (event.target),
      direction
    )?.focus();
  }
});

function handleFocusIn(event) {
  const subtitlesMenu = /** @type {HTMLElement}*/ (document.querySelector(
    '[data-subtitles-menu]'
  ));

  if (subtitlesMenu) {
    subtitlesMenu.hidden = event.target.closest('[data-subtitles]') === null;
  }
}

/**
 * @param {MouseEvent} event
 */
function handleClick(event) {
  const searchOrigin = /** @type {HTMLElement}*/ (event.target);

  if (searchOrigin.matches(FOCUSABLE_SELECTOR)) {
    event.preventDefault();

    searchOrigin.focus();
  }
}
