import { useState, useEffect } from 'react';
import { Search, Menu, Bell, X } from 'lucide-react';

export default function Header({ onSearch, toggleSidebar }) {
  const [searchValue, setSearchValue] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('aeroscope_recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const addToRecent = (city) => {
    if (!city) return;
    const filtered = recentSearches.filter(s => s.toLowerCase() !== city.toLowerCase());
    const updated = [city, ...filtered].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('aeroscope_recent_searches', JSON.stringify(updated));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      onSearch(searchValue.trim());
      addToRecent(searchValue.trim());
      setSearchValue('');
    }
  };

  const removeRecent = (city, e) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== city);
    setRecentSearches(updated);
    localStorage.setItem('aeroscope_recent_searches', JSON.stringify(updated));
  };

  return (
    <header className="min-h-[80px] lg:h-24 glass-panel border-b border-dark-700 flex flex-col justify-center px-4 md:px-6 lg:px-10 sticky top-0 z-10 rounded-none py-4">
      <div className="flex items-center justify-between w-full gap-4">
        <div className="flex items-center gap-2 md:gap-4 flex-1">
          <button 
            onClick={toggleSidebar}
            className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded-xl transition-all"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="relative group flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary-400 transition-colors" />
              <input 
                type="text" 
                placeholder="Search world cities..." 
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-dark-800 border border-dark-600 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 w-full transition-all"
              />
            </div>
            
            {recentSearches.length > 0 && (
              <div className="hidden sm:flex flex-wrap gap-2 mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center mr-1">Recent:</span>
                {recentSearches.map((city) => (
                  <button
                    key={city}
                    onClick={() => onSearch(city)}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-dark-700/50 hover:bg-primary-500/20 text-gray-300 hover:text-primary-400 border border-dark-600 hover:border-primary-500/30 rounded-lg text-[11px] font-medium transition-all group"
                  >
                    {city}
                    <X 
                      className="h-3 w-3 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all" 
                      onClick={(e) => removeRecent(city, e)}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <button className="relative p-2 text-gray-400 hover:text-white transition-colors bg-dark-800/50 rounded-xl border border-dark-700 hidden sm:block">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-accent-red rounded-full"></span>
          </button>
          <div className="h-9 w-9 md:h-11 md:w-11 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center font-bold text-sm shadow-lg border border-white/10 text-white flex-shrink-0">
            JD
          </div>
        </div>
      </div>
    </header>
  );
}
