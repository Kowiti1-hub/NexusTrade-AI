
import React, { useState } from 'react';
import { ExecutedOrder, StockData } from '../types';

interface TradeHistoryProps {
  history: ExecutedOrder[];
  stocks: StockData[];
}

const TradeHistory: React.FC<TradeHistoryProps> = ({ history, stocks }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">Execution Ledger</h3>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Verified Trade History</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 shadow-inner">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Sync</span>
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
            {history.length} Transactions
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-800/30 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800/50">
              <th className="px-6 py-4">Symbol</th>
              <th className="px-6 py-4">Order ID</th>
              <th className="px-6 py-4">Side</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Units</th>
              <th className="px-6 py-4 text-right">Price</th>
              <th className="px-6 py-4 text-right">P&L (Current)</th>
              <th className="px-6 py-4 text-right">Notional Value</th>
              <th className="px-6 py-4">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {history.slice().reverse().map((order) => {
              const stock = stocks.find(s => s.symbol === order.symbol);
              const currentPrice = stock?.price || order.price;
              
              const pnl = order.side === 'BUY' 
                ? (currentPrice - order.price) * order.shares
                : (order.price - currentPrice) * order.shares;
              
              const pnlPercent = (pnl / (order.price * order.shares)) * 100;
              const isPositive = pnl >= 0;

              return (
                <tr key={order.orderId} className="hover:bg-slate-800/20 transition-all duration-200 group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-white font-mono tracking-tight">{order.symbol}</span>
                      <span className="text-[9px] text-slate-500 font-medium uppercase tracking-tighter">
                        {stocks.find(s => s.symbol === order.symbol)?.name || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div 
                          className="flex items-center gap-1.5 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800/50 group-hover:border-slate-700 transition-colors shadow-inner" 
                        >
                          <span className="text-[8px] font-black text-slate-600 mr-1 uppercase">ID</span>
                          <span className="font-mono text-[10px] font-black text-slate-300">
                            {order.orderId.substring(0, 8).toUpperCase()}
                          </span>
                        </div>
                        {copiedId === order.orderId && (
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 text-[9px] font-black py-1 px-2 rounded-lg shadow-lg shadow-emerald-500/20 animate-bounce z-10 whitespace-nowrap border border-emerald-400">
                            COPIED
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => handleCopyId(order.orderId)}
                        className={`p-1 rounded-md transition-all opacity-0 group-hover:opacity-100 ${copiedId === order.orderId ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-600 hover:text-emerald-400 hover:bg-emerald-500/10'}`}
                        title="Copy Full Transaction ID"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                      order.side === 'BUY' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {order.side}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{order.type.replace('_', ' ')}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-slate-300 font-mono font-medium">{order.shares.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-xs text-slate-300 font-mono font-medium">${order.price.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className={`text-xs font-mono font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPositive ? '▲' : '▼'} {isPositive ? '+' : '-'}${Math.abs(pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className={`text-[9px] font-black tracking-widest ${isPositive ? 'text-emerald-500/60' : 'text-rose-500/60'} uppercase`}>
                        {isPositive ? '+' : ''}{pnlPercent.toFixed(2)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-bold text-white font-mono">
                      ${(order.shares * order.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-200 font-medium">{new Date(order.timestamp).toLocaleDateString()}</span>
                      <span className="text-[9px] text-slate-500 font-mono">{new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {history.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-8 h-8 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">No Executed Trades Found</p>
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
