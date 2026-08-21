import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard, { CITIES } from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Alerts from './pages/Alerts';
import Auth from './pages/Auth';
import Admin from './pages/Admin';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Activity, AlertCircle, RefreshCw } from 'lucide-react';

import MapView from './pages/Map';
import API_BASE_URL from './api/config';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [alerts, setAlerts] = useState([]);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [citiesData, setCitiesData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date().toISOString());
  const [selectedCityName, setSelectedCityName] = useState('Delhi');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAirQuality = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/air-quality/latest`);
      if (response.data.citiesData && response.data.citiesData.length > 0) {
        setCitiesData(response.data.citiesData);
        setLastUpdated(response.data.lastUpdated);
        if (!selectedCityName) setSelectedCityName(response.data.citiesData[0].name);
      } else {
        const updateRes = await axios.get(`${API_BASE_URL}/api/air-quality/update`);
        if (updateRes.data.results) {
          setCitiesData(updateRes.data.results);
          setLastUpdated(updateRes.data.lastUpdated);
          setSelectedCityName(updateRes.data.results[0].name);
        } else {
          throw new Error("No results from update");
        }
      }
    } catch (error) {
      console.error("Error fetching air quality data:", error);
      setError("Unable to connect to the backend server. Using offline mock data.");
      const mockData = CITIES.map((city, index) => ({
        id: city.name,
        name: city.name,
        lat: city.lat,
        lon: city.lon,
        aqi: 85 + (index * 12) % 150,
        pollutants: { 
          pm2_5: 30 + (index * 5) % 100, 
          pm10: 50 + (index * 8) % 150, 
          co2: 400 + (index * 2), 
          no2: 20 + (index * 3) % 50, 
          so2: 10 + (index * 2) % 30, 
          co: 0.5 + (index * 0.1) 
        },
        weather: { 
          temperature: 24 + (index % 10), 
          humidity: 50 + (index % 30), 
          windSpeed: 10 + (index % 15), 
          visibility: 10 - (index % 5), 
          pressure: 1010 + (index % 5) 
        }
      }));
      setCitiesData(mockData);
      setSelectedCityName(mockData[0].name);
      setLastUpdated(new Date().toISOString());
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (cityName) => {
    if (!cityName) return;
    
    setIsLoading(true);
    // Check if city exists in current list
    const existingCity = citiesData.find(c => c.name.toLowerCase() === cityName.toLowerCase());
    if (existingCity) {
      setSelectedCityName(existingCity.name);
      if (activeTab !== 'map' && activeTab !== 'dashboard') {
        setActiveTab('dashboard');
      }
      setIsLoading(false);
      return;
    }

    // If not, fetch from backend
    try {
      const response = await axios.get(`${API_BASE_URL}/api/air-quality/city/${encodeURIComponent(cityName)}`);
      const newCityData = response.data;
      
      setCitiesData(prev => {
        if (prev.find(c => c.name === newCityData.name)) return prev;
        return [...prev, newCityData];
      });
      setSelectedCityName(newCityData.name);
      if (activeTab !== 'map' && activeTab !== 'dashboard') {
        setActiveTab('dashboard');
      }
    } catch (error) {
      console.error("Error searching for city:", error);
      alert("City not found or error fetching data.");
    } finally {
      setIsLoading(false);
    }
  };

  const triggerUpdate = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/air-quality/update`);
      const latestRes = await axios.get(`${API_BASE_URL}/api/air-quality/latest`);
      setCitiesData(latestRes.data.citiesData);
      setLastUpdated(latestRes.data.lastUpdated);
    } catch (error) {
      console.error("Error updating air quality data:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    fetchAirQuality();
    const interval = setInterval(() => {
      triggerUpdate();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          } else {
            setUserRole('public');
          }
        } catch (e) {
          console.error("Error fetching user role", e);
          setUserRole('public');
        }
      } else {
        setUserRole(null);
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (citiesData.length === 0) return;
    const generatedAlerts = [];
    citiesData.forEach((cityData) => {
      const mockAqi = cityData.aqi;
      let severity = null;
      let description = '';
      if (mockAqi >= 150) {
        severity = 'Hazardous';
        description = 'Health warnings of emergency conditions.';
      } else if (mockAqi >= 100) {
        severity = 'Critical';
        description = 'Everyone may begin to experience health effects.';
      } else if (mockAqi >= 50) {
        severity = 'Warning';
        description = 'Members of sensitive groups may experience health effects.';
      }

      if (severity) {
        generatedAlerts.push({
          id: `alert-${cityData.id}-${Date.now()}`,
          city: cityData.name,
          aqi: mockAqi,
          severity,
          description,
          timestamp: new Date().toISOString(),
          read: false
        });
      }
    });

    generatedAlerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setAlerts(generatedAlerts);
  }, [citiesData]);

  const unreadCount = alerts.filter(a => !a.read).length;

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-dark-900">
        <div className="relative">
          <Activity className="h-12 w-12 animate-pulse text-primary-500" />
          <div className="absolute inset-0 h-12 w-12 animate-ping border-2 border-primary-500 rounded-full opacity-20"></div>
        </div>
        <p className="mt-4 text-gray-400 font-medium animate-pulse">Initializing AEROSCOPE...</p>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  return (
    <div className="min-h-screen flex bg-dark-900 text-gray-100 overflow-hidden font-sans relative">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => { setActiveTab(tab); setIsSidebarOpen(false); }} 
        unreadCount={unreadCount} 
        userRole={userRole}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
      />
      
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative">
        <Header onSearch={handleSearch} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        {error && (
          <div className="mx-6 mt-4 bg-accent-orange/10 border border-accent-orange/20 text-accent-orange px-4 py-3 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{error}</span>
            </div>
            <button onClick={fetchAirQuality} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="flex-1 p-4 md:p-6 lg:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + selectedCityName}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full"
            >
              {isLoading && !citiesData.length ? (
                <div className="h-full flex flex-col items-center justify-center">
                  <RefreshCw className="h-10 w-10 animate-spin text-primary-500 mb-4" />
                  <p className="text-gray-400">Fetching environmental data...</p>
                </div>
              ) : (
                <>
                  {activeTab === 'dashboard' && (
                    <Dashboard 
                      citiesData={citiesData} 
                      lastUpdated={lastUpdated} 
                      selectedCityName={selectedCityName}
                      setSelectedCityName={setSelectedCityName}
                    />
                  )}
                  {activeTab === 'map' && (
                    <MapView 
                      citiesData={citiesData} 
                      selectedCityName={selectedCityName}
                      setSelectedCityName={setSelectedCityName}
                      setActiveTab={setActiveTab}
                      onSearch={handleSearch}
                    />
                  )}
                  {activeTab === 'analytics' && <Analytics citiesData={citiesData} />}
                  {activeTab === 'alerts' && <Alerts alerts={alerts} setAlerts={setAlerts} />}
                  {activeTab === 'admin' && userRole === 'admin' && (
                    <Admin 
                      user={user} 
                      citiesData={citiesData} 
                      setCitiesData={setCitiesData} 
                      alertsCount={unreadCount} 
                      lastUpdated={lastUpdated} 
                      setLastUpdated={setLastUpdated} 
                    />
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Loading Overlay for searching */}
      {isLoading && citiesData.length > 0 && (
        <div className="absolute inset-0 z-50 bg-dark-900/40 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-300">
          <div className="bg-dark-800/80 p-6 rounded-2xl border border-dark-600 shadow-2xl flex flex-col items-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary-500 mb-3" />
            <p className="text-sm font-medium text-white">Updating Dashboard...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
