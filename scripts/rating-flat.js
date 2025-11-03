
// rating-flat — turn existing numeric inputs into pretty '/max' widgets
(function() {
  function clamp(n, min, max){ return Math.min(max, Math.max(min, n)); }
  function decimals(step){
    const s = parseFloat(step);
    if (isNaN(s) || s >= 1) return 0;
    const p = String(s).split('.')[1];
    return p ? p.length : 1;
  }
  function enhance(input){
    if (!input || input.dataset.ratingFlat) return;
    const max = parseFloat(input.max) || 10;
    const step = parseFloat(input.step) || 1;

    // wrapper
    const wrap = document.createElement('div');
    wrap.className = 'score-flat';
    wrap.dataset.max = String(max);
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);

    // tag input for styling
    input.classList.add('score-flat__input');
    input.dataset.ratingFlat = '1';
    input.inputMode = 'decimal';

    // suffix
    const sfx = document.createElement('span');
    sfx.className = 'score-flat__suffix';
    sfx.textContent = '/' + max;
    wrap.appendChild(sfx);

    // meter
    const meter = document.createElement('div');
    meter.className = 'score-flat__meter';
    const fill = document.createElement('i');
    meter.appendChild(fill);
    wrap.appendChild(meter);

    function update(){
      let v = parseFloat(input.value);
      if (isNaN(v)) v = 0;
      v = clamp(v, 0, max);
      const d = decimals(step);
      input.value = Number(v).toFixed(d);
      fill.style.width = (v / max * 100) + '%';
    }

    input.addEventListener('input', update);
    input.addEventListener('change', update);
    input.addEventListener('blur', update);

    // wheel & arrows for nicer stepping
    wrap.addEventListener('wheel', (e) => {
      if (document.activeElement !== input) return;
      e.preventDefault();
      const dir = e.deltaY < 0 ? 1 : -1;
      const v = parseFloat(input.value) || 0;
      const next = clamp(v + dir * step, 0, max);
      input.value = next;
      input.dispatchEvent(new Event('input', {bubbles:true}));
    }, {passive:false});

    input.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();
      const dir = e.key === 'ArrowUp' ? 1 : -1;
      const v = parseFloat(input.value) || 0;
      const next = clamp(v + dir * step, 0, max);
      input.value = next;
      input.dispatchEvent(new Event('input', {bubbles:true}));
    });

    update();
  }

  function enhanceAll(){
    const root = document.getElementById('scoreControls');
    if (!root) return;
    root.querySelectorAll('input[type="number"]').forEach(enhance);
  }

  document.addEventListener('DOMContentLoaded', () => {
    enhanceAll();
    const root = document.getElementById('scoreControls');
    if (!root || !('MutationObserver' in window)) return;
    const mo = new MutationObserver(enhanceAll);
    mo.observe(root, {childList: true, subtree: true});
  });
})();
