// ===============================================
// CONSTANTES DE LA APLICACIÓN
// ===============================================

// Clave para guardar datos en localStorage del navegador
const STORAGE_KEY = 'estudiantes_calificaciones';

// Expresión regular que solo permite letras, acentos y espacios
const REGEX_SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;

// Valores mínimo y máximo permitidos para las calificaciones
const MIN_NOTA = 1;
const MAX_NOTA = 7;

// ===============================================
// ELEMENTOS DEL DOM (Document Object Model)
// ===============================================
// Aquí obtenemos referencias a todos los elementos HTML que vamos a manipular

// Elementos del formulario principal
const formulario = document.getElementById('formulario');
const tabla = document.getElementById('tabla-estudiantes');
const promedioBox = document.getElementById('promedio');

// Botones del formulario
const btnSubmit = document.getElementById('btn-submit');
const btnText = document.getElementById('btn-text');
const btnCancelar = document.getElementById('btn-cancelar');

// Elementos de búsqueda y estadísticas
const buscarInput = document.getElementById('buscar');
const totalEstudiantes = document.getElementById('total-estudiantes');
const tablaVacia = document.getElementById('tabla-vacia');

// Elementos del sistema de notificaciones
const notificacion = document.getElementById('notificacion');
const notificacionTexto = document.getElementById('notificacion-texto');
const cerrarNotificacion = document.getElementById('cerrar-notificacion');

// Elementos del modal de confirmación
const modal = document.getElementById('modal-confirmacion');
const nombreEliminar = document.getElementById('nombre-eliminar');
const confirmarEliminar = document.getElementById('confirmar-eliminar');
const cancelarEliminar = document.getElementById('cancelar-eliminar');

// ===============================================
// VARIABLES GLOBALES
// ===============================================

// Array que almacena todos los estudiantes
let estudiantes = [];

// Índice del estudiante que se está editando (null si no hay edición)
let estudianteEditando = null;

// Índice del estudiante que se va a eliminar (usado en el modal)
let estudianteAEliminar = null;

// ===============================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ===============================================

// Se ejecuta cuando el DOM está completamente cargado
document.addEventListener('DOMContentLoaded', function() {
  cargarDatos();              // Carga datos guardados del localStorage
  inicializarEventListeners(); // Configura todos los eventos
  renderizarTabla();          // Muestra la tabla inicial
  actualizarEstadisticas();   // Actualiza el contador de estudiantes
});

// ===============================================
// CONFIGURACIÓN DE EVENT LISTENERS
// ===============================================

function inicializarEventListeners() {
  // Eventos del formulario principal
  formulario.addEventListener('submit', manejarSubmit);
  btnCancelar.addEventListener('click', cancelarEdicion);
  
  // Evento de búsqueda en tiempo real
  buscarInput.addEventListener('input', filtrarEstudiantes);
  
  // Configurar validación en tiempo real para cada campo
  ['nombre', 'apellido', 'nota', 'fecha'].forEach(id => {
    const input = document.getElementById(id);
    
    // Limpiar errores y validar mientras el usuario escribe
    input.addEventListener('input', () => {
      limpiarError(id);
      
      // Validación especial para el campo nota
      if (id === 'nota' && input.value.trim()) {
        const nota = parseFloat(input.value);
        if (!isNaN(nota) && (nota < MIN_NOTA || nota > MAX_NOTA)) {
          mostrarError('nota', `La nota debe estar entre ${MIN_NOTA} y ${MAX_NOTA}`);
        }
      }
    });
  });
  
  // Prevenir envío accidental del formulario con Enter si hay errores
  formulario.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      manejarSubmit(e);
    }
  });
  
  // Eventos del sistema de notificaciones
  cerrarNotificacion.addEventListener('click', cerrarNotificacionFn);
  
  // Eventos del modal de confirmación
  cancelarEliminar.addEventListener('click', cerrarModal);
  confirmarEliminar.addEventListener('click', confirmarEliminacion);
  
  // Cerrar modal haciendo clic fuera de él
  modal.addEventListener('click', (e) => {
    if (e.target === modal) cerrarModal();
  });
}

// ===============================================
// MANEJO DEL FORMULARIO
// ===============================================

// Función principal que maneja el envío del formulario
function manejarSubmit(e) {
  e.preventDefault(); // Previene el comportamiento por defecto del formulario
  
  // Si la validación falla, no continuar
  if (!validarFormulario()) return;
  
  // Obtener los datos del formulario
  const datosEstudiante = obtenerDatosFormulario();
  
  // Determinar si estamos editando o agregando
  if (estudianteEditando !== null) {
    actualizarEstudiante(datosEstudiante);
  } else {
    agregarEstudiante(datosEstudiante);
  }
  
  // Limpiar formulario y actualizar la interfaz
  resetearFormulario();
  guardarDatos();
  renderizarTabla();
  actualizarEstadisticas();
}

// Extrae y estructura los datos del formulario
function obtenerDatosFormulario() {
  return {
    // ID único: usa el ID existente si editamos, o crea uno nuevo con timestamp
    id: estudianteEditando !== null ? estudiantes[estudianteEditando].id : Date.now(),
    nombre: formulario.nombre.value.trim(),     // Elimina espacios al inicio/final
    apellido: formulario.apellido.value.trim(),
    nota: parseFloat(formulario.nota.value),    // Convierte string a número
    fecha: formulario.fecha.value
  };
}

// ===============================================
// SISTEMA DE VALIDACIÓN
// ===============================================

// Función principal de validación que verifica todos los campos
function validarFormulario() {
  limpiarErrores(); // Limpia errores anteriores
  let esValido = true;
  
  // Obtener valores de los campos
  const nombre = formulario.nombre.value.trim();
  const apellido = formulario.apellido.value.trim();
  const notaStr = formulario.nota.value.trim();
  const nota = parseFloat(notaStr);
  const fecha = formulario.fecha.value;
  
  // Validación del nombre: no vacío y solo letras
  if (!nombre || !REGEX_SOLO_LETRAS.test(nombre)) {
    mostrarError('nombre', 'El nombre debe contener solo letras');
    esValido = false;
  }
  
  // Validación del apellido: no vacío y solo letras
  if (!apellido || !REGEX_SOLO_LETRAS.test(apellido)) {
    mostrarError('apellido', 'El apellido debe contener solo letras');
    esValido = false;
  }
  
  // Validación de la nota: obligatoria, numérica y en rango válido
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
  
  // Validación de la fecha: obligatoria y no futura
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
  
  // Validación de duplicados: verificar si ya existe el mismo nombre+apellido
  if (esValido && !esDuplicado(nombre, apellido)) {
    // No es duplicado, continuar
  } else if (esValido) {
    mostrarError('nombre', 'Ya existe un estudiante con este nombre y apellido');
    esValido = false;
  }
  
  return esValido;
}

// Verifica si ya existe un estudiante con el mismo nombre y apellido
function esDuplicado(nombre, apellido) {
  return estudiantes.some((estudiante, index) => {
    // Comparación insensible a mayúsculas/minúsculas
    const mismosNombres = estudiante.nombre.toLowerCase() === nombre.toLowerCase() && 
                         estudiante.apellido.toLowerCase() === apellido.toLowerCase();
    
    // Si estamos editando, excluir el estudiante actual de la verificación
    const noEsElMismoEstudiante = index !== estudianteEditando;
    
    return mismosNombres && noEsElMismoEstudiante;
  });
}

// Muestra un mensaje de error en un campo específico
function mostrarError(campo, mensaje) {
  const errorElement = document.getElementById(`error-${campo}`);
  const inputElement = document.getElementById(campo);
  
  // Mostrar el mensaje de error
  errorElement.textContent = mensaje;
  // Aplicar estilo visual de error al campo
  inputElement.classList.add('error-input');
}

// Limpia el error de un campo específico
function limpiarError(campo) {
  const errorElement = document.getElementById(`error-${campo}`);
  const inputElement = document.getElementById(campo);
  
  // Limpiar mensaje y estilo de error
  errorElement.textContent = '';
  inputElement.classList.remove('error-input');
}

// Limpia todos los errores de validación
function limpiarErrores() {
  ['nombre', 'apellido', 'nota', 'fecha'].forEach(campo => {
    limpiarError(campo);
  });
}

// ===============================================
// GESTIÓN DE ESTUDIANTES (CRUD Operations)
// ===============================================

// Agrega un nuevo estudiante al array
function agregarEstudiante(estudiante) {
  estudiantes.push(estudiante);
  mostrarNotificacion(`${estudiante.nombre} ${estudiante.apellido} agregado correctamente`, 'success');
}

// Actualiza los datos de un estudiante existente
function actualizarEstudiante(datosActualizados) {
  const indice = estudianteEditando;
  // Combina los datos existentes con los nuevos datos
  estudiantes[indice] = { ...estudiantes[indice], ...datosActualizados };
  mostrarNotificacion(`${datosActualizados.nombre} ${datosActualizados.apellido} actualizado correctamente`, 'success');
  cancelarEdicion();
}

// Prepara el formulario para editar un estudiante existente
function iniciarEdicion(indice) {
  const estudiante = estudiantes[indice];
  
  // Llenar el formulario con los datos del estudiante
  formulario.nombre.value = estudiante.nombre;
  formulario.apellido.value = estudiante.apellido;
  formulario.nota.value = estudiante.nota;
  formulario.fecha.value = estudiante.fecha;
  
  // Cambiar el estado de la interfaz a modo edición
  estudianteEditando = indice;
  btnText.textContent = 'Actualizar';
  btnSubmit.querySelector('i').className = 'fas fa-save';
  btnCancelar.classList.remove('hidden');
  
  // Actualizar la tabla para resaltar la fila en edición
  renderizarTabla();
  
  // Hacer scroll suave al formulario
  formulario.scrollIntoView({ behavior: 'smooth' });
}

// Cancela la edición y vuelve al modo agregar
function cancelarEdicion() {
  estudianteEditando = null;
  resetearFormulario();
  renderizarTabla();
}

// Restaura el formulario a su estado inicial
function resetearFormulario() {
  formulario.reset();              // Limpia todos los campos
  limpiarErrores();               // Elimina mensajes de error
  btnText.textContent = 'Agregar'; // Cambia texto del botón
  btnSubmit.querySelector('i').className = 'fas fa-user-plus'; // Cambia icono
  btnCancelar.classList.add('hidden'); // Oculta botón cancelar
}

// Muestra el modal de confirmación para eliminar un estudiante
function mostrarModalEliminar(indice) {
  const estudiante = estudiantes[indice];
  nombreEliminar.textContent = `${estudiante.nombre} ${estudiante.apellido}`;
  estudianteAEliminar = indice;
  modal.classList.remove('hidden');
}

// Confirma y ejecuta la eliminación del estudiante
function confirmarEliminacion() {
  if (estudianteAEliminar !== null) {
    const estudiante = estudiantes[estudianteAEliminar];
    
    // Eliminar del array
    estudiantes.splice(estudianteAEliminar, 1);
    
    // Si estamos editando el estudiante eliminado, cancelar edición
    if (estudianteEditando === estudianteAEliminar) {
      cancelarEdicion();
    } else if (estudianteEditando > estudianteAEliminar) {
      // Ajustar índice si el estudiante en edición está después del eliminado
      estudianteEditando--;
    }
    
    // Mostrar confirmación y actualizar interfaz
    mostrarNotificacion(`${estudiante.nombre} ${estudiante.apellido} eliminado correctamente`, 'success');
    guardarDatos();
    renderizarTabla();
    actualizarEstadisticas();
  }
  cerrarModal();
}

// Cierra el modal de confirmación
function cerrarModal() {
  modal.classList.add('hidden');
  estudianteAEliminar = null;
}

// ===============================================
// RENDERIZADO DE LA INTERFAZ
// ===============================================

// Función principal que renderiza la tabla de estudiantes
function renderizarTabla(estudiantesFiltrados = null) {
  // Usar estudiantes filtrados o todos los estudiantes
  const estudiantesAMostrar = estudiantesFiltrados || estudiantes;
  
  // Si no hay estudiantes, mostrar mensaje vacío
  if (estudiantesAMostrar.length === 0) {
    tabla.innerHTML = '';
    tablaVacia.classList.remove('hidden');
    actualizarPromedio(estudiantesAMostrar);
    return;
  }
  
  // Ocultar mensaje de tabla vacía
  tablaVacia.classList.add('hidden');
  
  // Generar HTML para cada fila de la tabla
  tabla.innerHTML = estudiantesAMostrar.map((estudiante, indice) => {
    // Obtener el índice real en el array completo (importante para filtros)
    const indiceReal = estudiantes.indexOf(estudiante);
    
    // Clase especial si este estudiante está siendo editado
    const claseEdicion = indiceReal === estudianteEditando ? 'fila-editando' : '';
    
    return `
      <tr class="${claseEdicion}">
        <td>${estudiante.nombre}</td>
        <td>${estudiante.apellido}</td>
        <td>${estudiante.nota.toFixed(1)}</td>
        <td>${formatearFecha(estudiante.fecha)}</td>
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
      </tr>
    `;
  }).join('');
  
  // Actualizar el promedio con los estudiantes mostrados
  actualizarPromedio(estudiantesAMostrar);
}

// Convierte fecha de formato YYYY-MM-DD a formato DD/MM/YYYY
function formatearFecha(fechaString) {
  const fecha = new Date(fechaString + 'T00:00:00'); // Evita problemas de zona horaria
  return fecha.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

// Filtra estudiantes basado en el término de búsqueda
function filtrarEstudiantes() {
  const termino = buscarInput.value.toLowerCase().trim();
  
  // Si no hay término de búsqueda, mostrar todos
  if (!termino) {
    renderizarTabla();
    return;
  }
  
  // Buscar en nombre, apellido, nota y fecha
  const estudiantesFiltrados = estudiantes.filter(estudiante => {
    return estudiante.nombre.toLowerCase().includes(termino) ||
           estudiante.apellido.toLowerCase().includes(termino) ||
           estudiante.nota.toString().includes(termino) ||
           estudiante.fecha.includes(termino);
  });
  
  // Renderizar solo los estudiantes que coinciden
  renderizarTabla(estudiantesFiltrados);
}

// Calcula y muestra el promedio de calificaciones
function actualizarPromedio(estudiantesACalcular = estudiantes) {
  // Si no hay estudiantes, mostrar "No Disponible"
  if (estudiantesACalcular.length === 0) {
    promedioBox.innerHTML = '<i class="fas fa-chart-bar"></i> Promedio: No Disponible';
    return;
  }
  
  // Calcular promedio: suma total / cantidad de estudiantes
  const suma = estudiantesACalcular.reduce((acc, estudiante) => acc + estudiante.nota, 0);
  const promedio = suma / estudiantesACalcular.length;
  
  // Mostrar promedio con 1 decimal
  promedioBox.innerHTML = `<i class="fas fa-chart-bar"></i> Promedio: ${promedio.toFixed(1)}`;
}

// Actualiza el contador total de estudiantes
function actualizarEstadisticas() {
  const cantidad = estudiantes.length;
  // Usar singular o plural según la cantidad
  totalEstudiantes.textContent = `Total: ${cantidad} estudiante${cantidad !== 1 ? 's' : ''}`;
}

// ===============================================
// SISTEMA DE NOTIFICACIONES
// ===============================================

// Muestra una notificación temporal al usuario
function mostrarNotificacion(mensaje, tipo = 'success') {
  notificacionTexto.textContent = mensaje;
  
  // Aplicar clase de estilo según el tipo (success, error, warning)
  notificacion.className = `notificacion ${tipo}`;
  notificacion.classList.remove('hidden');
  
  // Auto-ocultar después de 3 segundos
  setTimeout(() => {
    cerrarNotificacionFn();
  }, 3000);
}

// Cierra la notificación actual
function cerrarNotificacionFn() {
  notificacion.classList.add('hidden');
}

// ===============================================
// PERSISTENCIA DE DATOS (LocalStorage)
// ===============================================

// Guarda los datos en el localStorage del navegador
function guardarDatos() {
  try {
    // Convertir array de estudiantes a JSON y guardarlo
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estudiantes));
  } catch (error) {
    console.error('Error al guardar datos:', error);
    mostrarNotificacion('Error al guardar los datos', 'error');
  }
}

// Carga los datos guardados del localStorage
function cargarDatos() {
  try {
    const datosGuardados = localStorage.getItem(STORAGE_KEY);
    if (datosGuardados) {
      // Convertir JSON de vuelta a array de objetos
      estudiantes = JSON.parse(datosGuardados);
    }
  } catch (error) {
    console.error('Error al cargar datos:', error);
    estudiantes = []; // Array vacío si hay error
    mostrarNotificacion('Error al cargar los datos guardados', 'error');
  }
}

// ===============================================
// FUNCIONES GLOBALES
// ===============================================
// Estas funciones se hacen globales para poder usarlas desde los onclick en HTML

window.iniciarEdicion = iniciarEdicion;
window.mostrarModalEliminar = mostrarModalEliminar;