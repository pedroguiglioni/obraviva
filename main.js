/* =========================================
   OBRA VIVA · main.js
   ========================================= */

/* --- COUNTDOWN SUBASTA --- */
function initCountdown() {
  const el = document.getElementById('countdown');
  if (!el) return;

  // Tiempo inicial en segundos (2h 14m 38s)
  let total = 2 * 3600 + 14 * 60 + 38;

  function format(s) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
  }

  function tick() {
    el.textContent = format(total);
    if (total > 0) {
      total--;
      setTimeout(tick, 1000);
    } else {
      el.textContent = 'Finalizada';
    }
  }

  tick();
}

/* --- BÚSQUEDA --- */
function initSearch() {
  const input = document.getElementById('search-input');
  if (!input) return;

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      const q = input.value.trim();
      if (q) {
        // TODO: cuando exista catalogo.html → /catalogo.html?q=${encodeURIComponent(q)}
        window.location.href = `#catalogo`;
      }
    }
  });
}

/* --- PILLS DE BÚSQUEDA --- */
function initPills() {
  const pills = document.querySelectorAll('.pill');
  pills.forEach(pill => {
    pill.addEventListener('click', function (e) {
      e.preventDefault();
      const q = pill.textContent.trim();
      if (document.getElementById('search-input')) {
        document.getElementById('search-input').value = q;
      }
      // TODO: cuando exista catalogo.html → /catalogo.html?q=${encodeURIComponent(q)}
      window.location.href = `#catalogo`;
    });
  });
}

/* --- INIT --- */
document.addEventListener('DOMContentLoaded', function () {
  initCountdown();
  initSearch();
  initPills();
});
