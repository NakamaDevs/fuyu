// Coordinates are relative to the joystick radius, with positive y pointing down.
export function joystickKeys(x, y) {
  const distance = Math.hypot(x, y);
  const keys = new Set();
  if (!Number.isFinite(distance) || distance <= 0.22) return keys;
  // Clamp before evaluating the axes so points outside the circle behave like
  // points on its edge, including their direction.
  const scale = Math.max(1, distance);
  x /= scale;
  y /= scale;
  if (x < -0.22) keys.add('ArrowLeft');
  if (x > 0.22) keys.add('ArrowRight');
  if (y < -0.22) keys.add('ArrowUp');
  if (y > 0.22) keys.add('ArrowDown');
  if (distance >= 0.8) keys.add('Space');
  return keys;
}

export function bindTouch(root, held, pressed) {
  const joystick = root.querySelector('#joystick');
  const stick = joystick?.querySelector('.stick');
  const buttons = [...root.querySelectorAll('[data-key]')];
  const doc = root.ownerDocument || root;
  const win = doc.defaultView || globalThis.window;
  const listeners = [];
  const owners = new Map();
  const pointerButtons = new Map();
  let joystickPointer = null;
  let joystickHeld = new Set();

  function on(target, type, fn) {
    if (!target) return;
    target.addEventListener(type, fn);
    listeners.push(() => target.removeEventListener(type, fn));
  }
  function setOwner(owner, keys) {
    const previous = owners.get(owner) || new Set();
    for (const key of previous) {
      if (!keys.has(key) && ![...owners].some(([other, values]) => other !== owner && values.has(key))) held.delete(key);
    }
    for (const key of keys) {
      if (!previous.has(key)) {
        if (![...owners.values()].some(values => values.has(key))) pressed.add(key);
        held.add(key);
      }
    }
    if (keys.size) owners.set(owner, keys); else owners.delete(owner);
  }
  function updateJoystick(event) {
    const rect = joystick.getBoundingClientRect();
    const radius = Math.min(rect.width, rect.height) / 2;
    if (!radius) return;
    const x = (event.clientX - (rect.left + rect.width / 2)) / radius;
    const y = (event.clientY - (rect.top + rect.height / 2)) / radius;
    const scale = Math.max(1, Math.hypot(x, y));
    if (stick) stick.style.transform = `translate(${x / scale * radius}px, ${y / scale * radius}px)`;
    joystickHeld = joystickKeys(x, y);
    setOwner('joystick', joystickHeld);
  }
  function endJoystick(event) {
    if (event.pointerId !== joystickPointer) return;
    joystickPointer = null;
    joystickHeld = new Set();
    setOwner('joystick', joystickHeld);
    if (stick) stick.style.transform = '';
  }
  on(joystick, 'pointerdown', event => {
    if (joystickPointer !== null) return;
    event.preventDefault();
    joystickPointer = event.pointerId;
    joystick.setPointerCapture(event.pointerId);
    updateJoystick(event);
  });
  on(joystick, 'pointermove', event => {
    if (event.pointerId === joystickPointer) { event.preventDefault(); updateJoystick(event); }
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) on(joystick, type, endJoystick);
  for (const button of buttons) {
    on(button, 'pointerdown', event => {
      if (button.disabled || pointerButtons.has(event.pointerId)) return;
      event.preventDefault();
      pointerButtons.set(event.pointerId, button);
      button.classList.add('is-held');
      button.setPointerCapture(event.pointerId);
      setOwner(event.pointerId, new Set([button.dataset.key]));
    });
    const end = event => {
      if (pointerButtons.get(event.pointerId) !== button) return;
      pointerButtons.delete(event.pointerId);
      if (![...pointerButtons.values()].includes(button)) button.classList.remove('is-held');
      setOwner(event.pointerId, new Set());
    };
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) on(button, type, end);
  }
  function reset() {
    for (const keys of owners.values()) for (const key of keys) held.delete(key);
    owners.clear();
    pointerButtons.clear();
    for (const button of buttons) button.classList.remove('is-held');
    joystickPointer = null;
    joystickHeld = new Set();
    if (stick) stick.style.transform = '';
    pressed.clear();
  }
  on(win, 'blur', reset);
  on(doc, 'visibilitychange', () => { if (doc.hidden) reset(); });
  const cleanup = () => { reset(); for (const off of listeners) off(); };
  cleanup.reset = reset;
  return cleanup;
}
