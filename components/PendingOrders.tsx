
import React, { useState, useMemo } from 'react';
import { PendingOrder, OrderSide, OrderType } from '../types';

interface PendingOrdersProps {
  orders: PendingOrder[];
  onCancel: (id: string) => void;
}

const getOrderIcon = (type: OrderType, isTrailing?: boolean) => {
  if (isTrailing) return <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>;
  switch (type) {
    case 'MARKET': return <div className="w-2 h-2 rounded-full bg-sky-400"></div>;
    case 'LIMIT': return <div className="w-2 h-2 rounded-full bg-emerald-400"></div>;
    case 'STOP_LOSS': return <div className="w-2 h-2 rounded-full bg-rose-400"></div>;
    default: return null;
  }
};

const PendingOrders: React.FC<PendingOrdersProps> = ({ orders, onCancel }) => {
  const [searchSymbol, setSearchSymbol] = useState('');
  const [filterSide, setFilterSide] = useState<'ALL' | OrderSide>('ALL');
  const [filterType, setFilterType] = useState<'ALL' | OrderType>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchSymbol) count++;
    if (filterSide !== 'ALL') count++;
    if (filterType !== 'ALL') count++;
    return count;
  }, [searchSymbol, filterSide, filterType]);

  const resetFilters = () => {
    setSearchSymbol('');
    setFilterSide('ALL');
    setFilterType('ALL');
  };

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
    <section className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mt-6">
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/20 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Execution Queue
          </h3>
          <span className="text-[9px] font-mono font-bold text-slate-500 uppercase px-2 py-0.5 bg-slate-800 rounded border border-slate-700">
            {filteredOrders.length} Active
          </span>
        </div>
        
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`p-1.5 rounded-lg transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-tight relative ${showFilters ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800 border border-transparent'}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {activeFilterCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute -top-0.5 -right-0.5"></span>}
        </button>
      </div>

      {showFilters && (
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div>
             <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-1">Asset Search</label>
             <input 
               type="text"
               placeholder="Enter Symbol..."
               value={searchSymbol}
               onChange={(e) => setSearchSymbol(e.target.value)}
               className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-[11px] font-mono text-white focus:outline-none focus:border-emerald-500/50"
             />
          </div>
          <div>
             <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-1">Action</label>
             <div className="flex gap-1">
               {(['ALL', 'BUY', 'SELL'] as const).map(s => (
                 <button 
                   key={s}
                   onClick={() => setFilterSide(s)}
                   className={`flex-1 py-1.5 text-[9px] font-black rounded border transition-all ${filterSide === s ? 'bg-slate-700 text-white border-slate-600' : 'text-slate-500 border-transparent hover:bg-slate-800'}`}
                 >
                   {s}
                 </button>
               ))}
             </div>
          </div>
          <div>
             <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-1">Execution Type</label>
             <div className="flex gap-1 overflow-x-auto">
               {(['ALL', 'MARKET', 'LIMIT', 'STOP_LOSS'] as const).map(t => (
                 <button 
                   key={t}
                   onClick={() => setFilterType(t)}
                   className={`flex-1 min-w-max px-2 py-1.5 text-[9px] font-black rounded border transition-all ${filterType === t ? 'bg-slate-700 text-white border-slate-600' : 'text-slate-500 border-transparent hover:bg-slate-800'}`}
                 >
                   {t.replace('_', ' ')}
                 </button>
               ))}
             </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-800/30 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800/50">
              <th className="px-6 py-4">Symbol</th>
              <th className="px-6 py-4">Order ID</th>
              <th className="px-6 py-4">Side</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Qty</th>
              <th className="px-6 py-4 text-right">Target Price</th>
              <th className="px-6 py-4 text-right">Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {filteredOrders.map((order) => (
              <tr key={order.orderId} className="hover:bg-slate-800/20 transition-all duration-200 group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {getOrderIcon(order.type, order.isTrailing)}
                    <span className="text-sm font-mono font-black text-white">{order.symbol}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="flex items-center gap-1.5 bg-slate-950/60 px-2 py-1 rounded border border-slate-700/50 group-hover:border-slate-600 transition-colors shadow-inner">
                        <span className="font-mono text-[9px] font-black text-slate-400">
                          {order.orderId.substring(0, 8).toUpperCase()}
                        </span>
                      </div>
                      {copiedId === order.orderId && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 text-[8px] font-black py-0.5 px-2 rounded shadow-lg animate-bounce z-10 whitespace-nowrap uppercase tracking-tighter">
                          ID Copied
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => handleCopyId(order.orderId)}
                      className="p-1 text-slate-600 hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all"
                      title="Copy Full Order ID"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                      </svg>
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                    order.side === 'BUY' ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/5 text-rose-400 border-rose-500/20'
                  }`}>
                    {order.side}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    {order.isTrailing ? 'TRAILING' : order.type.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-mono font-bold text-slate-300">{order.shares.toLocaleString()}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  {order.isTrailing ? (
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-mono font-bold text-amber-400">${order.limitPrice.toFixed(2)}</span>
                      <span className="text-[8px] text-slate-600 uppercase font-black tracking-widest">
                        Ref: ${order.highestPriceObserved?.toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm font-mono font-bold text-slate-200">
                      {order.type === 'MARKET' ? 'Market' : `$${order.limitPrice.toFixed(2)}`}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => onCancel(order.orderId)}
                    className="p-1.5 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded transition-all"
                    title="Cancel Pending Order"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredOrders.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">Queue Empty</p>
            <button onClick={resetFilters} className="mt-2 text-[9px] text-emerald-500 font-black uppercase hover:underline">Reset Filters</button>
          </div>
        )}
      </div>
    </section>
  );
};

export default PendingOrders;
