import { useState, useEffect } from 'react';
import { useRef } from 'react';
import { Search, Menu, Bell, X, UserRound, ShieldCheck, LogOut } from 'lucide-react';

export default function Header({ onSearch, toggleSidebar, user, userRole, onLogout }) {
  const [searchValue, setSearchValue] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

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

  useEffect(() => {
    if (!isProfileOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!profileRef.current?.contains(event.target)) setIsProfileOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsProfileOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileOpen]);

  const initials = (user?.displayName || user?.email || 'JD')
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('');

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
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen(open => !open)}
              aria-label="Open account menu"
              aria-haspopup="menu"
              aria-expanded={isProfileOpen}
              className="h-9 w-9 md:h-11 md:w-11 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center font-bold text-sm shadow-lg border border-white/10 text-white flex-shrink-0 hover:ring-2 hover:ring-primary-300/50 transition-all focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              {initials}
            </button>
            {isProfileOpen && (
              <div role="menu" aria-label="Account" className="absolute right-0 top-full mt-3 w-72 rounded-2xl border border-dark-600 bg-dark-800 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-3 border-b border-dark-700">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <UserRound className="h-4 w-4 text-primary-400" />
                    <span className="truncate">{user?.displayName || 'AeroScope user'}</span>
                  </div>
                  <p className="mt-1 pl-6 text-xs text-gray-400 break-all">{user?.email}</p>
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-dark-700 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-300">
                    <ShieldCheck className="h-3.5 w-3.5 text-accent-green" />
                    {userRole || 'public'} account
                  </div>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { setIsProfileOpen(false); onLogout?.(); }}
                  className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
