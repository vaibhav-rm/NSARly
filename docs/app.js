// NSARly GitHub Pages Interactive Logic

document.addEventListener('DOMContentLoaded', () => {
  // Tab Switcher for Documentation
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');

      tabBtns.forEach((b) => b.classList.remove('active'));
      tabPanes.forEach((p) => p.classList.remove('active'));

      btn.classList.add('active');
      const activePane = document.getElementById(target);
      if (activePane) {
        activePane.classList.add('active');
      }
    });
  });

  // Live Calculator Demo Logic
  const attendedInput = document.getElementById('calcAttended');
  const conductedInput = document.getElementById('calcConducted');
  const targetSelect = document.getElementById('calcTarget');

  const resultHero = document.getElementById('resultHero');
  const resultBadge = document.getElementById('resultBadge');
  const resultMsg = document.getElementById('resultMsg');

  function updateCalculator() {
    if (!attendedInput || !conductedInput || !targetSelect) return;

    const attended = parseInt(attendedInput.value, 10) || 0;
    const conducted = parseInt(conductedInput.value, 10) || 0;
    const targetPercentage = parseFloat(targetSelect.value) || 75;

    if (conducted === 0) {
      resultHero.textContent = '0%';
      resultBadge.textContent = 'NO DATA';
      resultBadge.className = 'result-badge';
      resultBadge.style.backgroundColor = '#444';
      resultBadge.style.color = '#FFF';
      resultMsg.textContent = 'ENTER CLASSES CONDUCTED & ATTENDED ABOVE';
      return;
    }

    const rawPct = (attended / conducted) * 100;
    const percentage = Math.round(rawPct * 10) / 10;
    resultHero.textContent = `${percentage}%`;

    const targetDecimal = targetPercentage / 100;

    if (percentage >= targetPercentage) {
      // Safe
      resultBadge.textContent = 'SAFE';
      resultBadge.className = 'result-badge badge-safe';

      const maxConducted = Math.floor(attended / targetDecimal);
      const safeToMiss = Math.max(0, maxConducted - conducted);

      if (safeToMiss > 0) {
        resultMsg.textContent = `YOU CAN SAFELY MISS NEXT ${safeToMiss} CLASS${safeToMiss > 1 ? 'ES' : ''}.`;
      } else {
        resultMsg.textContent = 'YOU ARE SAFE. ATTEND NEXT CLASS TO MAINTAIN TARGET.';
      }
    } else if (percentage >= targetPercentage - 5) {
      // At Risk
      resultBadge.textContent = 'AT RISK';
      resultBadge.className = 'result-badge badge-atrisk';

      const num = targetDecimal * conducted - attended;
      const den = 1 - targetDecimal;
      const needed = Math.max(0, Math.ceil(num / den));

      resultMsg.textContent = `AT RISK! ATTEND NEXT ${needed} CONSECUTIVE CLASS${needed > 1 ? 'ES' : ''}.`;
    } else {
      // Shortage
      resultBadge.textContent = 'SHORTAGE';
      resultBadge.className = 'result-badge badge-shortage';

      let needed = 0;
      if (targetDecimal >= 1) {
        needed = 999;
      } else {
        const num = targetDecimal * conducted - attended;
        const den = 1 - targetDecimal;
        needed = Math.max(0, Math.ceil(num / den));
      }

      resultMsg.textContent = `ATTENDANCE SHORTAGE! NEED ${needed} CONSECUTIVE CLASS${needed > 1 ? 'ES' : ''} TO RECOVER.`;
    }
  }

  if (attendedInput && conductedInput && targetSelect) {
    attendedInput.addEventListener('input', updateCalculator);
    conductedInput.addEventListener('input', updateCalculator);
    targetSelect.addEventListener('change', updateCalculator);
  }

  // Preset Buttons
  const presetBtns = document.querySelectorAll('.btn-chip');
  presetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const att = btn.getAttribute('data-att');
      const cond = btn.getAttribute('data-cond');

      if (att && cond && attendedInput && conductedInput) {
        attendedInput.value = att;
        conductedInput.value = cond;
        updateCalculator();
      }
    });
  });

  // Initial calculation run
  updateCalculator();
});
