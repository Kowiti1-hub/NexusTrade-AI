
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StockData, Portfolio, MarketInsight, Position, PendingOrder, OrderSide, OrderType, NewsArticle, PortfolioHistoryPoint, ExecutedOrder, TrailingType } from './types';
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
  const [tradeAmount, setTradeAmount] = useState<string>("");
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [limitPrice, setLimitPrice] = useState<string>("");
  const [isTrailing, setIsTrailing] = useState<boolean>(false);
  const [trailingType, setTrailingType] = useState<TrailingType>('FIXED');

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
  } | null>(null);

  const selectedStock = stocks.find(s => s.symbol === selectedSymbol) || stocks[0];
  const currentPosition = portfolio.positions.find(p => p.symbol === selectedSymbol);
  
  const portfolioRef = useRef(portfolio);
  portfolioRef.current = portfolio;

  const calculateTotalValue = (currentStocks: StockData[], currentPortfolio: Portfolio) => {
    const positionsValue = currentPortfolio.positions.reduce((acc, pos) => {
      const stock = currentStocks.find(s => s.symbol === pos.symbol);
      return acc + (pos.shares * (stock?.price || 0));
    }, 0);

    const pendingOrdersValue = currentPortfolio.pendingOrders.reduce((acc, order) => {
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

  // Complex Order Processing Logic (Trailing & Triggers)
  useEffect(() => {
    const triggeredOrders: PendingOrder[] = [];
    const remainingOrders: PendingOrder[] = [];
    let stateChanged = false;

    const newPendingOrders = portfolio.pendingOrders.map(order => {
      const stock = stocks.find(s => s.symbol === order.symbol);
      if (!stock) return order;

      if (order.type === 'STOP_LOSS' && order.isTrailing) {
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
      return order;
    });

    newPendingOrders.forEach(order => {
      const stock = stocks.find(s => s.symbol === order.symbol);
      if (!stock) return;

      let isTriggered = false;
      if (order.type === 'LIMIT') {
        isTriggered = 
          (order.side === 'BUY' && stock.price <= order.limitPrice) ||
          (order.side === 'SELL' && stock.price >= order.limitPrice);
      } else if (order.type === 'STOP_LOSS') {
        isTriggered = (order.side === 'SELL' && stock.price <= order.limitPrice);
      }

      if (isTriggered) {
        triggeredOrders.push(order);
        stateChanged = true;
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
            timestamp: Date.now()
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

  const calculatePreviewStopPrice = () => {
    const val = parseFloat(limitPrice);
    if (isNaN(val) || val <= 0) return selectedStock.price;
    if (trailingType === 'PERCENT') {
      return selectedStock.price * (1 - val / 100);
    }
    return selectedStock.price - val;
  };

  const handleTrade = (side: OrderSide) => {
    const shares = parseFloat(tradeAmount);
    const amountVal = parseFloat(limitPrice);
    let price = (orderType === 'LIMIT' || orderType === 'STOP_LOSS') ? amountVal : selectedStock.price;

    if (isNaN(shares) || shares <= 0) return;
    if (orderType !== 'MARKET' && (isNaN(price) || price <= 0)) return;

    if (orderType === 'STOP_LOSS' && isTrailing) {
      price = calculatePreviewStopPrice();
    }

    if (orderType === 'STOP_LOSS' && side === 'BUY') {
      alert("Stop loss is typically used for selling to limit losses on a position.");
      return;
    }

    const totalValue = shares * (orderType === 'MARKET' ? selectedStock.price : (isTrailing ? selectedStock.price : price));

    if (side === 'BUY') {
      if (portfolio.balance < totalValue) {
        alert("Insufficient balance!");
        return;
      }
    } else {
      const existingPos = portfolio.positions.find(p => p.symbol === selectedSymbol);
      if (!existingPos || existingPos.shares < shares) {
        alert("Insufficient shares in active position!");
        return;
      }
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
      trailingAmount: isTrailing ? amountVal : undefined
    });
  };

  const executeTrade = () => {
    if (!pendingTrade) return;
    const { side, shares, price, orderType, symbol, totalValue, isTrailing, trailingAmount, trailingType } = pendingTrade;

    if (side === 'BUY') {
      if (orderType === 'MARKET') {
        setPortfolio(prev => {
          const existingIdx = prev.positions.findIndex(p => p.symbol === symbol);
          const newPositions = [...prev.positions];
          const execPrice = selectedStock.price;
          if (existingIdx >= 0) {
            const pos = newPositions[existingIdx];
            const newTotal = pos.shares + shares;
            const newAvg = (pos.avgPrice * pos.shares + (shares * execPrice)) / newTotal;
            newPositions[existingIdx] = { ...pos, shares: newTotal, avgPrice: newAvg };
          } else {
            newPositions.push({ symbol, shares, avgPrice: execPrice });
          }
          
          const executed: ExecutedOrder = {
            orderId: generateOrderId(),
            symbol,
            side: 'BUY',
            type: 'MARKET',
            shares,
            price: execPrice,
            timestamp: Date.now()
          };

          return { 
            ...prev, 
            balance: prev.balance - (shares * execPrice), 
            positions: newPositions,
            history: [...prev.history, executed]
          };
        });
      } else {
        const newOrder: PendingOrder = {
          orderId: generateOrderId(),
          symbol,
          side: 'BUY',
          type: 'LIMIT',
          shares,
          limitPrice: price,
          timestamp: Date.now()
        };
        setPortfolio(prev => ({
          ...prev,
          balance: prev.balance - totalValue,
          pendingOrders: [...prev.pendingOrders, newOrder]
        }));
      }
    } else {
      if (orderType === 'MARKET') {
        setPortfolio(prev => {
          const execPrice = selectedStock.price;
          const newPositions = prev.positions.map(p => {
            if (p.symbol === symbol) return { ...p, shares: p.shares - shares };
            return p;
          }).filter(p => p.shares > 0);

          const executed: ExecutedOrder = {
            orderId: generateOrderId(),
            symbol,
            side: 'SELL',
            type: 'MARKET',
            shares,
            price: execPrice,
            timestamp: Date.now()
          };

          return { 
            ...prev, 
            balance: prev.balance + (shares * execPrice), 
            positions: newPositions,
            history: [...prev.history, executed]
          };
        });
      } else {
        const newOrder: PendingOrder = {
          orderId: generateOrderId(),
          symbol,
          side: 'SELL',
          type: orderType,
          shares,
          limitPrice: price,
          timestamp: Date.now(),
          isTrailing: isTrailing,
          trailingType: trailingType,
          trailingAmount: trailingAmount,
          highestPriceObserved: isTrailing ? selectedStock.price : undefined
        };
        setPortfolio(prev => {
          const newPositions = prev.positions.map(p => {
            if (p.symbol === symbol) return { ...p, shares: p.shares - shares };
            return p;
          }).filter(p => p.shares > 0);
          return {
            ...prev,
            positions: newPositions,
            pendingOrders: [...prev.pendingOrders, newOrder]
          };
        });
      }
    }
    setTradeAmount("");
    setLimitPrice("");
    setPendingTrade(null);
  };

  const cancelOrder = (orderId: string) => {
    setPortfolio(prev => {
      const order = prev.pendingOrders.find(o => o.orderId === orderId);
      if (!order) return prev;

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

  const handleQuickAmount = (percent: number) => {
    const price = (orderType !== 'MARKET' ? parseFloat(limitPrice) || selectedStock.price : selectedStock.price);
    const maxShares = Math.floor(portfolio.balance / price);
    setTradeAmount((maxShares * percent).toString());
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200">
      <Sidebar 
        stocks={stocks} 
        selectedSymbol={selectedSymbol} 
        onSelectStock={setSelectedSymbol}
        portfolioValue={currentTotalValue}
      />

      <main className="flex-1 flex flex-col p-8 overflow-y-auto">
        <div className="grid grid-cols-3 gap-8 mb-8">
          <section className="col-span-3 bg-slate-900/40 border border-slate-800 p-6 rounded-3xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/80 backdrop-blur rounded-full border border-slate-700">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Market Live</span>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row justify-between gap-8 mb-6">
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Net Worth</h2>
                <div className="flex items-baseline gap-4">
                  <span className="text-4xl font-mono font-bold text-white tracking-tight">
                    ${currentTotalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <div className={`flex items-center gap-1 font-bold text-sm ${totalGainLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    <span>{totalGainLoss >= 0 ? '▲' : '▼'}</span>
                    <span>${Math.abs(totalGainLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span>({gainLossPercent.toFixed(2)}%)</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-8 items-center">
                <div className="space-y-1 border-l border-slate-800 pl-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cash</span>
                  <p className="text-lg font-mono text-slate-200">${portfolio.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="space-y-1 border-l border-slate-800 pl-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Invested</span>
                  <p className="text-lg font-mono text-slate-200">${investedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="space-y-1 border-l border-slate-800 pl-4 hidden md:block">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total P&L</span>
                  <p className={`text-lg font-mono font-bold ${totalGainLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {totalGainLoss >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>

            <PortfolioChart history={portfolioHistory} />
          </section>
        </div>

        <header className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{selectedStock.name}</h1>
            <div className="flex items-center gap-4">
              <span className="bg-slate-800 text-slate-300 font-mono px-2 py-1 rounded text-sm font-bold">
                {selectedSymbol}
              </span>
              <span className="text-3xl font-mono font-medium text-white">
                ${selectedStock.price.toFixed(2)}
              </span>
              <span className={`text-lg font-medium ${selectedStock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {selectedStock.change >= 0 ? '+' : ''}{selectedStock.change.toFixed(2)} ({selectedStock.changePercent}%)
              </span>
            </div>
          </div>
          
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-xl flex gap-8">
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 uppercase font-bold tracking-tighter mb-1">Market Cap</span>
              <span className="text-lg font-mono text-slate-200">{selectedStock.marketCap}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 uppercase font-bold tracking-tighter mb-1">Volume</span>
              <span className="text-lg font-mono text-slate-200">{selectedStock.volume}</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-8 mb-8">
          <div className="col-span-2 space-y-8">
            <section className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-lg">
              <StockChart stock={selectedStock} />
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></div>
                    <span className="text-[10px] uppercase font-bold text-slate-500">NexusAI Online</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Gemini Market Outlook
                </h3>
                {isAnalyzing ? (
                  <div className="flex flex-col gap-4 py-8 items-center justify-center">
                    <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                    <p className="text-slate-400 text-sm italic">Synthesizing insights...</p>
                  </div>
                ) : aiInsight ? (
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className={`px-4 py-2 rounded-lg font-bold text-sm uppercase ${
                        aiInsight.sentiment === 'Bullish' ? 'bg-emerald-500/20 text-emerald-400' : 
                        aiInsight.sentiment === 'Bearish' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {aiInsight.sentiment}
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-300 leading-relaxed italic text-sm">"{aiInsight.summary}"</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Recommendation</h4>
                        <p className="text-emerald-400 font-bold">{aiInsight.recommendation}</p>
                      </div>
                      <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Key Drivers</h4>
                        <ul className="text-xs text-slate-300 space-y-2">
                          {aiInsight.keyFactors.map((f, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 italic py-4">Select a stock to generate AI analysis.</p>
                )}
              </section>

              <section className="space-y-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 px-2">
                  <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 4v4h4" />
                  </svg>
                  Latest Headlines
                </h3>
                <NewsFeed news={news} isLoading={isNewsLoading} stockSymbol={selectedStock.symbol} />
              </section>
            </div>
          </div>

          <div className="space-y-6">
            {/* TRADE FORM SECTION */}
            <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-rose-500/5 opacity-50"></div>
              
              <div className="relative">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                  <div className="w-2 h-5 bg-emerald-500 rounded-full"></div>
                  Trade Execution
                </h3>

                {/* DISTINCT ORDER TYPE SELECTOR */}
                <div className="grid grid-cols-3 gap-2 mb-4 p-1.5 bg-slate-800/60 rounded-2xl border border-slate-700/50 backdrop-blur-md">
                  {(['MARKET', 'LIMIT', 'STOP_LOSS'] as OrderType[]).map((type) => (
                    <button 
                      key={type}
                      onClick={() => {
                        setOrderType(type);
                        if (type !== 'STOP_LOSS') setIsTrailing(false);
                      }}
                      className={`py-3 px-1 text-[10px] font-bold uppercase rounded-xl transition-all duration-300 flex flex-col items-center justify-center gap-1 ${
                        orderType === type 
                          ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30' 
                          : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/30'
                      }`}
                    >
                      <span className="tracking-tighter">{type.replace('_', ' ')}</span>
                      {orderType === type && <div className="w-1 h-1 bg-slate-950 rounded-full"></div>}
                    </button>
                  ))}
                </div>

                {/* TRAILING TOGGLE & UNIT SELECTOR */}
                {orderType === 'STOP_LOSS' && (
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between px-2 bg-slate-800/30 py-2 rounded-xl border border-slate-700/50">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trailing Stop</span>
                      <button 
                        onClick={() => setIsTrailing(!isTrailing)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${isTrailing ? 'bg-emerald-500' : 'bg-slate-700'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isTrailing ? 'left-6' : 'left-1'}`} />
                      </button>
                    </div>

                    {isTrailing && (
                      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-800/60 rounded-xl border border-slate-700/30 animate-in fade-in slide-in-from-top-1 duration-200">
                        {(['FIXED', 'PERCENT'] as TrailingType[]).map((type) => (
                          <button
                            key={type}
                            onClick={() => setTrailingType(type)}
                            className={`py-1.5 text-[9px] font-bold uppercase rounded-lg transition-all ${
                              trailingType === type 
                                ? 'bg-slate-700 text-amber-400 border border-amber-500/20' 
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            {type === 'FIXED' ? 'Fixed ($)' : 'Percent (%)'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="space-y-6">
                  {orderType !== 'MARKET' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                           <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block whitespace-nowrap">
                             {orderType === 'LIMIT' ? 'Limit Price' : 'Stop Price'}
                           </label>
                           {isTrailing && (
                             <span className="text-[8px] font-bold bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded uppercase tracking-tighter border border-amber-500/20">
                               Trailing {trailingType === 'PERCENT' ? '%' : '$'}
                             </span>
                           )}
                        </div>
                        {/* Live Input Preview Badge */}
                        <div className="bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 flex items-center gap-1.5">
                           <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Target:</span>
                           <span className="text-[10px] font-mono font-bold text-emerald-400">
                             {limitPrice ? (trailingType === 'PERCENT' && isTrailing ? `${limitPrice}%` : `$${parseFloat(limitPrice).toFixed(2)}`) : '--'}
                           </span>
                        </div>
                      </div>
                      <div className="relative group/input">
                        {(!isTrailing || trailingType === 'FIXED') && (
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono group-focus-within/input:text-emerald-400 transition-colors">$</span>
                        )}
                        <input 
                          type="number" 
                          value={limitPrice}
                          onChange={(e) => setLimitPrice(e.target.value)}
                          placeholder={isTrailing ? (trailingType === 'PERCENT' ? "5.00" : "10.00") : selectedStock.price.toFixed(2)}
                          className={`w-full bg-slate-800/80 border border-slate-700 rounded-2xl pr-4 py-4 text-2xl font-mono text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-700 ${(!isTrailing || trailingType === 'FIXED') ? 'pl-8' : 'pl-4'}`}
                        />
                        {isTrailing && trailingType === 'PERCENT' && (
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono group-focus-within/input:text-emerald-400 transition-colors">%</span>
                        )}
                      </div>
                      {isTrailing && (
                        <div className="mt-3 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Initial Stop Price</span>
                            <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          </div>
                          <div className="flex items-baseline gap-2">
                             <span className="text-lg font-mono font-bold text-amber-400">${calculatePreviewStopPrice().toFixed(2)}</span>
                             <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">
                               Dist: {trailingType === 'FIXED' ? `$${parseFloat(limitPrice) || 0}` : `${limitPrice || 0}%`} from market
                             </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Amount (Shares)</label>
                      <div className="flex gap-2">
                        {[0.25, 0.5, 1].map((p) => (
                          <button 
                            key={p}
                            onClick={() => handleQuickAmount(p)}
                            className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-500 text-[9px] font-bold hover:text-emerald-400 transition-colors border border-slate-700/50"
                          >
                            {p === 1 ? 'MAX' : `${p * 100}%`}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input 
                      type="number" 
                      value={tradeAmount}
                      onChange={(e) => setTradeAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl px-4 py-4 text-2xl font-mono text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-700"
                    />
                  </div>

                  <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/30 space-y-3 backdrop-blur-sm">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-slate-500">Value Assessment</span>
                      <span className="text-white font-mono">
                        ${((parseFloat(tradeAmount) || 0) * (orderType !== 'MARKET' ? (isTrailing ? selectedStock.price : parseFloat(limitPrice) || selectedStock.price) : selectedStock.price)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <button 
                      onClick={() => handleTrade('BUY')}
                      disabled={orderType === 'STOP_LOSS'}
                      className={`font-bold py-5 rounded-2xl transition-all active:scale-95 shadow-xl flex flex-col items-center justify-center gap-1 ${
                        orderType === 'STOP_LOSS' 
                          ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700 opacity-50' 
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/10'
                      }`}
                    >
                      <span className="text-[10px] uppercase tracking-widest opacity-70">Long</span>
                      <span className="text-base">{orderType === 'LIMIT' ? 'Limit Buy' : 'Instant Buy'}</span>
                    </button>
                    <button 
                      onClick={() => handleTrade('SELL')}
                      className={`font-bold py-5 rounded-2xl transition-all active:scale-95 shadow-xl flex flex-col items-center justify-center gap-1 ${
                        orderType === 'STOP_LOSS'
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/10'
                          : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/10'
                      }`}
                    >
                      <span className="text-[10px] uppercase tracking-widest opacity-70">Short</span>
                      <span className="text-base">{orderType === 'LIMIT' ? 'Limit Sell' : orderType === 'STOP_LOSS' ? (isTrailing ? 'Trailing Stop' : 'Stop Loss') : 'Instant Sell'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Position in {selectedSymbol}</h3>
              {currentPosition ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-end border-b border-slate-800 pb-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-tighter">Ownership</p>
                      <p className="text-2xl font-mono text-white">{currentPosition.shares} Shares</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-tighter">Cost Basis</p>
                      <p className="text-xl font-mono text-slate-300">${currentPosition.avgPrice.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className={`flex justify-between text-sm`}>
                      <span className="text-slate-500">Unrealized P&L</span>
                      <span className={`font-mono font-bold ${
                        selectedStock.price >= currentPosition.avgPrice ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        ${((selectedStock.price - currentPosition.avgPrice) * currentPosition.shares).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-500 text-sm">No position in {selectedSymbol}.</p>
                </div>
              )}
            </section>

            <PendingOrders 
              orders={portfolio.pendingOrders} 
              onCancel={cancelOrder} 
            />
          </div>
        </div>

        <section className="mb-8">
          <TradeHistory history={portfolio.history} stocks={stocks} />
        </section>
      </main>

      <ConfirmationModal 
        isOpen={pendingTrade !== null}
        onClose={() => setPendingTrade(null)}
        onConfirm={executeTrade}
        tradeInfo={pendingTrade}
      />
    </div>
  );
};

export default App;
