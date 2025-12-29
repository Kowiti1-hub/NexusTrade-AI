import React, { useState, useMemo } from 'react';
import { PendingOrder, OrderSide, OrderType, TrailingType } from '../types';

interface PendingOrdersProps {
  orders: PendingOrder[];
  onCancel: (id: string) => void;
  onUpdate: (id: string, fields: Partial<PendingOrder>) => void;
}

const getOrderIcon = (type: OrderType, isTrailing?: boolean) => {
  if (isTrailing) {
    return (
      <div className="p-1.5 bg-amber-500/10 rounded-lg border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)] group-hover:scale-110 transition-transform">
        <svg className="w-4 h-4 text-amber-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      </div>
    );
  }
  
  switch (type) {
    case 'MARKET':
      return (
        <div className="p-1.5 bg-sky-500/10 rounded-lg border border-sky-500/20 group-hover:scale-110 transition-transform">
          <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      );
    case 'LIMIT':
      return (
        <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 group-hover:scale-110 transition-transform">
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
      );
    case 'STOP_LOSS':
      return (
        <div className="p-1.5 bg-rose-500/10 rounded-lg border border-rose-500/20 group-hover:scale-110 transition-transform">
          <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
      );
    default:
      return null;
  }
};

const PendingOrders: React.FC<PendingOrdersProps> = ({ orders, onCancel, onUpdate }) => {
  const [searchSymbol, setSearchSymbol] = useState('');
  const [filterSide, setFilterSide] = useState<'ALL' | OrderSide>('ALL');
  const [filterType, setFilterType] = useState<'ALL' | OrderType>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Editing State
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editShares, setEditShares] = useState<string>('');
  const [editLimitPrice, setEditLimitPrice] = useState<string>('');
  const [editTrailingType, setEditTrailingType] = useState<TrailingType>('FIXED');

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const startEditing = (order: PendingOrder) => {
    setEditingOrderId(order.orderId);
    setEditShares(order.shares.toString());
    setEditLimitPrice(order.isTrailing ? (order.trailingAmount?.toString() || '') : order.limitPrice.toString());
    if (order.isTrailing && order.trailingType) {
      setEditTrailingType(order.trailingType);
    }
  };

  const cancelEditing = () => {
    setEditingOrderId(null);
    setEditShares('');
    setEditLimitPrice('');
  };

  const saveEdit = (order: PendingOrder) => {
    const shares = parseFloat(editShares);
    const limitPriceValue = parseFloat(editLimitPrice);

    if (isNaN(shares) || shares <= 0) {
      alert("Please enter a valid number of shares.");
      return;
    }
    if (isNaN(limitPriceValue) || limitPriceValue <= 0) {
      alert("Please enter a valid price or offset value.");
      return;
    }

    const updates: Partial<PendingOrder> = {
      shares: shares
    };

    if (order.isTrailing) {
      updates.trailingAmount = limitPriceValue;
      updates.trailingType = editTrailingType;
      const peak = order.highestPriceObserved || 0;
      updates.limitPrice = editTrailingType === 'PERCENT' 
        ? peak * (1 - limitPriceValue / 100)
        : peak - limitPriceValue;
    } else {
      updates.limitPrice = limitPriceValue;
    }

    onUpdate(order.orderId, updates);
    setEditingOrderId(null);
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
             <input 
               type="text"
               placeholder="Ticker..."
               value={searchSymbol}
               onChange={(e) => setSearchSymbol(e.target.value)}
               className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all placeholder:text-slate-700"
             />
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
              <th className="px-6 py-5">Status Monitoring</th>
              <th className="px-6 py-5">Order ID</th>
              <th className="px-6 py-5">Side</th>
              <th className="px-6 py-5">Type</th>
              <th className="px-6 py-5 text-right">Volume</th>
              <th className="px-6 py-5 text-right">Target / Trigger</th>
              <th className="px-6 py-5 text-right">Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {filteredOrders.map((order) => {
              const isScheduled = order.scheduledTime && order.scheduledTime > Date.now();
              const isEditing = editingOrderId === order.orderId;
              const themeColor = order.side === 'BUY' ? 'emerald' : 'rose';
              const shortenedId = order.orderId.substring(0, 4).toUpperCase() + '-' + order.orderId.substring(order.orderId.length - 4).toUpperCase();

              // For dynamic limitPrice calculation during editing
              let calculatedEditPrice = order.limitPrice;
              if (isEditing && order.isTrailing) {
                const amountVal = parseFloat(editLimitPrice) || 0;
                const peak = order.highestPriceObserved || 0;
                calculatedEditPrice = editTrailingType === 'PERCENT' 
                  ? peak * (1 - amountVal / 100)
                  : peak - amountVal;
              }

              return (
                <tr key={order.orderId} className={`transition-all duration-200 group ${isEditing ? 'bg-slate-800/40 ring-1 ring-inset ring-slate-700' : 'hover:bg-slate-800/20'}`}>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      {getOrderIcon(order.type, order.isTrailing)}
                      <span className="text-sm font-mono font-black text-white tracking-tighter">{order.symbol}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {isScheduled ? (
                          <div className="w-3.5 h-3.5 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                            <svg className="w-2.5 h-2.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        ) : (
                          <div className="relative flex items-center justify-center">
                            <div className="absolute w-4 h-4 rounded-full bg-emerald-500/40 animate-ping opacity-25"></div>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isScheduled ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {isScheduled ? 'Queued' : 'Active'}
                        </span>
                        <span className="text-[8px] text-slate-600 font-black uppercase tracking-tighter -mt-0.5">
                          {isScheduled ? 'Clock Sync' : 'Real-time Tape Scan'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className="relative group/id">
                        <button 
                          onClick={() => handleCopyId(order.orderId)}
                          className="flex items-center gap-2 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800 shadow-inner group-hover/id:border-emerald-500/50 group-hover/id:bg-slate-900 transition-all cursor-pointer"
                        >
                          <span className="text-[8px] font-black text-slate-600 tracking-widest uppercase">REF</span>
                          <span className="font-mono text-[10px] font-black text-slate-300 group-hover/id:text-emerald-400">
                            {shortenedId}
                          </span>
                        </button>
                        {copiedId === order.orderId && (
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 text-[9px] font-black py-1 px-3 rounded-lg shadow-xl shadow-emerald-500/20 animate-bounce z-20 whitespace-nowrap uppercase tracking-tighter ring-2 ring-slate-900 border border-emerald-300">
                            Copied
                          </div>
                        )}
                      </div>
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
                    {isEditing ? (
                      <input 
                        type="number"
                        value={editShares}
                        onChange={(e) => setEditShares(e.target.value)}
                        className={`w-24 bg-slate-950/80 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono text-white text-right focus:outline-none focus:ring-1 focus:ring-${themeColor}-500/50 shadow-inner`}
                        placeholder="Shares"
                      />
                    ) : (
                      <span className="text-xs font-mono font-bold text-slate-300">{order.shares.toLocaleString()} <span className="text-[10px] text-slate-600">units</span></span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right">
                    {isEditing ? (
                      <div className="flex flex-col items-end gap-3 py-1">
                        {order.isTrailing && (
                          <div className="flex gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-slate-800">
                            {(['FIXED', 'PERCENT'] as TrailingType[]).map((t) => (
                              <button
                                key={t}
                                onClick={() => setEditTrailingType(t)}
                                className={`px-2.5 py-1 text-[8px] font-black uppercase rounded-lg transition-all ${
                                  editTrailingType === t 
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-inner' 
                                    : 'text-slate-600 hover:text-slate-400'
                                }`}
                              >
                                {t === 'FIXED' ? 'FIXED ($)' : 'PCT (%)'}
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="relative group/edit">
                          {(!order.isTrailing || editTrailingType === 'FIXED') && (
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-[10px]">$</span>
                          )}
                          <input 
                            type="number"
                            value={editLimitPrice}
                            onChange={(e) => setEditLimitPrice(e.target.value)}
                            className={`w-36 bg-slate-950/80 border border-slate-700 rounded-lg pr-2 py-1.5 text-xs font-mono text-white text-right focus:outline-none focus:ring-1 focus:ring-${themeColor}-500/50 shadow-inner ${(!order.isTrailing || editTrailingType === 'FIXED') ? 'pl-6' : 'pl-2'}`}
                            placeholder={order.isTrailing ? "Offset" : "Price"}
                          />
                          {order.isTrailing && editTrailingType === 'PERCENT' && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-[10px]">%</span>
                          )}
                        </div>
                        {order.isTrailing && (
                          <div className="flex flex-col items-end px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                            <span className="text-[8px] font-black text-rose-400 uppercase tracking-[0.2em]">Effective Trigger</span>
                            <span className="text-sm font-mono font-black text-rose-500 mt-0.5">
                              ${calculatedEditPrice.toFixed(2)}
                            </span>
                          </div>
                        )}
                        {!order.isTrailing && (
                          <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Target Price</span>
                        )}
                      </div>
                    ) : (
                      order.isTrailing ? (
                        <div className="flex flex-col items-end gap-3 py-1">
                          <div className="flex flex-wrap justify-end gap-3">
                             <div className="px-5 py-3 bg-indigo-900/40 border-2 border-indigo-500/40 rounded-2xl shadow-2xl shadow-indigo-500/10 ring-1 ring-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
                                <span className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.25em] block mb-1.5">Peak Observer</span>
                                <span className="text-xl font-mono font-black text-indigo-400 leading-none">
                                  ${order.highestPriceObserved?.toFixed(2)}
                                </span>
                             </div>
                             <div className="px-5 py-3 bg-amber-900/40 border-2 border-amber-500/40 rounded-2xl shadow-2xl shadow-amber-500/10 ring-1 ring-amber-500/20 group-hover:scale-105 transition-transform duration-300">
                                <span className="text-[10px] font-black text-amber-200 uppercase tracking-[0.25em] block mb-1.5">Trailing Offset</span>
                                <span className="text-xl font-mono font-black text-amber-400 leading-none">
                                  {order.trailingType === 'PERCENT' ? `${order.trailingAmount}%` : `$${order.trailingAmount?.toFixed(2)}`}
                                </span>
                             </div>
                          </div>
                          <div className="flex flex-col items-end px-6 py-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl shadow-lg shadow-rose-950/20">
                            <span className="text-[9px] font-black text-rose-400 uppercase tracking-[0.3em]">Active Stop Trigger</span>
                            <span className="text-2xl font-mono font-black text-rose-500 tracking-tighter leading-none mt-2">
                              ${order.limitPrice.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm font-mono font-bold text-white">
                          {order.type === 'MARKET' ? (
                            <span className="text-sky-400 text-xs uppercase tracking-widest">Market Price</span>
                          ) : `$${order.limitPrice.toFixed(2)}`}
                        </span>
                      )
                    )}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isEditing ? (
                        <div className="flex gap-2 animate-in fade-in zoom-in duration-200">
                          <button 
                            onClick={() => saveEdit(order)}
                            className="p-2 text-emerald-400 bg-emerald-500/10 rounded-xl transition-all border border-emerald-500/20 hover:bg-emerald-500/20 shadow-lg shadow-emerald-500/10"
                            title="Confirm Changes"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button 
                            onClick={cancelEditing}
                            className="p-2 text-slate-500 bg-slate-800 rounded-xl transition-all border border-slate-700 hover:text-white"
                            title="Discard Modifications"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => startEditing(order)}
                            className="p-2 text-slate-600 hover:text-sky-400 hover:bg-sky-500/10 rounded-xl transition-all border border-transparent hover:border-sky-500/20 opacity-0 group-hover:opacity-100"
                            title="Modify Transaction"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => onCancel(order.orderId)}
                            className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all border border-transparent hover:border-rose-500/20"
                            title="Terminate Order"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
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
