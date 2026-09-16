import assert from 'node:assert/strict';
import test from 'node:test';
import { initBetaAccessForm, initBetaSelect } from './beta-access-form.mjs';

function fixture({ valid = true, channels = ['WhatsApp'], captcha = 'test-token', botcheck = '', respond = async () => ({ ok: true, json: async () => ({ success: true }) }) } = {}) {
  let handler;
  const requests = [];
  const attributes = new Map();
  const button = { disabled: false, textContent: 'Request beta access' };
  const status = { hidden: true, textContent: '', focus() { this.focused = true; } };
  const heading = { focus() { this.focused = true; } };
  const success = { hidden: true, querySelector: () => heading };
  const form = {
    action: 'https://api.web3forms.com/submit', hidden: false, resets: 0,
    querySelector: () => button, reportValidity: () => valid,
    addEventListener(type, fn) { handler = fn; },
    setAttribute(key, value) { attributes.set(key, value); },
    removeAttribute(key) { attributes.delete(key); },
    reset() { this.resets++; },
  };
  let captchaResets = 0;
  initBetaAccessForm({
    form, status, success,
    readForm: () => {
      const data = new FormData();
      for (const [key, value] of [['email', 'beta@example.com'], ['message', 'Draft customer support replies.'], ['agent', 'Claude'], ['access_key', 'test-key'], ['h-captcha-response', captcha], ['botcheck', botcheck], ['redirect', 'https://replaid.pro/beta/?success=true']]) data.append(key, value);
      for (const channel of channels) data.append('channel', channel);
      return data;
    },
    send: async (url, options) => { requests.push({ url, ...options }); return respond(); },
    resetCaptcha: () => { captchaResets++; },
  });
  return { form, button, status, success, heading, requests, attributes, submit: () => handler({ preventDefault() {} }), captchaResets: () => captchaResets };
}

test('beta requests require valid fields and a completed spam check', async () => {
  const invalid = fixture({ valid: false });
  await invalid.submit();
  assert.equal(invalid.requests.length, 0);
  const noCaptcha = fixture({ captcha: '' });
  await noCaptcha.submit();
  assert.equal(noCaptcha.requests.length, 0);
  assert.match(noCaptcha.status.textContent, /Complete the spam check/);
  assert.equal(noCaptcha.status.focused, true);
  const bot = fixture({ botcheck: 'on' });
  await bot.submit();
  assert.equal(bot.requests.length, 0);
});

test('beta requests send the use case and show success only after acceptance', async () => {
  const view = fixture();
  await view.submit();
  assert.equal(view.requests.length, 1);
  assert.equal(view.requests[0].url, 'https://api.web3forms.com/submit');
  const data = JSON.parse(view.requests[0].body);
  assert.equal(data.email, 'beta@example.com');
  assert.equal(data.message, 'Draft customer support replies.');
  assert.equal(data.channel, 'WhatsApp');
  assert.equal(data.agent, 'Claude');
  assert.equal(data['h-captcha-response'], 'test-token');
  assert.equal(data.redirect, undefined);
  assert.equal(view.form.hidden, true);
  assert.equal(view.success.hidden, false);
  assert.equal(view.heading.focused, true);
  assert.equal(view.form.resets, 1);
});

test('beta requests cannot be submitted twice while a response is pending', async () => {
  let finish;
  const view = fixture({ respond: () => new Promise(resolve => { finish = resolve; }) });
  const pending = view.submit();
  assert.equal(view.button.disabled, true);
  assert.equal(view.attributes.get('aria-busy'), 'true');
  await view.submit();
  assert.equal(view.requests.length, 1);
  finish({ ok: true, json: async () => ({ success: true }) });
  await pending;
  assert.equal(view.button.disabled, false);
  assert.equal(view.attributes.has('aria-busy'), false);
});

test('failed beta requests keep the form and its answers available for retry', async () => {
  for (const respond of [
    async () => ({ ok: false, json: async () => ({ success: false }) }),
    async () => ({ ok: true, json: async () => ({ success: false }) }),
    async () => ({ ok: true, json: async () => { throw new Error('Invalid response'); } }),
    async () => { throw new Error('Network unavailable'); },
  ]) {
    const view = fixture({ respond });
    await view.submit();
    assert.equal(view.form.hidden, false);
    assert.equal(view.success.hidden, true);
    assert.equal(view.form.resets, 0);
    assert.equal(view.status.hidden, false);
    assert.match(view.status.textContent, /could not confirm your request/);
    assert.equal(view.button.disabled, false);
    assert.equal(view.button.textContent, 'Request beta access');
    assert.equal(view.captchaResets(), 1);
  }
});


test('beta requests include every selected channel', async () => {
  const view = fixture({ channels: ['WhatsApp', 'Instagram', 'Telegram'] });
  await view.submit();
  assert.equal(view.requests.length, 1);
  assert.equal(JSON.parse(view.requests[0].body).channel, 'WhatsApp, Instagram, Telegram');
});

test('beta requests require at least one channel', async () => {
  const view = fixture({ channels: [] });
  await view.submit();
  assert.equal(view.requests.length, 0);
  assert.equal(view.form.hidden, false);
  assert.equal(view.form.resets, 0);
  assert.equal(view.status.hidden, false);
  assert.equal(view.status.focused, true);
  assert.match(view.status.textContent, /Select at least one channel/);
});


function channelSelectFixture(options) {
  const handlers = new Map();
  const documentHandlers = new Map();
  const label = { textContent: '' };
  const summary = { focus() { this.focused = true; } };
  const choices = ['WhatsApp', 'Instagram', 'Telegram'].map(value => ({ value, checked: false }));
  const details = {
    open: false,
    querySelector: selector => selector === 'summary' ? summary : label,
    querySelectorAll: () => choices.filter(choice => choice.checked),
    contains: element => element === summary || choices.includes(element),
    addEventListener: (event, handler) => handlers.set(event, handler),
    ownerDocument: { addEventListener: (event, handler) => documentHandlers.set(event, handler) },
  };
  initBetaSelect(details, options);
  return { details, label, summary, choices, change: () => handlers.get('change')(), click: (target, detail = 1) => handlers.get('click')({ target, detail }), keydown: event => handlers.get('keydown')(event), focusout: target => handlers.get('focusout')({ relatedTarget: target }), pointerdown: target => documentHandlers.get('pointerdown')({ target }) };
}

test('the compact channel selector shows its current selections', () => {
  const view = channelSelectFixture();
  assert.equal(view.label.textContent, 'Choose channels');
  view.choices[0].checked = true;
  view.change();
  assert.equal(view.label.textContent, 'WhatsApp');
  view.choices[1].checked = true;
  view.change();
  assert.equal(view.label.textContent, 'WhatsApp, Instagram');
  assert.equal(view.summary.title, 'WhatsApp, Instagram');
  for (const choice of view.choices) choice.checked = false;
  view.change();
  assert.equal(view.label.textContent, 'Choose channels');
});

test('the channel dropdown keeps selections when dismissed with Escape or outside interaction', () => {
  const view = channelSelectFixture();
  view.choices[0].checked = true;
  view.details.open = true;
  view.pointerdown(view.choices[0]);
  view.focusout(view.choices[1]);
  view.focusout(null);
  assert.equal(view.details.open, true);
  view.keydown({ key: 'Escape', preventDefault() {} });
  assert.equal(view.details.open, false);
  assert.equal(view.summary.focused, true);
  assert.equal(view.choices[0].checked, true);
  view.details.open = true;
  view.pointerdown({});
  assert.equal(view.details.open, false);
  view.details.open = true;
  view.focusout({});
  assert.equal(view.details.open, false);
});


test('the agent selector closes on a choice and can return to its empty optional value', () => {
  const view = channelSelectFixture({ placeholder: 'Choose an agent', closeOnSelect: true });
  view.choices[0].value = 'Claude';
  view.choices[1].value = '';
  assert.equal(view.label.textContent, 'Choose an agent');
  view.details.open = true;
  view.choices[0].checked = true;
  view.click({ type: 'radio' });
  assert.equal(view.label.textContent, 'Claude');
  assert.equal(view.details.open, false);
  assert.equal(view.summary.focused, true);
  view.details.open = true;
  view.choices[0].checked = false;
  view.choices[1].checked = true;
  view.click({ type: 'radio' });
  assert.equal(view.label.textContent, 'Choose an agent');
  assert.equal(view.details.open, false);
});

test('keyboard selection stays open for arrow navigation and closes with Enter', () => {
  const view = channelSelectFixture({ placeholder: 'Choose an agent', closeOnSelect: true });
  view.details.open = true;
  view.choices[0].checked = true;
  view.change();
  view.click({ type: 'radio' }, 0);
  assert.equal(view.details.open, true);
  let prevented = false;
  view.keydown({ key: 'Enter', target: { type: 'radio' }, preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(view.details.open, false);
  assert.equal(view.summary.focused, true);
});
