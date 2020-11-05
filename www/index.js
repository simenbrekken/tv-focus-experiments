import { ReactiveElement } from '../node_modules/@nrk/reactive-element/index.mjs';
import { html, render } from '../node_modules/lit-html/lit-html.js';

class ChannelElement extends ReactiveElement {
  static get reactiveProperties() {
    return {
      channel: Object,
    };
  }

  updated() {
    render(this.render(), this);

    console.log(
      `ChannelsListElement ${this.channel.id} .channel count: ${
        this.querySelectorAll('.channel').length
      }`
    );
  }

  render() {
    return html`<div class="channel">${this.channel.name}</div>`;
  }
}

class ChannelsListElement extends ReactiveElement {
  static get reactiveProperties() {
    return {
      channels: Object,
    };
  }

  async updated() {
    render(this.render(), this);

    await Promise.resolve();

    console.log(
      `ChannelsListElement .channel count: ${
        this.querySelectorAll('.channel').length
      }`
    );
  }

  render() {
    return html`<div>
      <h2>Channel list</h2>
      <tv-scroll-container>
        ${this.channels.map(
          (channel) => html`<tv-channel .channel="${channel}"></tv-channel>`
        )}
      </tv-scroll-container>
    </div>`;
  }
}

class LivePageElement extends ReactiveElement {
  async updated() {
    render(this.render(), this);

    await Promise.resolve();

    console.log(
      `LivePageElement .channel count: ${
        this.querySelectorAll('.channel').length
      }`
    );
  }

  render() {
    const channels = [
      { id: 'nrk1', name: 'NRK1' },
      { id: 'nrk2', name: 'NRK2' },
      { id: 'nrk3', name: 'NRK3' },
    ];

    return html`<div>
      <h1>Live page</h1>
      <tv-channels-list .channels=${channels}></tv-channels-list>
    </div>`;
  }
}

customElements.define('tv-live-page', LivePageElement);
customElements.define('tv-channels-list', ChannelsListElement);
customElements.define('tv-channel', ChannelElement);
