import { useCallback, useEffect, useRef, useState } from 'react';

type Direction = 'buy' | 'sell';
type OrderType = 'market' | 'limit';

interface QuickOrderBarProps {
  onSubmit?: (order: {
    direction: Direction;
    symbol: string;
    quantity: number;
    price: number | null;
    type: OrderType;
  }) => void;
}

export function QuickOrderBar({ onSubmit }: QuickOrderBarProps) {
  const [direction, setDirection] = useState<Direction>('buy');
  const [symbol, setSymbol] = useState('AAPL');
  const [quantity, setQuantity] = useState(100);
  const [price, setPrice] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [showConfirm, setShowConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(() => {
    if (!symbol.trim()) return;
    setShowConfirm(true);
    setTimeout(() => setShowConfirm(false), 3000);
    onSubmit?.({
      direction,
      symbol: symbol.toUpperCase(),
      quantity,
      price: orderType === 'limit' ? Number(price) : null,
      type: orderType,
    });
  }, [direction, symbol, quantity, price, orderType, onSubmit]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setDirection('buy');
        inputRef.current?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        setDirection('sell');
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      style={{
        position: 'sticky',
        bottom: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 16px',
        background: 'var(--panel)',
        borderTop: '1px solid var(--line)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Direction toggle */}
      <div
        style={{ display: 'flex', gap: '2px', borderRadius: 'var(--radius)', overflow: 'hidden' }}
      >
        <button
          type="button"
          onClick={() => setDirection('buy')}
          style={{
            padding: '6px 14px',
            background: direction === 'buy' ? 'var(--buy)' : 'transparent',
            color: direction === 'buy' ? 'var(--on-buy)' : 'var(--muted)',
            border: 'none',
            fontFamily: 'var(--font-ui)',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            cursor: 'pointer',
          }}
        >
          Buy
        </button>
        <button
          type="button"
          onClick={() => setDirection('sell')}
          style={{
            padding: '6px 14px',
            background: direction === 'sell' ? 'var(--sell)' : 'transparent',
            color: direction === 'sell' ? 'var(--on-sell)' : 'var(--muted)',
            border: 'none',
            fontFamily: 'var(--font-ui)',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            cursor: 'pointer',
          }}
        >
          Sell
        </button>
      </div>

      {/* Symbol input */}
      <input
        ref={inputRef}
        type="text"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
        placeholder="Symbol"
        style={{
          width: '80px',
          padding: '6px 10px',
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius)',
          color: 'var(--text)',
          fontFamily: 'var(--font-data)',
          fontSize: '13px',
          fontWeight: 700,
          textAlign: 'center',
          outline: 'none',
        }}
      />

      {/* Quantity */}
      <input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        min={1}
        style={{
          width: '70px',
          padding: '6px 10px',
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius)',
          color: 'var(--text)',
          fontFamily: 'var(--font-data)',
          fontSize: '13px',
          textAlign: 'center',
          outline: 'none',
        }}
      />

      {/* Order type toggle */}
      <button
        type="button"
        onClick={() => setOrderType(orderType === 'market' ? 'limit' : 'market')}
        style={{
          padding: '6px 10px',
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius)',
          color: 'var(--muted)',
          fontFamily: 'var(--font-ui)',
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        {orderType === 'market' ? 'MKT' : 'LMT'}
      </button>

      {/* Price (limit only) */}
      {orderType === 'limit' && (
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price"
          step="0.01"
          style={{
            width: '80px',
            padding: '6px 10px',
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius)',
            color: 'var(--text)',
            fontFamily: 'var(--font-data)',
            fontSize: '13px',
            textAlign: 'center',
            outline: 'none',
          }}
        />
      )}

      {/* Submit button */}
      <button
        type="button"
        onClick={handleSubmit}
        style={{
          padding: '6px 20px',
          background: direction === 'buy' ? 'var(--buy)' : 'var(--sell)',
          color: direction === 'buy' ? 'var(--on-buy)' : 'var(--on-sell)',
          border: 'none',
          borderRadius: 'var(--radius)',
          fontFamily: 'var(--font-ui)',
          fontSize: '12px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          cursor: 'pointer',
          marginLeft: 'auto',
        }}
      >
        {direction === 'buy' ? 'Buy' : 'Sell'} {symbol}
      </button>

      {/* Confirmation toast */}
      {showConfirm && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            right: '16px',
            marginBottom: '8px',
            padding: '10px 16px',
            background: 'var(--panel-2)',
            border: '1px solid var(--line-strong)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow-lg)',
            fontFamily: 'var(--font-data)',
            fontSize: '12px',
            color: 'var(--text)',
            animation: 'slideUp 200ms ease',
          }}
        >
          {direction.toUpperCase()} {quantity} {symbol}{' '}
          {orderType === 'limit' ? `@ ${price}` : 'at market'}
        </div>
      )}
    </div>
  );
}
