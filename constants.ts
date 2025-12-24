
import { StockData } from './types';

const generateHistory = (basePrice: number) => {
  const history = [];
  let currentPrice = basePrice;
  const now = new Date();
  for (let i = 24; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 3600000);
    currentPrice = currentPrice * (1 + (Math.random() - 0.5) * 0.02);
    history.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      price: parseFloat(currentPrice.toFixed(2))
    });
  }
  return history;
};

export const INITIAL_STOCKS: StockData[] = [
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    price: 132.50,
    change: 4.25,
    changePercent: 3.2,
    volume: '42M',
    marketCap: '3.2T',
    history: generateHistory(132.50)
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 228.12,
    change: -1.45,
    changePercent: -0.63,
    volume: '58M',
    marketCap: '3.5T',
    history: generateHistory(228.12)
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    price: 242.10,
    change: 12.45,
    changePercent: 5.42,
    volume: '89M',
    marketCap: '760B',
    history: generateHistory(242.10)
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    price: 415.30,
    change: 2.10,
    changePercent: 0.51,
    volume: '22M',
    marketCap: '3.1T',
    history: generateHistory(415.30)
  },
  {
    symbol: 'AMD',
    name: 'Advanced Micro Devices',
    price: 165.40,
    change: 5.80,
    changePercent: 3.63,
    volume: '35M',
    marketCap: '267B',
    history: generateHistory(165.40)
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    price: 178.45,
    change: -0.85,
    changePercent: -0.47,
    volume: '19M',
    marketCap: '2.2T',
    history: generateHistory(178.45)
  }
];

export const INITIAL_BALANCE = 100000;
