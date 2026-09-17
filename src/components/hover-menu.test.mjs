import assert from 'node:assert/strict';
import test from 'node:test';
import { initHoverMenu } from './hover-menu.mjs';

function fixture({ canHover = true } = {}) {
  const handlers = new Map();
  let click;
  const summary = { addEventListener: (_, handler) => { click = handler; } };
  const document = { activeElement: null };
  const menu = {
    open: false, ownerDocument: document,
    contains: element => element === summary,
    querySelector: () => summary,
    addEventListener: (name, handler) => handlers.set(name, handler),
  };
  initHoverMenu(menu, () => canHover);
  return { menu, summary, document, fire: (name, event = {}) => handlers.get(name)(event), click: event => click(event) };
}

test('a mouse opens the menu without a click and closes it on exit', () => {
  const view = fixture();
  view.fire('pointerenter', { pointerType: 'mouse' });
  assert.equal(view.menu.open, true);
  let prevented = false;
  view.fire('pointerdown', { pointerType: 'mouse' });
  view.click({ detail: 1, preventDefault() { prevented = true; } });
  assert.equal(prevented, true, 'Clicking after hover must not toggle the menu shut');
  view.document.activeElement = view.summary;
  view.fire('pointerleave', { pointerType: 'mouse' });
  assert.equal(view.menu.open, false, 'Mouse focus must not keep the menu open after exit');
});

test('moving the mouse away does not close a menu in keyboard use', () => {
  const view = fixture();
  view.fire('pointerenter', { pointerType: 'mouse' });
  view.document.activeElement = view.summary;
  view.fire('keydown', { key: 'Tab' });
  view.fire('pointerleave', { pointerType: 'mouse' });
  assert.equal(view.menu.open, true);
  view.click({ detail: 0, preventDefault() { assert.fail('Keyboard activation must retain native details behavior'); } });
  view.document.activeElement = null;
  view.fire('pointerleave', { pointerType: 'mouse' });
  assert.equal(view.menu.open, false);
});

test('touch and devices without hover retain native click behavior', () => {
  for (const [canHover, pointerType] of [[false, 'mouse'], [true, 'touch']]) {
    const view = fixture({ canHover });
    view.fire('pointerenter', { pointerType });
    assert.equal(view.menu.open, false);
    view.fire('pointerdown', { pointerType });
    view.click({ detail: 1, preventDefault() { assert.fail('Touch activation must not be intercepted'); } });
  }
});
