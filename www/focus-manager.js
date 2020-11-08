let activeManager;

document.addEventListener(
  'keydown',
  (event) => {
    if (activeManager) {
      const { axis } = activeManager;
      const { key } = event;

      if (key.startsWith('Arrow')) {
        if (axis === 'vertical' && (key === 'ArrowUp' || key === 'ArrowDown')) {
          activeManager.selectActiveElement(key === 'ArrowDown' ? 1 : -1);
        } else if (key === 'ArrowRight' || key === 'ArrowLeft') {
          activeManager.selectActiveElement(key === 'ArrowRight' ? 1 : -1);
        }
      }
    }
  },
  true
);

export class FocusManager {
  /**
   * Constructor
   * @param { HTMLElement } target
   * @param { 'vertical' | 'horizontal' } axis
   * @param { () => Array<HTMLElement> } [childFilter]
   */
  constructor(target, axis, childFilter) {
    this.activeElement;
    this.axis = axis;
    this.childFilter =
      childFilter ||
      (() => {
        return Array.from(this.target.children);
      });
    this.target = target;
    this.target.tabIndex = 0;
    this.target.addEventListener('focus', this);

    if (document.activeElement === this.target) {
      this.selectActiveElement();
    }
  }

  handleEvent(event) {
    const { type } = event;

    if (type === 'focus') {
      activeManager = this;
      this.selectActiveElement();
    }

    super.handleEvent?.(event);
  }

  selectActiveElement(offset = 0) {
    const children = this.childFilter.call(this.target);
    let selected;

    for (let i = 0; i < children.length; i++) {
      const child = children[i];

      if (this.activeElement) {
        if (this.activeElement === child) {
          selected = children[i + offset];
        }
      } else {
        selected = child;
      }
      if (selected) {
        break;
      }
    }

    this.activeElement = selected;

    if (this.activeElement) {
      this.activeElement.focus();
    } else {
      console.warn('no active element found');
    }
  }

  deactivate() {}

  destroy() {
    this.target.removeEventListener('focus', this);
    this.target.tabIndex = -1;
    this.target = undefined;
    this.activeElement = undefined;
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
        this.focusChildFilter
      );
    }

    discconnectedCallback() {
      super.discconnectedCallback();
      this.focusManager.destroy();
      this.focusManager = undefined;
    }
  };
}
