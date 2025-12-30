import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StockData, Portfolio, MarketInsight, Position, PendingOrder, OrderSide, OrderType, OrderStatus, NewsArticle, PortfolioHistoryPoint, ExecutedOrder, TrailingType } from './types';
import { INITIAL_STOCKS, INITIAL_BALANCE } from './constants';
import Sidebar from './components/Sidebar';
import StockChart from './components/StockChart';
import NewsFeed from './components/NewsFeed';
import PortfolioChart from './components/PortfolioChart';
import TradeHistory from './components/TradeHistory';
import ConfirmationModal from './components/ConfirmationModal';
import PendingOrders from './components/PendingOrders';
import { getMarketAnalysis, getStockNews } from './services/geminiService';

const generateOrderId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const generateInitialPortfolioHistory = (currentBalance: number): PortfolioHistoryPoint[] => {
  const history: PortfolioHistoryPoint[] = [];
  let val = currentBalance;
  const now = new Date();
  for (let i = 24; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 3600000);
    val = val * (1 + (Math.random() - 0.5) * 0.01);
    history.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: val
    });
  }
  return history;
};

const App: React.FC = () => {
  const [stocks, setStocks] = useState<StockData[]>(INITIAL_STOCKS);
  const [selectedSymbol, setSelectedSymbol] = useState<string>(INITIAL_STOCKS[0].symbol);
  const [portfolio, setPortfolio] = useState<Portfolio>({
    balance: INITIAL_BALANCE,
    positions: [],
    pendingOrders: [],
    history: []
  });
  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioHistoryPoint[]>(() => generateInitialPortfolioHistory(INITIAL_BALANCE));
  const [aiInsight, setAiInsight] = useState<MarketInsight | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState<boolean>(false);
  
  // Form State
  const [tradeSide, setTradeSide] = useState<OrderSide>('BUY');
  const [tradeAmount, setTradeAmount] = useState<string>("");
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [limitPrice, setLimitPrice] = useState<string>("");
  const [isTrailing, setIsTrailing] = useState<boolean>(false);
  const [trailingType, setTrailingType] = useState<TrailingType>('FIXED');
  const [isScheduled, setIsScheduled] = useState<boolean>(false);
  const [scheduledTime, setScheduledTime] = useState<string>("");

  // Confirmation Modal State
  const [pendingTrade, setPendingTrade] = useState<{
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
  } | null>(null);

  const selectedStock = stocks.find(s => s.symbol === selectedSymbol) || stocks[0];
  const currentPosition = portfolio.positions.find(p => p.symbol === selectedSymbol);
  
  // Define helper variables and functions to resolve 'Cannot find name' errors
  const isBuy = tradeSide === 'BUY';
  const themeColor = isBuy ? 'emerald' : 'rose';

  // Helper to calculate stop price preview for trailing stop orders
  const calculatePreviewStopPrice = () => {
    const stockPrice = selectedStock.price;
    const amount = parseFloat(limitPrice);
    if (isNaN(amount)) return stockPrice;
    
    if (trailingType === 'PERCENT') {
      return stockPrice * (1 - amount / 100);
    } else {
      return stockPrice - amount;
    }
  };

  const portfolioRef = useRef(portfolio);
  portfolioRef.current = portfolio;

  const calculateTotalValue = (currentStocks: StockData[], currentPortfolio: Portfolio) => {
    const positionsValue = currentPortfolio.positions.reduce((acc, pos) => {
      const stock = currentStocks.find(s => s.symbol === pos.symbol);
      return acc + (pos.shares * (stock?.price || 0));
    }, 0);

    const pendingOrdersValue = currentPortfolio.pendingOrders.reduce((acc, order) => {
      if (order.status === 'REJECTED') return acc;
      if (order.side === 'BUY') return acc + (order.shares * order.limitPrice);
      const stock = currentStocks.find(s => s.symbol === order.symbol);
      return acc + (order.shares * (stock?.price || order.limitPrice));
    }, 0);

    return currentPortfolio.balance + positionsValue + pendingOrdersValue;
  };

  const currentTotalValue = calculateTotalValue(stocks, portfolio);
  const totalGainLoss = currentTotalValue - INITIAL_BALANCE;
  const gainLossPercent = (totalGainLoss / INITIAL_BALANCE) * 100;
  const investedValue = currentTotalValue - portfolio.balance;

  useEffect(() => {
    const interval = setInterval(() => {
      let updatedStocks: StockData[] = [];
      
      setStocks(currentStocks => {
        updatedStocks = currentStocks.map(stock => {
          const changeFactor = 1 + (Math.random() - 0.5) * 0.005;
          const newPrice = parseFloat((stock.price * changeFactor).toFixed(2));
          const priceDiff = newPrice - stock.price;
          const newChange = stock.change + priceDiff;
          const newPercent = (newChange / (newPrice - newChange)) * 100;
          
          const newHistory = [...stock.history.slice(1), {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            price: newPrice
          }];

          return {
            ...stock,
            price: newPrice,
            change: newChange,
            changePercent: parseFloat(newPercent.toFixed(2)),
            history: newHistory
          };
        });
        return updatedStocks;
      });

      setPortfolioHistory(prev => {
        const totalVal = calculateTotalValue(updatedStocks, portfolioRef.current);
        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        return [...prev.slice(-49), { time: nowStr, value: totalVal }];
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const triggeredOrders: PendingOrder[] = [];
    const remainingOrders: PendingOrder[] = [];
    let stateChanged = false;
    const now = Date.now();

    const newPendingOrders = portfolio.pendingOrders.map(order => {
      if (order.status === 'REJECTED') return order;

      const stock = stocks.find(s => s.symbol === order.symbol);
      if (!stock) return order;

      // Update Trailing Logic
      if (order.type === 'STOP_LOSS' && order.isTrailing) {
        if (!order.scheduledTime || now >= order.scheduledTime) {
          if (stock.price > (order.highestPriceObserved || 0)) {
            stateChanged = true;
            const newHighest = stock.price;
            const offset = order.trailingAmount || 0;
            const newStopPrice = order.trailingType === 'PERCENT' 
              ? newHighest * (1 - offset / 100)
              : newHighest - offset;
            
            return {
              ...order,
              highestPriceObserved: newHighest,
              limitPrice: newStopPrice
            };
          }
        }
      }

      // Proximity Alert Check
      const isClose = Math.abs((stock.price - order.limitPrice) / order.limitPrice) < 0.005;
      const isTimeReached = !order.scheduledTime || now >= order.scheduledTime;
      const newStatus: OrderStatus = !isTimeReached ? 'QUEUED' : (isClose ? 'ALERT' : 'ACTIVE');
      
      if (order.status !== newStatus) {
        stateChanged = true;
        return { ...order, status: newStatus };
      }

      return order;
    });

    newPendingOrders.forEach(order => {
      if (order.status === 'REJECTED') {
        remainingOrders.push(order);
        return;
      }

      const stock = stocks.find(s => s.symbol === order.symbol);
      if (!stock) return;

      const isTimeReached = !order.scheduledTime || now >= order.scheduledTime;
      let isTriggered = false;
      if (isTimeReached) {
        if (order.type === 'MARKET') {
          isTriggered = true;
        } else if (order.type === 'LIMIT') {
          isTriggered = 
            (order.side === 'BUY' && stock.price <= order.limitPrice) ||
            (order.side === 'SELL' && stock.price >= order.limitPrice);
        } else if (order.type === 'STOP_LOSS') {
          isTriggered = (order.side === 'SELL' && stock.price <= order.limitPrice);
        }
      }

      if (isTriggered) {
        // Random 2% failure simulation for institutional realism
        if (Math.random() < 0.02) {
          remainingOrders.push({ ...order, status: 'REJECTED' });
          stateChanged = true;
        } else {
          triggeredOrders.push(order);
          stateChanged = true;
        }
      } else {
        remainingOrders.push(order);
      }
    });

    if (stateChanged) {
      setPortfolio(prev => {
        let newBalance = prev.balance;
        const newPositions = [...prev.positions];
        const newHistory = [...prev.history];

        triggeredOrders.forEach(order => {
          const stock = stocks.find(s => s.symbol === order.symbol)!;
          const executionPrice = stock.price;
          
          const executed: ExecutedOrder = {
            orderId: generateOrderId(),
            symbol: order.symbol,
            side: order.side,
            type: order.type,
            shares: order.shares,
            price: executionPrice,
            timestamp: Date.now(),
            scheduledTime: order.scheduledTime
          };
          newHistory.push(executed);

          if (order.side === 'BUY') {
            const existingIdx = newPositions.findIndex(p => p.symbol === order.symbol);
            if (existingIdx >= 0) {
              const pos = newPositions[existingIdx];
              const newShares = pos.shares + order.shares;
              const newAvg = (pos.avgPrice * pos.shares + executionPrice * order.shares) / newShares;
              newPositions[existingIdx] = { ...pos, shares: newShares, avgPrice: newAvg };
            } else {
              newPositions.push({ symbol: order.symbol, shares: order.shares, avgPrice: executionPrice });
            }
            const reservedAmount = order.shares * order.limitPrice;
            const actualAmount = order.shares * executionPrice;
            newBalance += (reservedAmount - actualAmount); 
          } else {
            newBalance += order.shares * executionPrice;
          }
        });

        return {
          ...prev,
          balance: newBalance,
          positions: newPositions,
          pendingOrders: remainingOrders,
          history: newHistory
        };
      });
    }
  }, [stocks, portfolio.pendingOrders]);

  const fetchStockData = useCallback(async (stock: StockData) => {
    setIsAnalyzing(true);
    setAiInsight(null);
    getMarketAnalysis(stock).then(setAiInsight).finally(() => setIsAnalyzing(false));
    setIsNewsLoading(true);
    getStockNews(stock).then(setNews).finally(() => setIsNewsLoading(false));
  }, []);

  useEffect(() => {
    fetchStockData(selectedStock);
  }, [selectedSymbol, fetchStockData]);

  const handleTrade = (sideOverride?: OrderSide) => {
    const side = sideOverride || tradeSide;
    const shares = parseFloat(tradeAmount);
    const amountVal = parseFloat(limitPrice);
    let price = (orderType === 'LIMIT' || orderType === 'STOP_LOSS') ? amountVal : selectedStock.price;

    if (isNaN(shares) || shares <= 0) return;
    if (orderType !== 'MARKET' && (isNaN(price) || price <= 0)) return;

    if (orderType === 'STOP_LOSS' && isTrailing) {
      price = calculatePreviewStopPrice();
    }

    const scheduledTimestamp = isScheduled && scheduledTime ? new Date(scheduledTime).getTime() : undefined;
    const totalValue = shares * (orderType === 'MARKET' ? selectedStock.price : (isTrailing ? selectedStock.price : price));

    if (side === 'BUY' && portfolio.balance < totalValue) {
      alert("Insufficient balance!");
      return;
    }

    setPendingTrade({
      side,
      symbol: selectedSymbol,
      shares,
      price: price,
      orderType,
      totalValue,
      isTrailing,
      trailingType: isTrailing ? trailingType : undefined,
      trailingAmount: isTrailing ? amountVal : undefined,
      scheduledTime: scheduledTimestamp
    });
  };

  const executeTrade = () => {
    if (!pendingTrade) return;
    const { side, shares, price, orderType, symbol, totalValue, isTrailing, trailingAmount, trailingType, scheduledTime: tradeSchedTime } = pendingTrade;

    if (isScheduled || orderType !== 'MARKET') {
      const newOrder: PendingOrder = {
        orderId: generateOrderId(),
        symbol,
        side,
        type: orderType,
        status: tradeSchedTime ? 'QUEUED' : 'ACTIVE',
        shares,
        limitPrice: price,
        timestamp: Date.now(),
        scheduledTime: tradeSchedTime,
        isTrailing: isTrailing,
        trailingType: trailingType,
        trailingAmount: trailingAmount,
        highestPriceObserved: isTrailing ? selectedStock.price : undefined
      };

      setPortfolio(prev => {
        let newBalance = prev.balance;
        let newPositions = [...prev.positions];
        if (side === 'BUY') {
          newBalance -= totalValue;
        } else {
          newPositions = prev.positions.map(p => {
            if (p.symbol === symbol) return { ...p, shares: p.shares - shares };
            return p;
          }).filter(p => p.shares > 0);
        }
        return {
          ...prev,
          balance: newBalance,
          positions: newPositions,
          pendingOrders: [...prev.pendingOrders, newOrder]
        };
      });
    } else {
      setPortfolio(prev => {
        const execPrice = selectedStock.price;
        let newPositions = [...prev.positions];
        if (side === 'BUY') {
          const existingIdx = newPositions.findIndex(p => p.symbol === symbol);
          if (existingIdx >= 0) {
            const pos = newPositions[existingIdx];
            const newTotal = pos.shares + shares;
            const newAvg = (pos.avgPrice * pos.shares + (shares * execPrice)) / newTotal;
            newPositions[existingIdx] = { ...pos, shares: newTotal, avgPrice: newAvg };
          } else {
            newPositions.push({ symbol, shares, avgPrice: execPrice });
          }
        } else {
          newPositions = prev.positions.map(p => {
            if (p.symbol === symbol) return { ...p, shares: p.shares - shares };
            return p;
          }).filter(p => p.shares > 0);
        }
        
        const executed: ExecutedOrder = {
          orderId: generateOrderId(),
          symbol,
          side,
          type: 'MARKET',
          shares,
          price: execPrice,
          timestamp: Date.now()
        };

        return { 
          ...prev, 
          balance: side === 'BUY' ? prev.balance - (shares * execPrice) : prev.balance + (shares * execPrice), 
          positions: newPositions,
          history: [...prev.history, executed]
        };
      });
    }

    setTradeAmount("");
    setLimitPrice("");
    setIsScheduled(false);
    setScheduledTime("");
    setPendingTrade(null);
    setIsTrailing(false);
  };

  const cancelOrder = (orderId: string) => {
    setPortfolio(prev => {
      const order = prev.pendingOrders.find(o => o.orderId === orderId);
      if (!order) return prev;
      if (order.status === 'REJECTED') {
        return { ...prev, pendingOrders: prev.pendingOrders.filter(o => o.orderId !== orderId) };
      }
      let newBalance = prev.balance;
      const newPositions = [...prev.positions];
      if (order.side === 'BUY') {
        newBalance += (order.shares * order.limitPrice);
      } else {
        const existingIdx = newPositions.findIndex(p => p.symbol === order.symbol);
        if (existingIdx >= 0) {
          newPositions[existingIdx].shares += order.shares;
        } else {
          newPositions.push({ symbol: order.symbol, shares: order.shares, avgPrice: order.limitPrice });
        }
      }
      return {
        ...prev,
        balance: newBalance,
        positions: newPositions,
        pendingOrders: prev.pendingOrders.filter(o => o.orderId !== orderId)
      };
    });
  };

  const updateOrder = (orderId: string, updatedFields: Partial<PendingOrder>) => {
    setPortfolio(prev => {
      const orderIndex = prev.pendingOrders.findIndex(o => o.orderId === orderId);
      if (orderIndex === -1) return prev;
      const oldOrder = prev.pendingOrders[orderIndex];
      const newOrder = { ...oldOrder, ...updatedFields };
      let newPendingOrders = [...prev.pendingOrders];
      newPendingOrders[orderIndex] = newOrder;
      return { ...prev, pendingOrders: newPendingOrders };
    });
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-200 overflow-hidden">
      <Sidebar stocks={stocks} selectedSymbol={selectedSymbol} onSelectStock={setSelectedSymbol} portfolioValue={currentTotalValue} />
      <main className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar p-4 lg:p-6">
        <div className="max-w-[1700px] mx-auto w-full space-y-6">
          <section className="bg-slate-900/40 border border-slate-800 p-4 rounded-3xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/80 backdrop-blur rounded-full border border-slate-700">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Flow</span>
              </div>
            </div>
            <div className="flex flex-col md:flex-row justify-between gap-6 mb-4">
              <div className="space-y-0.5">
                <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Liquid Worth</h2>
                <div className="flex items-baseline gap-4">
                  <span className="text-3xl lg:text-4xl font-mono font-bold text-white tracking-tight">${currentTotalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <div className={`flex items-center gap-1 font-bold text-xs ${totalGainLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    <span>{totalGainLoss >= 0 ? '▲' : '▼'}</span>
                    <span>${Math.abs(totalGainLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({gainLossPercent.toFixed(2)}%)</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 items-center">
                <div className="space-y-0.5 border-l border-slate-800 pl-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Buying Power</span>
                  <p className="text-md font-mono text-slate-200">${portfolio.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="space-y-0.5 border-l border-slate-800 pl-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Allocated</span>
                  <p className="text-md font-mono text-slate-200">${investedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
            <PortfolioChart history={portfolioHistory} />
          </section>

          <header className="flex justify-between items-end gap-6 px-2">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold text-white">{selectedStock.name}</h1>
                <span className="bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded text-[10px] font-bold border border-slate-700/50">{selectedSymbol}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-mono font-medium text-white">${selectedStock.price.toFixed(2)}</span>
                <span className={`text-sm font-medium ${selectedStock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{selectedStock.change >= 0 ? '+' : ''}{selectedStock.change.toFixed(2)} ({selectedStock.changePercent}%)</span>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <section className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-lg min-h-[400px]">
                <StockChart stock={selectedStock} />
              </section>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Asset Outlook</h3>
                   {isAnalyzing ? (
                    <div className="flex flex-col gap-4 py-8 items-center justify-center">
                      <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                    </div>
                  ) : aiInsight ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${aiInsight.sentiment === 'Bullish' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>{aiInsight.sentiment}</span>
                        <p className="text-slate-300 text-[11px] font-medium italic">"{aiInsight.recommendation}"</p>
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">{aiInsight.summary}</p>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-[11px] italic">Awaiting AI synthesis...</p>
                  )}
                </section>
                <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Real-time Feed</h3>
                  <NewsFeed news={news.slice(0, 2)} isLoading={isNewsLoading} stockSymbol={selectedSymbol} />
                </section>
              </div>
            </div>

            <div className="space-y-6">
              <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
                <div className={`absolute inset-0 bg-gradient-to-br ${isBuy ? 'from-emerald-500/5' : 'from-rose-500/5'} to-transparent opacity-50`}></div>
                <div className="relative">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6"><div className={`w-1.5 h-4 ${isBuy ? 'bg-emerald-500' : 'bg-rose-500'} rounded-full`}></div>Terminal</h3>
                  <div className="grid grid-cols-2 gap-2 mb-4 p-1 bg-slate-800/60 rounded-xl border border-slate-700/50">
                    <button onClick={() => setTradeSide('BUY')} className={`py-2 text-[10px] font-black uppercase rounded-lg transition-all ${isBuy ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Buy</button>
                    <button onClick={() => setTradeSide('SELL')} className={`py-2 text-[10px] font-black uppercase rounded-lg transition-all ${!isBuy ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Sell</button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-6 p-1 bg-slate-800/40 rounded-xl border border-slate-800">
                    {(['MARKET', 'LIMIT', 'STOP_LOSS'] as OrderType[]).map((type) => (
                      <button key={type} onClick={() => setOrderType(type)} className={`py-1.5 text-[8px] font-bold uppercase rounded-lg transition-all ${orderType === type ? 'bg-slate-700 text-white' : 'text-slate-600 hover:text-slate-400'}`}>{type.replace('_', ' ')}</button>
                    ))}
                  </div>

                  {/* TRAILING TOGGLE - ONLY FOR STOP LOSS */}
                  {orderType === 'STOP_LOSS' && (
                    <div className="mb-6 p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Trailing Mode</span>
                        <span className="text-[10px] text-slate-500 font-medium">Automatic peak tracking</span>
                      </div>
                      <button 
                        onClick={() => setIsTrailing(!isTrailing)}
                        className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isTrailing ? 'bg-indigo-500' : 'bg-slate-700'}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isTrailing ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  )}

                  <div className="space-y-5">
                    {orderType !== 'MARKET' && (
                      <div className="space-y-4">
                        <div className="flex items-end gap-3">
                          <div className="flex-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                              {isTrailing ? 'Trailing Amount' : 'Target Price'}
                            </label>
                            <input 
                              type="number" 
                              value={limitPrice} 
                              onChange={(e) => setLimitPrice(e.target.value)} 
                              placeholder={isTrailing ? (trailingType === 'PERCENT' ? "5.0" : "1.00") : selectedStock.price.toFixed(2)} 
                              className={`w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-xl font-mono text-white focus:outline-none focus:ring-1 focus:ring-${isTrailing ? 'indigo' : themeColor}-500/50`} 
                            />
                          </div>
                          {isTrailing && (
                            <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                              {(['FIXED', 'PERCENT'] as TrailingType[]).map((t) => (
                                <button
                                  key={t}
                                  onClick={() => setTrailingType(t)}
                                  className={`px-3 py-2 text-[10px] font-black rounded-lg transition-all ${
                                    trailingType === t ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                                  }`}
                                >
                                  {t === 'FIXED' ? '$' : '%'}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {isTrailing && (
                          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50 flex justify-between items-center">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Initial Stop</span>
                            <span className="text-xs font-mono font-bold text-indigo-400">
                              ${calculatePreviewStopPrice().toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Units</label>
                      <input type="number" value={tradeAmount} onChange={(e) => setTradeAmount(e.target.value)} placeholder="0" className={`w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-xl font-mono text-white focus:outline-none focus:ring-1 focus:ring-${themeColor}-500/50`} />
                    </div>
                    <button onClick={() => handleTrade()} className={`w-full font-black py-5 rounded-xl transition-all active:scale-95 shadow-xl uppercase tracking-widest text-xs ${isBuy ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950' : 'bg-rose-500 hover:bg-rose-400 text-white'}`}>Confirm Order</button>
                  </div>
                </div>
              </section>
              <PendingOrders orders={portfolio.pendingOrders} onCancel={cancelOrder} onUpdate={updateOrder} stocks={stocks} />
            </div>
          </div>
          <section className="pb-10">
            <TradeHistory history={portfolio.history} stocks={stocks} />
          </section>
        </div>
      </main>
      <ConfirmationModal isOpen={pendingTrade !== null} onClose={() => setPendingTrade(null)} onConfirm={executeTrade} tradeInfo={pendingTrade} />
    </div>
  );
};

export default App;