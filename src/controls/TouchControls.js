export function bindTouchControls(api) {
  const base = document.getElementById('joystick');
  const knob = document.getElementById('joystick-knob');
  if (!base || !knob) return () => {};
  let pointerId = null;
  let active = false;
  let origin = { x: 0, y: 0 };
  let current = { x: 0, y: 0 };

  const report = () => api.setMovement({ x: current.x, y: current.y });
  const center = () => {
    const rect = base.getBoundingClientRect();
    origin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 - 8 };
  };
  const moveKnob = (x, y) => {
    const max = 27;
    const length = Math.hypot(x, y);
    const multiplier = length > max ? max / length : 1;
    const dx = x * multiplier;
    const dy = y * multiplier;
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    const magnitude = Math.min(1, Math.hypot(dx, dy) / max);
    if (Math.hypot(dx, dy) < 6) current = { x: 0, y: 0 };
    else current = { x: (dx / max) * Math.max(0.55, magnitude), y: (dy / max) * Math.max(0.55, magnitude) };
    report();
  };
  const start = (event) => {
    if (event.pointerType === 'mouse' && window.matchMedia('(pointer: fine)').matches) return;
    event.preventDefault();
    center();
    pointerId = event.pointerId;
    active = true;
    base.setPointerCapture?.(pointerId);
    base.classList.add('is-active');
    moveKnob(event.clientX - origin.x, event.clientY - origin.y);
  };
  const move = (event) => {
    if (!active || event.pointerId !== pointerId) return;
    event.preventDefault();
    moveKnob(event.clientX - origin.x, event.clientY - origin.y);
  };
  const end = (event) => {
    if (!active || (event?.pointerId != null && event.pointerId !== pointerId)) return;
    active = false;
    pointerId = null;
    current = { x: 0, y: 0 };
    knob.style.transform = 'translate(-50%, -50%)';
    base.classList.remove('is-active');
    report();
  };
  base.addEventListener('pointerdown', start, { passive: false });
  window.addEventListener('pointermove', move, { passive: false });
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);
  window.addEventListener('blur', end);
  return () => {
    base.removeEventListener('pointerdown', start);
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', end);
    window.removeEventListener('pointercancel', end);
    window.removeEventListener('blur', end);
  };
}
