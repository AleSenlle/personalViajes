// Destinos por defecto que SIEMPRE se muestran
export const defaultDestinations = [  
  {
    id: 1,
    name: 'Estambul',
    country: 'Turquía',
    bestMonths: 'Abril-Mayo, Septiembre-Octubre',
    festivals: 'Festival del Tulipán (Abril), Beyoğlu Culture Route Festival (Septiembre-Octubre)',
    lat: '41.010',
    lng: '28.960',
    imageQuery: 'Istanbul city Turkey skyline'
  },
  {
    id: 2,
    name: 'Moscú',
    country: 'Rusia',
    bestMonths: 'Primavera (Abril-Mayo), Verano (Junio-Agosto), Otoño (Septiembre-Noviembre)',
    festivals: 'Maslenitsa (7 días antes de la Cuaresma), Día de la Victoria (9 de mayo), Internacional Art November (Noviembre)',
    lat: '55.752222',
    lng: '37.615556',
    imageQuery: 'Moscow city Russia Kremlin'
  },
  {
    id: 3,
    name: 'Ereván',
    country: 'Armenia',
    bestMonths: 'Primavera (Abril-Junio), Otoño (Septiembre-Octubre)',
    festivals: 'Festival de Dolma (Mayo), Festival de los Días del Vino (Junio), Festival del Té y del Café (Primeros días de Octubre), Festival de Vardavar (98 días despues de Pascua)',
    lat: '40.18',
    lng: '44.50',
    imageQuery: 'Yerevan city Armenia'
  },
  {
    id: 4,
    name: 'Quba',
    country: 'Azerbaiyán',
    bestMonths: 'Primavera (Marzo-Mayo), Otoño (Septiembre-Octubre)',
    festivals: 'Festival de la Manzana (Octubre-Noviembre)',
    lat: '41.37',
    lng: '48.52',
    imageQuery: 'Quba Azerbaijan landscape mountains'
  },
  {
    id: 5,
    name: 'Minsk',
    country: 'Bielorrusia',
    bestMonths: 'Mayo, Junio, Septiembre y Octubre',
    festivals: 'Parada de Papá Noel (31 de diciembre), Año Nuevo',
    lat: '53.902',
    lng: '27.562',
    imageQuery: 'Minsk city Belarus architecture'
  },
  {
    id: 6,
    name: 'Jingdezhen',
    country: 'China',
    bestMonths: 'Primavera (Abril-Mayo), Otoño (Septiembre-Octubre)',
    festivals: 'Feria de Cerámica de Taoxichuan (30 de abril - 5 de mayo y 17 - 19 de octubre)',
    lat: '29.29',
    lng: '117.20',
    imageQuery: 'Jingdezhen ceramics China porcelain'
  }
];

// Función para obtener destinos del usuario
export async function loadUserDestinations() {
  try {
    const response = await fetch('/api/destinations');
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const userDestinations = await response.json();
    return userDestinations;
    
  } catch (error) {
    console.error('Error cargando destinos del usuario:', error);
    return []; // Si hay error, retornar array vacío
  }
}

// Función para combinar destinos por defecto + del usuario
export async function getAllDestinations() {
  const userDestinations = await loadUserDestinations();
  
  // Agregar propiedad isUserAdded a los destinos por defecto
  const defaultWithFlag = defaultDestinations.map(dest => ({
    ...dest,
    isUserAdded: false
  }));
  
  const userWithFlag = userDestinations.map(dest => ({
    ...dest,
    isUserAdded: true
  }));
  
  // Combinar: primero los del usuario, luego los por defecto
  return [...userWithFlag, ...defaultWithFlag];
}

// Función para guardar un nuevo destino del usuario
export async function saveUserDestination(destination) {
  try {
    const response = await fetch('/api/destinations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(destination)
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('Error guardando destino:', error);
    throw error;
  }
}

// Función para obtener imágenes
export async function getUnsplashImage(query) {
  try {
    const response = await fetch(`/api/unsplash-image?query=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.url;
    
  } catch (error) {
    console.error('Error obteniendo imagen:', error.message);
    return `https://source.unsplash.com/featured/800x600/?${encodeURIComponent(query)}`;
  }
}