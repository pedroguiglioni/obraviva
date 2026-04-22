/* ═══════════════════════════════════════════════
   OBRA VIVA · obra.js · Etapa 2B1
   Marketplace cultural argentino
   ═══════════════════════════════════════════════ */

const SUPABASE_URL = 'https://kcslaqmxxmcprkjhaidm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtjc2xhcW14eG1jcHJramhhaWRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3Mjg3MTQsImV4cCI6MjA5MjMwNDcxNH0.ZV-NRcGmrywoXLgWMj8sBvHbbxzcX3nzfKL1DhFnpX0';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* ─── HELPERS ─── */

function param(k) {
  return new URLSearchParams(window.location.search).get(k);
}

function formatPrecio(precio, moneda) {
  if (!precio) return null;
  return `${moneda === 'USD' ? 'U$D' : '$'} ${Number(precio).toLocaleString('es-AR')}`;
}

function capTipo(tipo) {
  return { artista:'Artista', galeria:'Galería', anticuario:'Anticuario', coleccionista:'Coleccionista', feria:'Feria', especialista:'Especialista' }[tipo] || tipo || '';
}

function inicial(nombre) {
  return (nombre || '').trim().charAt(0).toUpperCase() || '◈';
}

function wppMsg(obra) {
  return encodeURIComponent(`Hola, me interesa la obra "${obra.titulo}" publicada en OBRA VIVA. ¿Está disponible?`);
}

function svgUbic() {
  return `<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
}

function svgMsg() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
}

/* ─── ESTADOS UI ─── */

function ui(loading, error, main) {
  document.getElementById('obra-loading').style.display = loading ? 'block' : 'none';
  document.getElementById('obra-error').style.display   = error  ? 'block' : 'none';
  document.getElementById('obra-main').style.display    = main   ? 'block' : 'none';
}

/* ─── OPEN GRAPH ─── */

function og(obra) {
  const titulo = `${obra.titulo} · OBRA VIVA`;
  const desc   = obra.descripcion
    ? obra.descripcion.substring(0, 160)
    : `${obra.categoria || ''} · ${obra.artista_vendedor || ''} · Marketplace Cultural Argentino`;

  document.title = titulo;
  document.getElementById('og-title').setAttribute('content', titulo);
  document.getElementById('og-desc').setAttribute('content', desc);
  document.getElementById('og-url').setAttribute('content', window.location.href);
  document.getElementById('meta-desc').setAttribute('content', desc);
  if (obra.imagen_portada) document.getElementById('og-image').setAttribute('content', obra.imagen_portada);
}

/* ─── BREADCRUMB ─── */

function renderBreadcrumb(obra) {
  const nav = document.getElementById('breadcrumb');
  nav.style.display = 'flex';
  document.getElementById('bc-cat').textContent    = obra.categoria || '';
  document.getElementById('bc-titulo').textContent = obra.titulo    || '';
  if (obra.provincia) {
    document.getElementById('bc-prov').textContent      = obra.provincia;
    document.getElementById('bc-prov').style.display    = 'inline';
    document.getElementById('bc-prov-sep').style.display = 'inline';
  }
}

/* ─── GALERÍA MÚLTIPLE ─── */

async function renderGaleria(obra) {
  const wrap = document.getElementById('imagen-principal-wrap');
  const miniWrap = document.getElementById('galeria-miniaturas');

  // Intentar cargar imágenes desde obra_imagenes
  let imagenes = [];
  try {
    const { data } = await sb
      .from('obra_imagenes')
      .select('*')
      .eq('obra_id', obra.id)
      .order('orden', { ascending: true });
    imagenes = data || [];
  } catch (_) { imagenes = []; }

  // Construir lista final de imágenes
  const lista = imagenes.length > 0
    ? imagenes.map(img => ({ src: img.url || img.imagen_url || img.src, alt: obra.titulo }))
    : obra.imagen_portada
      ? [{ src: obra.imagen_portada, alt: obra.titulo }]
      : [];

  if (lista.length === 0) {
    wrap.innerHTML = `
      <div class="imagen-placeholder">
        <div class="imagen-placeholder-icon">◈</div>
        <p class="imagen-placeholder-text">Sin imagen disponible</p>
      </div>`;
    return;
  }

  // Imagen principal
  function setMain(src, alt) {
    wrap.innerHTML = `<img src="${src}" alt="${alt}" />`;
  }
  setMain(lista[0].src, lista[0].alt);

  // Miniaturas solo si hay más de 1
  if (lista.length > 1) {
    miniWrap.style.display = 'flex';
    miniWrap.innerHTML = lista.map((img, i) => `
      <div class="miniatura-item ${i === 0 ? 'activa' : ''}" data-index="${i}">
        <img src="${img.src}" alt="${img.alt}" loading="lazy" />
      </div>`).join('');

    miniWrap.querySelectorAll('.miniatura-item').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.index);
        setMain(lista[idx].src, lista[idx].alt);
        miniWrap.querySelectorAll('.miniatura-item').forEach(m => m.classList.remove('activa'));
        el.classList.add('activa');
      });
    });
  }
}

/* ─── BADGES ─── */

function renderBadges(obra) {
  const badges = [];
  if (obra.curado)              badges.push(`<span class="badge badge-curado">Curado · OBRA VIVA</span>`);
  if (obra.verificado)          badges.push(`<span class="badge badge-verificado">Vendedor verificado</span>`);
  if (obra.destacado)           badges.push(`<span class="badge badge-destacado">Obra destacada</span>`);
  if (obra.modo_venta==='subasta') badges.push(`<span class="badge badge-subasta">En subasta</span>`);
  document.getElementById('imagen-badges').innerHTML = badges.join('');
}

/* ─── DATOS PRINCIPALES ─── */

function renderDatosPrincipales(obra) {
  const cat = [obra.categoria, obra.subcategoria].filter(Boolean).join(' · ');
  document.getElementById('datos-eyebrow').textContent = cat;
  document.getElementById('datos-titulo').textContent  = obra.titulo || '';

  const ubic = [obra.ciudad, obra.provincia].filter(Boolean).join(', ');
  document.getElementById('datos-artista').innerHTML = `
    <p class="artista-nombre">${obra.artista_vendedor || ''}</p>
    <p class="artista-tipo">${capTipo(obra.tipo_vendedor)}</p>
    ${ubic ? `<p class="artista-ubic">${svgUbic()} ${ubic}</p>` : ''}`;
}

/* ─── PRECIO ─── */

function renderPrecio(obra) {
  const precio = formatPrecio(obra.precio, obra.moneda);
  const el = document.getElementById('datos-precio');

  if (obra.estado === 'vendido') {
    el.innerHTML = `<div class="precio-aviso vendida">Esta pieza fue vendida. Podés consultar obras similares en el catálogo federal.</div>`;
    return;
  }
  if (obra.estado === 'reservado') {
    el.innerHTML = `
      ${precio ? `<p class="precio-label">Precio</p><p class="precio-num">${precio}</p>` : ''}
      <div class="precio-aviso" style="margin-top:${precio ? '12px' : '0'}">Pieza reservada. Podés consultar disponibilidad o ver obras similares.</div>`;
    return;
  }
  el.innerHTML = precio
    ? `<p class="precio-label">Precio</p><p class="precio-num">${precio}</p>`
    : `<p class="precio-consultar">Precio a consultar</p>`;
}

/* ─── ESTADO ─── */

function renderEstado(obra) {
  const t = { disponible:'Disponible', reservado:'Reservada', vendido:'Vendida' };
  document.getElementById('datos-estado').innerHTML =
    `<span class="estado-pill ${obra.estado || ''}">${t[obra.estado] || obra.estado || ''}</span>`;
}

/* ─── BOTONES HERO ─── */

function renderAcciones(obra) {
  const wpp = obra.whatsapp_contacto || null;
  const msg = wppMsg(obra);
  document.getElementById('datos-acciones').innerHTML = botonesHero(obra, wpp, msg);
}

function botonesHero(obra, wpp, msg) {
  if (obra.estado === 'vendido') return `
    <div class="btn-sin-accion">Esta pieza ya fue vendida</div>
    <a href="index.html#catalogo" class="btn-secundario">Ver obras similares →</a>`;

  if (obra.modo_venta === 'subasta') return `
    <a href="index.html#subastas" class="btn-subasta">Ver subasta activa</a>
    ${wpp
      ? `<a href="https://wa.me/${wpp}?text=${msg}" target="_blank" class="btn-primario">${svgMsg()} Consultar disponibilidad</a>`
      : `<div class="btn-sin-accion">Consultas no disponibles por ahora</div>`}`;

  if (obra.estado === 'reservado') return `
    ${wpp
      ? `<a href="https://wa.me/${wpp}?text=${msg}" target="_blank" class="btn-primario">${svgMsg()} Consultar disponibilidad</a>`
      : `<div class="btn-sin-accion">Consultas no disponibles</div>`}
    <a href="index.html#catalogo" class="btn-secundario">Ver obras similares →</a>`;

  return wpp
    ? `<a href="https://wa.me/${wpp}?text=${msg}" target="_blank" class="btn-primario">${svgMsg()} Consultar disponibilidad</a>
       <a href="https://wa.me/${wpp}?text=${encodeURIComponent('Hola, quisiera solicitar información adicional sobre la obra "' + obra.titulo + '" publicada en OBRA VIVA.')}" target="_blank" class="btn-secundario">Solicitar información adicional</a>`
    : `<div class="btn-sin-accion">Consultas no disponibles por ahora</div>`;
}

/* ─── FICHA RÁPIDA ─── */

function renderFichaRapida(obra) {
  const campos = [
    { label:'Técnica',  valor: obra.tecnica },
    { label:'Medidas',  valor: obra.medidas },
    { label:'Año',      valor: obra.anio },
    { label:'Material', valor: obra.material },
    { label:'Origen',   valor: obra.origen },
    { label:'Estilo',   valor: obra.estilo },
  ].filter(f => f.valor);
  if (!campos.length) { document.getElementById('datos-ficha-rapida').style.display = 'none'; return; }
  document.getElementById('datos-ficha-rapida').innerHTML = campos.map(f => `
    <div class="fi-item">
      <span class="fi-label">${f.label}</span>
      <span class="fi-valor">${f.valor}</span>
    </div>`).join('');
}

/* ─── CURADURÍA ─── */

function renderCuraduria(obra) {
  if (!obra.curado) return;
  const cat = (obra.categoria || 'pieza').toLowerCase();
  const origen = obra.origen ? ` proveniente de ${obra.origen}` : '';
  const epoca  = obra.epoca  ? `, del período ${obra.epoca}` : '';
  document.getElementById('sec-curaduria').style.display = 'block';
  document.getElementById('curaduria-texto').textContent =
    `Esta ${cat}${origen}${epoca} forma parte de la selección curada de OBRA VIVA por su valor estético, histórico o cultural dentro del patrimonio argentino. Cada pieza curada es evaluada por nuestro equipo editorial antes de recibir esta distinción.`;
}

/* ─── DESCRIPCIÓN ─── */

function renderDescripcion(obra) {
  if (!obra.descripcion) return;
  document.getElementById('sec-descripcion').style.display = 'block';
  document.getElementById('descripcion-texto').textContent = obra.descripcion;
}

/* ─── VALOR CULTURAL ─── */

const contextoEditorial = {
  Pinturas:          'La pintura es uno de los lenguajes artísticos más documentados de la historia. Cada técnica, soporte y período refleja una visión específica del mundo y del artista.',
  Esculturas:        'La escultura ocupa el espacio de manera única. El material elegido —bronce, piedra, madera, cerámica— determina la relación de la obra con el tiempo y el entorno.',
  Antigüedades:      'Las piezas antiguas son testigos materiales de la historia. Su valor no es solo estético: es también documental, patrimonial y cultural.',
  Orfebrería:        'La orfebrería reúne técnica artesanal, material noble y valor histórico. Cada pieza condensa siglos de tradición artística y oficio especializado.',
  Coleccionables:    'Los objetos coleccionables documentan épocas, gustos, industrias y culturas. Su valor reside en la rareza, la autenticidad y la historia que cargan.',
  'Muebles antiguos':'El mueble antiguo es función y forma en equilibrio. Cada estilo refleja una época, una escuela de diseño y un contexto social determinado.',
  'Arte contemporáneo':'El arte contemporáneo interpela el presente. Convoca a la reflexión sobre el tiempo, el cuerpo, la identidad, la política y los materiales del mundo actual.',
  'Arte religioso':  'El arte de devoción concentra siglos de espiritualidad, iconografía y oficio artesanal. Cada pieza es un documento de fe, cultura y tradición visual.',
  'Platería criolla':'La platería criolla es una de las expresiones más originales del arte rioplatense. Combina técnicas europeas con materiales y formas propias del territorio americano.',
  'Objetos decorativos':'Los objetos decorativos revelan los gustos estéticos de una época y una clase social. Son parte de la historia del diseño y de la cultura material.',
  'Libros y documentos':'Los documentos y libros son patrimonio inmaterial hecho objeto. Preservar un libro antiguo o manuscrito es preservar parte de la memoria cultural de un pueblo.',
};

function renderValorCultural(obra) {
  const campos = [
    { label: 'Época',          dato: obra.epoca,    desc: obra.epoca   ? `Obra correspondiente al período ${obra.epoca}.` : null },
    { label: 'Origen',         dato: obra.origen,   desc: obra.origen  ? `Pieza de origen ${obra.origen} dentro del catálogo federal.` : null },
    { label: 'Estilo',         dato: obra.estilo,   desc: obra.estilo  ? `Estilo ${obra.estilo}: corriente que define una forma particular de crear y significar.` : null },
    { label: 'Técnica',        dato: obra.tecnica,  desc: obra.tecnica ? `Realizada en ${obra.tecnica}, técnica que determina textura, durabilidad y expresión de la obra.` : null },
  ].filter(f => f.dato);

  if (campos.length < 2) return;

  document.getElementById('sec-valor').style.display = 'block';
  document.getElementById('valor-grid').innerHTML = campos.map(f => `
    <div class="valor-card">
      <p class="valor-card-eyebrow">${f.label}</p>
      <p class="valor-card-dato">${f.dato}</p>
      ${f.desc ? `<p class="valor-card-desc">${f.desc}</p>` : ''}
    </div>`).join('');

  const nota = contextoEditorial[obra.categoria] || '';
  if (nota) document.getElementById('valor-nota').textContent = nota;
}

/* ─── FICHA TÉCNICA ─── */

function renderFichaTecnica(obra) {
  const campos = [
    { label:'Categoría',     valor: obra.categoria },
    { label:'Subcategoría',  valor: obra.subcategoria },
    { label:'Técnica',       valor: obra.tecnica },
    { label:'Medidas',       valor: obra.medidas },
    { label:'Material',      valor: obra.material },
    { label:'Año / Período', valor: obra.anio },
    { label:'Época',         valor: obra.epoca },
    { label:'Origen',        valor: obra.origen },
    { label:'Estilo',        valor: obra.estilo },
    { label:'Modo de venta', valor: ({ venta_directa:'Venta directa', subasta:'Subasta', consulta:'Consulta' })[obra.modo_venta] },
    { label:'Provincia',     valor: obra.provincia },
    { label:'Ciudad',        valor: obra.ciudad },
  ].filter(f => f.valor);

  if (campos.length < 3) return;
  document.getElementById('sec-ficha').style.display = 'block';
  document.getElementById('ficha-grid').innerHTML = campos.map(f => `
    <div class="ficha-celda">
      <span class="fc-label">${f.label}</span>
      <span class="fc-valor">${f.valor}</span>
    </div>`).join('');
}

/* ─── OPERACIÓN COMERCIAL ─── */

function renderOperacion(obra) {
  const modoTexto = { venta_directa:'Venta directa', subasta:'Subasta', consulta:'Por consulta' };
  const estadoTexto = { disponible:'Disponible', reservado:'Reservada', vendido:'Vendida' };
  const estadoColor = { disponible:'disponible-color', reservado:'reservado-color', vendido:'vendido-color' };
  const precio = formatPrecio(obra.precio, obra.moneda);

  document.getElementById('operacion-grid').innerHTML = `
    <div class="op-item">
      <span class="op-label">Modalidad de venta</span>
      <span class="op-valor">${modoTexto[obra.modo_venta] || obra.modo_venta || '—'}</span>
    </div>
    <div class="op-item">
      <span class="op-label">Estado de la pieza</span>
      <span class="op-valor ${estadoColor[obra.estado] || ''}">${estadoTexto[obra.estado] || obra.estado || '—'}</span>
    </div>
    <div class="op-item">
      <span class="op-label">Precio</span>
      <span class="op-valor">${precio || 'A consultar con el vendedor'}</span>
    </div>
    <div class="op-item">
      <span class="op-label">Contacto</span>
      <span class="op-valor">${obra.whatsapp_contacto ? 'WhatsApp disponible' : 'Consultar a través de OBRA VIVA'}</span>
    </div>
    <div class="op-item">
      <span class="op-label">Envío y retiro</span>
      <span class="op-valor">Coordinado entre comprador y vendedor</span>
    </div>
    <div class="op-item">
      <span class="op-label">Documentación</span>
      <span class="op-valor">Consultar disponibilidad con el vendedor</span>
    </div>`;
}

/* ─── VENDEDOR AVANZADO ─── */

function renderVendedor(obra) {
  const tipo      = capTipo(obra.tipo_vendedor);
  const ubic      = [obra.ciudad, obra.provincia].filter(Boolean).join(', ');
  const ini       = inicial(obra.artista_vendedor);
  const verif     = obra.verificado;

  const especialidades = {
    artista:       'Artista independiente con obra propia publicada en el catálogo federal de OBRA VIVA.',
    galeria:       'Galería con selección curatorial propia. Representa artistas y gestiona la circulación de obras en el mercado argentino.',
    anticuario:    'Anticuario especializado en piezas con valor histórico, artístico o cultural. Integrante de la red de especialistas de OBRA VIVA.',
    coleccionista: 'Coleccionista privado que pone en circulación piezas de su acervo personal dentro de la red cultural de OBRA VIVA.',
    feria:         'Participante activo de ferias culturales y de anticuarios dentro del circuito nacional.',
    especialista:  'Especialista en arte, antigüedades u objetos de valor cultural. Publicaciones revisadas por el equipo de OBRA VIVA.',
  };

  document.getElementById('vendedor-avanzado').innerHTML = `
    <div class="vendedor-top">
      <div class="vendedor-avatar">${ini}</div>
      <div class="vendedor-info-col">
        <p class="vendedor-nombre">${obra.artista_vendedor || '—'}</p>
        <span class="vendedor-tipo-badge">${tipo}</span>
        ${ubic ? `<p class="vendedor-ubic">${svgUbic()} ${ubic}</p>` : ''}
        ${verif ? `<span class="vendedor-verificado-badge">◎ Vendedor verificado</span>` : ''}
      </div>
    </div>
    <div class="vendedor-sep"></div>
    <p class="vendedor-meta">${especialidades[obra.tipo_vendedor] || 'Publicador activo dentro de la red cultural de OBRA VIVA.'}</p>
    <div class="vendedor-acciones">
      <a href="#" class="vendedor-btn" title="Próximamente disponible">Ver perfil del vendedor</a>
      <a href="#" class="vendedor-btn" title="Próximamente disponible">Ver más piezas</a>
      <span class="vendedor-btn-nota">Perfiles completos — próximamente</span>
    </div>`;
}

/* ─── CONSULTA COMERCIAL (SECCIÓN NEGRA) ─── */

function renderConsulta(obra) {
  const wpp = obra.whatsapp_contacto || null;
  const msg = wppMsg(obra);
  const el  = document.getElementById('consulta-acciones');

  if (obra.estado === 'vendido') {
    el.innerHTML = `<a href="index.html#catalogo" class="btn-consulta-primario">Ver obras similares →</a>`;
    return;
  }

  el.innerHTML = wpp
    ? `<a href="https://wa.me/${wpp}?text=${msg}" target="_blank" class="btn-consulta-primario">${svgMsg()} Consultar disponibilidad</a>
       <a href="index.html#catalogo" class="btn-consulta-sec">Explorar más obras →</a>`
    : `<div class="btn-consulta-disabled">Consultas no disponibles por ahora</div>
       <a href="index.html#catalogo" class="btn-consulta-sec">Explorar más obras →</a>`;
}

/* ─── CARGA PRINCIPAL ─── */

async function cargarObra() {
  ui(true, false, false);

  const id = param('id');
  if (!id) { ui(false, true, false); return; }

  const { data: obra, error } = await sb
    .from('obras')
    .select('*')
    .eq('id', id)
    .eq('activo', true)
    .single();

  if (error || !obra) { ui(false, true, false); return; }

  // Renderizar todo
  og(obra);
  renderBreadcrumb(obra);
  await renderGaleria(obra);       // async: carga obra_imagenes
  renderBadges(obra);
  renderDatosPrincipales(obra);
  renderPrecio(obra);
  renderEstado(obra);
  renderAcciones(obra);
  renderFichaRapida(obra);
  renderCuraduria(obra);
  renderDescripcion(obra);
  renderValorCultural(obra);
  renderFichaTecnica(obra);
  renderOperacion(obra);
  renderVendedor(obra);
  renderConsulta(obra);

  ui(false, false, true);
}

/* ─── INIT ─── */
document.addEventListener('DOMContentLoaded', cargarObra);
