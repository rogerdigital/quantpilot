import type { BrokerOrder, BrokerPositionSnapshot } from '@shared-types/trading.ts';
import { useTradingSystem } from '../../store/trading-system/TradingSystemProvider.tsx';
import { copy, useLocale } from '../../modules/console/console.i18n.tsx';
import {
  fmtCurrency,
  fmtDateTime,
  fmtPct,
  rowsForPositions,
  statusClass,
  translateActionText,
  translateOrderStatus,
  translateRuntimeText,
  translateSignal,
  translateSide,
} from '../../modules/console/console.utils.ts';

export function UniverseTable() {
  const { state } = useTradingSystem();
  const { locale } = useLocale();
  const rows = state.stockStates.slice().sort((a, b) => b.score - a.score);

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>{copy[locale].terms.symbol}</th><th>{copy[locale].terms.price}</th><th>{copy[locale].terms.change}</th><th>{copy[locale].labels.score}</th><th>{copy[locale].terms.signal}</th><th>{copy[locale].terms.action}</th></tr>
        </thead>
        <tbody>
          {rows.map((stock) => {
            const pct = (stock.price / stock.prevClose - 1) * 100;
            return (
              <tr key={stock.symbol}>
                <td><div className="symbol-cell"><strong>{stock.symbol}</strong><span>{stock.name}</span></div></td>
                <td>{stock.price.toFixed(2)}</td>
                <td className={pct >= 0 ? 'text-up' : 'text-down'}>{fmtPct(pct)}</td>
                <td>{stock.score.toFixed(1)}</td>
                <td><span className={`signal-chip signal-${stock.signal.toLowerCase()}`}>{translateSignal(locale, stock.signal)}</span></td>
                <td>{translateActionText(locale, stock.actionText)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function PositionsTable({ accountKey }: { accountKey: 'paper' | 'live' }) {
  const { state } = useTradingSystem();
  const { locale } = useLocale();
  const rows = rowsForPositions(state.accounts[accountKey], state.stockStates);

  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>{copy[locale].terms.symbol}</th><th>{copy[locale].labels.positions}</th><th>{copy[locale].terms.avgCost}</th><th>{copy[locale].terms.marketValue}</th><th>{copy[locale].terms.unrealizedPnl}</th></tr></thead>
        <tbody>
          {rows.length ? rows.map((row) => (
            <tr key={`${accountKey}-${row.symbol}`}>
              <td><div className="symbol-cell"><strong>{row.symbol}</strong><span>{row.name}</span></div></td>
              <td>{row.shares}</td>
              <td>{row.avgCost.toFixed(2)}</td>
              <td>{fmtCurrency(row.marketValue)}</td>
              <td className={row.pnl >= 0 ? 'text-up' : 'text-down'}>{fmtCurrency(row.pnl)}</td>
            </tr>
          )) : <tr><td colSpan={5} className="empty-cell">{copy[locale].terms.noPositions}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export function BrokerSnapshotPositionsTable({ positions }: { positions: BrokerPositionSnapshot[] }) {
  const { locale } = useLocale();
  const rows = positions
    .slice()
    .sort((a, b) => Number(b.marketValue || 0) - Number(a.marketValue || 0));

  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>{copy[locale].terms.symbol}</th><th>{copy[locale].labels.positions}</th><th>{copy[locale].terms.avgCost}</th><th>{copy[locale].terms.marketValue}</th><th>{locale === 'zh' ? '来源' : 'Source'}</th></tr></thead>
        <tbody>
          {rows.length ? rows.map((row) => (
            <tr key={`broker-${row.symbol}`}>
              <td><div className="symbol-cell"><strong>{row.symbol}</strong><span>{locale === 'zh' ? '后端快照' : 'Backend snapshot'}</span></div></td>
              <td>{row.qty}</td>
              <td>{row.avgCost.toFixed(2)}</td>
              <td>{fmtCurrency(Number(row.marketValue || row.qty * row.avgCost || 0))}</td>
              <td><span className="table-note">{locale === 'zh' ? 'broker' : 'broker'}</span></td>
            </tr>
          )) : <tr><td colSpan={5} className="empty-cell">{copy[locale].terms.noPositions}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export function OrdersTable({ accountKey }: { accountKey: 'paper' | 'live' }) {
  const { state, cancelLiveOrder } = useTradingSystem();
  const { locale } = useLocale();
  const rows: BrokerOrder[] = state.accounts[accountKey].orders.slice(0, 12);

  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>{copy[locale].terms.side}</th><th>{copy[locale].terms.symbol}</th><th>{copy[locale].terms.qty}</th><th>{copy[locale].terms.fill}</th><th>{copy[locale].labels.status}</th><th>{copy[locale].terms.time}</th><th>{copy[locale].terms.action}</th></tr></thead>
        <tbody>
          {rows.length ? rows.map((order, index) => (
            <tr key={`${accountKey}-${order.symbol}-${order.side}-${index}`}>
              <td className={order.side === 'BUY' ? 'text-up' : 'text-down'}>{translateSide(locale, order.side)}</td>
              <td>{order.symbol}</td>
              <td>{order.qty}</td>
              <td>{order.filledQty || 0} @ {(order.filledAvgPrice || order.price || 0).toFixed(2)}</td>
              <td><span className={`order-status ${statusClass(order.status)}`}>{translateOrderStatus(locale, order.status)}</span></td>
              <td>{fmtDateTime(order.updatedAt || order.submittedAt, locale)}</td>
              <td>
                {accountKey === 'live' && order.cancelable ? (
                  <button type="button" className="inline-action" onClick={() => cancelLiveOrder(order.id || '')}>{copy[locale].terms.cancel}</button>
                ) : (
                  <span className="table-note">{order.tag || order.source || '--'}</span>
                )}
              </td>
            </tr>
          )) : <tr><td colSpan={7} className="empty-cell">{copy[locale].terms.noFills}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export function ApprovalQueueTable({ onApprove, onReject }: { onApprove: (clientOrderId: string) => void; onReject: (clientOrderId: string) => void }) {
  const { state } = useTradingSystem();
  const { locale } = useLocale();
  const rows: BrokerOrder[] = state.approvalQueue.slice(0, 12);

  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>{copy[locale].terms.side}</th><th>{copy[locale].terms.symbol}</th><th>{copy[locale].terms.qty}</th><th>{copy[locale].terms.fill}</th><th>{copy[locale].labels.status}</th><th>{copy[locale].terms.time}</th><th>{copy[locale].terms.action}</th></tr></thead>
        <tbody>
          {rows.length ? rows.map((order, index) => (
            <tr key={`${order.clientOrderId || order.symbol}-${index}`}>
              <td className={order.side === 'BUY' ? 'text-up' : 'text-down'}>{translateSide(locale, order.side)}</td>
              <td>{order.symbol}</td>
              <td>{order.qty}</td>
              <td>0 @ {(order.price || 0).toFixed(2)}</td>
              <td><span className="order-status order-status-open">{locale === 'zh' ? '待审批' : 'Pending'}</span></td>
              <td>{fmtDateTime(order.updatedAt || order.submittedAt, locale)}</td>
              <td className="action-group">
                <button type="button" className="inline-action inline-action-approve" onClick={() => onApprove(order.clientOrderId || '')}>{copy[locale].terms.approve}</button>
                <button type="button" className="inline-action" onClick={() => onReject(order.clientOrderId || '')}>{copy[locale].terms.reject}</button>
              </td>
            </tr>
          )) : <tr><td colSpan={7} className="empty-cell">{locale === 'zh' ? '当前没有待审批实盘订单' : 'No live orders are waiting for approval'}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export function ActivityLog() {
  const { state } = useTradingSystem();
  const { locale } = useLocale();

  return (
    <div className="log-list">
      {state.activityLog.map((entry, index) => (
        <div className="log-item" key={`${entry.time}-${index}`}>
          <div className="log-time">{entry.time}</div>
          <div className="log-main">
            <div className="log-title">{translateRuntimeText(locale, entry.title)}</div>
            <div className="log-copy">{translateRuntimeText(locale, entry.copy)}</div>
          </div>
          <div className={`log-tag ${entry.kind}`}>{entry.kind.toUpperCase()}</div>
        </div>
      ))}
    </div>
  );
}
