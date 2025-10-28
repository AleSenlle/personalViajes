import { renderDestinations, setupFormHandler } from './app.js';

// Inicializar la app cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  setupFormHandler();
  renderDestinations();
});