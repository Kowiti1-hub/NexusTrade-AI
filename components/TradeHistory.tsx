import React, { useState } from 'react';
import { ExecutedOrder, StockData, OrderType } from '../types';

interface TradeHistoryProps {
  history: ExecutedOrder[];
  stocks: StockData[];
}

const getOrderTypeIcon = (type: OrderType) => {
  switch (type) {
    case 'MARKET':
      return (
        <div className="p-1 bg-sky-500/10 rounded border border-sky-500/20">
          <svg className="w-3 h-3 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      );
    case 'LIMIT':
      return (
        <div className="p-1 bg-emerald-500/10 rounded border border-emerald-500/20">
          <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 12H21" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12H5" />
          </svg>
        </div>
      );
    case 'STOP_LOSS':
      return (
        <div className="p-1 bg-rose-500/10 rounded border border-rose-500/20">
          <svg className="w-3 h-3 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9" />
          </svg>
        </div>
      );
    default:
      return null;
  }
};

const TradeHistory: React.FC<TradeHistoryProps> = ({ history, stocks }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
      <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner">
            <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight leading-tight">Execution Ledger</h3>
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mt-0.5">Verified Institutional History</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/50 border border-slate-800 shadow-inner">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Audited Sync</span>
          </div>
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-800 px-4 py-1.5 rounded-xl border border-slate-700 shadow-sm">
            {history.length} Entries
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-800/30 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800/50">
              <th className="px-6 py-5">Asset</th>
              <th className="px-6 py-5">Order REF</th>
              <th className="px-6 py-5">Market Cap</th>
              <th className="px-6 py-5">Side</th>
              <th className="px-6 py-5">Type</th>
              <th className="px-6 py-5">Units</th>
              <th className="px-6 py-5 text-right">Price</th>
              <th className="px-6 py-5 text-right">Yield (P&L)</th>
              <th className="px-6 py-5 text-right">Notional</th>
              <th className="px-6 py-5">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {history.slice().reverse().map((order) => {
              const stock = stocks.find(s => s.symbol === order.symbol);
              const currentPrice = stock?.price || order.price;
              const marketCapStr = stock?.marketCap || 'N/A';
              const isTrillion = marketCapStr.includes('T');
              
              const pnl = order.side === 'BUY' 
                ? (currentPrice - order.price) * order.shares
                : (order.price - currentPrice) * order.shares;
              
              const pnlPercent = (pnl / (order.price * order.shares)) * 100;
              const isPositive = pnl >= 0;
              const shortenedId = order.orderId.substring(0, 4).toUpperCase() + '-' + order.orderId.substring(order.orderId.length - 4).toUpperCase();

              return (
                <tr key={order.orderId} className="hover:bg-slate-800/20 transition-all duration-200 group">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="font-black text-white font-mono text-sm tracking-tight">{order.symbol}</span>
                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-0.5">
                        {stock?.name || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className="relative group/id">
                        <button 
                          onClick={() => handleCopyId(order.orderId)}
                          className="flex items-center gap-2 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800 group-hover/id:border-emerald-500/50 group-hover/id:bg-slate-900 transition-all cursor-pointer"
                          title="Click to Copy Order REF"
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
                    <div className="flex flex-col">
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border shadow-inner w-fit transition-all duration-300 ${
                        isTrillion ? 'bg-indigo-500/10 border-indigo-500/30 group-hover:bg-indigo-500/20 ring-1 ring-indigo-500/10' : 'bg-slate-950 border-slate-800'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isTrillion ? 'bg-indigo-400 animate-pulse shadow-[0_0_8px_rgba(129,140,248,0.8)]' : 'bg-slate-600'}`}></div>
                        <span className={`text-[11px] font-mono font-black tracking-tight ${isTrillion ? 'text-indigo-400' : 'text-slate-300'}`}>
                          ${marketCapStr}
                        </span>
                      </div>
                      <span className="text-[8px] text-slate-600 font-black uppercase tracking-[0.2em] mt-1.5 ml-1">
                        {isTrillion ? 'Mega Cap Tier' : 'Large Cap Tier'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                      order.side === 'BUY' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {order.side}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      {getOrderTypeIcon(order.type)}
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{order.type.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs text-slate-300 font-mono font-bold">{order.shares.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className="text-xs text-slate-300 font-mono font-bold">${order.price.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex flex-col items-end">
                      <span className={`text-xs font-mono font-black ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPositive ? '▲' : '▼'} {isPositive ? '+' : '-'}${Math.abs(pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className={`text-[9px] font-black tracking-widest ${isPositive ? 'text-emerald-500/60' : 'text-rose-500/60'} uppercase mt-0.5`}>
                        {isPositive ? '+' : ''}{pnlPercent.toFixed(2)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className="text-sm font-black text-white font-mono tracking-tighter">
                      ${(order.shares * order.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-200 font-black uppercase tracking-tighter">{new Date(order.timestamp).toLocaleDateString()}</span>
                      <span className="text-[9px] text-slate-500 font-mono mt-0.5">{new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {history.length === 0 && (
              <tr>
                <td colSpan={10} className="px-6 py-28 text-center bg-slate-900/40">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-slate-800/30 rounded-full border border-slate-700 shadow-inner">
                      <svg className="w-10 h-10 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-600 uppercase tracking-[0.3em]">No Recorded History</p>
                      <p className="text-[9px] text-slate-700 uppercase font-bold tracking-widest mt-1">Deploy capital to begin tracking</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TradeHistory;