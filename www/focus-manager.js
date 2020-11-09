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
        let target = activeManager.target;

        while ((target = target.parentElement)) {
          const manager = managersByTarget.get(target);

          if (manager && manager.axis === axis) {
            manager.activeElementIndex += offset;
            target.focus();
          }
        }
      }
    }
  }
}

export class FocusManager {
  /**
   * Constructor
   * @param { HTMLElement } target
   * @param { 'vertical' | 'horizontal' } axis
   * @param { string } [childSelector]
   */
  constructor(target, axis, childSelector = '*') {
    this.axis = axis;
    this.childSelector = childSelector;
    this.target = target;
    this.target.tabIndex = 0;

    this._activeElementIndex = 0;

    this.target.addEventListener('focus', this);

    managersByTarget.set(this.target, this);

    if (document.activeElement === this.target) {
      this.focusActiveElement();
    }
  }

  get activeElementIndex() {
    return this._activeElementIndex;
  }

  set activeElementIndex(value) {
    const children = this.getFocusableChildren();

    this._activeElementIndex = Math.max(
      0,
      Math.min(value, children.length - 1)
    );
  }

  focusActiveElement(offset = 0) {
    const children = this.getFocusableChildren();
    const index = this.activeElementIndex + offset;
    const activeElement = children[index];

    if (activeElement) {
      this.activeElementIndex = index;
      activeElement.focus();
    } else {
      console.warn('no active element found');
    }
  }

  getFocusableChildren() {
    return Array.from(this.target.children).filter((child) =>
      child.matches(this.childSelector)
    );
  }

  handleEvent(event) {
    const { type } = event;

    if (type === 'focus') {
      activeManager = this;
      this.focusActiveElement();
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
      super.connectedCallback();
      this.focusManager = new FocusManager(
        this,
        this.focusAxis || 'vertical',
        this.focusChildSelector
      );
    }

    discconnectedCallback() {
      super.discconnectedCallback();
      this.focusManager.destroy();
      this.focusManager = undefined;
    }
  };
}
