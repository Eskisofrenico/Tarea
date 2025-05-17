const formulario = document.getElementById('formulario');
const tabla = document.getElementById('tabla-estudiantes');
const promedioBox = document.getElementById('promedio');
let calificaciones = [];

// Solo letras y espacios
const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;

// Validación dinámica mientras escribe
['nombre', 'apellido', 'nota'].forEach(id => {
  const input = document.getElementById(id);
  input.addEventListener('input', () => {
    document.getElementById(`error-${id}`).textContent = '';
    input.classList.remove('error-input');
  });
});

formulario.addEventListener('submit', function (e) {
  e.preventDefault();

  // Limpiar errores previos
  document.querySelectorAll('.error').forEach(el => el.textContent = '');
  document.querySelectorAll('input').forEach(el => el.classList.remove('error-input'));

  const nombre = formulario.nombre.value.trim();
  const apellido = formulario.apellido.value.trim();
  const notaStr = formulario.nota.value.trim();
  const nota = parseFloat(notaStr);
  let valido = true;

  // Nombre
  if (!nombre) {
    mostrarError('nombre', 'Por favor, ingrese el nombre');
    valido = false;
  } else if (!soloLetras.test(nombre)) {
    mostrarError('nombre', 'El nombre solo debe contener letras');
    valido = false;
  }

  // Apellido
  if (!apellido) {
    mostrarError('apellido', 'Por favor, ingrese el apellido');
    valido = false;
  } else if (!soloLetras.test(apellido)) {
    mostrarError('apellido', 'El apellido solo debe contener letras');
    valido = false;
  }

  // Nota
  if (!notaStr) {
    mostrarError('nota', 'Por favor, ingrese una calificación');
    valido = false;
  } else if (isNaN(nota)) {
    mostrarError('nota', 'La calificación debe ser un número');
    valido = false;
  } else if (nota < 1) {
    mostrarError('nota', 'El valor debe ser mayor o igual a 1.0');
    valido = false;
  } else if (nota > 7) {
    mostrarError('nota', 'El valor debe ser menor o igual a 7.0');
    valido = false;
  }

  if (!valido) return;

  // Agregar fila
  const fila = document.createElement('tr');
  fila.innerHTML = `
    <td>${nombre}</td>
    <td>${apellido}</td>
    <td>${nota.toFixed(1)}</td>
  `;
  tabla.appendChild(fila);

  // Calcular promedio
  calificaciones.push(nota);
  const promedio = calificaciones.reduce((a, b) => a + b, 0) / calificaciones.length;
  promedioBox.innerHTML = `<i class="fas fa-chart-bar"></i> Promedio: ${promedio.toFixed(1)}`;

  formulario.reset();
});

function mostrarError(id, mensaje) {
  const input = document.getElementById(id);
  const errorSpan = document.getElementById(`error-${id}`);
  errorSpan.textContent = mensaje;
  input.classList.add('error-input');
}
