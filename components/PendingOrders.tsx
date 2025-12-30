import React, { useState, useMemo } from 'react';
import { PendingOrder, OrderSide, OrderType, OrderStatus, TrailingType, StockData } from '../types';

interface PendingOrdersProps {
  orders: PendingOrder[];
  stocks: StockData[];
  onCancel: (id: string) => void;
  onUpdate: (id: string, fields: Partial<PendingOrder>) => void;
}

const getStatusConfig = (status: OrderStatus) => {
  switch (status) {
    case 'ACTIVE':
      return {
        color: 'bg-emerald-500',
        textColor: 'text-emerald-400',
        borderColor: 'border-emerald-500/20',
        bgColor: 'bg-emerald-500/5',
        label: 'Active Scan',
        icon: (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
      };
    case 'QUEUED':
      return {
        color: 'bg-amber-500',
        textColor: 'text-amber-400',
        borderColor: 'border-amber-500/20',
        bgColor: 'bg-amber-500/5',
        label: 'Time-Locked',
        icon: (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      };
    case 'REJECTED':
      return {
        color: 'bg-rose-500',
        textColor: 'text-rose-400',
        borderColor: 'border-rose-500/20',
        bgColor: 'bg-rose-500/5',
        label: 'Execution Error',
        icon: (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
      };
    case 'ALERT':
      return {
        color: 'bg-purple-500',
        textColor: 'text-purple-400',
        borderColor: 'border-purple-500/20',
        bgColor: 'bg-purple-500/5',
        label: 'Near Trigger',
        icon: (
          <svg className="w-3 h-3 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        )
      };
  }
};

const getOrderTypeDisplay = (type: OrderType, isTrailing?: boolean) => {
  if (isTrailing) {
    return (
      <div className="flex items-center gap-2 group">
        <div className="p-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-all">
          <svg className="w-3.5 h-3.5 text-indigo-400 animate-[spin_4s_linear_infinite]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-white uppercase tracking-tighter">Trailing</span>
          <span className="text-[7px] font-black text-indigo-400 uppercase tracking-widest">Dynamic</span>
        </div>
      </div>
    );
  }
  
  switch (type) {
    case 'MARKET':
      return (
        <div className="flex items-center gap-2 group">
          <div className="p-1.5 bg-sky-500/10 rounded-lg border border-sky-500/20 group-hover:bg-sky-500/20 transition-all">
            <svg className="w-3.5 h-3.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Market</span>
        </div>
      );
    case 'LIMIT':
      return (
        <div className="flex items-center gap-2 group">
          <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all">
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 12H21" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12H5" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3V5" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19V21" />
            </svg>
          </div>
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Limit</span>
        </div>
      );
    case 'STOP_LOSS':
      return (
        <div className="flex items-center gap-2 group">
          <div className="p-1.5 bg-rose-500/10 rounded-lg border border-rose-500/20 group-hover:bg-rose-500/20 transition-all">
            <svg className="w-3.5 h-3.5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9" />
            </svg>
          </div>
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Stop Loss</span>
        </div>
      );
    default:
      return null;
  }
};

const PendingOrders: React.FC<PendingOrdersProps> = ({ orders, stocks, onCancel, onUpdate }) => {
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editShares, setEditShares] = useState<string>('');
  const [editLimitPrice, setEditLimitPrice] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const startEditing = (order: PendingOrder) => {
    setEditingOrderId(order.orderId);
    setEditShares(order.shares.toString());
    setEditLimitPrice(order.limitPrice.toString());
  };

  const cancelEditing = () => {
    setEditingOrderId(null);
  };

  const saveEdit = (order: PendingOrder) => {
    const shares = parseFloat(editShares);
    const limitPriceValue = parseFloat(editLimitPrice);
    if (isNaN(shares) || shares <= 0 || isNaN(limitPriceValue) || limitPriceValue <= 0) return;
    onUpdate(order.orderId, { shares, limitPrice: limitPriceValue });
    setEditingOrderId(null);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden mt-6">
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/20 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Execution Queue</h3>
        </div>
        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-400/20">
          {orders.length} ACTIVE
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-800/30 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800/50">
              <th className="px-6 py-4">Symbol</th>
              <th className="px-6 py-4">Order REF</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Side</th>
              <th className="px-6 py-4 text-right">Units</th>
              <th className="px-6 py-4 text-right">Target / Trailing</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {orders.map((order) => {
              const config = getStatusConfig(order.status);
              const isEditing = editingOrderId === order.orderId;
              const isRejected = order.status === 'REJECTED';
              const shortenedId = order.orderId.substring(0, 4).toUpperCase() + '-' + order.orderId.substring(order.orderId.length - 4).toUpperCase();

              return (
                <tr key={order.orderId} className={`transition-all duration-200 group ${isEditing ? 'bg-slate-800/40' : 'hover:bg-slate-800/20'} ${isRejected ? 'opacity-60 grayscale' : ''}`}>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono font-black text-white">{order.symbol}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative group/id flex items-center">
                      <button 
                        onClick={() => handleCopyId(order.orderId)}
                        className="flex items-center gap-2 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800 group-hover/id:border-emerald-500/50 group-hover/id:bg-slate-900 transition-all cursor-pointer relative overflow-hidden"
                        title="Click to Copy Order ID"
                      >
                        <svg className="w-3 h-3 text-slate-500 group-hover/id:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        <span className="text-[8px] font-black text-slate-600 tracking-widest uppercase">ID</span>
                        <span className="font-mono text-[10px] font-black text-slate-300 group-hover/id:text-emerald-400">
                          {shortenedId}
                        </span>
                      </button>
                      {copiedId === order.orderId && (
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 text-[9px] font-black py-1 px-3 rounded-lg shadow-xl shadow-emerald-500/20 animate-bounce z-20 whitespace-nowrap uppercase tracking-tighter ring-2 ring-slate-900 border border-emerald-300">
                          Copied!
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getOrderTypeDisplay(order.type, order.isTrailing)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative flex items-center justify-center">
                        <div className={`absolute w-3 h-3 rounded-full animate-ping opacity-25 ${config.color}`}></div>
                        <div className={`w-1.5 h-1.5 rounded-full ${config.color}`}></div>
                      </div>
                      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border ${config.textColor} ${config.borderColor} ${config.bgColor}`}>
                        {config.icon}
                        <span className="text-[9px] font-black uppercase tracking-widest">{config.label}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                      order.side === 'BUY' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {order.side}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isEditing ? (
                      <input 
                        type="number"
                        value={editShares}
                        onChange={(e) => setEditShares(e.target.value)}
                        className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-white text-right"
                      />
                    ) : (
                      <span className="text-xs font-mono font-bold text-slate-300">{order.shares.toLocaleString()}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isEditing ? (
                      <input 
                        type="number"
                        value={editLimitPrice}
                        onChange={(e) => setEditLimitPrice(e.target.value)}
                        className="w-28 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-white text-right"
                      />
                    ) : (
                      <div className="flex flex-col items-end gap-1.5">
                        {order.isTrailing ? (
                          <div className="flex flex-col gap-1 w-full items-end">
                            <div className="flex items-center gap-3 bg-indigo-500/5 px-3 py-1.5 rounded-xl border border-indigo-500/20 shadow-sm">
                              <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Offset Strategy</span>
                              <span className="text-md font-black text-white bg-indigo-500 px-2 py-0.5 rounded-lg shadow-lg shadow-indigo-500/20">
                                {order.trailingType === 'PERCENT' ? `${order.trailingAmount}%` : `$${order.trailingAmount}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-800/40 px-3 py-1.5 rounded-xl border border-slate-700/50 w-fit">
                              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Observed Peak</span>
                              <span className="text-sm font-mono font-black text-slate-100">
                                ${order.highestPriceObserved?.toFixed(2) || 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 pt-1 border-t border-slate-800/50 w-full justify-end pr-1">
                              <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">Trigger Level</span>
                              <span className="text-sm font-mono font-black text-rose-400">${order.limitPrice.toFixed(2)}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm font-mono font-bold text-white">${order.limitPrice.toFixed(2)}</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isEditing ? (
                        <>
                          <button onClick={() => saveEdit(order)} className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button onClick={cancelEditing} className="p-1.5 text-slate-500 hover:bg-slate-800 rounded-lg">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <>
                          {!isRejected && (
                            <button onClick={() => startEditing(order)} className="p-1.5 text-slate-600 hover:text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          )}
                          <button onClick={() => onCancel(order.orderId)} className="p-1.5 text-slate-600 hover:text-rose-500 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default PendingOrders;