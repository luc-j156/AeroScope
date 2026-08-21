import { LayoutDashboard, Map as MapIcon, BarChart3, Bell, Shield, LogOut, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'map', label: 'Map View', icon: MapIcon },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'admin', label: 'Admin Panel', icon: Shield, role: 'admin' },
];

export default function Sidebar({ activeTab, setActiveTab, unreadCount = 0, userRole, isOpen, onClose, onLogout }) {
  const filteredItems = NAV_ITEMS.filter(item => !item.role || item.role === userRole);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-dark-900 border-r border-dark-700 w-72">
      <div className="p-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <span className="text-white font-black text-xl">A</span>
          </div>
          <span className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">AEROSCOPE</span>
        </div>
        <button onClick={onClose} className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors">
          <X className="h-6 w-6" />
        </button>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group relative ${
              activeTab === item.id 
                ? 'bg-primary-500/10 text-primary-400 font-bold' 
                : 'text-gray-400 hover:bg-dark-800 hover:text-gray-200'
            }`}
          >
            {activeTab === item.id && (
              <motion.div 
                layoutId="activeTab"
                className="absolute left-0 w-1 h-6 bg-primary-500 rounded-r-full"
              />
            )}
            <item.icon className={`h-5 w-5 transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
            <span className="text-sm tracking-wide">{item.label}</span>
            {item.id === 'alerts' && unreadCount > 0 && (
              <span className="ml-auto bg-accent-red text-white text-[10px] font-black h-5 w-5 flex items-center justify-center rounded-lg animate-pulse shadow-lg shadow-accent-red/20">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="p-6">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-4 py-3.5 text-gray-400 hover:text-accent-red hover:bg-accent-red/10 rounded-xl transition-all duration-300 group"
        >
          <LogOut className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block h-screen sticky top-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden shadow-2xl"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
