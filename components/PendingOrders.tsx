
import React, { useState, useMemo } from 'react';
import { PendingOrder, OrderSide, OrderType } from '../types';

interface PendingOrdersProps {
  orders: PendingOrder[];
  onCancel: (id: string) => void;
}

const getOrderIcon = (type: OrderType, isTrailing?: boolean) => {
  if (isTrailing) return <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.4)]"></div>;
  switch (type) {
    case 'MARKET': return <div className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.3)]"></div>;
    case 'LIMIT': return <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]"></div>;
    case 'STOP_LOSS': return <div className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.3)]"></div>;
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
    <section className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="px-6 py-5 border-b border-slate-800 bg-slate-800/20 flex justify-between items-center backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] leading-tight">
              Execution Queue
            </h3>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Orders Pending Deployment</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
            {filteredOrders.length} Active
          </span>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-tight relative border ${showFilters ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            {activeFilterCount > 0 && <span className="w-2 h-2 rounded-full bg-emerald-500 absolute -top-1 -right-1 ring-2 ring-slate-900"></span>}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="p-5 bg-slate-950/40 border-b border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="space-y-2">
             <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] block">Asset Search</label>
             <div className="relative">
                <input 
                  type="text"
                  placeholder="Ticker..."
                  value={searchSymbol}
                  onChange={(e) => setSearchSymbol(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all placeholder:text-slate-700"
                />
             </div>
          </div>
          <div className="space-y-2">
             <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] block">Action Side</label>
             <div className="flex gap-2">
               {(['ALL', 'BUY', 'SELL'] as const).map(s => (
                 <button 
                   key={s}
                   onClick={() => setFilterSide(s)}
                   className={`flex-1 py-2.5 text-[10px] font-black rounded-xl border transition-all ${filterSide === s ? 'bg-slate-700 text-emerald-400 border-emerald-500/30' : 'bg-slate-900/50 text-slate-500 border-slate-800 hover:border-slate-700'}`}
                 >
                   {s}
                 </button>
               ))}
             </div>
          </div>
          <div className="space-y-2">
             <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] block">Execution Type</label>
             <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
               {(['ALL', 'MARKET', 'LIMIT', 'STOP_LOSS'] as const).map(t => (
                 <button 
                   key={t}
                   onClick={() => setFilterType(t)}
                   className={`min-w-max px-4 py-2.5 text-[10px] font-black rounded-xl border transition-all ${filterType === t ? 'bg-slate-700 text-emerald-400 border-emerald-500/30' : 'bg-slate-900/50 text-slate-500 border-slate-800 hover:border-slate-700'}`}
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
            <tr className="bg-slate-800/30 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800/50">
              <th className="px-6 py-5">Symbol</th>
              <th className="px-6 py-5">Order ID</th>
              <th className="px-6 py-5">Side</th>
              <th className="px-6 py-5">Type</th>
              <th className="px-6 py-5 text-right">Volume</th>
              <th className="px-6 py-5 text-right">Target Price</th>
              <th className="px-6 py-5 text-right">Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {filteredOrders.map((order) => (
              <tr key={order.orderId} className="hover:bg-slate-800/20 transition-all duration-200 group">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    {getOrderIcon(order.type, order.isTrailing)}
                    <span className="text-sm font-mono font-black text-white tracking-tighter">{order.symbol}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="flex items-center gap-2 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800 shadow-inner group-hover:border-slate-700 transition-colors">
                        <span className="text-[8px] font-black text-slate-600 tracking-widest">HASH</span>
                        <span className="font-mono text-[10px] font-black text-slate-300">
                          {order.orderId.substring(0, 8).toUpperCase()}
                        </span>
                      </div>
                      {copiedId === order.orderId && (
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 text-[9px] font-black py-1 px-3 rounded-lg shadow-xl shadow-emerald-500/20 animate-bounce z-10 whitespace-nowrap uppercase tracking-tighter ring-2 ring-slate-900">
                          ID Copied
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => handleCopyId(order.orderId)}
                      className="p-1.5 text-slate-600 hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all bg-slate-800/40 rounded-md hover:bg-emerald-500/10"
                      title="Copy Full Transaction UUID"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                      </svg>
                    </button>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                    order.side === 'BUY' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {order.side}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                    {order.isTrailing ? 'TRAILING STOP' : order.type.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-5 text-right">
                  <span className="text-xs font-mono font-bold text-slate-300">{order.shares.toLocaleString()} <span className="text-[10px] text-slate-600">units</span></span>
                </td>
                <td className="px-6 py-5 text-right">
                  {order.isTrailing ? (
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-mono font-bold text-amber-400">${order.limitPrice.toFixed(2)}</span>
                      <span className="text-[8px] text-slate-600 uppercase font-black tracking-widest mt-0.5">
                        High Watermark: ${order.highestPriceObserved?.toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm font-mono font-bold text-white">
                      {order.type === 'MARKET' ? (
                        <span className="text-sky-400 text-xs uppercase tracking-widest">Market Price</span>
                      ) : `$${order.limitPrice.toFixed(2)}`}
                    </span>
                  )}
                </td>
                <td className="px-6 py-5 text-right">
                  <button 
                    onClick={() => onCancel(order.orderId)}
                    className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all border border-transparent hover:border-rose-500/20"
                    title="Terminate Order"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredOrders.length === 0 && (
          <div className="py-20 text-center bg-slate-900/20">
            <div className="mb-4 inline-flex p-4 bg-slate-800/30 rounded-full border border-slate-700">
              <svg className="w-8 h-8 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.25em]">Execution Queue Clear</p>
            {activeFilterCount > 0 && (
              <button 
                onClick={resetFilters} 
                className="mt-4 px-4 py-2 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 rounded-xl transition-all border border-emerald-500/20"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default PendingOrders;
