import { html, render } from 'lit-html';
import { focusManagerMixin } from './focus-manager.js';
import { ReactiveElement } from '@nrk/reactive-element';

export class PageOne extends focusManagerMixin(ReactiveElement) {
  static whenDefinedCallback() {
    customElements.define('page-one-section', PageOneSection);
  }

  constructor() {
    super();
    this.focusAxis = 'vertical';
    this.focusChildSelector = 'page-one-section';
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
      <page-one-section size="5"></page-one-section>
      <page-one-section size="3"></page-one-section>
      <page-one-section size="8"></page-one-section>
      <page-one-section size="2"></page-one-section>
      <page-one-section size="1"></page-one-section>
    `;
  }
}

class PageOneSection extends focusManagerMixin(ReactiveElement) {
  static get reactiveAttributes() {
    return {
      size: Number,
    };
  }

  constructor() {
    super();
    this.focusAxis = 'horizontal';
    this.size = 0;
  }

  connectedCallback() {
    super.connectedCallback();
  }

  updated() {
    render(this.render(), this);
  }

  render() {
    return html`
      ${[...new Array(this.size)].map(
        (_, idx) =>
          html`<a class="page-one-section__item" href="#${idx + 1}"
            >item ${idx + 1}</a
          >`
      )}
    `;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }
}
