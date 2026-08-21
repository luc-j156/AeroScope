import { useState, useEffect } from 'react';
import { Activity, MapPin, AlertTriangle, Thermometer, CloudRain, Wind, Eye, Gauge, ChevronDown, Droplets } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

export const CITIES = [
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

export const getAqiInfo = (aqi) => {
  if (aqi <= 50) return { text: 'Good', color: 'text-green-500', bg: 'bg-green-500', border: 'border-green-500/30', advisory: 'Air quality is excellent. Enjoy outdoor activities!' };
  if (aqi <= 100) return { text: 'Moderate', color: 'text-yellow-400', bg: 'bg-yellow-400', border: 'border-yellow-400/30', advisory: 'Air quality is acceptable. Unusually sensitive people should limit exertion.' };
  if (aqi <= 150) return { text: 'Unhealthy (SG)', color: 'text-orange-500', bg: 'bg-orange-500', border: 'border-orange-500/30', advisory: 'Sensitive groups should limit prolonged outdoor exertion.' };
  if (aqi <= 200) return { text: 'Unhealthy', color: 'text-red-500', bg: 'bg-red-500', border: 'border-red-500/30', advisory: 'Active children and adults should avoid prolonged outdoor exertion.' };
  return { text: 'Hazardous', color: 'text-purple-500', bg: 'bg-purple-500', border: 'border-purple-500/30', advisory: 'Everyone should avoid all outdoor exertion.' };
};

const CircularGauge = ({ value, max = 500, color }) => {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="relative flex justify-center items-center h-32 w-32 md:h-40 md:w-40">
      <svg className="transform -rotate-90 w-32 h-32 md:w-40 md:h-40 drop-shadow-xl">
        <circle cx="50%" cy="50%" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-dark-700" />
        <circle cx="50%" cy="50%" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className={`${color} transition-all duration-1000 ease-out`} />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-3xl md:text-5xl font-black text-white tracking-tighter">{value}</span>
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">AQI</span>
      </div>
    </div>
  );
};

export default function Dashboard({ citiesData, lastUpdated, selectedCityName, setSelectedCityName }) {
  const [data, setData] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (citiesData && citiesData.length > 0) {
      const cityData = citiesData.find(c => c.name === selectedCityName) || citiesData[0];
      setData({
        name: cityData.name,
        lat: cityData.lat,
        lon: cityData.lon,
        aqi: cityData.aqi,
        components: cityData.pollutants,
        weather: cityData.weather,
        lastUpdated: cityData.lastUpdated
      });
    }
  }, [selectedCityName, citiesData]);

  if (!data) return null;

  const aqiInfo = getAqiInfo(data.aqi);
  const chartData = Array.from({ length: 7 }).map((_, i) => ({
    time: `${String(i * 4).padStart(2, '0')}:00`,
    aqi: Math.max(0, data.aqi + (Math.random() * 40 - 20))
  }));

  return (
    <div className="space-y-6 md:space-y-10">
      {/* City Selector Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter text-white">
            {data.name}
          </h2>
          <div className="flex items-center gap-2 text-gray-400 text-sm md:text-base">
            <MapPin className="h-4 w-4 text-primary-500" />
            <span className="font-medium">{data.lat.toFixed(2)}, {data.lon.toFixed(2)}</span>
            <span className="mx-2 hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5 bg-dark-800 px-2.5 py-1 rounded-lg border border-dark-700">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">Live</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative">
          <div className="flex items-center bg-dark-800 p-1 rounded-xl border border-dark-700 overflow-x-auto no-scrollbar">
            {citiesData.slice(0, 5).map((city) => (
              <button
                key={city.name}
                onClick={() => setSelectedCityName(city.name)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  selectedCityName === city.name 
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' 
                    : 'text-gray-400 hover:text-white hover:bg-dark-700'
                }`}
              >
                {city.name}
              </button>
            ))}
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all group w-full sm:w-auto ${
                isDropdownOpen 
                ? 'bg-primary-500 text-white border-primary-400' 
                : 'bg-dark-800 hover:bg-dark-700 text-white border-dark-700'
              }`}
            >
              <span className="text-xs font-bold">More Cities</span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-[40]" onClick={() => setIsDropdownOpen(false)}></div>
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-full sm:w-64 max-h-80 overflow-y-auto bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl z-[50] p-2 no-scrollbar"
                  >
                    <div className="grid grid-cols-1 gap-1">
                      {citiesData.map((city) => (
                        <button
                          key={city.name}
                          onClick={() => {
                            setSelectedCityName(city.name);
                            setIsDropdownOpen(false);
                          }}
                          className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                            selectedCityName === city.name 
                              ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20' 
                              : 'text-gray-400 hover:bg-dark-700 hover:text-white border border-transparent'
                          }`}
                        >
                          <span className="text-sm font-bold">{city.name}</span>
                          <div className={`h-2 w-2 rounded-full ${getAqiInfo(city.aqi).bg}`}></div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* AQI Main Card */}
        <div className={`lg:col-span-2 rounded-[2rem] p-6 md:p-10 border relative overflow-hidden group transition-all duration-500 ${aqiInfo.bg}/10 ${aqiInfo.border}`}>
          <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-700 hidden md:block">
            <Wind className="h-48 w-48 lg:h-64 lg:w-64" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8 md:mb-10">
              <div className={`h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center border shadow-lg ${aqiInfo.bg} ${aqiInfo.border}`}>
                <Activity className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <div>
                <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400">Current AQI</p>
                <p className="text-white text-xs font-medium">Synced: {new Date(data.lastUpdated || new Date()).toLocaleTimeString()}</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-12">
              <div className="flex justify-center md:block">
                <CircularGauge value={data.aqi} color={aqiInfo.color} />
              </div>
              <div className="text-center md:text-left">
                <h3 className={`text-3xl md:text-5xl font-black mb-3 ${aqiInfo.color}`}>{aqiInfo.text}</h3>
                <p className="text-gray-400 text-sm md:text-base max-w-sm mx-auto md:mx-0 leading-relaxed">
                  "{aqiInfo.advisory}"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Weather Brief */}
        <div className="glass-panel p-6 md:p-8 rounded-[2rem] border-dark-700 flex flex-col justify-between group hover:border-primary-500/50 transition-all duration-500 relative overflow-hidden h-full">
          <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
            <CloudRain className="h-40 w-40 md:h-52 md:w-52 text-primary-500" />
          </div>
          <div className="flex items-center justify-between relative z-10">
            <div className="h-12 w-12 rounded-2xl bg-dark-800 border border-dark-600 flex items-center justify-center group-hover:border-primary-500/50 transition-colors">
              <Thermometer className="h-6 w-6 text-primary-400" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Weather Report</span>
          </div>
          <div className="mt-8 relative z-10">
            <h4 className="text-5xl md:text-6xl font-black text-white mb-2">{data.weather.temperature}°</h4>
            <p className="text-gray-400 font-medium">Partly Cloudy • High 32° / Low 24°</p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 relative z-10">
            <div className="bg-dark-800/50 p-3 rounded-2xl border border-dark-700">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Humidity</p>
              <p className="text-lg font-bold text-white">{data.weather.humidity}%</p>
            </div>
            <div className="bg-dark-800/50 p-3 rounded-2xl border border-dark-700">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Wind</p>
              <p className="text-lg font-bold text-white">{data.weather.windSpeed} <span className="text-xs font-normal text-gray-500">km/h</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Pollutants Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
        {[
          { label: 'PM2.5', value: data.components.pm2_5, unit: 'μg/m³', icon: Droplets, color: 'text-blue-400' },
          { label: 'PM10', value: data.components.pm10, unit: 'μg/m³', icon: Wind, color: 'text-teal-400' },
          { label: 'CO2', value: data.components.co2, unit: 'ppm', icon: Activity, color: 'text-purple-400' },
          { label: 'NO2', value: data.components.no2, unit: 'μg/m³', icon: Activity, color: 'text-orange-400' },
          { label: 'SO2', value: data.components.so2, unit: 'μg/m³', icon: Droplets, color: 'text-red-400' },
        ].map((p) => (
          <div key={p.label} className="glass-panel p-5 md:p-6 rounded-3xl border-dark-700 hover:border-dark-500 transition-all duration-300 hover:translate-y-[-4px] group">
            <div className="flex items-center justify-between mb-4">
              <div className={`h-8 w-8 rounded-lg bg-dark-800 border border-dark-700 flex items-center justify-center group-hover:border-white/10 transition-colors`}>
                <p.icon className={`h-4 w-4 ${p.color}`} />
              </div>
              <span className="text-[10px] font-black text-gray-500">{p.label}</span>
            </div>
            <div className="space-y-1 text-center md:text-left">
              <p className="text-xl md:text-2xl font-black text-white">{p.value}</p>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">{p.unit}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Forecast Chart */}
      <div className="glass-panel p-6 md:p-8 rounded-[2rem] border-dark-700">
        <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3">
          <Activity className="h-5 w-5 text-primary-400" />
          AQI TREND <span className="text-[10px] font-bold text-gray-500 tracking-widest">(24H FORECAST)</span>
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', border: '1px solid #1e293b' }} 
                itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }} 
              />
              <Line type="monotone" dataKey="aqi" stroke="#3b82f6" strokeWidth={4} dot={false} activeDot={{ r: 8, fill: '#3b82f6', stroke: '#fff' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
