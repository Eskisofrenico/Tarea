const formulario = document.getElementById('formulario');
const tabla = document.getElementById('tabla-estudiantes');
const promedioBox = document.getElementById('promedio');

let calificaciones = [];
let filaEditando = null; // Guarda la fila que se está editando

const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;

['nombre', 'apellido', 'nota', 'fecha'].forEach(id => {
  const input = document.getElementById(id);
  input.addEventListener('input', () => {
    document.getElementById(`error-${id}`).textContent = '';
    input.classList.remove('error-input');
  });
});

formulario.addEventListener('submit', function (e) {
  e.preventDefault();
  limpiarErrores();

  const nombre = formulario.nombre.value.trim();
  const apellido = formulario.apellido.value.trim();
  const notaStr = formulario.nota.value.trim();
  const fecha = formulario.fecha.value;
  const nota = parseFloat(notaStr);

  let valido = true;

  if (!nombre || !soloLetras.test(nombre)) {
    mostrarError('nombre', 'Nombre inválido');
    valido = false;
  }

  if (!apellido || !soloLetras.test(apellido)) {
    mostrarError('apellido', 'Apellido inválido');
    valido = false;
  }

  if (!notaStr || isNaN(nota) || nota < 1 || nota > 7) {
    mostrarError('nota', 'Nota debe ser un número entre 1 y 7');
    valido = false;
  }

  if (!fecha) {
    mostrarError('fecha', 'Ingrese la fecha de inscripción');
    valido = false;
  }

  if (!valido) return;

  if (filaEditando) {
    // Modo edición: actualiza fila existente
    actualizarFila(filaEditando, { nombre, apellido, nota, fecha });
    filaEditando = null;
  } else {
    // Nueva fila
    agregarEstudiante({ nombre, apellido, nota, fecha });
  }

  formulario.reset();
});

function mostrarError(id, mensaje) {
  document.getElementById(`error-${id}`).textContent = mensaje;
  document.getElementById(id).classList.add('error-input');
}

function limpiarErrores() {
  document.querySelectorAll('.error').forEach(e => e.textContent = '');
  document.querySelectorAll('input').forEach(i => i.classList.remove('error-input'));
}

function agregarEstudiante({ nombre, apellido, nota, fecha }) {
  const fila = document.createElement('tr');
  fila.innerHTML = `
    <td>${nombre}</td>
    <td>${apellido}</td>
    <td>${nota.toFixed(1)}</td>
    <td>${fecha}</td>
    <td>
      <button class="editar">Editar</button>
      <button class="eliminar">Eliminar</button>
    </td>
  `;
  tabla.appendChild(fila);
  calificaciones.push(nota);
  actualizarPromedio();

  fila.querySelector('.eliminar').addEventListener('click', () => {
    fila.remove();
    calificaciones = calificaciones.filter(n => n !== nota);
    actualizarPromedio();
  });

  fila.querySelector('.editar').addEventListener('click', () => {
    formulario.nombre.value = nombre;
    formulario.apellido.value = apellido;
    formulario.nota.value = nota;
    formulario.fecha.value = fecha;
    filaEditando = fila;
  });
}

function actualizarFila(fila, { nombre, apellido, nota, fecha }) {
  fila.children[0].textContent = nombre;
  fila.children[1].textContent = apellido;

  const notaAnterior = parseFloat(fila.children[2].textContent);
  calificaciones = calificaciones.filter(n => n !== notaAnterior);
  calificaciones.push(nota);

  fila.children[2].textContent = nota.toFixed(1);
  fila.children[3].textContent = fecha;
  actualizarPromedio();
}

function actualizarPromedio() {
  if (calificaciones.length === 0) {
    promedioBox.innerHTML = `Promedio: No disponible`;
    return;
  }
  const suma = calificaciones.reduce((a, b) => a + b, 0);
  const promedio = suma / calificaciones.length;
  promedioBox.innerHTML = `Promedio: ${promedio.toFixed(1)}`;
}
