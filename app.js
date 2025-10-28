import { getAllDestinations, saveUserDestination, getUnsplashImage } from './destinations-data.js';

// Variable global para TODOS los destinos
let allDestinations = [];

async function createDestinationCard(destination) {
  const mapId = `map-${destination.id}`;
  const imageUrl = await getUnsplashImage(destination.imageQuery);
  
  // Agregar clase especial si fue agregado por usuario
  const userAddedClass = destination.isUserAdded ? 'ring-2 ring-green-500' : '';
  
  return `
    <div class="w-full bg-white dark:bg-background-dark/50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 grid grid-cols-1 md:grid-cols-3 gap-0 overflow-hidden mb-8 ${userAddedClass}">
      <!-- Imagen de la ciudad -->
      <div class="w-full bg-center bg-no-repeat aspect-square md:aspect-auto bg-cover bg-gray-200" 
           style='background-image: url("${imageUrl}")'
           title="${destination.name}, ${destination.country}">
      </div>
      
      <!-- Mapa Leaflet -->
      <div class="w-full aspect-square md:aspect-auto">
        <div id="${mapId}" class="w-full h-full map-container"></div>
      </div>
      
      <!-- Información del destino -->
      <div class="p-6 sm:p-8 flex flex-col justify-center bg-gray-50 dark:bg-background-dark/30">
        <div class="flex flex-col gap-2 mb-6">
          <p class="text-2xl font-bold leading-tight text-slate-800 dark:text-slate-100">${destination.name}</p>
          <p class="text-base font-normal leading-normal text-slate-500 dark:text-slate-400">${destination.country}</p>
          ${destination.isUserAdded ? '<span class="text-xs text-green-600 font-medium">✓ Agregado por ti</span>' : ''}
        </div>
        
        <div class="grid grid-cols-[auto_1fr] gap-x-4">
          <div class="col-span-2 grid grid-cols-subgrid border-t border-t-slate-200 dark:border-t-slate-700 py-4">
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Mejores meses</p>
            <p class="text-sm font-normal text-right text-slate-700 dark:text-slate-300">${destination.bestMonths}</p>
          </div>
          
          <div class="col-span-2 grid grid-cols-subgrid border-t border-b border-t-slate-200 dark:border-t-slate-700 border-b-slate-200 dark:border-b-slate-700 py-4">
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Festivales</p>
            <p class="text-sm font-normal text-right text-slate-700 dark:text-slate-300">${destination.festivals}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function initMap(mapId, lat, lng, name) {
  const map = L.map(mapId).setView([parseFloat(lat), parseFloat(lng)], 10);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18,
  }).addTo(map);
  
  L.marker([parseFloat(lat), parseFloat(lng)])
    .addTo(map)
    .bindPopup(`<b>${name}</b>`)
    .openPopup();
}

async function renderDestinations() {
  const container = document.getElementById('destinations-container');
  
  if (!container) {
    console.error('No se encontró el contenedor de destinos');
    return;
  }
  
  container.innerHTML = '<div class="text-center py-8 text-slate-500">Cargando destinos...</div>';
  
  try {
    // Cargar TODOS los destinos (por defecto + usuario)
    allDestinations = await getAllDestinations();
    
    let allCardsHTML = '';
    
    for (const destination of allDestinations) {
      const destinationCardHTML = await createDestinationCard(destination);
      allCardsHTML += destinationCardHTML;
    }
    
    container.innerHTML = allCardsHTML;
    
    allDestinations.forEach(destination => {
      setTimeout(() => {
        if (document.getElementById(`map-${destination.id}`)) {
          initMap(`map-${destination.id}`, destination.lat, destination.lng, destination.name);
        }
      }, 100);
    });
    
  } catch (error) {
    console.error('Error cargando destinos:', error);
    container.innerHTML = '<div class="text-center py-8 text-red-500">Error cargando los destinos</div>';
  }
}

// Función para generar imageQuery automáticamente
function generateImageQuery(name, country) {
  return `${name}, ${country}, city, travel`;
}

// Función para manejar el envío del formulario
function setupFormHandler() {
  const form = document.getElementById('destination-form');
  
  if (!form) return;
  
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    
    // Deshabilitar botón y mostrar "Guardando..."
    submitButton.disabled = true;
    submitButton.textContent = 'Guardando...';
    submitButton.classList.add('opacity-50', 'cursor-not-allowed');
    
    const formData = new FormData(form);
    const newDestination = {
      name: formData.get('name'),
      country: formData.get('country'),
      bestMonths: formData.get('bestMonths'),
      festivals: formData.get('festivals'),
      lat: formData.get('lat'),
      lng: formData.get('lng'),
      imageQuery: generateImageQuery(formData.get('name'), formData.get('country'))
    };
    
    if (!newDestination.name || !newDestination.country || !newDestination.lat || !newDestination.lng) {
      alert('Por favor completa todos los campos obligatorios');
      // Restaurar botón
      submitButton.disabled = false;
      submitButton.textContent = originalText;
      submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
      return;
    }
    
    try {
      // Guardar el destino del USUARIO
      await saveUserDestination(newDestination);
      
      // Mostrar indicador de carga en el contenedor de destinos
      const container = document.getElementById('destinations-container');
      const originalContent = container.innerHTML;
      container.innerHTML = '<div class="text-center py-8 text-slate-500">Actualizando destinos...</div>';
      
      // Recargar la lista (incluye por defecto + nuevos)
      await renderDestinations();
      
      // Limpiar formulario
      form.reset();
      
      showNotification('¡Destino agregado correctamente! Aparecerá arriba de todo.', 'success');
      
    } catch (error) {
      console.error('Error agregando destino:', error);
      showNotification('Error al agregar el destino', 'error');
      
      // En caso de error, restaurar el contenido original
      const container = document.getElementById('destinations-container');
      container.innerHTML = originalContent;
      
    } finally {
      // Siempre restaurar el botón, haya éxito o error
      submitButton.disabled = false;
      submitButton.textContent = originalText;
      submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  });
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${
    type === 'success' ? 'bg-green-500 text-white' : 
    type === 'error' ? 'bg-red-500 text-white' : 
    'bg-blue-500 text-white'
  }`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
  setupFormHandler();
  renderDestinations();
});

export { renderDestinations, setupFormHandler };