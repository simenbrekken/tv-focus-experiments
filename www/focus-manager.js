const AXIS_BY_DIRECTION = {
  up: 'vertical',
  down: 'vertical',
  left: 'horizontal',
  right: 'horizontal',
};
const DIRECTION_BY_KEY = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};
const OFFSET_BY_DIRECTION = {
  up: -1,
  down: 1,
  left: -1,
  right: 1,
};

/** @type { Map<HTMLElement, FocusManager> } */
const managersByTarget = new Map();
/** @type { FocusManager } */
let activeManager;

document.addEventListener('keydown', handleKeydownEvent, true);

function handleKeydownEvent(event) {
  if (activeManager) {
    const { key } = event;

    if (key.startsWith('Arrow')) {
      const direction = DIRECTION_BY_KEY[key];
      const axis = AXIS_BY_DIRECTION[direction];
      const offset = OFFSET_BY_DIRECTION[direction];

      if (activeManager.axis === axis) {
        activeManager.activeElementIndex += offset;
        activeManager.focusActiveElement();
      } else {
        // Find nearest parent manager that can handle direction
        let target = activeManager.target;

        while ((target = target.parentElement)) {
          const manager = managersByTarget.get(target);

          if (
            manager &&
            manager.axis === axis &&
            // Check if out of bounds
            manager.hasActiveElement(offset)
          ) {
            manager.activeElementIndex += offset;
            manager.target.focus();
            return;
          }
        }
      }
    }
  }
}

export class FocusManager {
  /**
   * Constructor
   *
   * @param { HTMLElement } target
   * @param { 'vertical' | 'horizontal' } [axis]
   * @param { string } [childSelector]
   */
  constructor(target, axis = 'vertical', childSelector = '*') {
    this.activeElementIndex = 0;
    this.axis = axis;
    this.childSelector = childSelector;
    this.target = target;
    this.target.tabIndex = 0;

    this.target.addEventListener('focus', this);

    managersByTarget.set(this.target, this);

    // Activate if current activeElement is the same as this target
    if (document.activeElement === this.target) {
      activeManager = this;
      this.focusActiveElement();
    }
  }

  /**
   * Return activeElement based on current focusable children and activeElementIndex
   *
   * @returns { HTMLElement | undefined }
   */
  get activeElement() {
    const children = this.getFocusableChildren();

    return children[this.activeElementIndex];
  }

  /**
   * Determine if we have an activeElement candidate based on current activeElementIndex and an "offset"
   *
   * @param { number } offset
   * @returns { boolean }
   */
  hasActiveElement(offset) {
    const index = this.activeElementIndex + offset;
    const children = this.getFocusableChildren();

    // TODO: allow for lazy loading/render
    return index >= 0 && index < children.length;
  }

  /**
   * Focus activeElement
   * Passing a "relatedTarget" will override current activeElementIndex to account for spacial positioning
   *
   * @param { HTMLElement } [relatedTarget]
   */
  focusActiveElement(relatedTarget) {
    if (this !== activeManager) {
      return;
    }

    let activeElement = this.activeElement;

    if (activeElement) {
      const activeElementManager = managersByTarget.get(activeElement);

      // If activeElement is also a FocusManager, activate and call focusActiveElement directly
      if (activeElementManager) {
        activeManager = activeElementManager;
        activeElementManager.focusActiveElement(relatedTarget);
      } else {
        if (relatedTarget) {
          const children = this.getFocusableChildren();
          let minDistance = Number.POSITIVE_INFINITY;
          let index = 0;

          for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const distance = distanceBetweenElements(
              child,
              relatedTarget,
              this.axis
            );

            if (distance < minDistance) {
              index = i;
              minDistance = distance;
            }
          }

          this.activeElementIndex = index;
          activeElement = this.activeElement;
        }

        activeElement.focus();
      }
    } else {
      console.warn('no active element found');
    }
  }

  /**
   * Retrieve target's children matching "childSelector"
   *
   * @returns { Array<HTMLElement> }
   */
  getFocusableChildren() {
    return Array.from(this.target.children).filter((child) =>
      child.matches(this.childSelector)
    );
  }

  handleEvent(event) {
    const { relatedTarget, type } = event;

    if (type === 'focus') {
      activeManager = this;
      this.focusActiveElement(relatedTarget);
    }

    super.handleEvent?.(event);
  }

  destroy() {
    managersByTarget.delete(this.target);
    this.target.removeEventListener('focus', this);
    this.target.tabIndex = -1;
    this.target = undefined;
  }
}

export function focusManagerMixin(BaseClass) {
  return class extends BaseClass {
    constructor() {
      super();
      this.focusManager;
    }

    connectedCallback() {
      super.connectedCallback?.();
      this.focusManager = new FocusManager(
        this,
        this.focusAxis,
        this.focusChildSelector
      );
    }

    discconnectedCallback() {
      super.discconnectedCallback?.();
      this.focusManager.destroy();
      this.focusManager = undefined;
    }
  };
}

function distanceBetweenElements(a, b, axis) {
  const aBounds = a.getBoundingClientRect();
  const bBounds = b.getBoundingClientRect();
  const bMid =
    axis === 'vertical'
      ? bBounds.y + bBounds.height / 2
      : bBounds.x + bBounds.width / 2;
  const aStart = axis === 'vertical' ? aBounds.y : aBounds.x;
  const aEnd =
    axis === 'vertical'
      ? aBounds.y + aBounds.height
      : aBounds.x + aBounds.width;

  return Math.min(Math.abs(aStart - bMid), Math.abs(aEnd - bMid));
}
