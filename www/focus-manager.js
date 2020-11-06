export class FocusManager {
  constructor(target) {
    this.target = target;
  }

  activate() {
    const focusableElements = this.target.querySelectorAll(
      '[data-focusable-element]'
    );
    console.log(focusableElements);
  }

  deactivate() {}
}
