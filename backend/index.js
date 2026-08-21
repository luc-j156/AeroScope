const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const admin = require('firebase-admin');

// Initialize Firebase Admin for JWT Verification
admin.initializeApp({
  projectId: 'aeroscope-9fb6d'
});
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const db = admin.firestore();

// In-memory cache fallback if Firestore fails
let memoryCache = {
  air_quality_data: {},
  metadata: { last_update: { timestamp: new Date().toISOString() } }
};

const CITIES = [
  { name: 'Delhi', lat: 28.7041, lon: 77.1025 },
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
  { name: 'Bangalore', lat: 12.9716, lon: 77.5946 },
  { name: 'Chennai', lat: 13.0827, lon: 80.2707 },
  { name: 'Kolkata', lat: 22.5726, lon: 88.3639 },
  { name: 'Hyderabad', lat: 17.3850, lon: 78.4867 },
  { name: 'Pune', lat: 18.5204, lon: 73.8567 },
  { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714 },
  { name: 'Jaipur', lat: 26.9124, lon: 75.7873 },
  { name: 'Lucknow', lat: 26.8467, lon: 80.9462 },
  { name: 'Chandigarh', lat: 30.7333, lon: 76.7794 },
  { name: 'Surat', lat: 21.1702, lon: 72.8311 },
  { name: 'Patna', lat: 25.5941, lon: 85.1376 },
  { name: 'Bhopal', lat: 23.2599, lon: 77.4126 },
  { name: 'Kochi', lat: 9.9312, lon: 76.2673 },
];

// Helper function to fetch data for a single city
async function fetchCityData(city, apiKey) {
  const timestamp = new Date().toISOString();
  
  // Fetch Air Pollution Data
  const pollutionRes = await axios.get(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${city.lat}&lon=${city.lon}&appid=${apiKey}`);
  const pollutionData = pollutionRes.data.list[0];

  // Fetch Weather Data
  const weatherRes = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lon}&appid=${apiKey}&units=metric`);
  const weatherData = weatherRes.data;

  return {
    id: city.name,
    name: city.name,
    lat: city.lat,
    lon: city.lon,
    aqi: pollutionData.main.aqi * 20, 
    aqiDisplay: [0, 20, 80, 150, 250, 450][pollutionData.main.aqi],
    aqiRaw: pollutionData.main.aqi,
    pollutants: {
      pm2_5: pollutionData.components.pm2_5,
      pm10: pollutionData.components.pm10,
      co2: Math.floor(Math.random() * 50) + 400, // Mocked
      no2: pollutionData.components.no2,
      so2: pollutionData.components.so2,
      co: pollutionData.components.co
    },
    weather: {
      temperature: Math.round(weatherData.main.temp),
      humidity: weatherData.main.humidity,
      windSpeed: weatherData.wind.speed,
      visibility: weatherData.visibility / 1000,
      pressure: weatherData.main.pressure
    },
    lastUpdated: timestamp
  };
}

// Endpoint to trigger manual update (for predefined cities)
app.get('/api/air-quality/update', async (req, res) => {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  const results = [];
  const timestamp = new Date().toISOString();

  try {
    for (const city of CITIES) {
      const cityData = await fetchCityData(city, apiKey);
      
      // Store in memory cache
      memoryCache.air_quality_data[city.name] = cityData;

      // Try storing in Firestore
      try {
        await db.collection('air_quality_data').doc(city.name).set(cityData);
      } catch (e) {
        console.warn(`Firestore save failed for ${city.name}, using memory fallback.`);
      }
      
      results.push(cityData);
    }

    // Update global last_updated
    memoryCache.metadata.last_update.timestamp = timestamp;
    try {
      await db.collection('metadata').doc('last_update').set({ timestamp });
    } catch (e) {
      console.warn("Firestore metadata update failed.");
    }

    res.json({ message: 'Air quality data updated successfully', lastUpdated: timestamp, results, count: results.length });
  } catch (error) {
    console.error('Error updating air quality data:', error);
    res.status(500).json({ error: 'Failed to update air quality data', details: error.message });
  }
});

// Endpoint to fetch data for ANY city
app.get('/api/air-quality/city/:cityName', async (req, res) => {
  const { cityName } = req.params;
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;

  try {
    const geoRes = await axios.get(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=${apiKey}`);
    
    if (!geoRes.data || geoRes.data.length === 0) {
      return res.status(404).json({ error: 'City not found' });
    }

    const { name, lat, lon } = geoRes.data[0];
    const cityData = await fetchCityData({ name, lat, lon }, apiKey);

    // Store in memory cache
    memoryCache.air_quality_data[name] = cityData;

    // Try storing in Firestore
    try {
      await db.collection('air_quality_data').doc(name).set(cityData);
    } catch (e) {}

    res.json(cityData);
  } catch (error) {
    console.error(`Error fetching data for city ${cityName}:`, error);
    res.status(500).json({ error: 'Failed to fetch city data', details: error.message });
  }
});

// Endpoint to get latest data for all cities
app.get('/api/air-quality/latest', async (req, res) => {
  try {
    let citiesData = [];
    let lastUpdated = memoryCache.metadata.last_update.timestamp;

    try {
      const snapshot = await db.collection('air_quality_data').get();
      snapshot.forEach(doc => citiesData.push(doc.data()));
      
      const metadata = await db.collection('metadata').doc('last_update').get();
      if (metadata.exists) lastUpdated = metadata.data().timestamp;
    } catch (e) {
      console.warn("Firestore fetch failed, using memory cache.");
      citiesData = Object.values(memoryCache.air_quality_data);
    }

    // If memory cache is also empty, trigger an update automatically
    if (citiesData.length === 0) {
      const apiKey = process.env.OPENWEATHERMAP_API_KEY;
      try {
        const updatePromises = CITIES.slice(0, 10).map(city => fetchCityData(city, apiKey));
        const results = await Promise.all(updatePromises);
        results.forEach(data => {
          citiesData.push(data);
          memoryCache.air_quality_data[data.name] = data;
        });
      } catch (err) {
        console.error("Auto-update failed:", err);
      }
    }

    res.json({ citiesData, lastUpdated });
  } catch (error) {
    console.error('Error in latest endpoint:', error);
    res.status(500).json({ error: 'Failed to fetch latest data' });
  }
});

// Middleware to verify Firebase JWT Token
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split('Bearer ')[1];
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

// Protected Admin Route
app.get('/api/admin/system', verifyToken, (req, res) => {
  res.json({ 
    message: `Secure connection established. JWT successfully validated for UID: ${req.user.uid}` 
  });
});

app.listen(PORT, () => {
  console.log(`AEROSCOPE Backend Server is running on port ${PORT}`);
});
