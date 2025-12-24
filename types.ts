
export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  marketCap: string;
  history: PricePoint[];
}

export interface PricePoint {
  time: string;
  price: number;
}

export interface PortfolioHistoryPoint {
  time: string;
  value: number;
}

export interface Position {
  symbol: string;
  shares: number;
  avgPrice: number;
}

export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP_LOSS';

export interface ExecutedOrder {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  shares: number;
  price: number;
  timestamp: number;
}

export interface PendingOrder {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  shares: number;
  limitPrice: number; // For Stop Loss, this acts as the "Stop Price"
  timestamp: number;
}

export interface Portfolio {
  balance: number;
  positions: Position[];
  pendingOrders: PendingOrder[];
  history: ExecutedOrder[];
}

export interface MarketInsight {
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  summary: string;
  recommendation: string;
  keyFactors: string[];
}

export interface NewsArticle {
  title: string;
  source: string;
  time: string;
  summary: string;
  url: string;
}
