import { html, render } from 'lit-html';
import { FocusManager } from './focus-manager.js';
import { ReactiveElement } from '@nrk/reactive-element';

export class PageOne extends ReactiveElement {
  static whenDefinedCallback() {
    customElements.define('page-one-section', PageOneSection);
  }

  get updateComplete() {
    return new Promise((resolve) => {
      this.updatePromise.then(() => {
        const sections = Array.from(this.querySelectorAll('page-one-section'));
        resolve(Promise.all(sections.map((el) => el.updateComplete)));
      });
    });
  }

  updated() {
    render(this.render(), this);
  }

  render() {
    return html`
      <style>
        page-one-section {
          display: flex;
          justify-content: space-evenly;
          margin: 2rem;
        }
      </style>
      <h1>Page One</h1>
      <page-one-section size="5" data-focusable-element></page-one-section>
      <page-one-section size="3" data-focusable-element></page-one-section>
      <page-one-section size="8" data-focusable-element></page-one-section>
      <page-one-section size="2" data-focusable-element></page-one-section>
      <page-one-section size="1" data-focusable-element></page-one-section>
    `;
  }
}

class PageOneSection extends ReactiveElement {
  static get reactiveAttributes() {
    return {
      size: Number,
    };
  }

  constructor() {
    super();
    this.size = 0;
    this.focusManager;
  }

  connectedCallback() {
    super.connectedCallback();
    this.focusManager = new FocusManager(this);
  }

  focus() {
    this.focusManager.activate();
  }

  blur() {
    this.focusManager.deactivate();
  }

  updated() {
    render(this.render(), this);
  }

  render() {
    return html`
      <style></style>
      ${[...new Array(this.size)].map(
        (_, idx) =>
          html`<a
            class="page-one-section__item"
            href="#${idx + 1}"
            data-focusable-element
            >item ${idx + 1}</a
          >`
      )}
    `;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.focusManager.deactivate();
  }
}
