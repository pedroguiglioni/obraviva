/* =========================================
   OBRA VIVA · admin.js · Etapa 2
   TODO: migrar a Supabase Auth
   ========================================= */

const SUPABASE_URL = 'https://kcslaqmxxmcprkjhaidm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtjc2xhcW14eG1jcHJramhhaWRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3Mjg3MTQsImV4cCI6MjA5MjMwNDcxNH0.ZV-NRcGmrywoXLgWMj8sBvHbbxzcX3nzfKL1DhFnpX0';
const ADMIN_PASSWORD = 'obraviva2026';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let obrasCache     = [];
let idParaEliminar = null;
let tabActual      = 0;

/* =========================================
   LOGIN
   ========================================= */
function intentarLogin() {
  const pass = document.getElementById('login-password').value;
  const err  = document.getElementById('login-error');
  if (pass === ADMIN_PASSWORD) {
    document.getElementById('login-screen').style.display  = 'none';
    document.getElementById('admin-panel').style.display   = 'flex';
    iniciarAdmin();
  } else {
    err.textContent = 'Contraseña incorrecta.';
    document.getElementById('login-password').value = '';
    document.getElementById('login-password').focus();
  }
}
document.getElementById('login-password').addEventListener('keydown', e => {
  if (e.key === 'Enter') intentarLogin();
});
function cerrarSesion() {
  document.getElementById('admin-panel').style.display  = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('login-password').value = '';
}

/* =========================================
   NAVEGACIÓN
   ========================================= */
function mostrarSeccion(seccion) {
  document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
  const nav = document.getElementById('nav-' + seccion);
  if (nav) nav.classList.add('active');
  document.getElementById('page-title').textContent = seccion === 'dashboard' ? 'Dashboard' : 'Gestión de obras';
}

/* =========================================
   INICIAR
   ========================================= */
async function iniciarAdmin() {
  await verificarConexion();
  await cargarObras();
  await actualizarMetricas();
}

async function verificarConexion() {
  const dot   = document.getElementById('status-dot');
  const texto = document.getElementById('status-text');
  const { error } = await sb.from('obras').select('id').limit(1);
  if (error) {
    dot.className = 'status-dot error';
    texto.textContent = 'Sin conexión';
  } else {
    dot.className = 'status-dot conectado';
    texto.textContent = 'Conectado';
  }
}

/* =========================================
   MÉTRICAS
   ========================================= */
async function actualizarMetricas() {
  const { data } = await sb.from('obras').select('estado, destacado, activo, imagen_portada');
  if (!data) return;
  document.getElementById('m-total').textContent      = data.length;
  document.getElementById('m-activas').textContent    = data.filter(o => o.activo).length;
  document.getElementById('m-destacadas').textContent = data.filter(o => o.destacado).length;
  document.getElementById('m-reservadas').textContent = data.filter(o => o.estado === 'reservado').length;
  document.getElementById('m-vendidas').textContent   = data.filter(o => o.estado === 'vendido').length;
  document.getElementById('m-sin-imagen').textContent = data.filter(o => !o.imagen_portada).length;
}

/* =========================================
   CARGAR OBRAS
   ========================================= */
async function cargarObras() {
  mostrarLoading(true);
  const { data, error } = await sb.from('obras').select('*').order('created_at', { ascending: false });
  mostrarLoading(false);
  if (error) { mostrarMsg('Error al cargar obras: ' + error.message, 'error'); return; }
  obrasCache = data || [];
  renderizarTabla(obrasCache);
}

function renderizarTabla(obras) {
  const tbody = document.getElementById('tabla-body');
  const tabla = document.getElementById('tabla-obras');
  const vacia = document.getElementById('tabla-vacia');

  if (!obras || obras.length === 0) {
    tabla.style.display = 'none';
    vacia.style.display = 'block';
    return;
  }

  tabla.style.display = '';
  vacia.style.display = 'none';

  tbody.innerHTML = obras.map(obra => {
    const precio = formatPrecio(obra.precio, obra.moneda);
    const tipo   = capitalizarTipo(obra.tipo_vendedor);
    const fecha  = obra.created_at ? new Date(obra.created_at).toLocaleDateString('es-AR') : '—';

    const img = obra.imagen_portada
      ? `<img src="${obra.imagen_portada}" alt="${obra.titulo}" class="tabla-thumb" />`
      : `<div class="tabla-thumb-placeholder">Sin<br>imagen</div>`;

    const badges = [
      obra.curado     ? `<span class="badge-pill curado">Curado</span>`     : '',
      obra.verificado ? `<span class="badge-pill verificado">Verif.</span>` : '',
      obra.destacado  ? `<span class="badge-pill destacado">Dest.</span>`   : '',
    ].filter(Boolean).join('') || '<span style="color:#C8C4BE;font-size:10px">—</span>';

    const accionDesact = obra.activo
      ? `<button class="btn-accion desactivar" onclick="desactivarObra('${obra.id}')">Desactivar</button>`
      : `<button class="btn-accion activar" onclick="activarObra('${obra.id}')">Activar</button>`;

    return `<tr>
      <td>${img}</td>
      <td><div class="tabla-titulo">${obra.titulo}</div><div class="tabla-fecha">${fecha}</div></td>
      <td>${obra.categoria || '—'}${obra.subcategoria ? `<br><span style="font-size:10px;color:#9A9590">${obra.subcategoria}</span>` : ''}</td>
      <td>${obra.artista_vendedor || '—'}${tipo ? `<br><span style="font-size:10px;color:#9A9590">${tipo}</span>` : ''}</td>
      <td>${obra.provincia || '—'}</td>
      <td style="white-space:nowrap;font-weight:500">${precio}</td>
      <td><span class="estado-pill ${obra.estado || ''}">${obra.estado || '—'}</span></td>
      <td>${badges}</td>
      <td><span class="${obra.activo ? 'activo-si' : 'activo-no'}">${obra.activo ? '● Activa' : '○ Inactiva'}</span></td>
      <td>
        <div class="acciones">
          <button class="btn-accion editar" onclick="editarObra('${obra.id}')">Editar</button>
          ${accionDesact}
          <div class="btn-accion-sep"></div>
          <button class="btn-accion eliminar" onclick="confirmarEliminar('${obra.id}')" title="Eliminar">✕</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

/* =========================================
   HELPERS
   ========================================= */
function formatPrecio(precio, moneda) {
  if (!precio) return '<span style="color:#9A9590">Consultar</span>';
  const simbolo = moneda === 'USD' ? 'U$D' : '$';
  return `${simbolo} ${Number(precio).toLocaleString('es-AR')}`;
}

function capitalizarTipo(tipo) {
  const map = { artista:'Artista', galeria:'Galería', anticuario:'Anticuario', coleccionista:'Coleccionista', feria:'Feria', especialista:'Especialista' };
  return map[tipo] || tipo || '';
}

/* =========================================
   FILTROS
   ========================================= */
function aplicarFiltros() {
  const buscar    = document.getElementById('filtro-buscar').value.toLowerCase();
  const categoria = document.getElementById('filtro-categoria').value;
  const estado    = document.getElementById('filtro-estado').value;
  const provincia = document.getElementById('filtro-provincia').value;
  const destacado = document.getElementById('filtro-destacado').value;
  const imagen    = document.getElementById('filtro-imagen').value;
  const activo    = document.getElementById('filtro-activo').value;

  const resultado = obrasCache.filter(obra => {
    const matchBuscar    = !buscar || (obra.titulo||'').toLowerCase().includes(buscar) || (obra.artista_vendedor||'').toLowerCase().includes(buscar);
    const matchCat       = !categoria || obra.categoria === categoria;
    const matchEstado    = !estado    || obra.estado === estado;
    const matchProvincia = !provincia || obra.provincia === provincia;
    const matchDestacado = destacado === '' ? true : obra.destacado === (destacado === 'true');
    const matchImagen    = !imagen || (imagen === 'con' ? !!obra.imagen_portada : !obra.imagen_portada);
    const matchActivo    = activo === '' ? true : obra.activo === (activo === 'true');
    return matchBuscar && matchCat && matchEstado && matchProvincia && matchDestacado && matchImagen && matchActivo;
  });

  renderizarTabla(resultado);
}

function limpiarFiltros() {
  ['filtro-buscar','filtro-categoria','filtro-estado','filtro-provincia','filtro-destacado','filtro-imagen','filtro-activo']
    .forEach(id => { document.getElementById(id).value = ''; });
  renderizarTabla(obrasCache);
}

/* =========================================
   DRAWER — ABRIR / CERRAR
   ========================================= */
function abrirDrawer(obra = null) {
  limpiarFormulario();
  irTab(0);

  document.getElementById('drawer-title').textContent    = obra ? 'Editar obra' : 'Nueva obra';
  document.getElementById('drawer-subtitle').textContent = obra ? 'Modificá los datos de esta pieza' : 'Completá los datos para publicar en OBRA VIVA';

  if (obra) {
    document.getElementById('form-id').value            = obra.id;
    document.getElementById('form-titulo').value        = obra.titulo || '';
    document.getElementById('form-artista').value       = obra.artista_vendedor || '';
    document.getElementById('form-categoria').value     = obra.categoria || '';
    document.getElementById('form-subcategoria').value  = obra.subcategoria || '';
    document.getElementById('form-tipo-vendedor').value = obra.tipo_vendedor || '';
    document.getElementById('form-whatsapp').value      = obra.whatsapp_contacto || '';
    document.getElementById('form-provincia').value     = obra.provincia || '';
    document.getElementById('form-ciudad').value        = obra.ciudad || '';
    document.getElementById('form-descripcion').value   = obra.descripcion || '';
    document.getElementById('form-precio').value        = obra.precio || '';
    document.getElementById('form-moneda').value        = obra.moneda || 'ARS';
    document.getElementById('form-modo').value          = obra.modo_venta || 'venta_directa';
    document.getElementById('form-estado').value        = obra.estado || 'disponible';
    document.getElementById('form-orden').value         = obra.orden || 0;
    document.getElementById('form-precio-base').value   = obra.precio_base || '';
    if (obra.fecha_cierre_subasta) document.getElementById('form-fecha-cierre').value = obra.fecha_cierre_subasta.slice(0,16);
    document.getElementById('form-tecnica').value       = obra.tecnica || '';
    document.getElementById('form-medidas').value       = obra.medidas || '';
    document.getElementById('form-anio').value          = obra.anio || '';
    document.getElementById('form-epoca').value         = obra.epoca || '';
    document.getElementById('form-origen').value        = obra.origen || '';
    document.getElementById('form-material').value      = obra.material || '';
    document.getElementById('form-estilo').value        = obra.estilo || '';
    document.getElementById('form-imagen').value        = obra.imagen_portada || '';
    document.getElementById('form-destacado').checked  = obra.destacado  === true;
    document.getElementById('form-curado').checked     = obra.curado     === true;
    document.getElementById('form-verificado').checked = obra.verificado === true;
    document.getElementById('form-activo').checked     = obra.activo     !== false;

    if (obra.imagen_portada) {
      document.getElementById('imagen-preview').src              = obra.imagen_portada;
      document.getElementById('imagen-preview-grande').style.display = 'block';
      document.getElementById('imagen-upload-zone').style.display    = 'none';
    }

    toggleCamposSubasta();
  }

  document.getElementById('drawer-overlay').style.display = 'flex';
  setTimeout(() => document.getElementById('drawer').classList.add('abierto'), 10);
}

function editarObra(id) {
  const obra = obrasCache.find(o => o.id === id);
  if (obra) abrirDrawer(obra);
}

function cerrarDrawer() {
  document.getElementById('drawer').classList.remove('abierto');
  setTimeout(() => {
    document.getElementById('drawer-overlay').style.display = 'none';
    limpiarFormulario();
  }, 300);
}

function cerrarDrawerSiOverlay(e) {
  if (e.target === document.getElementById('drawer-overlay')) cerrarDrawer();
}

function limpiarFormulario() {
  document.getElementById('form-id').value = '';
  ['form-titulo','form-artista','form-subcategoria','form-whatsapp','form-ciudad',
   'form-descripcion','form-precio','form-orden','form-precio-base','form-fecha-cierre',
   'form-tecnica','form-medidas','form-anio','form-epoca','form-origen','form-material',
   'form-estilo','form-imagen']
    .forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });

  document.getElementById('form-categoria').value    = '';
  document.getElementById('form-tipo-vendedor').value= '';
  document.getElementById('form-provincia').value    = '';
  document.getElementById('form-moneda').value       = 'ARS';
  document.getElementById('form-modo').value         = 'venta_directa';
  document.getElementById('form-estado').value       = 'disponible';
  document.getElementById('form-destacado').checked  = false;
  document.getElementById('form-curado').checked     = false;
  document.getElementById('form-verificado').checked = false;
  document.getElementById('form-activo').checked     = true;
  document.getElementById('imagen-preview-grande').style.display = 'none';
  document.getElementById('imagen-upload-zone').style.display    = 'block';
  document.getElementById('form-imagen-file').value              = '';
  document.getElementById('campos-subasta').style.display        = 'none';

  ['err-titulo','err-artista','err-categoria','err-tipo'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
  ['form-titulo','form-artista','form-categoria','form-tipo-vendedor'].forEach(id => {
    document.getElementById(id)?.classList.remove('error-field');
  });
}

/* =========================================
   TABS
   ========================================= */
function irTab(n) {
  const total = 5;
  tabActual = n;

  for (let i = 0; i < total; i++) {
    const tab  = document.getElementById(`tab-${i}`);
    const body = document.getElementById(`drawer-tab-${i}`);
    if (tab)  tab.classList.toggle('active', i === n);
    if (body) body.style.display = i === n ? 'block' : 'none';
  }

  document.getElementById('btn-anterior').style.display = n > 0 ? 'inline-block' : 'none';
  document.getElementById('btn-siguiente').style.display = n < total - 1 ? 'inline-block' : 'none';
}

function tabSiguiente() {
  if (tabActual < 4) irTab(tabActual + 1);
}

function tabAnterior() {
  if (tabActual > 0) irTab(tabActual - 1);
}

function toggleCamposSubasta() {
  const modo = document.getElementById('form-modo').value;
  document.getElementById('campos-subasta').style.display = modo === 'subasta' ? 'block' : 'none';
}

/* =========================================
   IMAGEN
   ========================================= */
function previsualizarImagen() {
  const file = document.getElementById('form-imagen-file').files[0];
  if (!file) return;

  if (file.size > 10 * 1024 * 1024) {
    mostrarMsg('La imagen es muy grande. Recomendamos menos de 5MB.', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('imagen-preview').src              = e.target.result;
    document.getElementById('imagen-preview-grande').style.display = 'block';
    document.getElementById('imagen-upload-zone').style.display    = 'none';
  };
  reader.readAsDataURL(file);
}

function actualizarPreviewUrl() {
  const url = document.getElementById('form-imagen').value.trim();
  if (url) {
    document.getElementById('imagen-preview').src              = url;
    document.getElementById('imagen-preview-grande').style.display = 'block';
    document.getElementById('imagen-upload-zone').style.display    = 'none';
  }
}

function reemplazarImagen() {
  document.getElementById('imagen-preview-grande').style.display = 'none';
  document.getElementById('imagen-upload-zone').style.display    = 'block';
  document.getElementById('form-imagen-file').value              = '';
  document.getElementById('form-imagen').value                   = '';
}

function quitarImagen() {
  reemplazarImagen();
}

/* =========================================
   VALIDACIÓN
   ========================================= */
function validarFormulario() {
  let valido = true;

  const campos = [
    { id: 'form-titulo',       err: 'err-titulo',   msg: 'El título es obligatorio.' },
    { id: 'form-artista',      err: 'err-artista',  msg: 'El artista o vendedor es obligatorio.' },
    { id: 'form-categoria',    err: 'err-categoria', msg: 'Seleccioná una categoría.' },
    { id: 'form-tipo-vendedor',err: 'err-tipo',      msg: 'Seleccioná el tipo de vendedor.' },
  ];

  campos.forEach(({ id, err, msg }) => {
    const el    = document.getElementById(id);
    const errEl = document.getElementById(err);
    if (!el.value.trim()) {
      el.classList.add('error-field');
      if (errEl) errEl.textContent = msg;
      valido = false;
    } else {
      el.classList.remove('error-field');
      if (errEl) errEl.textContent = '';
    }
  });

  if (!valido) {
    irTab(0);
    mostrarMsg('Completá los campos obligatorios antes de guardar.', 'error');
  }

  return valido;
}

/* =========================================
   GUARDAR OBRA
   ========================================= */
async function guardarObra() {
  if (!validarFormulario()) return;

  const id  = document.getElementById('form-id').value;
  const btn = document.getElementById('btn-guardar');
  btn.disabled    = true;
  btn.textContent = 'Guardando…';

  let imagenUrl = document.getElementById('form-imagen').value.trim() || null;
  const file    = document.getElementById('form-imagen-file').files[0];
  if (file) imagenUrl = await subirImagen(file, id || 'nueva');

  const modo = document.getElementById('form-modo').value;

  const datos = {
    titulo:              document.getElementById('form-titulo').value.trim(),
    artista_vendedor:    document.getElementById('form-artista').value.trim(),
    categoria:           document.getElementById('form-categoria').value,
    subcategoria:        document.getElementById('form-subcategoria').value.trim() || null,
    tipo_vendedor:       document.getElementById('form-tipo-vendedor').value,
    whatsapp_contacto:   document.getElementById('form-whatsapp').value.trim() || null,
    provincia:           document.getElementById('form-provincia').value || null,
    ciudad:              document.getElementById('form-ciudad').value.trim() || null,
    descripcion:         document.getElementById('form-descripcion').value.trim() || null,
    precio:              document.getElementById('form-precio').value || null,
    moneda:              document.getElementById('form-moneda').value,
    modo_venta:          modo,
    estado:              document.getElementById('form-estado').value,
    orden:               parseInt(document.getElementById('form-orden').value) || 0,
    precio_base:         modo === 'subasta' ? (document.getElementById('form-precio-base').value || null) : null,
    fecha_cierre_subasta:modo === 'subasta' ? (document.getElementById('form-fecha-cierre').value || null) : null,
    tecnica:             document.getElementById('form-tecnica').value.trim() || null,
    medidas:             document.getElementById('form-medidas').value.trim() || null,
    anio:                document.getElementById('form-anio').value.trim() || null,
    epoca:               document.getElementById('form-epoca').value.trim() || null,
    origen:              document.getElementById('form-origen').value.trim() || null,
    material:            document.getElementById('form-material').value.trim() || null,
    estilo:              document.getElementById('form-estilo').value.trim() || null,
    imagen_portada:      imagenUrl,
    destacado:           document.getElementById('form-destacado').checked,
    curado:              document.getElementById('form-curado').checked,
    verificado:          document.getElementById('form-verificado').checked,
    activo:              document.getElementById('form-activo').checked,
  };

  let error;
  if (id) {
    ({ error } = await sb.from('obras').update(datos).eq('id', id));
  } else {
    ({ error } = await sb.from('obras').insert([datos]));
  }

  btn.disabled    = false;
  btn.textContent = 'Guardar obra';

  if (error) {
    mostrarMsg('Error al guardar: ' + error.message, 'error');
  } else {
    mostrarMsg(id ? '✓ Obra actualizada correctamente.' : '✓ Obra creada correctamente.', 'ok');
    await cargarObras();
    await actualizarMetricas();
    cerrarDrawer();
  }
}

/* =========================================
   SUBIR IMAGEN
   ========================================= */
async function subirImagen(file, obraId) {
  const ext    = file.name.split('.').pop();
  const nombre = `obra-${obraId}-${Date.now()}.${ext}`;
  const { error } = await sb.storage.from('obras-imagenes').upload(nombre, file, { upsert: true });
  if (error) { mostrarMsg('Error al subir imagen: ' + error.message, 'error'); return null; }
  const { data: urlData } = sb.storage.from('obras-imagenes').getPublicUrl(nombre);
  return urlData.publicUrl;
}

/* =========================================
   DESACTIVAR / ACTIVAR
   ========================================= */
async function desactivarObra(id) {
  const { error } = await sb.from('obras').update({ activo: false }).eq('id', id);
  if (error) {
    mostrarMsg('Error al desactivar: ' + error.message, 'error');
  } else {
    mostrarMsg('✓ Obra desactivada. Sigue en la base de datos pero no aparece en la web.', 'ok');
    await cargarObras();
    await actualizarMetricas();
  }
}

async function activarObra(id) {
  const { error } = await sb.from('obras').update({ activo: true }).eq('id', id);
  if (error) {
    mostrarMsg('Error al activar: ' + error.message, 'error');
  } else {
    mostrarMsg('✓ Obra activada correctamente.', 'ok');
    await cargarObras();
    await actualizarMetricas();
  }
}

/* =========================================
   ELIMINAR
   ========================================= */
function confirmarEliminar(id) {
  idParaEliminar = id;
  document.getElementById('modal-confirmar').style.display = 'flex';
}

function cerrarConfirmar() {
  idParaEliminar = null;
  document.getElementById('modal-confirmar').style.display = 'none';
}

async function eliminarConfirmado() {
  if (!idParaEliminar) return;
  const { error } = await sb.from('obras').delete().eq('id', idParaEliminar);
  cerrarConfirmar();
  if (error) {
    mostrarMsg('Error al eliminar: ' + error.message, 'error');
  } else {
    mostrarMsg('Obra eliminada definitivamente.', 'ok');
    await cargarObras();
    await actualizarMetricas();
  }
}

/* =========================================
   UI HELPERS
   ========================================= */
function mostrarLoading(show) {
  document.getElementById('tabla-loading').style.display = show ? 'block' : 'none';
  if (show) {
    document.getElementById('tabla-obras').style.display = 'none';
    document.getElementById('tabla-vacia').style.display = 'none';
  }
}

function mostrarMsg(texto, tipo) {
  const el = document.getElementById('admin-msg');
  el.textContent   = texto;
  el.className     = `admin-msg ${tipo}`;
  el.style.display = 'flex';
  clearTimeout(el._timeout);
  el._timeout = setTimeout(() => { el.style.display = 'none'; }, 5000);
}
