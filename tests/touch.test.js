import test from 'node:test';
import assert from 'node:assert/strict';
import { bindTouch, joystickKeys } from '../src/application/touch.js';

const keys = (x, y) => [...joystickKeys(x, y)].sort();
test('joystick dead zone, diagonals, and normalized outer run ring', () => {
  assert.deepEqual(keys(0.22, 0), []);
  assert.deepEqual(keys(0.5, -0.5), ['ArrowRight', 'ArrowUp']);
  assert.deepEqual(keys(-0.8, 0), ['ArrowLeft', 'Space']);
  assert.deepEqual(keys(10, 10), ['ArrowDown', 'ArrowRight', 'Space']);
  assert.deepEqual(keys(NaN, 1), []);
});

class FakeTarget {
  constructor() { this.handlers = new Map(); this.style = {}; this.dataset = {}; const classes = new Set(); this.classList = { add: value => classes.add(value), remove: value => classes.delete(value), contains: value => classes.has(value) }; }
  addEventListener(type, fn) { if (!this.handlers.has(type)) this.handlers.set(type, new Set()); this.handlers.get(type).add(fn); }
  removeEventListener(type, fn) { this.handlers.get(type)?.delete(fn); }
  emit(type, values = {}) { const e = { preventDefault() {}, ...values }; for (const fn of this.handlers.get(type) || []) fn(e); }
  setPointerCapture() {}
}
function fixture() {
  const doc = new FakeTarget(), win = new FakeTarget(), joystick = new FakeTarget(), stick = new FakeTarget();
  const jump = new FakeTarget(), attack = new FakeTarget(), secondJump = new FakeTarget();
  jump.dataset.key = secondJump.dataset.key = 'KeyQ'; attack.dataset.key = 'KeyJ';
  doc.defaultView = win; joystick.querySelector = () => stick;
  joystick.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 });
  const root = { ownerDocument: doc, querySelector: () => joystick, querySelectorAll: () => [jump, attack, secondJump] };
  return { doc, win, joystick, stick, jump, attack, secondJump, root };
}
test('joystick and action pointers work together and release independently', () => {
  const f = fixture(), held = new Set(), pressed = new Set();
  const cleanup = bindTouch(f.root, held, pressed);
  f.joystick.emit('pointerdown', { pointerId: 1, clientX: 100, clientY: 50 });
  f.jump.emit('pointerdown', { pointerId: 2 });
  f.attack.emit('pointerdown', { pointerId: 3 });
  assert.deepEqual([...held].sort(), ['ArrowRight', 'KeyJ', 'KeyQ', 'Space']);
  f.joystick.emit('pointermove', { pointerId: 1, clientX: 50, clientY: 50 });
  assert.deepEqual([...held].sort(), ['KeyJ', 'KeyQ']);
  f.jump.emit('pointercancel', { pointerId: 2 });
  f.attack.emit('lostpointercapture', { pointerId: 3 });
  assert.equal(held.size, 0);
  assert.ok(pressed.has('KeyQ') && pressed.has('KeyJ'));
  cleanup();
});
test('shared action ownership and lifecycle resets', () => {
  const f = fixture(), held = new Set(), pressed = new Set();
  const cleanup = bindTouch(f.root, held, pressed);
  f.jump.emit('pointerdown', { pointerId: 1 });
  f.secondJump.emit('pointerdown', { pointerId: 2 });
  f.jump.emit('pointerup', { pointerId: 1 });
  assert.ok(held.has('KeyQ'));
  f.secondJump.emit('pointerup', { pointerId: 2 });
  assert.ok(!held.has('KeyQ'));
  f.joystick.emit('pointerdown', { pointerId: 3, clientX: 100, clientY: 50 });
  f.doc.hidden = true; f.doc.emit('visibilitychange');
  assert.equal(held.size, 0); assert.equal(pressed.size, 0); assert.equal(f.stick.style.transform, '');
  f.jump.emit('pointerdown', { pointerId: 4 }); f.win.emit('blur');
  assert.equal(held.size, 0); assert.equal(pressed.size, 0);
  cleanup(); f.jump.emit('pointerdown', { pointerId: 5 }); assert.equal(held.size, 0);
});

test('button feedback, disabled controls and explicit reset', () => {
  const f = fixture(), held = new Set(), pressed = new Set();
  const cleanup = bindTouch(f.root, held, pressed);
  f.jump.disabled = true; f.jump.emit('pointerdown', { pointerId: 1 });
  assert.equal(held.size, 0); assert.equal(f.jump.classList.contains('is-held'), false);
  f.jump.disabled = false; f.jump.emit('pointerdown', { pointerId: 1 });
  f.jump.emit('pointerdown', { pointerId: 2 });
  f.jump.emit('pointerup', { pointerId: 1 });
  assert.ok(f.jump.classList.contains('is-held'));
  cleanup.reset();
  assert.equal(f.jump.classList.contains('is-held'), false);
  assert.equal(held.size, 0); assert.equal(pressed.size, 0);
  cleanup();
});
