/* =========================================
   OBRA VIVA · obra.js
   Página de detalle de obra
   ========================================= */

const SUPABASE_URL = 'https://kcslaqmxxmcprkjhaidm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtjc2xhcW14eG1jcHJramhhaWRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3Mjg3MTQsImV4cCI6MjA5MjMwNDcxNH0.ZV-NRcGmrywoXLgWMj8sBvHbbxzcX3nzfKL1DhFnpX0';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* =========================================
   HELPERS
   ========================================= */
function getParam(nombre) {
  return new URLSearchParams(window.location.search).get(nombre);
}

function formatPrecio(precio, moneda) {
  if (!precio) return null;
  const simbolo = moneda === 'USD' ? 'U$D' : '$';
  return `${simbolo} ${Number(precio).toLocaleString('es-AR')}`;
}

function capitalizarTipo(tipo) {
  const map = {
    artista:       'Artista',
    galeria:       'Galería',
    anticuario:    'Anticuario',
    coleccionista: 'Coleccionista',
    feria:         'Feria',
    especialista:  'Especialista',
  };
  return map[tipo] || tipo || '';
}

function mensajeWpp(obra) {
  return encodeURIComponent(
    `Hola, me interesa la obra "${obra.titulo}" publicada en OBRA VIVA. ¿Está disponible?`
  );
}

/* =========================================
   MOSTRAR / OCULTAR ESTADOS
   ========================================= */
function mostrarLoading() {
  document.getElementById('obra-loading').style.display = 'block';
  document.getElementById('obra-error').style.display   = 'none';
  document.getElementById('obra-main').style.display    = 'none';
}

function mostrarError() {
  document.getElementById('obra-loading').style.display = 'none';
  document.getElementById('obra-error').style.display   = 'block';
  document.getElementById('obra-main').style.display    = 'none';
}

function mostrarObra() {
  document.getElementById('obra-loading').style.display = 'none';
  document.getElementById('obra-error').style.display   = 'none';
  document.getElementById('obra-main').style.display    = 'block';
}

/* =========================================
   RENDERIZAR OBRA
   ========================================= */
function renderizarObra(obra) {

  // Título de página
  document.title = `${obra.titulo} · OBRA VIVA`;

  // Breadcrumb
  document.getElementById('breadcrumb').style.display     = 'flex';
  document.getElementById('breadcrumb-categoria').textContent = obra.categoria || '';
  document.getElementById('breadcrumb-titulo').textContent    = obra.titulo || '';

  // IMAGEN
  const imagenEl = document.getElementById('obra-imagen');
  if (obra.imagen_portada) {
    imagenEl.innerHTML = `<img src="${obra.imagen_portada}" alt="${obra.titulo}" />`;
  } else {
    imagenEl.innerHTML = `
      <div class="obra-imagen-placeholder">
        <div class="obra-imagen-placeholder-icon">◈</div>
        <div class="obra-imagen-placeholder-text">Sin imagen disponible</div>
      </div>`;
  }

  // BADGES
  const badges = [];
  if (obra.curado)    badges.push(`<span class="badge badge-curado">Curado</span>`);
  if (obra.verificado) badges.push(`<span class="badge badge-verificado">Verificado</span>`);
  if (obra.destacado) badges.push(`<span class="badge badge-destacado">Destacado</span>`);
  document.getElementById('obra-badges-hero').innerHTML = badges.join('');

  // CATEGORÍA
  const catLabel = [obra.categoria, obra.subcategoria].filter(Boolean).join(' · ');
  document.getElementById('obra-categoria-label').textContent = catLabel;

  // TÍTULO
  document.getElementById('obra-titulo-grande').textContent = obra.titulo || '';

  // ARTISTA
  document.getElementById('obra-artista-hero').innerHTML = `
    <div class="obra-artista-nombre">${obra.artista_vendedor || ''}</div>
    <div class="obra-artista-tipo">${capitalizarTipo(obra.tipo_vendedor)}</div>`;

  // UBICACIÓN
  const ubicacion = [obra.ciudad, obra.provincia].filter(Boolean).join(', ');
  if (ubicacion) {
    document.getElementById('obra-ubicacion').innerHTML = `
      <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
      ${ubicacion}`;
  }

  // PRECIO
  const precio = formatPrecio(obra.precio, obra.moneda);
  const precioEl = document.getElementById('obra-precio-grande');
  if (precio) {
    precioEl.textContent = precio;
  } else {
    precioEl.innerHTML = `<span class="obra-precio-consultar">Consultar precio</span>`;
    document.getElementById('obra-precio-wrap').querySelector('.obra-precio-label').style.display = 'none';
  }

  // ESTADO
  const estadoTextos = { disponible: 'Disponible', reservado: 'Reservada', vendido: 'Vendida' };
  document.getElementById('obra-estado-wrap').innerHTML =
    `<span class="estado-pill ${obra.estado || ''}">${estadoTextos[obra.estado] || obra.estado || ''}</span>`;

  // BOTONES DE ACCIÓN
  const wpp     = obra.whatsapp_contacto || null;
  const msgWpp  = mensajeWpp(obra);
  const esSubasta = obra.modo_venta === 'subasta';
  const vendida   = obra.estado === 'vendido';

  const btnWpp = wpp
    ? `<a href="https://wa.me/${wpp}?text=${msgWpp}" target="_blank" class="btn-accion-wpp">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        Consultar por WhatsApp
      </a>`
    : `<div class="btn-accion-wpp-disabled">Consultas por WhatsApp no disponibles</div>`;

  const btnWppReserva = wpp
    ? `<a href="https://wa.me/${wpp}?text=${msgWpp}" target="_blank" class="btn-accion-wpp">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        Consultar disponibilidad
      </a>`
    : `<div class="btn-accion-wpp-disabled">Consultas no disponibles</div>`;

  let accionesHTML = '';

  if (vendida) {
    accionesHTML = `<div style="font-size:12px;color:#A32D2D;padding:12px 0;">Esta obra ya fue vendida.</div>`;
  } else if (esSubasta) {
    accionesHTML = `
      <a href="index.html#subastas" class="btn-accion-oferta">Ver subasta activa</a>
      ${btnWpp}`;
  } else if (obra.estado === 'reservado') {
    accionesHTML = btnWppReserva;
  } else {
    accionesHTML = btnWpp;
  }

  document.getElementById('obra-acciones').innerHTML = accionesHTML;
  document.getElementById('obra-footer-acciones').innerHTML = accionesHTML;

  // FICHA RÁPIDA (datos clave visibles en hero)
  const fichaRapida = [
    { label: 'Técnica',  valor: obra.tecnica },
    { label: 'Medidas',  valor: obra.medidas },
    { label: 'Año',      valor: obra.anio },
    { label: 'Material', valor: obra.material },
  ].filter(f => f.valor);

  document.getElementById('obra-ficha-rapida').innerHTML = fichaRapida.map(f => `
    <div class="ficha-item">
      <div class="ficha-label">${f.label}</div>
      <div class="ficha-valor">${f.valor}</div>
    </div>`).join('');

  // DESCRIPCIÓN
  if (obra.descripcion) {
    document.getElementById('obra-descripcion-sec').style.display = 'block';
    document.getElementById('obra-descripcion-texto').textContent = obra.descripcion;
  }

  // FICHA TÉCNICA COMPLETA
  const fichaCompleta = [
    { label: 'Categoría',    valor: obra.categoria },
    { label: 'Subcategoría', valor: obra.subcategoria },
    { label: 'Técnica',      valor: obra.tecnica },
    { label: 'Medidas',      valor: obra.medidas },
    { label: 'Material',     valor: obra.material },
    { label: 'Año / Período',valor: obra.anio },
    { label: 'Época',        valor: obra.epoca },
    { label: 'Origen',       valor: obra.origen },
    { label: 'Estilo',       valor: obra.estilo },
    { label: 'Provincia',    valor: obra.provincia },
    { label: 'Ciudad',       valor: obra.ciudad },
    { label: 'Modo de venta',valor: obra.modo_venta === 'venta_directa' ? 'Venta directa' : obra.modo_venta === 'subasta' ? 'Subasta' : 'Consulta' },
  ].filter(f => f.valor);

  if (fichaCompleta.length > 0) {
    document.getElementById('obra-ficha-sec').style.display = 'block';
    document.getElementById('obra-ficha-grid').innerHTML = fichaCompleta.map(f => `
      <div class="ficha-celda">
        <span class="ficha-label">${f.label}</span>
        <span class="ficha-valor">${f.valor}</span>
      </div>`).join('');
  }
}

/* =========================================
   CARGAR OBRA DESDE SUPABASE
   ========================================= */
async function cargarObra() {
  mostrarLoading();

  const id = getParam('id');
  if (!id) { mostrarError(); return; }

  const { data, error } = await sb
    .from('obras')
    .select('*')
    .eq('id', id)
    .eq('activo', true)
    .single();

  if (error || !data) {
    mostrarError();
    return;
  }

  renderizarObra(data);
  mostrarObra();
}

/* =========================================
   INIT
   ========================================= */
document.addEventListener('DOMContentLoaded', cargarObra);
