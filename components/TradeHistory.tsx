
import React from 'react';
import { ExecutedOrder, StockData } from '../types';

interface TradeHistoryProps {
  history: ExecutedOrder[];
  stocks: StockData[];
}

const TradeHistory: React.FC<TradeHistoryProps> = ({ history, stocks }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Trade History
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800 border border-slate-700">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live P&L</span>
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-800 px-2 py-1 rounded">
            {history.length} Transactions
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-800/30 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              <th className="px-6 py-4">Symbol</th>
              <th className="px-6 py-4">Side</th>
              <th className="px-6 py-4">Shares</th>
              <th className="px-6 py-4 text-right">Entry Price</th>
              <th className="px-6 py-4 text-right">Current Price</th>
              <th className="px-6 py-4 text-right">Unrealized P&L</th>
              <th className="px-6 py-4 text-right">Market Value</th>
              <th className="px-6 py-4 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {history.length > 0 ? (
              [...history].reverse().map((order) => {
                const currentStock = stocks.find(s => s.symbol === order.symbol);
                const currentPrice = currentStock?.price || order.price;
                const isBuy = order.side === 'BUY';
                
                // Unrealized P&L: (Current - Entry) * Shares
                const pnl = isBuy ? (currentPrice - order.price) * order.shares : 0;
                const pnlPercent = isBuy ? ((currentPrice - order.price) / order.price) * 100 : 0;
                const marketValue = order.shares * currentPrice;

                return (
                  <tr key={order.orderId} className="hover:bg-slate-800/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold font-mono text-slate-200">{order.symbol}</span>
                        <span className="text-[8px] text-slate-600 font-bold uppercase tracking-tighter">ID: {order.orderId.substring(0, 8)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase border ${
                        order.side === 'BUY' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {order.side}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-300 text-sm">{order.shares.toLocaleString()}</td>
                    <td className="px-6 py-4 font-mono text-slate-400 text-sm text-right">${order.price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                       <span className={`font-mono text-sm ${currentPrice > order.price ? 'text-emerald-400/80' : currentPrice < order.price ? 'text-rose-400/80' : 'text-slate-400'}`}>
                         ${currentPrice.toFixed(2)}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isBuy ? (
                        <div className={`flex flex-col items-end ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          <span className="font-mono font-bold text-sm">
                            {pnl >= 0 ? '+' : ''}${Math.abs(pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] opacity-80 font-bold">
                            ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end">
                          <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">Realized</span>
                          <span className="text-[9px] text-slate-700 font-medium">Position Closed</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-white text-sm text-right">
                      ${marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end opacity-60 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] text-slate-300 font-bold uppercase tracking-tighter">
                          {new Date(order.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-500 italic text-sm">
                  <div className="flex flex-col items-center gap-2 opacity-30">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>No trades executed yet.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="p-4 bg-slate-800/10 border-t border-slate-800 flex justify-between items-center text-[10px] font-bold text-slate-600 uppercase tracking-widest">
        <span>History synchronized with live data feeds</span>
        <span>Trade History Log v1.4</span>
      </div>
    </div>
  );
};

export default TradeHistory;
