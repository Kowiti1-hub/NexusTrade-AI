
import React from 'react';
import { OrderSide, OrderType, TrailingType } from '../types';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tradeInfo: {
    side: OrderSide;
    symbol: string;
    shares: number;
    price: number;
    orderType: OrderType;
    totalValue: number;
    isTrailing?: boolean;
    trailingType?: TrailingType;
    trailingAmount?: number;
    scheduledTime?: number;
  } | null;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, tradeInfo }) => {
  if (!isOpen || !tradeInfo) return null;

  const isBuy = tradeInfo.side === 'BUY';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className={`h-2 w-full ${isBuy ? 'bg-emerald-500' : 'bg-rose-500'}`} />
        
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">Confirm Trade</h3>
            <button 
              onClick={onClose}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 space-y-4 mb-8">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Transaction</span>
              <span className={`font-bold px-3 py-1 rounded-full text-xs tracking-widest ${isBuy ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {tradeInfo.side} {tradeInfo.isTrailing ? 'TRAILING STOP' : tradeInfo.orderType}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Asset</span>
              <span className="text-white font-bold font-mono text-lg">{tradeInfo.symbol}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Quantity</span>
              <span className="text-white font-mono text-lg">{tradeInfo.shares} Shares</span>
            </div>

            {tradeInfo.scheduledTime && (
               <div className="flex justify-between items-center border-t border-slate-700 pt-4">
                <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Execution Time</span>
                <div className="text-right">
                  <p className="text-amber-400 font-mono text-sm font-bold">
                    {new Date(tradeInfo.scheduledTime).toLocaleDateString()}
                  </p>
                  <p className="text-amber-500/80 font-mono text-xs">
                    {new Date(tradeInfo.scheduledTime).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            )}

            {tradeInfo.isTrailing && (
               <div className="flex justify-between items-center border-t border-slate-700 pt-4">
                <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Trailing Offset</span>
                <span className="text-amber-400 font-mono text-lg">
                  {tradeInfo.trailingType === 'PERCENT' ? `${tradeInfo.trailingAmount?.toFixed(2)}%` : `$${tradeInfo.trailingAmount?.toFixed(2)}`}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center border-t border-slate-700 pt-4">
              <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">
                {tradeInfo.orderType === 'MARKET' ? 'Estimated Price' : (tradeInfo.isTrailing ? 'Initial Stop' : 'Target Price')}
              </span>
              <span className="text-white font-mono text-lg">${tradeInfo.price.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center border-t border-slate-700 pt-4">
              <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">Total Value</span>
              <span className={`text-xl font-mono font-bold ${isBuy ? 'text-emerald-400' : 'text-rose-400'}`}>
                ${tradeInfo.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={onClose}
              className="py-3 px-6 rounded-xl font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all border border-slate-700"
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm}
              className={`py-3 px-6 rounded-xl font-bold text-slate-950 transition-all shadow-lg active:scale-95 ${isBuy ? 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20' : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'}`}
            >
              Confirm {tradeInfo.side}
            </button>
          </div>
          
          <p className="text-[10px] text-slate-500 mt-6 text-center italic leading-relaxed">
            Please verify all details. {tradeInfo.scheduledTime ? `This order is scheduled for ${new Date(tradeInfo.scheduledTime).toLocaleString()}.` : tradeInfo.isTrailing ? `Your stop price will track the market peak by ${tradeInfo.trailingAmount}${tradeInfo.trailingType === 'PERCENT' ? '%' : '$'} and trigger when that distance is breached.` : tradeInfo.orderType === 'MARKET' ? 'This trade will execute at the best available price.' : 'The order will wait until your target price is reached.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
