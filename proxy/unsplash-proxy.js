import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// Ruta principal - servir el index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Ruta para imágenes de Unsplash
app.get('/api/unsplash-image', async (req, res) => {
  try {
    const { query = 'city' } = req.query;
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;

    if (!accessKey) {
      return res.json({ 
        url: `https://source.unsplash.com/featured/800x600/?${query}` 
      });
    }

    const unsplashUrl = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape&client_id=${accessKey}`;
    
    const response = await fetch(unsplashUrl, {
      headers: {
        'Accept-Version': 'v1'
      }
    });

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = await response.json();
    let imageUrl = data.urls?.custom || data.urls?.regular;
    
    res.json({ url: imageUrl });
    
  } catch (error) {
    console.error('Error en el proxy:', error.message);
    const fallbackUrl = `https://source.unsplash.com/featured/800x600/?${req.query.query || 'city'}`;
    res.json({ url: fallbackUrl });
  }
});

// API para guardar destinos DEL USUARIO
app.post('/api/destinations', express.json(), (req, res) => {
  try {
    const newDestination = req.body;
    
    // Leer destinos DEL USUARIO existentes
    const userDestinationsPath = path.join(__dirname, '../user-destinations.json');
    let userDestinations = [];
    
    if (fs.existsSync(userDestinationsPath)) {
      const data = fs.readFileSync(userDestinationsPath, 'utf8');
      userDestinations = JSON.parse(data);
    }

    // VERIFICAR SI YA EXISTE para evitar duplicados
    const alreadyExists = userDestinations.some(dest => 
      dest.name === newDestination.name && dest.country === newDestination.country
    );
    
    if (alreadyExists) {
      return res.status(400).json({ 
        success: false, 
        error: 'Este destino ya existe' 
      });
    }
    
    // Agregar nuevo destino DEL USUARIO
    newDestination.id = Date.now();
    newDestination.isUserAdded = true; // Marcar como agregado por usuario
    userDestinations.unshift(newDestination);
    
    // Guardar en archivo SEPARADO
    fs.writeFileSync(userDestinationsPath, JSON.stringify(userDestinations, null, 2));
    
    res.json({ success: true, destination: newDestination });
    
  } catch (error) {
    console.error('Error guardando destino:', error);
    res.status(500).json({ success: false, error: 'Error guardando destino' });
  }
});

// API para obtener destinos DEL USUARIO
app.get('/api/destinations', (req, res) => {
  try {
    const userDestinationsPath = path.join(__dirname, '../user-destinations.json');
    
    if (!fs.existsSync(userDestinationsPath)) {
      return res.json([]);
    }
    
    const data = fs.readFileSync(userDestinationsPath, 'utf8');
    const userDestinations = JSON.parse(data);
    
    res.json(userDestinations);
    
  } catch (error) {
    console.error('Error leyendo destinos:', error);
    res.status(500).json({ error: 'Error leyendo destinos' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Travel Diary API funcionando',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor completo funcionando en http://localhost:${PORT}`);
  console.log(`📸 API Imágenes: http://localhost:${PORT}/api/unsplash-image`);
  console.log(`🗺️ API Destinos: http://localhost:${PORT}/api/destinations`);
  console.log(`🌐 Frontend: http://localhost:${PORT}/`);
  console.log(`❤️  Health: http://localhost:${PORT}/api/health`);
});