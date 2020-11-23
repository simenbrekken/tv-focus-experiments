// @ts-check
import {
  enableSpatialNavigation,
  FOCUSABLE_SELECTOR,
} from './spatial-navigation.js';

document.addEventListener('click', handleClick);
document.addEventListener('focusin', handleFocusIn);

enableSpatialNavigation();

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
