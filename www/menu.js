import { html, render } from 'lit-html';
import { focusManagerMixin } from './focus-manager.js';

export class Menu extends focusManagerMixin(HTMLElement) {
  constructor() {
    super();
    this.focusAxis = 'horizontal';
    this.focusChildSelector = 'a';

    this.innerHtml = render(
      html`
        <style>
          m-enu {
            display: flex;
            justify-content: space-evenly;
            margin: 2rem;
          }
        </style>
        <a href="/page-one">page one</a>
        <a href="/page-two">page two</a>
        <a href="/page-three">page three</a>
      `,
      this
    );
  }
}
