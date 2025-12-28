
import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StockData, PricePoint } from '../types';

interface StockChartProps {
  stock: StockData;
}

type TimeFrame = '1H' | '1D' | '1W' | '1M';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 p-2 rounded shadow-lg">
        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-tighter mb-1">{label}</p>
        <p className="text-emerald-400 font-bold font-mono text-sm">${payload[0].value.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

const StockChart: React.FC<StockChartProps> = ({ stock }) => {
  const [timeframe, setTimeframe] = useState<TimeFrame>('1D');
  
  const isPositive = stock.change >= 0;
  const chartColor = isPositive ? '#10b981' : '#f43f5e';

  // Simulate different data sets based on timeframe for visual variety
  const chartData = useMemo(() => {
    const baseHistory = stock.history;
    if (timeframe === '1D') return baseHistory;

    // Helper to generate jittered history based on the current price
    const generateJitter = (points: number, intervalMinutes: number) => {
      const data: PricePoint[] = [];
      let lastPrice = stock.price;
      const now = new Date();
      
      for (let i = points; i >= 0; i--) {
        const time = new Date(now.getTime() - i * intervalMinutes * 60000);
        // Add some volatility
        const jitter = 1 + (Math.random() - 0.5) * 0.01;
        lastPrice = lastPrice * jitter;
        data.push({
          time: time.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            ...(timeframe === '1H' ? { second: '2-digit' } : {})
          }),
          price: parseFloat(lastPrice.toFixed(2))
        });
      }
      return data;
    };

    switch (timeframe) {
      case '1H': return generateJitter(60, 1); // 60 points, 1 min apart
      case '1W': return generateJitter(28, 360); // 28 points, 6 hours apart
      case '1M': return generateJitter(30, 1440); // 30 points, 1 day apart
      default: return baseHistory;
    }
  }, [stock.history, stock.price, timeframe]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Market Chart</h3>
          <div className="flex bg-slate-800/50 p-1 rounded-lg border border-slate-700/50 shadow-inner">
            {(['1H', '1D', '1W', '1M'] as TimeFrame[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all duration-200 ${
                  timeframe === tf 
                    ? 'bg-emerald-500 text-slate-950 shadow-lg' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        
        {/* MARKET CAPITALIZATION DISPLAY - BELOW TIMEFRAME CONTROLS */}
        <div className="flex justify-end items-center gap-2 pr-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Market Cap:</span>
          <span className="text-xs font-mono font-bold text-slate-200 bg-slate-800/30 px-2 py-0.5 rounded border border-slate-700/50">
            ${stock.marketCap}
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
              interval={timeframe === '1H' ? 14 : timeframe === '1D' ? 4 : 6}
            />
            <YAxis 
              domain={['auto', 'auto']} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
              orientation="right"
              tickFormatter={(val) => `$${val}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke={chartColor} 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorPrice)"
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StockChart;
