import { useState } from 'react';
import { Activity, BarChart2, PieChart as PieChartIcon, Map, Calendar } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import { CITIES, getAqiInfo } from './Dashboard';

export default function Analytics({ citiesData = [] }) {
  const [timeFilter, setTimeFilter] = useState('Today'); // Today, Weekly, Monthly

  // Mock data generators
  const generateLineData = (filter) => {
    let length = 24;
    let labelFormat = (i) => `${String(i).padStart(2, '0')}:00`;
    if (filter === 'Weekly') {
      length = 7;
      labelFormat = (i) => ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i];
    } else if (filter === 'Monthly') {
      length = 30;
      labelFormat = (i) => `Day ${i+1}`;
    }

    return Array.from({ length }).map((_, i) => ({
      label: labelFormat(i),
      aqi: Math.floor(Math.random() * 150) + 50
    }));
  };

  const generateBarData = () => {
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({
      day,
      aqi: Math.floor(Math.random() * 120) + 40
    }));
  };

  const pollutantData = [
    { name: 'PM2.5', value: 45, color: '#f87171' },
    { name: 'PM10', value: 30, color: '#fb923c' },
    { name: 'CO2', value: 10, color: '#facc15' },
    { name: 'NO2', value: 10, color: '#60a5fa' },
    { name: 'SO2', value: 5, color: '#c084fc' },
  ];

  const cityComparisonData = citiesData.map((city) => ({
    name: city.name,
    aqi: city.aqi
  })).sort((a, b) => b.aqi - a.aqi);

  const lineData = generateLineData(timeFilter);
  const barData = generateBarData();

  return (
    <div className="space-y-6 md:space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white mb-2 flex items-center">
            <BarChart2 className="mr-3 md:mr-4 h-8 w-8 md:h-12 md:w-12 text-primary-500" />
            Analytics
          </h1>
          <p className="text-gray-400 text-sm md:text-base font-medium">Deep dive into historical air quality metrics and environmental trends.</p>
        </div>
        
        {/* Time Filters */}
        <div className="flex bg-dark-800 p-1.5 rounded-2xl border border-dark-700 self-start lg:self-auto">
          {['Today', 'Weekly', 'Monthly'].map(filter => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-4 md:px-6 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${
                timeFilter === filter 
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' 
                : 'text-gray-400 hover:text-white'
              }`}
            >
              <Calendar className="h-4 w-4 opacity-70" />
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        
        {/* Chart 1: Line Chart (AQI Trend) */}
        <div className="glass-panel p-6 md:p-8 lg:col-span-2 rounded-[2rem]">
          <h3 className="text-lg md:text-xl font-black text-white mb-8 flex items-center gap-3">
            <Activity className="h-5 w-5 text-primary-400" />
            AQI TREND <span className="text-[10px] font-bold text-gray-500 tracking-widest">({timeFilter.toUpperCase()})</span>
          </h3>
          <div className="h-72 md:h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', border: '1px solid #1e293b' }} />
                <Line type="monotone" dataKey="aqi" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, fill: '#1e293b', stroke: '#3b82f6', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Bar Chart (7-Day Average) */}
        <div className="glass-panel p-6 md:p-8 rounded-[2rem]">
          <h3 className="text-lg md:text-xl font-black text-white mb-8 flex items-center gap-3">
            <BarChart2 className="h-5 w-5 text-primary-400" />
            WEEKLY AVERAGE
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', border: '1px solid #1e293b' }} cursor={{fill: '#334155', opacity: 0.4}} />
                <Bar dataKey="aqi" radius={[6, 6, 0, 0]} barSize={32}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#3b82f6" fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Pie Chart (Pollutant Breakdown) */}
        <div className="glass-panel p-6 md:p-8 rounded-[2rem]">
          <h3 className="text-lg md:text-xl font-black text-white mb-8 flex items-center gap-3">
            <PieChartIcon className="h-5 w-5 text-primary-400" />
            POLLUTANTS
          </h3>
          <div className="h-64 w-full flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pollutantData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={8} dataKey="value" stroke="none">
                  {pollutantData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', border: '1px solid #1e293b' }} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#94a3b8' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Horizontal Bar Chart (City Comparison) */}
        <div className="glass-panel p-6 md:p-8 lg:col-span-2 rounded-[2rem]">
          <h3 className="text-lg md:text-xl font-black text-white mb-8 flex items-center gap-3">
            <Map className="h-5 w-5 text-primary-400" />
            CITY COMPARISON <span className="text-[10px] font-bold text-gray-500 tracking-widest">(LIVE AQI)</span>
          </h3>
          <div className="h-[400px] md:h-[500px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={cityComparisonData} margin={{ top: 5, right: 30, bottom: 5, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" stroke="#f8fafc" fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} dx={-10} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', border: '1px solid #1e293b' }} cursor={{fill: '#334155', opacity: 0.2}} />
                <Bar dataKey="aqi" radius={[0, 6, 6, 0]} barSize={12}>
                  {cityComparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getAqiInfo(entry.aqi).color.includes('green') ? '#10b981' : 
                                                      getAqiInfo(entry.aqi).color.includes('yellow') ? '#f59e0b' : 
                                                      getAqiInfo(entry.aqi).color.includes('orange') ? '#f97316' : 
                                                      getAqiInfo(entry.aqi).color.includes('red') ? '#ef4444' : '#a855f7'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
