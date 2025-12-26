
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">Trade History</h3>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Transaction Ledger</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 shadow-inner">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time Sync</span>
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
              <th className="px-6 py-4">Order ID</th>
              <th className="px-6 py-4">Symbol</th>
              <th className="px-6 py-4">Side</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Shares</th>
              <th className="px-6 py-4 text-right">Price</th>
              <th className="px-6 py-4 text-right">Unrealized P&L</th>
              <th className="px-6 py-4 text-right">Total</th>
              <th className="px-6 py-4 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {history.slice().reverse().map((order) => {
              const stock = stocks.find(s => s.symbol === order.symbol);
              const currentPrice = stock?.price || order.price;
              
              const pnl = order.side === 'BUY' 
                ? (currentPrice - order.price) * order.shares
                : (order.price - currentPrice) * order.shares;
              
              const isPositive = pnl >= 0;

              return (
                <tr key={order.orderId} className="hover:bg-slate-800/20 transition-all duration-200 group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="relative group/id">
                        <span 
                          className="font-mono text-[10px] text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700/50 cursor-help flex items-center gap-1.5" 
                          title={order.orderId}
                        >
                          <span className="text-slate-600 text-[8px] font-bold">TX</span>
                          {order.orderId.substring(0, 8)}
                        </span>
                        {copiedId === order.orderId && (
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 text-[8px] font-bold py-1 px-2 rounded shadow-lg animate-in fade-in slide-in-from-bottom-1 z-10">
                            COPIED
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => handleCopyId(order.orderId)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-emerald-400 text-slate-600 focus:outline-none"
                        title="Copy Full ID"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-white font-mono tracking-tight">{order.symbol}</span>
                      <span className="text-[10px] text-slate-500 font-medium truncate max-w-[120px]">
                        {stocks.find(s => s.symbol === order.symbol)?.name || 'Unknown Asset'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                      order.side === 'BUY' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]' 
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.05)]'
                    }`}>
                      {order.side}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter">{order.type.replace('_', ' ')}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-slate-300 font-mono font-medium">{order.shares.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-xs text-slate-300 font-mono">${order.price.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className={`text-xs font-mono font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPositive ? '▲' : '▼'} ${Math.abs(pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">
                        {order.side === 'BUY' ? 'MKT DELTA' : 'TIMING DELTA'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-bold text-white font-mono">
                      ${(order.shares * order.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] text-slate-200 font-medium">{new Date(order.timestamp).toLocaleDateString()}</span>
                      <span className="text-[9px] text-slate-500 font-mono">{new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {history.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-24 text-center">
                  <div className="flex flex-col items-center gap-3 opacity-20">
                    <svg className="w-12 h-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="italic text-sm font-medium text-slate-400">No transaction records found in ledger.</p>
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
