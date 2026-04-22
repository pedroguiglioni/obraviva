/* =========================================
   OBRA VIVA · main.js
   Conectado a Supabase
   ========================================= */

const SUPABASE_URL  = 'https://kcslaqmxxmcprkjhaidm.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtjc2xhcW14eG1jcHJramhhaWRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3Mjg3MTQsImV4cCI6MjA5MjMwNDcxNH0.ZV-NRcGmrywoXLgWMj8sBvHbbxzcX3nzfKL1DhFnpX0';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* --- COUNTDOWN SUBASTA --- */
function initCountdown() {
  const el = document.getElementById('countdown');
  if (!el) return;
  let total = 2 * 3600 + 14 * 60 + 38;
  function format(s) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
  }
  function tick() {
    el.textContent = format(total);
    if (total > 0) { total--; setTimeout(tick, 1000); }
    else { el.textContent = 'Finalizada'; }
  }
  tick();
}

/* --- BÚSQUEDA --- */
function initSearch() {
  const input = document.getElementById('search-input');
  if (!input) return;
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      const q = input.value.trim();
      if (q) window.location.href = `#catalogo`;
    }
  });
}

/* --- PILLS --- */
function initPills() {
  document.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', function(e) {
      e.preventDefault();
      const input = document.getElementById('search-input');
      if (input) input.value = pill.textContent.trim();
    });
  });
}

/* --- FILTROS DE OBRAS --- */
function initFiltros() {
  const btns = document.querySelectorAll('.obras-filter');
  btns.forEach(btn => {
    btn.addEventListener('click', function() {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.textContent.trim();
      if (cat === 'Todos') {
        cargarObrasDestacadas();
      } else {
        cargarObrasDestacadas(cat);
      }
    });
  });
}

/* --- HELPERS --- */
function formatPrecio(precio, moneda) {
  if (!precio) return 'Consultar';
  const simbolo = moneda === 'USD' ? 'U$D' : '$';
  return `${simbolo} ${Number(precio).toLocaleString('es-AR')}`;
}

function badgesHTML(obra) {
  let html = '';
  if (obra.curado)    html += `<span class="badge badge-curado">Curado</span>`;
  if (obra.verificado) html += `<span class="badge badge-verificado">Verificado</span>`;
  if (obra.modo_venta === 'subasta') html += `<span class="badge badge-subasta">En subasta</span>`;
  return html ? `<div class="obra-badges">${html}</div>` : '';
}

function estadoHTML(obra) {
  if (obra.modo_venta === 'subasta') return '';
  const clases = {
    disponible: 'estado-disponible',
    reservado:  'estado-reservado',
    vendido:    'estado-vendido'
  };
  const textos = {
    disponible: 'Disponible',
    reservado:  'Reservada',
    vendido:    'Vendida'
  };
  return `<div class="obra-estado ${clases[obra.estado] || ''}">${textos[obra.estado] || obra.estado}</div>`;
}

function botonesHTML(obra) {
  const esSubasta = obra.modo_venta === 'subasta';
  const wpp = obra.whatsapp_contacto || '5493624000000';
  const msg = encodeURIComponent(`Hola, me interesa la obra "${obra.titulo}" publicada en OBRA VIVA.`);

  if (esSubasta) {
    return `
      <a href="#subastas" class="obra-btn obra-btn-ver">Ver pieza</a>
      <a href="#subastas" class="obra-btn obra-btn-ofertar">Ofertar</a>`;
  }
  if (obra.estado === 'reservado') {
    return `
      <a href="#" class="obra-btn obra-btn-ver">Ver pieza</a>
      <a href="https://wa.me/${wpp}?text=${msg}" target="_blank" class="obra-btn obra-btn-consultar">Ver disponibilidad</a>`;
  }
  return `
    <a href="#" class="obra-btn obra-btn-ver">Ver pieza</a>
    <a href="https://wa.me/${wpp}?text=${msg}" target="_blank" class="obra-btn obra-btn-consultar">Consultar</a>`;
}

function imagenHTML(obra) {
  if (obra.imagen_portada) {
    return `<img src="${obra.imagen_portada}" alt="${obra.titulo}" style="width:100%;height:100%;object-fit:cover;object-position:center center;display:block;">`;
  }
  const colores = ['#C8BAA8','#A8B8C0','#B4A890','#C0B4A4','#9AACB4','#B8C0A8','#C4B0A4'];
  const color = colores[Math.floor(Math.random() * colores.length)];
  return `<div style="width:100%;height:100%;background:${color};min-height:100%;position:absolute;inset:0;"></div>`;
}

function cardObraHTML(obra) {
  return `
    <article class="obra-card">
      <div class="obra-img">
        ${imagenHTML(obra)}
        ${badgesHTML(obra)}
        ${estadoHTML(obra)}
      </div>
      <div class="obra-body">
        <div class="obra-cat">${obra.categoria}${obra.subcategoria ? ' · ' + obra.subcategoria : ''}</div>
        <h3 class="obra-title">${obra.titulo}</h3>
        <div class="obra-artist">${obra.artista_vendedor} · ${obra.tipo_vendedor.charAt(0).toUpperCase() + obra.tipo_vendedor.slice(1)}</div>
        <div class="obra-meta">
          ${obra.provincia ? `<span class="obra-meta-item"><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${obra.provincia}</span>` : ''}
          ${obra.medidas ? `<span class="obra-meta-sep">·</span><span class="obra-meta-item">${obra.medidas}</span>` : ''}
          ${obra.anio ? `<span class="obra-meta-sep">·</span><span class="obra-meta-item">${obra.anio}</span>` : ''}
        </div>
        <div class="obra-price">${formatPrecio(obra.precio, obra.moneda)}</div>
        <div class="obra-actions">${botonesHTML(obra)}</div>
      </div>
    </article>`;
}

/* --- CARGAR OBRAS DESTACADAS --- */
async function cargarObrasDestacadas(categoria = null) {
  const grid = document.getElementById('obras-destacadas-grid');
  if (!grid) return;

  grid.innerHTML = '<div style="padding:20px;color:#9A9590;font-size:12px">Cargando obras...</div>';

  let query = sb
    .from('obras')
    .select('*')
    .eq('activo', true)
    .eq('destacado', true)
    .order('orden', { ascending: true })
    .limit(4);

  if (categoria) query = query.eq('categoria', categoria);

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    grid.innerHTML = '<div style="padding:20px;color:#9A9590;font-size:12px">No hay obras disponibles.</div>';
    return;
  }

  grid.innerHTML = data.map(cardObraHTML).join('');
}

/* --- CARGAR OBRAS RECIENTES --- */
async function cargarObrasRecientes() {
  const grid = document.getElementById('obras-recientes-grid');
  if (!grid) return;

  const { data, error } = await sb
    .from('obras')
    .select('*')
    .eq('activo', true)
    .order('created_at', { ascending: false })
    .limit(6);

  if (error || !data || data.length === 0) return;

  grid.innerHTML = data.map(cardObraHTML).join('');
}

/* --- INIT --- */
document.addEventListener('DOMContentLoaded', function() {
  initCountdown();
  initSearch();
  initPills();
  initFiltros();
  cargarObrasDestacadas();
  cargarObrasRecientes();
});
