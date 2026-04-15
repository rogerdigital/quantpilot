import type { AppLocale } from '@shared-types/trading.ts';
import type { BrokerOrder } from '@shared-types/trading.ts';
import { useState } from 'react';
import {
  approveBtn,
  drawerBody,
  drawerCount,
  drawerDismiss,
  drawerDot,
  drawerHead,
  drawerPanel,
  drawerRoot,
  drawerTitle,
  orderActions,
  orderCard,
  orderDetail,
  orderMeta,
  orderSideBuy,
  orderSideSell,
  orderSymbol,
  rejectBtn,
} from './ApprovalDrawer.css.ts';

type Props = {
  locale: AppLocale;
  queue: BrokerOrder[];
  onApprove: (clientOrderId: string) => void;
  onReject: (clientOrderId: string) => void;
};

const copy = {
  zh: {
    title: '待审批实盘订单',
    approve: '批准',
    reject: '拒绝',
    dismiss: '稍后处理',
    qty: (qty: number) => `${qty} 股`,
  },
  en: {
    title: 'Pending Live Orders',
    approve: 'Approve',
    reject: 'Reject',
    dismiss: 'Later',
    qty: (qty: number) => `${qty} shares`,
  },
};

export function ApprovalDrawer({ locale, queue, onApprove, onReject }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const t = copy[locale];

  if (queue.length === 0 || dismissed) return null;

  return (
    <div className={drawerRoot}>
      <div className={drawerPanel}>
        <div className={drawerHead}>
          <div className={drawerTitle}>
            <span className={drawerDot} />
            {t.title}
            <span className={drawerCount}>{queue.length}</span>
          </div>
          <button type="button" className={drawerDismiss} onClick={() => setDismissed(true)}>
            {t.dismiss}
          </button>
        </div>

        <div className={drawerBody}>
          {queue.map((order) => {
            const key = order.clientOrderId ?? order.id ?? `${order.symbol}-${order.side}`;
            const isBuy = order.side?.toUpperCase() === 'BUY';

            return (
              <div key={key} className={orderCard}>
                <div className={orderMeta}>
                  <div className={orderSymbol}>{order.symbol}</div>
                  <div className={orderDetail}>
                    <span className={isBuy ? orderSideBuy : orderSideSell}>
                      {order.side?.toUpperCase()}
                    </span>
                    {' · '}
                    {t.qty(order.qty)}
                    {order.account ? ` · ${order.account}` : ''}
                  </div>
                </div>
                <div className={orderActions}>
                  <button type="button" className={approveBtn} onClick={() => onApprove(key)}>
                    {t.approve}
                  </button>
                  <button type="button" className={rejectBtn} onClick={() => onReject(key)}>
                    {t.reject}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
