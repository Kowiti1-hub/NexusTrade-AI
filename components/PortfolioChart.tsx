
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PortfolioHistoryPoint } from '../types';

interface PortfolioChartProps {
  history: PortfolioHistoryPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-2xl">
        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-tighter mb-1">{label}</p>
        <p className="text-white font-mono font-bold">
          ${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

const PortfolioChart: React.FC<PortfolioChartProps> = ({ history }) => {
  const firstVal = history[0]?.value || 0;
  const lastVal = history[history.length - 1]?.value || 0;
  const isPositive = lastVal >= firstVal;
  const chartColor = isPositive ? '#10b981' : '#f43f5e';

  return (
    <div className="h-48 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={history}>
          <defs>
            <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColor} stopOpacity={0.2}/>
              <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
          <XAxis 
            dataKey="time" 
            hide={true}
          />
          <YAxis 
            domain={['auto', 'auto']} 
            hide={true}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={chartColor} 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#portfolioGradient)" 
            animationDuration={1000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PortfolioChart;
