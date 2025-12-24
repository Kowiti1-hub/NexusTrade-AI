
import React, { useState } from 'react';
import { StockData } from '../types';

interface SidebarProps {
  stocks: StockData[];
  selectedSymbol: string;
  onSelectStock: (symbol: string) => void;
  portfolioValue: number;
}

const Sidebar: React.FC<SidebarProps> = ({ stocks, selectedSymbol, onSelectStock, portfolioValue }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStocks = stocks.filter(stock => 
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <span className="text-slate-900 font-bold">N</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">NexusTrade AI</h1>
        </div>
        
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Portfolio Value</p>
          <p className="text-2xl font-bold font-mono text-white">${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-emerald-400 font-medium">+2.4%</span>
            <span className="text-xs text-slate-500 font-medium">today</span>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-slate-800/50">
        <div className="relative">
          <svg 
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text"
            placeholder="Search stocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <h2 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Watchlist</h2>
        <div className="space-y-1">
          {filteredStocks.length > 0 ? (
            filteredStocks.map((stock) => (
              <button
                key={stock.symbol}
                onClick={() => onSelectStock(stock.symbol)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                  selectedSymbol === stock.symbol 
                    ? 'bg-emerald-500/10 border border-emerald-500/20 shadow-sm' 
                    : 'hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <div className="flex flex-col items-start">
                  <span className={`font-bold font-mono ${selectedSymbol === stock.symbol ? 'text-emerald-400' : 'text-slate-200'}`}>
                    {stock.symbol}
                  </span>
                  <span className="text-xs text-slate-500 truncate w-32 text-left">{stock.name}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-mono text-sm text-white">${stock.price.toFixed(2)}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    stock.change >= 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'
                  }`}>
                    {stock.change >= 0 ? '+' : ''}{stock.changePercent}%
                  </span>
                </div>
              </button>
            ))
          ) : (
            <div className="p-3 text-center">
              <p className="text-xs text-slate-500 italic">No stocks found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4 border-t border-slate-800">
        <button className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm">
          Settings
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
