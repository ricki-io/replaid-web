import assert from 'node:assert/strict';
import test from 'node:test';
import { CONSENT_KEY, CONSENT_DURATION, MEASUREMENT_ID, readConsent, initAnalyticsConsent } from './analytics-consent.mjs';

const today = Date.UTC(2026, 8, 14);
const saved = (analytics, expiresAt = today + CONSENT_DURATION) => JSON.stringify({ version: 1, analytics, expiresAt });
function fixture({ raw = null, enabled = true, storageBlocked = false } = {}) {
  let clock = today;
  const store = new Map(raw ? [[CONSENT_KEY, raw]] : []);
  const scripts = [], cookies = [], timers = new Map(), events = new Map();
  let nextTimer = 1;
  const control = value => ({ hidden: true, dataset: { analyticsChoice: value }, events: new Map(), addEventListener(type, fn) { this.events.set(type, fn); }, click() { this.events.get('click')(); }, focus() { this.focused = true; } });
  const reject = control('rejected'), accept = control('accepted'), settings = control();
  const status = { textContent: '' };
  const banner = { hidden: true, querySelector: () => reject };
  const doc = {
    querySelector: () => banner,
    querySelectorAll: selector => selector === '[data-cookie-status]' ? [status] : selector === '[data-analytics-choice]' ? [reject, accept] : [settings],
    createElement: tag => ({ tag }), head: { append: script => scripts.push(script) },
    set cookie(value) { cookies.push(value); },
  };
  const win = {
    location: { origin: 'https://replaid.pro', hostname: 'replaid.pro', pathname: '/contact', search: '?email=private@example.com', hash: '#private' },
    localStorage: {
      getItem(key) { if (storageBlocked) throw Error('blocked'); return store.get(key) ?? null; },
      setItem(key, value) { if (storageBlocked) throw Error('blocked'); store.set(key, value); },
      removeItem(key) { store.delete(key); },
    },
    setTimeout(fn, delay) { const id = nextTimer++; timers.set(id, { fn, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    addEventListener(type, fn) { events.set(type, fn); },
  };
  initAnalyticsConsent({ win, doc, enabled, now: () => clock });
  return { win, store, scripts, cookies, timers, events, status, banner, reject, accept, settings, advance(value) { clock += value; } };
}

test('only a valid, unexpired saved choice can enable analytics', () => {
  for (const raw of [null, '{}', '{', saved('accepted', today), saved('accepted', today - 1), saved('accepted', today + CONSENT_DURATION + 1), saved('yes'), JSON.stringify({ version: 0, analytics: 'accepted', expiresAt: today + 1 })]) {
    assert.equal(readConsent(raw, today), null);
    const view = fixture({ raw });
    assert.equal(view.scripts.length, 0);
    assert.equal(view.win.dataLayer, undefined);
    assert.equal(view.banner.hidden, false);
  }
});

test('rejecting analytics sends no analytics commands and survives navigation', () => {
  const view = fixture();
  view.reject.click();
  assert.equal(view.scripts.length, 0);
  assert.equal(view.win.dataLayer, undefined);
  assert.equal(view.win[`ga-disable-${MEASUREMENT_ID}`], true);
  assert.equal(view.banner.hidden, true);
  const next = fixture({ raw: view.store.get(CONSENT_KEY) });
  assert.equal(next.scripts.length, 0);
  assert.equal(next.banner.hidden, true);
});

test('explicit consent loads a single tag with no query or fragment in the page address', () => {
  const view = fixture();
  view.accept.click();
  view.accept.click();
  assert.equal(view.scripts.length, 1);
  assert.equal(view.scripts[0].src, `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`);
  const config = [...view.win.dataLayer.find(command => command[0] === 'config')][2];
  assert.equal(config.page_location, 'https://replaid.pro/contact');
  assert.equal(config.page_referrer, '');
  assert.equal(config.allow_google_signals, false);
  assert.equal(config.allow_ad_personalization_signals, false);
  assert.equal(config.cookie_expires, 180 * 24 * 60 * 60);
  assert.equal(fixture({ raw: view.store.get(CONSENT_KEY) }).scripts.length, 1);
});

test('withdrawing consent disables the active tag and removes only its analytics cookies', () => {
  const view = fixture({ raw: saved('accepted') });
  view.settings.click();
  assert.equal(view.banner.hidden, false);
  assert.equal(view.reject.focused, true);
  view.reject.click();
  assert.equal(view.win[`ga-disable-${MEASUREMENT_ID}`], true);
  assert.equal(view.settings.focused, true);
  assert.ok(view.cookies.length > 0);
  for (const cookie of view.cookies) assert.match(cookie, /^_ga(?:_T2C7LJY6CL)?=; Max-Age=0; Path=\//);
  assert.equal(fixture({ raw: view.store.get(CONSENT_KEY) }).scripts.length, 0);
});

test('a saved choice expiring on an open page disables analytics and asks again', () => {
  const view = fixture({ raw: saved('accepted', today + 1000) });
  view.advance(1001);
  [...view.timers.values()][0].fn();
  assert.equal(view.win[`ga-disable-${MEASUREMENT_ID}`], true);
  assert.equal(view.banner.hidden, false);
  assert.equal(view.store.has(CONSENT_KEY), false);
});

test('revocation in another tab is applied to an active page', () => {
  const view = fixture({ raw: saved('accepted') });
  view.store.set(CONSENT_KEY, saved('rejected'));
  view.events.get('storage')({ key: CONSENT_KEY });
  assert.equal(view.win[`ga-disable-${MEASUREMENT_ID}`], true);
  view.store.clear();
  view.events.get('storage')({ key: null });
  assert.equal(view.banner.hidden, false);
});

test('blocked browser storage starts safely and explains a page-only choice', () => {
  const view = fixture({ storageBlocked: true });
  assert.equal(view.scripts.length, 0);
  view.accept.click();
  assert.equal(view.scripts.length, 1);
  assert.match(view.status.textContent, /could not save/);
  view.reject.click();
  assert.equal(view.win[`ga-disable-${MEASUREMENT_ID}`], true);
});

test('local previews never load Google Analytics even after consent', () => {
  const view = fixture({ enabled: false, raw: saved('accepted') });
  view.accept.click();
  assert.equal(view.scripts.length, 0);
  assert.equal(view.win.dataLayer, undefined);
});
