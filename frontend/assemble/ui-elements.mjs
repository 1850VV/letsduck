// Plain-HTML stand-ins for the Ryugi components the assembly prototype was designed with. Same tags, attributes,
// .value/.checked and `ryugi-change` events, so a newer prototype drops in without edits. Load before prototype-v3.mjs.
const ICONS = {
  play: '<path d="M5 3.2v9.6L12.6 8z"/>',
  pause: '<path d="M4.3 3h2.6v10H4.3zM9.1 3h2.6v10H9.1z"/>',
  refresh: '<path d="M13 8a5 5 0 1 1-1.5-3.6M13 2.6v2.8h-2.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  x: '<path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
};
const icon = (name) => ICONS[name] ? `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">${ICONS[name]}</svg>` : '';
const changed = (host, value) => host.dispatchEvent(new CustomEvent('ryugi-change', { bubbles: true, detail: { value } }));
// The accessible name belongs on the native control inside.
const label = (host, control) => {for (const name of ['aria-label', 'title']) if (host.hasAttribute(name)) control.setAttribute(name, host.getAttribute(name));};

class RyugiButton extends HTMLElement {
  static observedAttributes = ['disabled'];
  connectedCallback() {
    if (this.button) return;
    const button = this.button = document.createElement('button');
    button.type = 'button';button.innerHTML = icon(this.getAttribute('icon'));button.append(...this.childNodes);
    label(this, button);this.append(button);this.attributeChangedCallback();
  }
  attributeChangedCallback() {if (this.button) this.button.disabled = this.hasAttribute('disabled');}
}

class RyugiActionIcon extends RyugiButton {
  connectedCallback() {if (!this.hasAttribute('icon')) this.setAttribute('icon', 'x');super.connectedCallback();}
}

class RyugiSelect extends HTMLElement {
  static observedAttributes = ['value', 'disabled'];
  connectedCallback() {
    if (this.select) return;
    const select = this.select = document.createElement('select');
    for (const option of this.querySelectorAll('ryugi-option')) select.add(new Option(option.textContent.trim(), option.getAttribute('value')));
    label(this, select);this.replaceChildren(select);
    if (this.hasAttribute('value')) select.value = this.getAttribute('value');
    select.addEventListener('change', () => {this.setAttribute('value', select.value);changed(this, select.value);});
    this.attributeChangedCallback();
  }
  // Setting the value from script moves the selection without announcing a change, like the original.
  attributeChangedCallback() {
    if (!this.select) return;
    const value = this.getAttribute('value');if (value !== null && this.select.value !== value) this.select.value = value;
    this.select.disabled = this.hasAttribute('disabled');
  }
  get value() {return this.select ? this.select.value : this.getAttribute('value');}
  set value(value) {this.setAttribute('value', value);}
}

class RyugiSlider extends HTMLElement {
  static observedAttributes = ['value'];
  connectedCallback() {
    if (this.input) return;
    const input = this.input = document.createElement('input');input.type = 'range';
    for (const name of ['min', 'max', 'step']) if (this.hasAttribute(name)) input.setAttribute(name, this.getAttribute(name));
    label(this, input);this.append(input);
    input.addEventListener('input', () => {this.paint();changed(this, Number(input.value));});
    this.attributeChangedCallback();
  }
  attributeChangedCallback() {
    if (!this.input) return;
    const value = this.getAttribute('value');if (value !== null && this.input.value !== value) this.input.value = value;
    this.paint();
  }
  paint() {const { min, max, value } = this.input;this.input.style.setProperty('--fill', (value - min) / (max - min || 1) * 100 + '%');}
  get value() {return this.input ? Number(this.input.value) : Number(this.getAttribute('value'));}
  set value(value) {this.setAttribute('value', value);}
}

class RyugiSwitch extends HTMLElement {
  connectedCallback() {
    if (this.input) return;
    const input = this.input = document.createElement('input');
    input.type = 'checkbox';input.setAttribute('role', 'switch');input.checked = this.hasAttribute('checked');
    label(this, input);this.append(input);
    input.addEventListener('change', () => {this.toggleAttribute('checked', input.checked);changed(this, input.checked);});
  }
  get checked() {return this.input ? this.input.checked : this.hasAttribute('checked');}
  set checked(on) {this.toggleAttribute('checked', !!on);if (this.input) this.input.checked = !!on;}
}

customElements.define('ryugi-button', RyugiButton);
customElements.define('ryugi-action-icon', RyugiActionIcon);
customElements.define('ryugi-select', RyugiSelect);
customElements.define('ryugi-option', class extends HTMLElement {});
customElements.define('ryugi-slider', RyugiSlider);
customElements.define('ryugi-switch', RyugiSwitch);
document.dispatchEvent(new Event('ryugi-ui:ready'));
