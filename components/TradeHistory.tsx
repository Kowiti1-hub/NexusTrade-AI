
import React from 'react';
import { ExecutedOrder, StockData } from '../types';

interface TradeHistoryProps {
  history: ExecutedOrder[];
  stocks: StockData[];
}

const TradeHistory: React.FC<TradeHistoryProps> = ({ history, stocks }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="p-6 border-b border-slate-800 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Trade History
        </h3>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-800 px-2 py-1 rounded">
          {history.length} Transactions
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-800/30 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              <th className="px-6 py-4">Symbol</th>
              <th className="px-6 py-4">Side</th>
              <th className="px-6 py-4">Shares</th>
              <th className="px-6 py-4 text-right">Execution Price</th>
              <th className="px-6 py-4 text-right">Unrealized P&L</th>
              <th className="px-6 py-4 text-right">Total Value</th>
              <th className="px-6 py-4 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {history.length > 0 ? (
              [...history].reverse().map((order) => {
                const currentStock = stocks.find(s => s.symbol === order.symbol);
                const currentPrice = currentStock?.price || order.price;
                const isBuy = order.side === 'BUY';
                
                // Unrealized P&L only makes sense for BUY orders (holdings)
                const pnl = isBuy ? (currentPrice - order.price) * order.shares : 0;
                const pnlPercent = isBuy ? ((currentPrice - order.price) / order.price) * 100 : 0;

                return (
                  <tr key={order.orderId} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 font-bold font-mono text-slate-200">{order.symbol}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest ${
                        order.side === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {order.side}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-300 text-sm">{order.shares}</td>
                    <td className="px-6 py-4 font-mono text-slate-300 text-sm text-right">${order.price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      {isBuy ? (
                        <div className={`flex flex-col items-end ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          <span className="font-mono font-bold text-sm">
                            {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                          </span>
                          <span className="text-[10px] opacity-80 font-bold">
                            ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-[10px] font-bold uppercase tracking-tighter">Realized</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-white text-sm text-right">
                      ${(order.shares * order.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs text-slate-500 font-medium">
                        {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500 italic text-sm">
                  No trades executed yet.
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
