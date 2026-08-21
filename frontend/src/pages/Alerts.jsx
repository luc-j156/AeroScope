import { useState } from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, Filter, Clock, Activity } from 'lucide-react';

export default function Alerts({ alerts, setAlerts }) {
  const [filter, setFilter] = useState('All'); // All, Warning, Critical, Hazardous

  const filteredAlerts = alerts.filter(a => filter === 'All' || a.severity === filter);

  const getSeverityStyles = (severity) => {
    switch(severity) {
      case 'Warning': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
      case 'Critical': return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'Hazardous': return 'text-purple-500 bg-purple-500/10 border-purple-500/30';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/30';
    }
  };

  const markAsRead = (id) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, read: true } : a));
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString();
  };

  return (
    <div className="space-y-6 md:space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white mb-2 flex items-center">
            <AlertTriangle className="mr-3 md:mr-4 h-8 w-8 md:h-12 md:w-12 text-accent-red" />
            Alerts
          </h1>
          <p className="text-gray-400 text-sm md:text-base font-medium">Manage real-time health warnings and critical air quality updates.</p>
        </div>
        
        {/* Severity Filters */}
        <div className="flex bg-dark-800 p-1.5 rounded-2xl border border-dark-700 self-start lg:self-auto overflow-x-auto no-scrollbar max-w-full">
          {['All', 'Warning', 'Critical', 'Hazardous'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 md:px-6 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                filter === f 
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' 
                : 'text-gray-400 hover:text-white'
              }`}
            >
              <Filter className="h-4 w-4 opacity-70" />
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <ShieldAlert className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No alerts found for this severity.</p>
          </div>
        ) : (
          filteredAlerts.map(alert => (
            <div 
              key={alert.id} 
              className={`p-5 rounded-2xl transition-all border ${
                alert.read 
                ? 'bg-dark-800/40 border-dark-700/50 opacity-70' 
                : `glass-panel border-l-4 ${getSeverityStyles(alert.severity).split(' ')[2]}`
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-full mt-1 ${getSeverityStyles(alert.severity)}`}>
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className={`font-bold text-lg ${alert.read ? 'text-gray-300' : 'text-white'}`}>
                        {alert.city}
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${getSeverityStyles(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className={`${alert.read ? 'text-gray-500' : 'text-gray-300'} mb-2 leading-relaxed`}>
                      {alert.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                      <span className="flex items-center">
                        <Activity className="h-3.5 w-3.5 mr-1" />
                        AQI: <strong className="ml-1 text-gray-300">{alert.aqi}</strong>
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        {formatTime(alert.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>

                {!alert.read && (
                  <button 
                    onClick={() => markAsRead(alert.id)}
                    className="flex-shrink-0 self-start sm:self-center flex items-center px-4 py-2 bg-dark-700 hover:bg-dark-600 text-gray-300 hover:text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark as Read
                  </button>
                )}
                
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
