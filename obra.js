/* =========================================
   OBRA VIVA · obra.js · Etapa 2A
   Ficha premium de marketplace nacional
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

function inicialVendedor(nombre) {
  if (!nombre) return '◈';
  return nombre.trim().charAt(0).toUpperCase();
}

function msgWpp(obra) {
  return encodeURIComponent(
    `Hola, me interesa la obra "${obra.titulo}" publicada en OBRA VIVA. ¿Está disponible?`
  );
}

/* =========================================
   ESTADOS UI
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
   OPEN GRAPH DINÁMICO
   ========================================= */
function actualizarOpenGraph(obra) {
  const titulo    = `${obra.titulo} · OBRA VIVA`;
  const artista   = obra.artista_vendedor || '';
  const categoria = obra.categoria || '';
  const desc      = obra.descripcion
    ? obra.descripcion.substring(0, 160)
    : `${categoria} · ${artista} · Marketplace Cultural Argentino`;

  document.title = titulo;
  document.getElementById('og-title').setAttribute('content', titulo);
  document.getElementById('og-description').setAttribute('content', desc);
  document.getElementById('og-url').setAttribute('content', window.location.href);
  if (obra.imagen_portada) {
    document.getElementById('og-image').setAttribute('content', obra.imagen_portada);
  }

  // Meta description estándar
  let metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', desc);
}

/* =========================================
   RENDERIZAR IMAGEN
   ========================================= */
function renderizarImagen(obra) {
  const wrap = document.getElementById('obra-imagen-wrap');
  if (obra.imagen_portada) {
    wrap.innerHTML = `<img src="${obra.imagen_portada}" alt="${obra.titulo}" />`;
  } else {
    wrap.innerHTML = `
      <div class="obra-imagen-placeholder">
        <div class="obra-imagen-placeholder-icon">◈</div>
        <div class="obra-imagen-placeholder-text">Sin imagen disponible</div>
      </div>`;
  }
}

/* =========================================
   RENDERIZAR BADGES
   ========================================= */
function renderizarBadges(obra) {
  const badges = [];
  if (obra.curado)    badges.push(`<span class="badge badge-curado">Curado por OBRA VIVA</span>`);
  if (obra.verificado) badges.push(`<span class="badge badge-verificado">Vendedor verificado</span>`);
  if (obra.destacado) badges.push(`<span class="badge badge-destacado">Obra destacada</span>`);
  if (obra.modo_venta === 'subasta') badges.push(`<span class="badge badge-curado">En subasta</span>`);
  document.getElementById('obra-badges-bajo').innerHTML = badges.join('');
}

/* =========================================
   RENDERIZAR DATOS PRINCIPALES
   ========================================= */
function renderizarDatosPrincipales(obra) {
  // Eyebrow categoría
  const cat = [obra.categoria, obra.subcategoria].filter(Boolean).join(' · ');
  document.getElementById('obra-eyebrow').textContent = cat;

  // Título
  document.getElementById('obra-titulo').textContent = obra.titulo || '';

  // Artista
  const ubicVendedor = [obra.ciudad, obra.provincia].filter(Boolean).join(', ');
  document.getElementById('obra-artista-bloque').innerHTML = `
    <div class="obra-artista-nombre">${obra.artista_vendedor || ''}</div>
    <div class="obra-artista-tipo">${capitalizarTipo(obra.tipo_vendedor)}</div>
    ${ubicVendedor ? `
      <div class="obra-artista-ubicacion">
        <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        ${ubicVendedor}
      </div>` : ''}`;
}

/* =========================================
   RENDERIZAR PRECIO
   ========================================= */
function renderizarPrecio(obra) {
  const precio = formatPrecio(obra.precio, obra.moneda);
  const el     = document.getElementById('obra-precio-bloque');

  if (obra.estado === 'vendido') {
    el.innerHTML = `<div class="obra-precio-vendida">Esta obra fue vendida. Podés consultar piezas similares en el catálogo.</div>`;
    return;
  }

  if (obra.estado === 'reservado') {
    el.innerHTML = `
      ${precio ? `<div class="obra-precio-label">Precio</div><div class="obra-precio-numero">${precio}</div>` : ''}
      <div class="obra-precio-reservada" style="margin-top:10px">Esta obra está reservada. Podés consultar disponibilidad o piezas similares.</div>`;
    return;
  }

  if (precio) {
    el.innerHTML = `
      <div class="obra-precio-label">Precio</div>
      <div class="obra-precio-numero">${precio}</div>`;
  } else {
    el.innerHTML = `<div class="obra-precio-consultar">Precio a consultar</div>`;
  }
}

/* =========================================
   RENDERIZAR ESTADO
   ========================================= */
function renderizarEstado(obra) {
  const textos = { disponible: 'Disponible', reservado: 'Reservada', vendido: 'Vendida' };
  document.getElementById('obra-estado-bloque').innerHTML =
    `<span class="estado-pill ${obra.estado || ''}">${textos[obra.estado] || obra.estado || ''}</span>`;
}

/* =========================================
   RENDERIZAR BOTONES DE ACCIÓN
   ========================================= */
function botonesHTML(obra) {
  const wpp = obra.whatsapp_contacto || null;
  const msg = msgWpp(obra);

  const btnWppPrincipal = wpp
    ? `<a href="https://wa.me/${wpp}?text=${msg}" target="_blank" class="btn-accion-wpp">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        Consultar disponibilidad
      </a>`
    : `<div class="btn-accion-disabled">Consultas no disponibles por ahora</div>`;

  const btnWppSecundario = wpp
    ? `<a href="https://wa.me/${wpp}?text=${msg}" target="_blank" class="btn-accion-secundario">
        Preguntar por envío o retiro
      </a>`
    : '';

  if (obra.estado === 'vendido') {
    return `
      <div class="btn-accion-disabled">Esta obra ya fue vendida</div>
      <a href="index.html#catalogo" class="btn-accion-secundario">Ver obras similares →</a>`;
  }

  if (obra.modo_venta === 'subasta') {
    return `
      <a href="index.html#subastas" class="btn-accion-subasta">Ver subasta activa</a>
      ${btnWppPrincipal}`;
  }

  if (obra.estado === 'reservado') {
    return `
      ${btnWppPrincipal}
      <a href="index.html#catalogo" class="btn-accion-secundario">Ver obras similares →</a>`;
  }

  return `${btnWppPrincipal}${btnWppSecundario ? '\n      ' + btnWppSecundario : ''}`;
}

function renderizarBotones(obra) {
  const html = botonesHTML(obra);
  document.getElementById('obra-acciones-principales').innerHTML = html;
  document.getElementById('consulta-acciones').innerHTML = botonesConsultaHTML(obra);
}

function botonesConsultaHTML(obra) {
  const wpp = obra.whatsapp_contacto || null;
  const msg = msgWpp(obra);

  if (obra.estado === 'vendido') {
    return `<a href="index.html#catalogo" class="btn-consulta-wpp">Ver obras similares →</a>`;
  }

  if (!wpp) {
    return `<div class="btn-consulta-disabled">Consultas no disponibles por ahora</div>`;
  }

  return `
    <a href="https://wa.me/${wpp}?text=${msg}" target="_blank" class="btn-consulta-wpp">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      Consultar por WhatsApp
    </a>`;
}

/* =========================================
   FICHA RÁPIDA (hero)
   ========================================= */
function renderizarFichaRapida(obra) {
  const campos = [
    { label: 'Técnica',  valor: obra.tecnica },
    { label: 'Medidas',  valor: obra.medidas },
    { label: 'Año',      valor: obra.anio },
    { label: 'Material', valor: obra.material },
    { label: 'Origen',   valor: obra.origen },
    { label: 'Estilo',   valor: obra.estilo },
  ].filter(f => f.valor);

  if (campos.length === 0) return;
  document.getElementById('obra-ficha-rapida').innerHTML = campos.map(f => `
    <div class="ficha-item">
      <span class="ficha-label">${f.label}</span>
      <span class="ficha-valor">${f.valor}</span>
    </div>`).join('');
}

/* =========================================
   CURADURÍA EDITORIAL
   ========================================= */
function renderizarCuraduria(obra) {
  if (!obra.curado) return;
  const sec = document.getElementById('obra-curaduria-sec');
  const cat = obra.categoria ? obra.categoria.toLowerCase() : 'esta pieza';
  sec.style.display = 'block';
  document.getElementById('curaduria-texto').textContent =
    `Esta ${cat} forma parte de la selección curada de OBRA VIVA por su valor estético, histórico o cultural dentro del patrimonio argentino. Cada pieza curada es revisada por nuestro equipo editorial antes de recibir esta distinción.`;
}

/* =========================================
   DESCRIPCIÓN
   ========================================= */
function renderizarDescripcion(obra) {
  if (!obra.descripcion) return;
  document.getElementById('obra-descripcion-sec').style.display = 'block';
  document.getElementById('obra-descripcion-texto').textContent = obra.descripcion;
}

/* =========================================
   FICHA TÉCNICA COMPLETA
   ========================================= */
function renderizarFichaTecnica(obra) {
  const campos = [
    { label: 'Categoría',     valor: obra.categoria },
    { label: 'Subcategoría',  valor: obra.subcategoria },
    { label: 'Técnica',       valor: obra.tecnica },
    { label: 'Medidas',       valor: obra.medidas },
    { label: 'Material',      valor: obra.material },
    { label: 'Año / Período', valor: obra.anio },
    { label: 'Época',         valor: obra.epoca },
    { label: 'Origen',        valor: obra.origen },
    { label: 'Estilo',        valor: obra.estilo },
    { label: 'Modo de venta', valor: obra.modo_venta === 'venta_directa' ? 'Venta directa' : obra.modo_venta === 'subasta' ? 'Subasta' : obra.modo_venta === 'consulta' ? 'Consulta' : null },
    { label: 'Moneda',        valor: obra.moneda === 'USD' ? 'Dólares (USD)' : obra.moneda === 'ARS' ? 'Pesos argentinos (ARS)' : null },
  ].filter(f => f.valor);

  if (campos.length === 0) return;
  document.getElementById('obra-ficha-sec').style.display = 'block';
  document.getElementById('obra-ficha-editorial').innerHTML = campos.map(f => `
    <div class="ficha-editorial-item">
      <span class="ficha-label">${f.label}</span>
      <span class="ficha-valor">${f.valor}</span>
    </div>`).join('');
}

/* =========================================
   CONTEXTO CULTURAL
   ========================================= */
function renderizarContexto(obra) {
  const campos = [
    { label: 'Época histórica', valor: obra.epoca },
    { label: 'Origen / procedencia', valor: obra.origen },
    { label: 'Estilo artístico', valor: obra.estilo },
    { label: 'Período', valor: obra.anio },
  ].filter(f => f.valor);

  if (campos.length < 2) return; // No mostrar si hay muy pocos datos
  document.getElementById('obra-contexto-sec').style.display = 'block';
  document.getElementById('obra-contexto-grid').innerHTML = campos.map(f => `
    <div class="contexto-item">
      <span class="ficha-label">${f.label}</span>
      <span class="ficha-valor">${f.valor}</span>
    </div>`).join('');
}

/* =========================================
   BLOQUE VENDEDOR
   ========================================= */
function renderizarVendedor(obra) {
  const tipo     = capitalizarTipo(obra.tipo_vendedor);
  const inicial  = inicialVendedor(obra.artista_vendedor);
  const ubicacion = [obra.ciudad, obra.provincia].filter(Boolean).join(', ');
  const verificado = obra.verificado;

  document.getElementById('vendedor-bloque').innerHTML = `
    <div class="vendedor-avatar">${inicial}</div>
    <div class="vendedor-info">
      <div class="vendedor-nombre">${obra.artista_vendedor || '—'}</div>
      <div class="vendedor-tipo">${tipo}</div>
      ${ubicacion ? `
        <div class="vendedor-ubicacion">
          <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${ubicacion}
        </div>` : ''}
    </div>
    ${verificado ? `<div class="vendedor-badge">Verificado</div>` : ''}
    <a href="#" class="vendedor-perfil" title="Próximamente">Ver perfil →</a>`;
}

/* =========================================
   BREADCRUMB
   ========================================= */
function renderizarBreadcrumb(obra) {
  document.getElementById('breadcrumb').style.display     = 'flex';
  document.getElementById('breadcrumb-categoria').textContent = obra.categoria || '';
  document.getElementById('breadcrumb-titulo').textContent    = obra.titulo || '';
}

/* =========================================
   CARGAR OBRA DESDE SUPABASE
   ========================================= */
async function cargarObra() {
  mostrarLoading();

  const id = getParam('id');
  if (!id) { mostrarError(); return; }

  const { data: obra, error } = await sb
    .from('obras')
    .select('*')
    .eq('id', id)
    .eq('activo', true)
    .single();

  if (error || !obra) { mostrarError(); return; }

  // Renderizar todo en orden
  actualizarOpenGraph(obra);
  renderizarBreadcrumb(obra);
  renderizarImagen(obra);
  renderizarBadges(obra);
  renderizarDatosPrincipales(obra);
  renderizarPrecio(obra);
  renderizarEstado(obra);
  renderizarBotones(obra);
  renderizarFichaRapida(obra);
  renderizarCuraduria(obra);
  renderizarDescripcion(obra);
  renderizarFichaTecnica(obra);
  renderizarContexto(obra);
  renderizarVendedor(obra);

  mostrarObra();
}

/* =========================================
   INIT
   ========================================= */
document.addEventListener('DOMContentLoaded', cargarObra);
