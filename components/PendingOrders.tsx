
import React, { useState, useMemo } from 'react';
import { PendingOrder, OrderSide, OrderType } from '../types';

interface PendingOrdersProps {
  orders: PendingOrder[];
  onCancel: (id: string) => void;
}

const getOrderIcon = (type: OrderType, isTrailing?: boolean, size: 'sm' | 'md' = 'md') => {
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  
  if (isTrailing) {
    return (
      <div className="relative flex items-center justify-center">
        <div className={`absolute inset-0 bg-amber-400/20 rounded-full animate-ping ${size === 'sm' ? 'scale-110' : 'scale-150'}`}></div>
        <svg className={`${iconSize} text-amber-400 relative z-10`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      </div>
    );
  }

  switch (type) {
    case 'MARKET':
      return (
        <svg className={`${iconSize} text-blue-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case 'LIMIT':
      return (
        <svg className={`${iconSize} text-emerald-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="3" strokeWidth={2.5} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v3m0 14v3m10-10h-3M5 12H2" />
        </svg>
      );
    case 'STOP_LOSS':
      return (
        <svg className={`${iconSize} text-rose-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      );
    default:
      return null;
  }
};

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
                    className={`flex items-center justify-center gap-1.5 text-[9px] py-1 font-bold rounded transition-colors ${filterType === type ? 'bg-slate-700 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {type !== 'ALL' && (
                      <span className="opacity-80 scale-90">
                        {getOrderIcon(type, false, 'sm')}
                      </span>
                    )}
                    {type === 'STOP_LOSS' ? 'STOP' : type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="divide-y divide-slate-800 max-h-[480px] overflow-y-auto">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div key={order.orderId} className="p-5 hover:bg-slate-800/30 transition-colors group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-white text-base tracking-tight">{order.symbol}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase ${
                    order.side === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {order.side}
                  </span>
                  {order.scheduledTime && order.scheduledTime > Date.now() && (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                       <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                       </svg>
                       Scheduled
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => onCancel(order.orderId)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-400 transition-all"
                  title="Cancel Order"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-2">Order Details</p>
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg flex items-center justify-center ${
                        order.isTrailing ? 'bg-amber-500/10' : 
                        order.type === 'MARKET' ? 'bg-blue-500/10' :
                        order.type === 'LIMIT' ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                      }`}>
                        {getOrderIcon(order.type, order.isTrailing)}
                      </div>
                      <div className="flex flex-col">
                        <p className="text-xs text-slate-200 font-bold uppercase tracking-tight">
                          {order.isTrailing ? 'Trailing Stop' : order.type.replace('_', ' ')}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono font-medium">
                          {order.shares.toLocaleString()} Shares
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-2">Execution Status</p>
                    <div className="flex flex-col items-end">
                      <p className={`text-xs font-bold uppercase tracking-tighter ${order.scheduledTime && order.scheduledTime > Date.now() ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {order.scheduledTime && order.scheduledTime > Date.now() ? 'Awaiting Schedule' : 'Live Tracking'}
                      </p>
                      <p className="text-[10px] text-slate-600 font-medium">
                        {order.scheduledTime && order.scheduledTime > Date.now() ? 'Market Entry Pending' : 'Monitoring Price'}
                      </p>
                    </div>
                  </div>
                </div>

                {order.scheduledTime && order.scheduledTime > Date.now() && (
                   <div className="bg-amber-500/5 rounded-xl p-3 border border-amber-500/10 mb-2">
                     <p className="text-[8px] text-amber-500 uppercase font-bold tracking-widest mb-1">Scheduled For</p>
                     <p className="text-xs font-mono text-slate-200">
                        {new Date(order.scheduledTime).toLocaleString()}
                     </p>
                   </div>
                )}

                <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/50">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">
                        {order.isTrailing ? 'Current Stop Level' : 'Activation Price'}
                      </p>
                      <p className={`text-2xl font-mono font-bold ${order.isTrailing ? 'text-amber-400' : 'text-emerald-400'}`}>
                        ${order.limitPrice.toFixed(2)}
                      </p>
                    </div>
                    
                    {order.isTrailing && (
                      <div className="flex flex-col gap-3 min-w-[120px]">
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                          <div className="flex justify-between items-center gap-4 mb-2">
                             <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">Market Peak</span>
                             <span className="text-[10px] text-white font-mono font-bold">${order.highestPriceObserved?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center gap-4">
                             <div className="flex items-center gap-1">
                               <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">Distance</span>
                               <span className={`text-[7px] font-black px-1 py-0.5 rounded leading-none ${order.trailingType === 'PERCENT' ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-700 text-slate-400'}`}>
                                 {order.trailingType}
                               </span>
                             </div>
                             <span className="text-[10px] text-amber-400 font-mono font-bold">
                               {order.trailingType === 'PERCENT' ? `${order.trailingAmount?.toFixed(2)}%` : `$${order.trailingAmount?.toFixed(2)}`}
                             </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center text-[9px] font-mono text-slate-600">
                  <span>REF: {order.orderId.substring(0, 8).toUpperCase()}</span>
                  <span>Entry: {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-slate-600">
            <svg className="w-8 h-8 mx-auto mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="italic text-xs">No active orders match your criteria.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default PendingOrders;
