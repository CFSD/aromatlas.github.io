
// ------------------------------------------------------------
// Note / X — Enhancer
// - Wraps existing inputs in #scoreControls and shows a '/max' suffix
// - Adds a small progress meter and tidy arrow/wheel stepping
// - Also exports createNoteBox(container, options) for a global /10 field
// ------------------------------------------------------------
(function () {
  function clamp(val, min, max) { return Math.min(max, Math.max(min, val)); }
  function stepOf(input) {
    const s = parseFloat(input.step);
    return isNaN(s) || s <= 0 ? 1 : s;
  }
  function format(input, val) {
    const s = stepOf(input);
    const decimals = (s < 1) ? (String(s).split('.')[1] || '').length : 0;
    return Number(val).toFixed(decimals);
  }

  function enhanceNumberInput(input, compact=true) {
    if (!input || input.dataset.xOutOf) return;
    const max = parseFloat(input.max) || 10;

    // Wrapper
    const wrap = document.createElement('div');
    wrap.className = 'x-out-of' + (compact ? ' x-out-of--compact' : '');
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Champ de note');
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);

    // Suffix
    const suffix = document.createElement('span');
    suffix.className = 'x-out-of__suffix';
    suffix.textContent = '/' + max;
    wrap.appendChild(suffix);

    // Meter
    const meter = document.createElement('div');
    meter.className = 'x-out-of__meter';
    const fill = document.createElement('i');
    meter.appendChild(fill);
    wrap.appendChild(meter);

    function update() {
      const raw = parseFloat(input.value);
      const clamped = isNaN(raw) ? 0 : clamp(raw, 0, max);
      if (clamped !== raw) input.value = format(input, clamped);
      const pct = (clamped / max) * 100;
      fill.style.width = pct + '%';
      wrap.setAttribute('aria-valuenow', String(clamped));
      wrap.setAttribute('aria-valuemax', String(max));
    }

    // Wheel step
    wrap.addEventListener('wheel', (e) => {
      if (document.activeElement !== input) return;
      e.preventDefault();
      const dir = e.deltaY < 0 ? 1 : -1;
      const s = stepOf(input);
      const next = clamp((parseFloat(input.value) || 0) + dir * s, 0, max);
      input.value = format(input, next);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      update();
    }, { passive: false });

    // Up/Down arrows
    input.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();
      const dir = e.key === 'ArrowUp' ? 1 : -1;
      const s = stepOf(input);
      const next = clamp((parseFloat(input.value) || 0) + dir * s, 0, max);
      input.value = format(input, next);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      update();
    });

    input.addEventListener('input', update);
    input.dataset.xOutOf = '1';
    update();
  }

  // Enhance #scoreControls numeric inputs once DOM is ready
  function enhanceAll() {
    const grid = document.getElementById('scoreControls');
    if (!grid) return;
    grid.querySelectorAll('input[type="number"]').forEach((inp) => enhanceNumberInput(inp, true));
  }

  // Public API for a large single note box
  window.createNoteBox = function(container, opts) {
    const max = (opts && opts.max) || 10;
    const step = (opts && opts.step) || 0.1;
    const placeholder = (opts && opts.placeholder) || 'Tape ta note…';

    const box = document.createElement('div');
    box.className = 'note-box';

    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'note-input';
    input.placeholder = placeholder;
    input.min = 0; input.max = max; input.step = step;

    const slash = document.createElement('div');
    slash.className = 'note-divider';
    slash.textContent = '/';

    const maxEl = document.createElement('div');
    maxEl.className = 'note-max';
    maxEl.textContent = max;

    box.appendChild(input); box.appendChild(slash); box.appendChild(maxEl);
    container.appendChild(box);

    // Basic clamp/format
    function onInput() {
      let v = parseFloat(input.value);
      if (isNaN(v)) v = 0;
      v = Math.min(max, Math.max(0, v));
      const decimals = (step < 1) ? String(step).split('.')[1]?.length || 1 : 0;
      input.value = v.toFixed(decimals);
    }
    input.addEventListener('change', onInput);
    input.addEventListener('blur', onInput);

    return { input, box };
  };

  // Try enhancing after DOMContentLoaded; if the grid is built later by main.js
  // we also observe mutations for late-added inputs.
  document.addEventListener('DOMContentLoaded', () => {
    enhanceAll();
    const grid = document.getElementById('scoreControls');
    if (!grid || !('MutationObserver' in window)) return;
    const mo = new MutationObserver(() => enhanceAll());
    mo.observe(grid, { childList: true, subtree: true });
  });
})();
