import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import api from '../services/api';

const DEFAULT_TICKERS = [
  { symbol: 'RELIANCE.NS', price: '2,950.40', change: '+1.2%', up: true },
  { symbol: 'TCS.NS', price: '4,120.00', change: '+0.8%', up: true },
  { symbol: 'HDFCBANK.NS', price: '1,430.50', change: '-0.5%', up: false },
  { symbol: 'INFY.NS', price: '1,650.75', change: '+2.1%', up: true },
  { symbol: 'ICICIBANK.NS', price: '1,050.20', change: '+0.4%', up: true },
  { symbol: 'SBI.NS', price: '750.10', change: '-1.2%', up: false },
  { symbol: 'BAJFINANCE.NS', price: '7,200.00', change: '+1.5%', up: true },
  { symbol: 'ITC.NS', price: '420.30', change: '+0.2%', up: true },
];

export default function TickerTape() {
  const [tickers, setTickers] = useState(DEFAULT_TICKERS);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const fetchLivePrices = async () => {
      try {
        const res = await api.post('/stocks/compare', {
          tickers: DEFAULT_TICKERS.map(t => t.symbol)
        });
        
        if (res.data && res.data.stocks) {
          const live = res.data.stocks.map(s => {
            const changePercent = s.change_percent ?? 0;
            const latestPrice = s.current_price ?? (s.price_history_6m?.length > 0 ? s.price_history_6m[s.price_history_6m.length - 1].price : 0);
            return {
              symbol: s.symbol,
              price: latestPrice ? latestPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A',
              change: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
              up: changePercent >= 0
            };
          });
          if (live.length > 0) {
            setTickers(live);
          }
        }
      } catch (e) {
        console.error("Failed to load live marquee prices, using fallbacks:", e);
      }
    };

    fetchLivePrices();
    const interval = setInterval(fetchLivePrices, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let animationFrameId;
    const scrollTicker = () => {
      setOffset((prev) => {
        const newOffset = prev - 0.5;
        // Reset when the first set of items has scrolled completely out of view
        return newOffset <= -1500 ? 0 : newOffset; 
      });
      animationFrameId = requestAnimationFrame(scrollTicker);
    };
    
    animationFrameId = requestAnimationFrame(scrollTicker);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="w-full bg-[var(--bg-card)] border-b border-[var(--border-color)] overflow-hidden h-10 flex items-center relative shadow-sm z-40">
      <div 
        className="flex whitespace-nowrap absolute"
        style={{ transform: `translateX(${offset}px)` }}
      >
        {/* Render the list multiple times to create an infinite seamless scrolling effect */}
        {[...tickers, ...tickers, ...tickers, ...tickers].map((ticker, idx) => {
          return (
            <div key={idx} className="flex items-center px-6 gap-2 border-r border-[var(--border-color)]/50">
              <span className="font-bold text-[var(--text-main)] text-sm">{ticker.symbol.replace('.NS', '')}</span>
              <span className="text-[var(--text-muted)] text-sm">₹{ticker.price}</span>
              <span className={`flex items-center text-xs font-bold ${ticker.up ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                {ticker.up ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />}
                {ticker.change}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
