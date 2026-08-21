import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Wind, Thermometer, CloudRain, Activity, Info, Navigation } from 'lucide-react';
import { getAqiInfo } from './Dashboard';

// Fix for default marker icons in Leaflet with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Use the correct OpenWeatherMap API key
const API_KEY = '25cdbb2311d88cd12e9468a8c8fabead'; 

const createCustomIcon = (aqiColor) => {
  const colorMap = {
    'text-green-500': '#22c55e',
    'text-yellow-400': '#facc15',
    'text-orange-500': '#f97316',
    'text-red-500': '#ef4444',
    'text-purple-500': '#a855f7'
  };
  const hexColor = colorMap[aqiColor] || '#3b82f6';
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${hexColor};" class="w-4 h-4 rounded-full border-2 border-white shadow-lg pulse-animation"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function MapView({ citiesData, selectedCityName, setSelectedCityName, setActiveTab, onSearch }) {
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
  const [zoom, setZoom] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync map center with selected city
  useEffect(() => {
    if (selectedCityName) {
      const city = citiesData.find(c => c.name === selectedCityName);
      if (city) {
        setMapCenter([city.lat, city.lon]);
        setZoom(10);
      }
    }
  }, [selectedCityName, citiesData]);

  const handleLocalSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      // 1. Geocode city name to get lat/lon
      const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(searchQuery.trim())}&limit=1&appid=${API_KEY}`;
      const geoRes = await axios.get(geoUrl);
      
      if (!geoRes.data || geoRes.data.length === 0) {
        alert("City not found. Please try another name.");
        setLoading(false);
        return;
      }

      const { name, lat, lon } = geoRes.data[0];

      // 2. Fetch AQI data
      const pollutionUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
      const pollutionRes = await axios.get(pollutionUrl);
      const pollutionData = pollutionRes.data.list[0];

      // 3. Update global state via App.jsx's search handler to keep data consistent
      // But we can also manually trigger the zoom here for immediate feedback
      await onSearch(name); 
      
      setMapCenter([lat, lon]);
      setZoom(12);
      setSelectedCityName(name);

    } catch (error) {
      console.error("Search error:", error);
      alert("Error fetching location data. Please check your API key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden rounded-[2rem] border border-dark-700 shadow-2xl">
      {/* Map Search Bar overlay */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-sm md:max-w-md px-4">
        <form onSubmit={handleLocalSearch} className="relative group">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${loading ? 'animate-spin text-primary-500' : 'text-gray-400'} group-focus-within:text-primary-400 transition-colors`} />
          <input 
            type="text" 
            placeholder="Search any world city..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-dark-900/80 backdrop-blur-xl border border-dark-700 text-white rounded-2xl pl-12 pr-4 py-3 shadow-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-sm md:text-base"
          />
        </form>
      </div>

      <div className="flex-1 w-full h-full min-h-[500px] z-0">
        <MapContainer center={mapCenter} zoom={zoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%', background: '#0f172a' }} zoomControl={false}>
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <ChangeView center={mapCenter} zoom={zoom} />

          {citiesData.map((city) => {
            const aqiInfo = getAqiInfo(city.aqi);
            return (
              <Marker 
                key={city.id || city.name} 
                position={[city.lat, city.lon]} 
                icon={createCustomIcon(aqiInfo.color)}
                eventHandlers={{ click: () => setSelectedCityName(city.name) }}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                  <div className="bg-dark-900 text-white p-2 rounded-lg border border-dark-700 shadow-xl flex flex-col items-center">
                    <span className="font-bold text-xs md:text-sm">{city.name}</span>
                    <span className={`text-[10px] md:text-xs font-black ${aqiInfo.color}`}>AQI: {city.aqi}</span>
                  </div>
                </Tooltip>
                <Popup className="custom-leaflet-popup">
                  <div className="bg-dark-900 text-gray-100 p-4 rounded-xl border border-dark-700 min-w-[240px] md:min-w-[280px] shadow-2xl">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg md:text-xl font-bold text-white leading-tight">{city.name}</h3>
                        <div className="flex items-center text-[10px] md:text-xs text-gray-400 mt-1"><MapPin className="h-3 w-3 mr-1" />{city.lat.toFixed(2)}, {city.lon.toFixed(2)}</div>
                      </div>
                      <div className={`flex flex-col items-center justify-center h-12 w-12 md:h-14 md:w-14 rounded-xl bg-dark-800 border ${aqiInfo.border}`}>
                        <span className={`text-xl md:text-2xl font-black ${aqiInfo.color}`}>{city.aqi}</span>
                        <span className="text-[8px] font-bold uppercase tracking-tighter text-gray-500">AQI</span>
                      </div>
                    </div>
                    <div className={`px-3 py-1.5 rounded-lg ${aqiInfo.bg}/10 mb-4 border ${aqiInfo.border}`}>
                      <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wider ${aqiInfo.color}`}>{aqiInfo.text}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-dark-800/50 p-2 rounded-lg border border-dark-700/50">
                        <p className="text-[9px] text-gray-500 font-bold uppercase">PM2.5</p>
                        <p className="text-xs font-bold text-white">{city.pollutants?.pm2_5 || 'N/A'}</p>
                      </div>
                      <div className="bg-dark-800/50 p-2 rounded-lg border border-dark-700/50">
                        <p className="text-[9px] text-gray-500 font-bold uppercase">Temp</p>
                        <p className="text-xs font-bold text-white">{city.weather?.temperature || 'N/A'}°C</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setSelectedCityName(city.name); setActiveTab('dashboard'); }} 
                      className="w-full bg-primary-500 hover:bg-primary-600 text-white text-[10px] md:text-xs font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Activity className="h-3.5 w-3.5" /> View Dashboard
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Legend Overlay */}
      <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 z-[1000] glass-panel p-3 md:p-4 border border-dark-700 shadow-2xl max-w-[150px] md:max-w-[200px]">
        <h4 className="text-[9px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 md:mb-3 flex items-center gap-2"><Info className="h-3 w-3 text-primary-400" /> AQI Legend</h4>
        <div className="space-y-2 md:space-y-2.5">
          {[
            { label: 'Good', color: 'bg-green-500', range: '0-50' },
            { label: 'Moderate', color: 'bg-yellow-400', range: '51-100' },
            { label: 'Unhealthy', color: 'bg-orange-500', range: '101-150' },
            { label: 'Hazardous', color: 'bg-purple-500', range: '151+' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${item.color}`}></div>
                <span className="text-[9px] md:text-[10px] font-medium text-gray-200">{item.label}</span>
              </div>
              <span className="text-[8px] md:text-[9px] font-mono text-gray-500">{item.range}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
