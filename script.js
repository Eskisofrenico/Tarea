// ===============================================
// CONSTANTES
// ===============================================
const STORAGE_KEY = 'estudiantes_calificaciones';
const REGEX_SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
const MIN_NOTA = 1;
const MAX_NOTA = 7;
const NOTA_EXENCION = 5.0;

// ===============================================
// ELEMENTOS DEL DOM
// ===============================================
const formulario = document.getElementById('formulario');
const tabla = document.getElementById('tabla-estudiantes');
const promedioBox = document.getElementById('promedio');
const estudiantesExamenBox = document.getElementById('estudiantes-examen');
const estudiantesEximidosBox = document.getElementById('estudiantes-eximidos');
const totalEstudiantes = document.getElementById('total-estudiantes');

const btnSubmit = document.getElementById('btn-submit');
const btnText = document.getElementById('btn-text');
const btnCancelar = document.getElementById('btn-cancelar');

const buscarInput = document.getElementById('buscar');
const tablaVacia = document.getElementById('tabla-vacia');

const notificacion = document.getElementById('notificacion');
const notificacionTexto = document.getElementById('notificacion-texto');
const cerrarNotificacion = document.getElementById('cerrar-notificacion');

const modal = document.getElementById('modal-confirmacion');
const nombreEliminar = document.getElementById('nombre-eliminar');
const confirmarEliminar = document.getElementById('confirmar-eliminar');
const cancelarEliminar = document.getElementById('cancelar-eliminar');

// ===============================================
// VARIABLES GLOBALES
// ===============================================
let estudiantes = [];
let estudianteEditando = null;
let estudianteAEliminar = null;

// ===============================================
// INICIALIZACIÓN
// ===============================================
document.addEventListener('DOMContentLoaded', () => {
  cargarDatos();
  inicializarEventListeners();
  renderizarTabla();
  actualizarEstadisticas();
});

// ===============================================
// EVENTOS
// ===============================================
function inicializarEventListeners() {
  formulario.addEventListener('submit', manejarSubmit);
  btnCancelar.addEventListener('click', cancelarEdicion);
  buscarInput.addEventListener('input', filtrarEstudiantes);
  cerrarNotificacion.addEventListener('click', cerrarNotificacionFn);
  cancelarEliminar.addEventListener('click', cerrarModal);
  confirmarEliminar.addEventListener('click', confirmarEliminacion);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) cerrarModal();
  });

  ['nombre', 'apellido', 'nota', 'fecha'].forEach(id => {
    const input = document.getElementById(id);
    input.addEventListener('input', () => {
      limpiarError(id);
      if (id === 'nota' && input.value.trim()) {
        const nota = parseFloat(input.value);
        if (!isNaN(nota) && (nota < MIN_NOTA || nota > MAX_NOTA)) {
          mostrarError('nota', `La nota debe estar entre ${MIN_NOTA} y ${MAX_NOTA}`);
        }
      }
    });
  });

  formulario.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      manejarSubmit(e);
    }
  });
}

// ===============================================
// FORMULARIO
// ===============================================
function manejarSubmit(e) {
  e.preventDefault();
  if (!validarFormulario()) return;

  const datosEstudiante = obtenerDatosFormulario();

  if (estudianteEditando !== null) {
    actualizarEstudiante(datosEstudiante);
  } else {
    agregarEstudiante(datosEstudiante);
  }

  resetearFormulario();
  guardarDatos();
  renderizarTabla();
  actualizarEstadisticas();
}

function obtenerDatosFormulario() {
  return {
    id: estudianteEditando !== null ? estudiantes[estudianteEditando].id : Date.now(),
    nombre: formulario.nombre.value.trim(),
    apellido: formulario.apellido.value.trim(),
    nota: parseFloat(formulario.nota.value),
    fecha: formulario.fecha.value
  };
}

// ===============================================
// VALIDACIÓN
// ===============================================
function validarFormulario() {
  limpiarErrores();
  let esValido = true;

  const nombre = formulario.nombre.value.trim();
  const apellido = formulario.apellido.value.trim();
  const notaStr = formulario.nota.value.trim();
  const nota = parseFloat(notaStr);
  const fecha = formulario.fecha.value;

  if (!nombre || !REGEX_SOLO_LETRAS.test(nombre)) {
    mostrarError('nombre', 'El nombre debe contener solo letras');
    esValido = false;
  }

  if (!apellido || !REGEX_SOLO_LETRAS.test(apellido)) {
    mostrarError('apellido', 'El apellido debe contener solo letras');
    esValido = false;
  }

  if (!notaStr) {
    mostrarError('nota', 'La calificación es obligatoria');
    esValido = false;
  } else if (isNaN(nota)) {
    mostrarError('nota', 'Ingrese un número válido');
    esValido = false;
  } else if (nota < MIN_NOTA || nota > MAX_NOTA) {
    mostrarError('nota', `La nota debe estar entre ${MIN_NOTA} y ${MAX_NOTA}`);
    esValido = false;
  }

  if (!fecha) {
    mostrarError('fecha', 'La fecha es obligatoria');
    esValido = false;
  } else {
    const fechaSeleccionada = new Date(fecha);
    const fechaActual = new Date();
    if (fechaSeleccionada > fechaActual) {
      mostrarError('fecha', 'La fecha no puede ser futura');
      esValido = false;
    }
  }

  if (esValido && esDuplicado(nombre, apellido)) {
    mostrarError('nombre', 'Ya existe un estudiante con este nombre y apellido');
    esValido = false;
  }

  return esValido;
}

function esDuplicado(nombre, apellido) {
  return estudiantes.some((est, idx) => {
    const mismosNombres = est.nombre.toLowerCase() === nombre.toLowerCase() &&
                          est.apellido.toLowerCase() === apellido.toLowerCase();
    return mismosNombres && idx !== estudianteEditando;
  });
}

function mostrarError(campo, mensaje) {
  document.getElementById(`error-${campo}`).textContent = mensaje;
  document.getElementById(campo).classList.add('error-input');
}

function limpiarError(campo) {
  document.getElementById(`error-${campo}`).textContent = '';
  document.getElementById(campo).classList.remove('error-input');
}

function limpiarErrores() {
  ['nombre', 'apellido', 'nota', 'fecha'].forEach(limpiarError);
}

// ===============================================
// GESTIÓN DE ESTUDIANTES
// ===============================================
function agregarEstudiante(estudiante) {
  estudiantes.push(estudiante);
  mostrarNotificacion(`${estudiante.nombre} ${estudiante.apellido} agregado correctamente`);
}

function actualizarEstudiante(datos) {
  estudiantes[estudianteEditando] = { ...estudiantes[estudianteEditando], ...datos };
  mostrarNotificacion(`${datos.nombre} ${datos.apellido} actualizado correctamente`);
  cancelarEdicion();
}

function iniciarEdicion(indice) {
  const estudiante = estudiantes[indice];
  formulario.nombre.value = estudiante.nombre;
  formulario.apellido.value = estudiante.apellido;
  formulario.nota.value = estudiante.nota;
  formulario.fecha.value = estudiante.fecha;

  estudianteEditando = indice;
  btnText.textContent = 'Actualizar';
  btnSubmit.querySelector('i').className = 'fas fa-save';
  btnCancelar.classList.remove('hidden');

  renderizarTabla();
  formulario.scrollIntoView({ behavior: 'smooth' });
}

function cancelarEdicion() {
  estudianteEditando = null;
  resetearFormulario();
  renderizarTabla();
}

function resetearFormulario() {
  formulario.reset();
  limpiarErrores();
  btnText.textContent = 'Agregar';
  btnSubmit.querySelector('i').className = 'fas fa-user-plus';
  btnCancelar.classList.add('hidden');
}

function mostrarModalEliminar(indice) {
  const estudiante = estudiantes[indice];
  nombreEliminar.textContent = `${estudiante.nombre} ${estudiante.apellido}`;
  estudianteAEliminar = indice;
  modal.classList.remove('hidden');
}

function confirmarEliminacion() {
  if (estudianteAEliminar !== null) {
    const estudiante = estudiantes[estudianteAEliminar];
    estudiantes.splice(estudianteAEliminar, 1);

    if (estudianteEditando === estudianteAEliminar) cancelarEdicion();
    else if (estudianteEditando > estudianteAEliminar) estudianteEditando--;

    mostrarNotificacion(`${estudiante.nombre} ${estudiante.apellido} eliminado correctamente`);
    guardarDatos();
    renderizarTabla();
    actualizarEstadisticas();
  }
  cerrarModal();
}

function cerrarModal() {
  modal.classList.add('hidden');
  estudianteAEliminar = null;
}

// ===============================================
// ESTADÍSTICAS
// ===============================================
function actualizarPromedio(estudiantesACalcular = estudiantes) {
  if (estudiantesACalcular.length === 0) {
    promedioBox.innerHTML = '<i class="fas fa-chart-bar"></i> Promedio: No Disponible';
    return;
  }
  const suma = estudiantesACalcular.reduce((acc, e) => acc + e.nota, 0);
  const promedio = suma / estudiantesACalcular.length;
  promedioBox.innerHTML = `<i class="fas fa-chart-bar"></i> Promedio: ${promedio.toFixed(1)}`;
}

function actualizarEstadisticasExamen(estudiantesACalcular = estudiantes) {
  const debenExamen = estudiantesACalcular.filter(e => e.nota < NOTA_EXENCION).length;
  const eximidos = estudiantesACalcular.filter(e => e.nota >= NOTA_EXENCION).length;

  if (estudiantesExamenBox && estudiantesEximidosBox) {
    estudiantesExamenBox.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Deben Examen: ${debenExamen}`;
    estudiantesEximidosBox.innerHTML = `<i class="fas fa-check-circle"></i> Eximidos: ${eximidos}`;
  }
}

function actualizarEstadisticas() {
  const cantidad = estudiantes.length;
  totalEstudiantes.innerHTML = `<i class="fas fa-users"></i> Total: ${cantidad} estudiante${cantidad !== 1 ? 's' : ''}`;
  actualizarPromedio();
  actualizarEstadisticasExamen();
}

// ===============================================
// RENDER
// ===============================================
function renderizarTabla(estudiantesFiltrados = null) {
  const estudiantesAMostrar = estudiantesFiltrados || estudiantes;

  if (estudiantesAMostrar.length === 0) {
    tabla.innerHTML = '';
    tablaVacia.classList.remove('hidden');
    actualizarEstadisticas();
    return;
  }

  tablaVacia.classList.add('hidden');

  tabla.innerHTML = estudiantesAMostrar.map((e, i) => {
    const indiceReal = estudiantes.indexOf(e);
    const estado = e.nota >= NOTA_EXENCION ? 'Eximido' : 'Debe Examen';
    const claseEstado = e.nota >= NOTA_EXENCION ? 'estado-eximido' : 'estado-examen';
    const claseEdicion = indiceReal === estudianteEditando ? 'fila-editando' : '';
  
    return `
      <tr class="${claseEdicion}">
        <td>${e.nombre}</td>
        <td>${e.apellido}</td>
        <td>${e.nota.toFixed(1)}</td>
        <td><span class="estado ${claseEstado}">${estado}</span></td>
        <td>${formatearFecha(e.fecha)}</td>
        <td>
          <div class="acciones-fila">
            <button class="btn-editar" onclick="iniciarEdicion(${indiceReal})">
              <i class="fas fa-edit"></i> Editar
            </button>
            <button class="btn-eliminar" onclick="mostrarModalEliminar(${indiceReal})">
              <i class="fas fa-trash"></i> Eliminar
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');
  
  
  actualizarEstadisticas();
}

function formatearFecha(fechaString) {
  const fecha = new Date(fechaString + 'T00:00:00');
  return fecha.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function filtrarEstudiantes() {
  const termino = buscarInput.value.toLowerCase().trim();
  if (!termino) {
    renderizarTabla();
    return;
  }

  const filtrados = estudiantes.filter(e =>
    e.nombre.toLowerCase().includes(termino) ||
    e.apellido.toLowerCase().includes(termino) ||
    e.nota.toString().includes(termino) ||
    e.fecha.includes(termino) ||
    obtenerEstadoEstudiante(e.nota).toLowerCase().includes(termino)
  );

  renderizarTabla(filtrados);
}

function obtenerEstadoEstudiante(nota) {
  return nota >= NOTA_EXENCION ? 'Eximido' : 'Debe Examen';
}

// ===============================================
// NOTIFICACIONES
// ===============================================
function mostrarNotificacion(mensaje, tipo = 'success') {
  notificacionTexto.textContent = mensaje;
  notificacion.className = `notificacion ${tipo}`;
  notificacion.classList.remove('hidden');

  setTimeout(() => {
    cerrarNotificacionFn();
  }, 3000);
}

function cerrarNotificacionFn() {
  notificacion.classList.add('hidden');
}

// ===============================================
// LOCALSTORAGE
// ===============================================
function guardarDatos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(estudiantes));
}

function cargarDatos() {
  const datos = localStorage.getItem(STORAGE_KEY);
  if (datos) estudiantes = JSON.parse(datos);
}

// Hacer funciones globales
window.iniciarEdicion = iniciarEdicion;
window.mostrarModalEliminar = mostrarModalEliminar;
