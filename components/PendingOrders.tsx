
import React, { useState, useMemo } from 'react';
import { PendingOrder, OrderSide, OrderType } from '../types';

interface PendingOrdersProps {
  orders: PendingOrder[];
  onCancel: (id: string) => void;
}

const PendingOrders: React.FC<PendingOrdersProps> = ({ orders, onCancel }) => {
  const [searchSymbol, setSearchSymbol] = useState('');
  const [filterSide, setFilterSide] = useState<'ALL' | OrderSide>('ALL');
  const [filterType, setFilterType] = useState<'ALL' | OrderType>('ALL');
  const [showFilters, setShowFilters] = useState(false);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchSymbol = order.symbol.toLowerCase().includes(searchSymbol.toLowerCase());
      const matchSide = filterSide === 'ALL' || order.side === filterSide;
      const matchType = filterType === 'ALL' || order.type === filterType;
      return matchSymbol && matchSide && matchType;
    });
  }, [orders, searchSymbol, filterSide, filterType]);

  if (orders.length === 0) return null;

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/20 flex justify-between items-center">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Active Orders
        </h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded-lg transition-colors ${showFilters ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
          <span className="text-[10px] font-mono text-slate-500">{filteredOrders.length} / {orders.length}</span>
        </div>
      </div>

      {showFilters && (
        <div className="p-4 bg-slate-800/20 border-b border-slate-800 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="relative">
            <input 
              type="text"
              placeholder="Search symbol..."
              value={searchSymbol}
              onChange={(e) => setSearchSymbol(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-4 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Side</p>
              <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
                {(['ALL', 'BUY', 'SELL'] as const).map(side => (
                  <button
                    key={side}
                    onClick={() => setFilterSide(side)}
                    className={`text-[9px] py-1 font-bold rounded ${filterSide === side ? 'bg-slate-700 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {side}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Type</p>
              <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
                {(['ALL', 'LIMIT', 'STOP_LOSS'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`text-[9px] py-1 font-bold rounded ${filterType === type ? 'bg-slate-700 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {type === 'STOP_LOSS' ? 'STOP' : type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="divide-y divide-slate-800 max-h-[400px] overflow-y-auto">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div key={order.orderId} className="p-4 hover:bg-slate-800/30 transition-colors group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-white text-base">{order.symbol}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase ${
                    order.side === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {order.side}
                  </span>
                  {order.isTrailing && (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                      Trailing
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => onCancel(order.orderId)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-rose-400 hover:text-rose-300 font-bold uppercase tracking-tighter"
                >
                  Cancel
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter mb-0.5">Order Type</p>
                  <p className="text-xs text-slate-300 font-medium">{order.type.replace('_', ' ')}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter mb-0.5">Quantity</p>
                  <p className="text-xs text-slate-300 font-mono">{order.shares} Shares</p>
                </div>
                
                <div className="col-span-2 mt-2 pt-2 border-t border-slate-800/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter mb-0.5">
                        {order.isTrailing ? 'Live Stop Price' : 'Activation Price'}
                      </p>
                      <p className={`text-lg font-mono font-bold ${order.type === 'STOP_LOSS' ? 'text-amber-400' : 'text-emerald-400'}`}>
                        ${order.limitPrice.toFixed(2)}
                      </p>
                    </div>
                    
                    {order.isTrailing && (
                      <div className="text-right space-y-1">
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">Trailing Amount</span>
                          <span className="text-xs text-amber-500 font-mono font-bold">${order.trailingAmount?.toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col items-end pt-1">
                          <span className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">Peak Observed</span>
                          <span className="text-xs text-slate-300 font-mono font-bold">${order.highestPriceObserved?.toFixed(2) || 'N/A'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {!order.isTrailing && (
                <div className="mt-3 text-right">
                   <p className="text-[9px] text-slate-600 font-mono italic">
                    Placed: {new Date(order.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-slate-600 italic text-xs">
            No pending orders found matching the filters.
          </div>
        )}
      </div>
    </section>
  );
};

export default PendingOrders;
