
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StockData, Portfolio, MarketInsight, Position, PendingOrder, OrderSide, OrderType, NewsArticle } from './types';
import { INITIAL_STOCKS, INITIAL_BALANCE } from './constants';
import Sidebar from './components/Sidebar';
import StockChart from './components/StockChart';
import NewsFeed from './components/NewsFeed';
import { getMarketAnalysis, getStockNews } from './services/geminiService';

const App: React.FC = () => {
  const [stocks, setStocks] = useState<StockData[]>(INITIAL_STOCKS);
  const [selectedSymbol, setSelectedSymbol] = useState<string>(INITIAL_STOCKS[0].symbol);
  const [portfolio, setPortfolio] = useState<Portfolio>({
    balance: INITIAL_BALANCE,
    positions: [],
    pendingOrders: []
  });
  const [aiInsight, setAiInsight] = useState<MarketInsight | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState<boolean>(false);
  
  // Form State
  const [tradeAmount, setTradeAmount] = useState<string>("");
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [limitPrice, setLimitPrice] = useState<string>("");

  const selectedStock = stocks.find(s => s.symbol === selectedSymbol) || stocks[0];
  const stocksRef = useRef(stocks);
  stocksRef.current = stocks;

  // Simulate Price Fluctuations and Check Limit Orders
  useEffect(() => {
    const interval = setInterval(() => {
      setStocks(currentStocks => {
        const nextStocks = currentStocks.map(stock => {
          const changeFactor = 1 + (Math.random() - 0.5) * 0.005; // 0.5% max swing
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
        return nextStocks;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Process Limit Orders when stocks change
  useEffect(() => {
    const triggeredOrders: PendingOrder[] = [];
    const remainingOrders: PendingOrder[] = [];

    portfolio.pendingOrders.forEach(order => {
      const stock = stocks.find(s => s.symbol === order.symbol);
      if (!stock) return;

      const isTriggered = 
        (order.side === 'BUY' && stock.price <= order.limitPrice) ||
        (order.side === 'SELL' && stock.price >= order.limitPrice);

      if (isTriggered) {
        triggeredOrders.push(order);
      } else {
        remainingOrders.push(order);
      }
    });

    if (triggeredOrders.length > 0) {
      setPortfolio(prev => {
        let newBalance = prev.balance;
        const newPositions = [...prev.positions];

        triggeredOrders.forEach(order => {
          const stock = stocks.find(s => s.symbol === order.symbol)!;
          const executionPrice = stock.price;
          
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
            const existingIdx = newPositions.findIndex(p => p.symbol === order.symbol);
            if (existingIdx >= 0) {
              newBalance += order.shares * executionPrice;
            }
          }
        });

        return {
          ...prev,
          balance: newBalance,
          positions: newPositions,
          pendingOrders: remainingOrders
        };
      });
    }
  }, [stocks, portfolio.pendingOrders]);

  const fetchStockData = useCallback(async (stock: StockData) => {
    // Fetch Analysis
    setIsAnalyzing(true);
    setAiInsight(null);
    getMarketAnalysis(stock).then(setAiInsight).finally(() => setIsAnalyzing(false));

    // Fetch News
    setIsNewsLoading(true);
    getStockNews(stock).then(setNews).finally(() => setIsNewsLoading(false));
  }, []);

  useEffect(() => {
    fetchStockData(selectedStock);
  }, [selectedSymbol, fetchStockData]);

  const handleTrade = (side: OrderSide) => {
    const shares = parseFloat(tradeAmount);
    const price = orderType === 'LIMIT' ? parseFloat(limitPrice) : selectedStock.price;

    if (isNaN(shares) || shares <= 0) return;
    if (orderType === 'LIMIT' && (isNaN(price) || price <= 0)) return;

    const totalValueAtTarget = shares * price;

    if (side === 'BUY') {
      if (portfolio.balance < totalValueAtTarget) {
        alert("Insufficient balance!");
        return;
      }

      if (orderType === 'MARKET') {
        setPortfolio(prev => {
          const existingIdx = prev.positions.findIndex(p => p.symbol === selectedSymbol);
          const newPositions = [...prev.positions];
          if (existingIdx >= 0) {
            const pos = newPositions[existingIdx];
            const newTotal = pos.shares + shares;
            const newAvg = (pos.avgPrice * pos.shares + totalValueAtTarget) / newTotal;
            newPositions[existingIdx] = { ...pos, shares: newTotal, avgPrice: newAvg };
          } else {
            newPositions.push({ symbol: selectedSymbol, shares, avgPrice: price });
          }
          return { ...prev, balance: prev.balance - totalValueAtTarget, positions: newPositions };
        });
      } else {
        const newOrder: PendingOrder = {
          id: Math.random().toString(36).substr(2, 9),
          symbol: selectedSymbol,
          side: 'BUY',
          type: 'LIMIT',
          shares,
          limitPrice: price,
          timestamp: Date.now()
        };
        setPortfolio(prev => ({
          ...prev,
          balance: prev.balance - totalValueAtTarget,
          pendingOrders: [...prev.pendingOrders, newOrder]
        }));
      }
    } else {
      const existingPos = portfolio.positions.find(p => p.symbol === selectedSymbol);
      if (!existingPos || existingPos.shares < shares) {
        alert("Insufficient shares!");
        return;
      }

      if (orderType === 'MARKET') {
        setPortfolio(prev => {
          const newPositions = prev.positions.map(p => {
            if (p.symbol === selectedSymbol) return { ...p, shares: p.shares - shares };
            return p;
          }).filter(p => p.shares > 0);
          return { ...prev, balance: prev.balance + totalValueAtTarget, positions: newPositions };
        });
      } else {
        const newOrder: PendingOrder = {
          id: Math.random().toString(36).substr(2, 9),
          symbol: selectedSymbol,
          side: 'SELL',
          type: 'LIMIT',
          shares,
          limitPrice: price,
          timestamp: Date.now()
        };
        setPortfolio(prev => {
          const newPositions = prev.positions.map(p => {
            if (p.symbol === selectedSymbol) return { ...p, shares: p.shares - shares };
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
  };

  const cancelOrder = (orderId: string) => {
    setPortfolio(prev => {
      const order = prev.pendingOrders.find(o => o.id === orderId);
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
        pendingOrders: prev.pendingOrders.filter(o => o.id !== orderId)
      };
    });
  };

  const currentPosition = portfolio.positions.find(p => p.symbol === selectedSymbol);
  const totalPortfolioValue = portfolio.balance + portfolio.positions.reduce((acc, pos) => {
    const stock = stocks.find(s => s.symbol === pos.symbol);
    return acc + (pos.shares * (stock?.price || 0));
  }, 0) + portfolio.pendingOrders.reduce((acc, order) => {
    if (order.side === 'BUY') return acc + (order.shares * order.limitPrice);
    const stock = stocks.find(s => s.symbol === order.symbol);
    return acc + (order.shares * (stock?.price || order.limitPrice));
  }, 0);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200">
      <Sidebar 
        stocks={stocks} 
        selectedSymbol={selectedSymbol} 
        onSelectStock={setSelectedSymbol}
        portfolioValue={totalPortfolioValue}
      />

      <main className="flex-1 flex flex-col p-8 overflow-y-auto">
        <header className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{selectedStock.name}</h1>
            <div className="flex items-center gap-4">
              <span className="bg-slate-800 text-slate-300 font-mono px-2 py-1 rounded text-sm font-bold">
                {selectedStock.symbol}
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

        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-8">
            <section className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-white">Price History</h3>
                <div className="flex gap-2">
                  {['1H', '1D', '1W', '1M'].map(t => (
                    <button key={t} className={`px-3 py-1 text-xs rounded-md ${t === '1D' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <StockChart stock={selectedStock} />
            </section>

            {/* Pending Orders Section */}
            {portfolio.pendingOrders.length > 0 && (
              <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-white mb-4">Pending Limit Orders</h3>
                <div className="space-y-2">
                  {portfolio.pendingOrders.map(order => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="flex items-center gap-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${order.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                          {order.side}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-white">{order.symbol} <span className="text-slate-500 font-normal">x {order.shares}</span></p>
                          <p className="text-xs text-slate-400">Target: <span className="font-mono text-slate-200">${order.limitPrice.toFixed(2)}</span></p>
                        </div>
                      </div>
                      <button 
                        onClick={() => cancelOrder(order.id)}
                        className="text-xs text-rose-400 hover:text-rose-300 font-medium px-3 py-1 rounded border border-rose-400/20 hover:bg-rose-400/10 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

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
                    <p className="text-slate-400 text-sm italic">Analyzing technical markers and sentiment data...</p>
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
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Trade {selectedStock.symbol}</h3>
                <div className="flex p-1 bg-slate-800 rounded-lg">
                  <button 
                    onClick={() => setOrderType('MARKET')}
                    className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${orderType === 'MARKET' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Market
                  </button>
                  <button 
                    onClick={() => setOrderType('LIMIT')}
                    className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${orderType === 'LIMIT' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Limit
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {orderType === 'LIMIT' && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Limit Price</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono">$</span>
                      <input 
                        type="number" 
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                        placeholder={selectedStock.price.toFixed(2)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-4 py-3 text-xl font-mono text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Shares</label>
                  <input 
                    type="number" 
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xl font-mono text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>

                <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/30 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Estimated {orderType === 'LIMIT' ? 'Value' : 'Cost'}</span>
                    <span className="text-slate-200 font-mono">
                      ${((parseFloat(tradeAmount) || 0) * (orderType === 'LIMIT' ? (parseFloat(limitPrice) || selectedStock.price) : selectedStock.price)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Available Balance</span>
                    <span className="text-slate-200 font-mono">${portfolio.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <button 
                    onClick={() => handleTrade('BUY')}
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-4 rounded-xl transition-transform active:scale-95 shadow-lg shadow-emerald-500/20"
                  >
                    {orderType === 'LIMIT' ? 'Limit Buy' : 'Buy'}
                  </button>
                  <button 
                    onClick={() => handleTrade('SELL')}
                    className="bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-200 font-bold py-4 rounded-xl transition-all active:scale-95"
                  >
                    {orderType === 'LIMIT' ? 'Limit Sell' : 'Sell'}
                  </button>
                </div>
              </div>
            </section>

            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Your Position</h3>
              {currentPosition ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-end border-b border-slate-800 pb-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-tighter">Shares</p>
                      <p className="text-2xl font-mono text-white">{currentPosition.shares}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-tighter">Avg Price</p>
                      <p className="text-xl font-mono text-slate-300">${currentPosition.avgPrice.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Market Value</span>
                      <span className="text-white font-mono">${(currentPosition.shares * selectedStock.price).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Total Return</span>
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
                  <p className="text-slate-500 text-sm">You don't own any active shares of {selectedStock.symbol}.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
