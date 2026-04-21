/* =========================================
   OBRA VIVA · admin.js
   Panel de Administración
   TODO: reemplazar password por Supabase Auth
   ========================================= */

const SUPABASE_URL = 'https://kcslaqmxxmcprkjhaidm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtjc2xhcW14eG1jcHJramhhaWRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3Mjg3MTQsImV4cCI6MjA5MjMwNDcxNH0.ZV-NRcGmrywoXLgWMj8sBvHbbxzcX3nzfKL1DhFnpX0';

// TODO: mover a Supabase Auth cuando implementemos login real
const ADMIN_PASSWORD = 'obraviva2026';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let obrasCache = [];
let idParaEliminar = null;

/* =========================================
   LOGIN
   ========================================= */
function intentarLogin() {
  const pass = document.getElementById('login-password').value;
  const err  = document.getElementById('login-error');
  if (pass === ADMIN_PASSWORD) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-panel').style.display  = 'block';
    iniciarAdmin();
  } else {
    err.textContent = 'Contraseña incorrecta.';
    document.getElementById('login-password').value = '';
  }
}

document.getElementById('login-password').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') intentarLogin();
});

function cerrarSesion() {
  document.getElementById('admin-panel').style.display  = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('login-password').value = '';
}

/* =========================================
   INICIAR ADMIN
   ========================================= */
async function iniciarAdmin() {
  await verificarConexion();
  await cargarObras();
  await actualizarMetricas();
}

async function verificarConexion() {
  const dot   = document.querySelector('.status-dot');
  const texto = document.getElementById('supabase-status');
  const { error } = await sb.from('obras').select('id').limit(1);
  if (error) {
    dot.className   = 'status-dot error';
    texto.innerHTML = '<span class="status-dot error"></span> Sin conexión';
  } else {
    dot.className   = 'status-dot conectado';
    texto.innerHTML = '<span class="status-dot conectado"></span> Conectado';
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
  const { data, error } = await sb
    .from('obras')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    mostrarLoading(false);
    mostrarMsg('Error al cargar obras: ' + error.message, 'error');
    return;
  }
  obrasCache = data || [];
  renderizarTabla(obrasCache);
  mostrarLoading(false);
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

  tbody.innerHTML = obras.map(obra => `
    <tr>
      <td>
        ${obra.imagen_portada
          ? `<img src="${obra.imagen_portada}" alt="${obra.titulo}" class="tabla-thumb" />`
          : `<div class="tabla-thumb-placeholder">Sin img</div>`}
      </td>
      <td>
        <div class="tabla-titulo">${obra.titulo}</div>
        <div style="font-size:10px;color:#9A9590;margin-top:2px">${obra.ciudad || ''}${obra.ciudad && obra.created_at ? ' · ' : ''}${obra.created_at ? new Date(obra.created_at).toLocaleDateString('es-AR') : ''}</div>
      </td>
      <td>${obra.categoria || '—'}<br><span style="font-size:10px;color:#9A9590">${obra.subcategoria || ''}</span></td>
      <td>${obra.artista_vendedor || '—'}<br><span style="font-size:10px;color:#9A9590">${obra.tipo_vendedor || ''}</span></td>
      <td>${obra.provincia || '—'}</td>
      <td style="white-space:nowrap">${obra.precio ? '$ ' + Number(obra.precio).toLocaleString('es-AR') : 'Consultar'}</td>
      <td><span class="estado-pill ${obra.estado}">${obra.estado || '—'}</span></td>
      <td>
        ${obra.curado    ? '<span class="badge-pill curado">Curado</span>'     : ''}
        ${obra.verificado? '<span class="badge-pill verificado">Verif.</span>' : ''}
        ${obra.destacado ? '<span class="badge-pill curado">Dest.</span>'      : ''}
      </td>
      <td><span class="activo-pill ${obra.activo ? 'si' : 'no'}">${obra.activo ? '● Activa' : '○ Inactiva'}</span></td>
      <td>
        <div class="acciones">
          <button class="btn-accion editar" onclick="editarObra('${obra.id}')">Editar</button>
          ${obra.activo
            ? `<button class="btn-accion" onclick="confirmarEliminar('${obra.id}')">Desactivar</button>`
            : `<button class="btn-accion editar" onclick="activarObra('${obra.id}')">Activar</button>`}
          <button class="btn-accion eliminar" onclick="confirmarEliminar('${obra.id}')">Eliminar</button>
        </div>
      </td>
    </tr>`).join('');
}

/* =========================================
   FILTROS
   ========================================= */
function aplicarFiltros() {
  const buscar    = document.getElementById('filtro-buscar').value.toLowerCase();
  const categoria = document.getElementById('filtro-categoria').value;
  const estado    = document.getElementById('filtro-estado').value;
  const activo    = document.getElementById('filtro-activo').value;

  let resultado = obrasCache.filter(obra => {
    const matchBuscar = !buscar ||
      (obra.titulo && obra.titulo.toLowerCase().includes(buscar)) ||
      (obra.artista_vendedor && obra.artista_vendedor.toLowerCase().includes(buscar));
    const matchCat    = !categoria || obra.categoria === categoria;
    const matchEstado = !estado    || obra.estado === estado;
    const matchActivo = activo === '' ? true : obra.activo === (activo === 'true');
    return matchBuscar && matchCat && matchEstado && matchActivo;
  });

  renderizarTabla(resultado);
}

function limpiarFiltros() {
  document.getElementById('filtro-buscar').value    = '';
  document.getElementById('filtro-categoria').value = '';
  document.getElementById('filtro-estado').value    = '';
  document.getElementById('filtro-activo').value    = '';
  renderizarTabla(obrasCache);
}

/* =========================================
   FORMULARIO — ABRIR / CERRAR
   ========================================= */
function abrirFormulario(obra = null) {
  limpiarFormulario();
  document.getElementById('modal-title').textContent = obra ? 'Editar obra' : 'Nueva obra';

  if (obra) {
    document.getElementById('form-id').value          = obra.id;
    document.getElementById('form-titulo').value      = obra.titulo || '';
    document.getElementById('form-artista').value     = obra.artista_vendedor || '';
    document.getElementById('form-categoria').value   = obra.categoria || '';
    document.getElementById('form-subcategoria').value= obra.subcategoria || '';
    document.getElementById('form-tipo-vendedor').value= obra.tipo_vendedor || '';
    document.getElementById('form-whatsapp').value    = obra.whatsapp_contacto || '';
    document.getElementById('form-provincia').value   = obra.provincia || '';
    document.getElementById('form-ciudad').value      = obra.ciudad || '';
    document.getElementById('form-precio').value      = obra.precio || '';
    document.getElementById('form-moneda').value      = obra.moneda || 'ARS';
    document.getElementById('form-modo').value        = obra.modo_venta || 'venta_directa';
    document.getElementById('form-estado').value      = obra.estado || 'disponible';
    document.getElementById('form-orden').value       = obra.orden || 0;
    document.getElementById('form-tecnica').value     = obra.tecnica || '';
    document.getElementById('form-medidas').value     = obra.medidas || '';
    document.getElementById('form-anio').value        = obra.anio || '';
    document.getElementById('form-epoca').value       = obra.epoca || '';
    document.getElementById('form-origen').value      = obra.origen || '';
    document.getElementById('form-material').value    = obra.material || '';
    document.getElementById('form-estilo').value      = obra.estilo || '';
    document.getElementById('form-descripcion').value = obra.descripcion || '';
    document.getElementById('form-imagen').value      = obra.imagen_portada || '';
    document.getElementById('form-destacado').checked = obra.destacado || false;
    document.getElementById('form-curado').checked    = obra.curado || false;
    document.getElementById('form-verificado').checked= obra.verificado || false;
    document.getElementById('form-activo').checked    = obra.activo !== false;

    if (obra.imagen_portada) {
      document.getElementById('imagen-preview').src    = obra.imagen_portada;
      document.getElementById('imagen-preview-wrap').style.display = 'block';
    }
  }

  document.getElementById('modal-overlay').style.display = 'flex';
}

function editarObra(id) {
  const obra = obrasCache.find(o => o.id === id);
  if (obra) abrirFormulario(obra);
}

function cerrarFormulario() {
  document.getElementById('modal-overlay').style.display = 'none';
  limpiarFormulario();
}

function cerrarModalSiOverlay(e) {
  if (e.target === document.getElementById('modal-overlay')) cerrarFormulario();
}

function limpiarFormulario() {
  document.getElementById('form-id').value = '';
  ['form-titulo','form-artista','form-categoria','form-subcategoria',
   'form-tipo-vendedor','form-whatsapp','form-provincia','form-ciudad',
   'form-precio','form-tecnica','form-medidas','form-anio','form-epoca',
   'form-origen','form-material','form-estilo','form-descripcion','form-imagen']
    .forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('form-moneda').value  = 'ARS';
  document.getElementById('form-modo').value    = 'venta_directa';
  document.getElementById('form-estado').value  = 'disponible';
  document.getElementById('form-orden').value   = '0';
  document.getElementById('form-destacado').checked = false;
  document.getElementById('form-curado').checked    = false;
  document.getElementById('form-verificado').checked= false;
  document.getElementById('form-activo').checked    = true;
  document.getElementById('imagen-preview-wrap').style.display = 'none';
  document.getElementById('form-imagen-file').value = '';
}

/* =========================================
   GUARDAR OBRA (crear o editar)
   ========================================= */
async function guardarObra() {
  const id    = document.getElementById('form-id').value;
  const titulo = document.getElementById('form-titulo').value.trim();
  const artista= document.getElementById('form-artista').value.trim();
  const cat    = document.getElementById('form-categoria').value;
  const tipo   = document.getElementById('form-tipo-vendedor').value;

  if (!titulo || !artista || !cat || !tipo) {
    mostrarMsg('Completá los campos obligatorios: título, artista, categoría y tipo de vendedor.', 'error');
    return;
  }

  const btn = document.getElementById('btn-guardar');
  btn.disabled = true;
  btn.textContent = 'Guardando...';

  // Subir imagen si hay archivo seleccionado
  let imagenUrl = document.getElementById('form-imagen').value.trim() || null;
  const file = document.getElementById('form-imagen-file').files[0];
  if (file) {
    imagenUrl = await subirImagen(file, id || 'nueva');
  }

  const datos = {
    titulo,
    artista_vendedor:  artista,
    categoria:         cat,
    subcategoria:      document.getElementById('form-subcategoria').value.trim() || null,
    tipo_vendedor:     tipo,
    whatsapp_contacto: document.getElementById('form-whatsapp').value.trim() || null,
    provincia:         document.getElementById('form-provincia').value.trim() || null,
    ciudad:            document.getElementById('form-ciudad').value.trim() || null,
    precio:            document.getElementById('form-precio').value || null,
    moneda:            document.getElementById('form-moneda').value,
    modo_venta:        document.getElementById('form-modo').value,
    estado:            document.getElementById('form-estado').value,
    orden:             parseInt(document.getElementById('form-orden').value) || 0,
    tecnica:           document.getElementById('form-tecnica').value.trim() || null,
    medidas:           document.getElementById('form-medidas').value.trim() || null,
    anio:              document.getElementById('form-anio').value.trim() || null,
    epoca:             document.getElementById('form-epoca').value.trim() || null,
    origen:            document.getElementById('form-origen').value.trim() || null,
    material:          document.getElementById('form-material').value.trim() || null,
    estilo:            document.getElementById('form-estilo').value.trim() || null,
    descripcion:       document.getElementById('form-descripcion').value.trim() || null,
    imagen_portada:    imagenUrl,
    destacado:         document.getElementById('form-destacado').checked,
    curado:            document.getElementById('form-curado').checked,
    verificado:        document.getElementById('form-verificado').checked,
    activo:            document.getElementById('form-activo').checked,
  };

  let error;
  if (id) {
    // EDITAR — UPDATE sin borrar
    ({ error } = await sb.from('obras').update(datos).eq('id', id));
  } else {
    // CREAR — INSERT nueva obra
    ({ error } = await sb.from('obras').insert([datos]));
  }

  btn.disabled = false;
  btn.textContent = 'Guardar obra';

  if (error) {
    mostrarMsg('Error al guardar: ' + error.message, 'error');
  } else {
    mostrarMsg(id ? 'Obra actualizada correctamente.' : 'Obra creada correctamente.', 'ok');
    cerrarFormulario();
    await cargarObras();
    await actualizarMetricas();
  }
}

/* =========================================
   SUBIR IMAGEN A SUPABASE STORAGE
   ========================================= */
async function subirImagen(file, obraId) {
  const ext      = file.name.split('.').pop();
  const nombre   = `obra-${obraId}-${Date.now()}.${ext}`;
  const { data, error } = await sb.storage
    .from('obras-imagenes')
    .upload(nombre, file, { upsert: true });

  if (error) {
    mostrarMsg('Error al subir imagen: ' + error.message, 'error');
    return null;
  }
  const { data: urlData } = sb.storage.from('obras-imagenes').getPublicUrl(nombre);
  return urlData.publicUrl;
}

function previsualizarImagen() {
  const file = document.getElementById('form-imagen-file').files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById('imagen-preview').src = e.target.result;
    document.getElementById('imagen-preview-wrap').style.display = 'block';
  };
  reader.readAsDataURL(file);
}

/* =========================================
   DESACTIVAR / ACTIVAR
   ========================================= */
async function activarObra(id) {
  const { error } = await sb.from('obras').update({ activo: true }).eq('id', id);
  if (error) {
    mostrarMsg('Error al activar: ' + error.message, 'error');
  } else {
    mostrarMsg('Obra activada correctamente.', 'ok');
    await cargarObras();
    await actualizarMetricas();
  }
}

/* =========================================
   ELIMINAR — con doble confirmación
   ========================================= */
function confirmarEliminar(id) {
  idParaEliminar = id;
  document.getElementById('modal-confirmar').style.display = 'flex';
}

function cerrarConfirmar() {
  idParaEliminar = null;
  document.getElementById('modal-confirmar').style.display = 'none';
}

async function desactivarConfirmado() {
  if (!idParaEliminar) return;
  const { error } = await sb.from('obras').update({ activo: false }).eq('id', idParaEliminar);
  cerrarConfirmar();
  if (error) {
    mostrarMsg('Error al desactivar: ' + error.message, 'error');
  } else {
    mostrarMsg('Obra desactivada. Sigue en la base de datos pero no aparece en la web.', 'ok');
    await cargarObras();
    await actualizarMetricas();
  }
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
   HELPERS UI
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
  el.textContent  = texto;
  el.className    = `admin-msg ${tipo}`;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}
