import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const MOCK_TICKERS = [
  { symbol: 'RELIANCE.NS', price: '2,950.40', change: '+1.2%' },
  { symbol: 'TCS.NS', price: '4,120.00', change: '+0.8%' },
  { symbol: 'HDFCBANK.NS', price: '1,430.50', change: '-0.5%' },
  { symbol: 'INFY.NS', price: '1,650.75', change: '+2.1%' },
  { symbol: 'ICICIBANK.NS', price: '1,050.20', change: '+0.4%' },
  { symbol: 'SBI.NS', price: '750.10', change: '-1.2%' },
  { symbol: 'BAJFINANCE.NS', price: '7,200.00', change: '+1.5%' },
  { symbol: 'ITC.NS', price: '420.30', change: '+0.2%' },
];

export default function TickerTape() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let animationFrameId;
    const scrollTicker = () => {
      setOffset((prev) => {
        const newOffset = prev - 0.5;
        // Reset when the first set of items has scrolled completely out of view
        return newOffset <= -1000 ? 0 : newOffset; 
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
        {/* Render the list twice to create an infinite seamless scrolling effect */}
        {[...MOCK_TICKERS, ...MOCK_TICKERS, ...MOCK_TICKERS].map((ticker, idx) => {
          const isPositive = ticker.change.startsWith('+');
          return (
            <div key={idx} className="flex items-center px-6 gap-2 border-r border-[var(--border-color)]/50">
              <span className="font-bold text-[var(--text-main)] text-sm">{ticker.symbol}</span>
              <span className="text-[var(--text-muted)] text-sm">₹{ticker.price}</span>
              <span className={`flex items-center text-xs font-bold ${isPositive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                {isPositive ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />}
                {ticker.change}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
