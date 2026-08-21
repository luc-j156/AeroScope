import { useState, useEffect } from 'react';
import { Shield, Database, Users, Activity, Settings, RefreshCw, Key, MapPin, Edit2, Trash2, CheckCircle2, X } from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import axios from 'axios';

export default function Admin({ user, citiesData, setCitiesData, alertsCount, lastUpdated, setLastUpdated }) {
  const [backendStatus, setBackendStatus] = useState('Idle');
  const [loading, setLoading] = useState(false);
  const [usersList, setUsersList] = useState([]);
  
  // Override form state
  const [editingCity, setEditingCity] = useState(null);
  const [formData, setFormData] = useState({ aqi: 0, pm2_5: 0, pm10: 0, co2: 0 });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersCol = collection(db, 'users');
      const userSnapshot = await getDocs(usersCol);
      const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsersList(userList);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const handleDeleteCity = (cityName) => {
    setCitiesData(citiesData.filter(city => city.name !== cityName));
    setLastUpdated(new Date().toISOString());
  };

  const handleEditClick = (city) => {
    setEditingCity(city.name);
    setFormData({
      aqi: city.aqi,
      pm2_5: city.pollutants.pm2_5,
      pm10: city.pollutants.pm10,
      co2: city.pollutants.co2
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setCitiesData(citiesData.map(city => {
      if (city.name === editingCity) {
        return {
          ...city,
          aqi: Number(formData.aqi),
          pollutants: {
            ...city.pollutants,
            pm2_5: Number(formData.pm2_5),
            pm10: Number(formData.pm10),
            co2: Number(formData.co2)
          }
        };
      }
      return city;
    }));
    setEditingCity(null);
    setLastUpdated(new Date().toISOString());
  };

  return (
    <div className="p-6 lg:p-10 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center">
            <Shield className="mr-3 h-8 w-8 text-primary-500" />
            Admin Control Panel
          </h1>
          <p className="text-gray-400">Manage application data, users, and system configurations.</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-panel p-6 flex items-center gap-4">
          <div className="p-3 bg-primary-500/10 rounded-xl"><MapPin className="h-6 w-6 text-primary-400" /></div>
          <div><p className="text-sm text-gray-400 font-medium">Cities Monitored</p><p className="text-2xl font-bold text-white">{citiesData.length}</p></div>
        </div>
        <div className="glass-panel p-6 flex items-center gap-4">
          <div className="p-3 bg-red-500/10 rounded-xl"><Activity className="h-6 w-6 text-red-400" /></div>
          <div><p className="text-sm text-gray-400 font-medium">Active Alerts</p><p className="text-2xl font-bold text-white">{alertsCount}</p></div>
        </div>
        <div className="glass-panel p-6 flex items-center gap-4">
          <div className="p-3 bg-accent-green/10 rounded-xl"><RefreshCw className="h-6 w-6 text-accent-green" /></div>
          <div><p className="text-sm text-gray-400 font-medium">Last Data Sync</p><p className="text-sm font-bold text-white mt-1">{new Date(lastUpdated).toLocaleTimeString()}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* City Management Table */}
        <div className="glass-panel p-6 xl:col-span-2 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Database className="h-5 w-5 mr-2 text-primary-400" />
              City Management
            </h3>
          </div>
          <div className="overflow-x-auto flex-1 border border-dark-700 rounded-xl">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="text-xs uppercase bg-dark-800 text-gray-400 border-b border-dark-700">
                <tr>
                  <th className="px-4 py-3 font-medium">City Name</th>
                  <th className="px-4 py-3 font-medium">Current AQI</th>
                  <th className="px-4 py-3 font-medium">PM2.5 / PM10</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {citiesData.map(city => (
                  <tr key={city.name} className="hover:bg-dark-800/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-white">{city.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${city.aqi > 150 ? 'bg-red-500/20 text-red-400' : city.aqi > 100 ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>
                        {city.aqi}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{city.pollutants.pm2_5} / {city.pollutants.pm10}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleEditClick(city)} className="p-1.5 text-gray-400 hover:text-primary-400 transition-colors rounded-md hover:bg-primary-400/10 mr-2" title="Edit Data">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDeleteCity(city.name)} className="p-1.5 text-gray-400 hover:text-red-400 transition-colors rounded-md hover:bg-red-400/10" title="Stop Monitoring">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {citiesData.length === 0 && (
                  <tr><td colSpan="4" className="text-center py-6 text-gray-500">No active cities monitored.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Form & Users Column */}
        <div className="space-y-6">
          
          {/* Manual Override Form */}
          <div className="glass-panel p-6 border-t-4 border-accent-red">
            <h3 className="text-lg font-semibold text-white flex items-center mb-4">
              <Settings className="h-5 w-5 mr-2 text-accent-red" />
              Manual Data Override
            </h3>
            {editingCity ? (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="flex justify-between items-center bg-dark-800 p-3 rounded-lg border border-dark-700">
                  <span className="text-sm font-bold text-white">Target City</span>
                  <span className="text-primary-400 font-bold">{editingCity}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-400 block mb-1">AQI Override</label>
                    <input type="number" required value={formData.aqi} onChange={e => setFormData({...formData, aqi: e.target.value})} className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-400 block mb-1">CO2 (ppm)</label>
                    <input type="number" required value={formData.co2} onChange={e => setFormData({...formData, co2: e.target.value})} className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-400 block mb-1">PM2.5 (μg/m³)</label>
                    <input type="number" required value={formData.pm2_5} onChange={e => setFormData({...formData, pm2_5: e.target.value})} className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-400 block mb-1">PM10 (μg/m³)</label>
                    <input type="number" required value={formData.pm10} onChange={e => setFormData({...formData, pm10: e.target.value})} className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500" />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-accent-red hover:bg-red-500 text-white font-bold py-2 rounded-lg transition-colors flex justify-center items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Apply
                  </button>
                  <button type="button" onClick={() => setEditingCity(null)} className="flex-1 bg-dark-700 hover:bg-dark-600 text-gray-300 font-bold py-2 rounded-lg transition-colors flex justify-center items-center">
                    <X className="h-4 w-4 mr-2" /> Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-8 text-gray-500 bg-dark-800/50 rounded-xl border border-dark-700/50">
                <Edit2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Click the Edit icon on a city<br/>to override its metrics.</p>
              </div>
            )}
          </div>

          {/* User Management Table */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-semibold text-white flex items-center mb-4">
              <Users className="h-5 w-5 mr-2 text-primary-400" />
              Registered Users
            </h3>
            <div className="overflow-y-auto max-h-64 pr-2 border border-dark-700 rounded-xl">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="text-xs uppercase bg-dark-800 text-gray-400 border-b border-dark-700 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 font-medium">User Email</th>
                    <th className="px-4 py-2 font-medium">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700">
                  {usersList.map(u => (
                    <tr key={u.id}>
                      <td className="px-4 py-3 truncate max-w-[150px]" title={u.email}>{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-primary-500/20 text-primary-400' : 'bg-gray-700 text-gray-300'}`}>
                          {u.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {usersList.length === 0 && (
                    <tr><td colSpan="2" className="text-center py-4 text-gray-500">Loading users...</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
