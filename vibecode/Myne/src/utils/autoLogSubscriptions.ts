import { getItem, setItem } from './storage';
import { today, uid, addDays, addMonths, addYears } from './helpers';
import type { Subscription, BudgetEntry } from '../types';

function getNextRenewal(sub: Subscription): string {
  const todayStr = today();
  let next = sub.startDate;
  let iterations = 0;
  while (next <= todayStr && iterations < 1000) {
    iterations++;
    if (sub.frequency === 'monthly')          next = addMonths(next, 1);
    else if (sub.frequency === 'every4weeks') next = addDays(next, 28);
    else if (sub.frequency === 'yearly')      next = addYears(next, 1);
    else                                       next = addDays(next, sub.customDays ?? 30);
  }
  return next;
}

export function autoLogSubscriptions(): void {
  const todayStr = today();
  const subs     = getItem<Subscription[]>('myne:subscriptions', []);
  if (subs.length === 0) return;

  // Track which subs were already auto-logged on which date
  const logged   = getItem<Record<string, string>>('myne:budget:sublogs', {});
  const newEntries: BudgetEntry[] = [];
  const updatedLogged = { ...logged };

  for (const sub of subs) {
    const renewal = getNextRenewal(sub);
    if (renewal === todayStr && logged[sub.id] !== todayStr) {
      newEntries.push({
        id:          uid(),
        accountId:   'cc',
        type:        'expense',
        amount:      sub.amount,
        category:    'services',
        description: `${sub.emoji ?? '💳'} ${sub.name}`,
        date:        todayStr,
      });
      updatedLogged[sub.id] = todayStr;
    }
  }

  if (newEntries.length > 0) {
    const entries = getItem<BudgetEntry[]>('myne:budget:entries', []).map(
      (e: any) => ({ ...e, accountId: e.accountId ?? 'cc' })
    );
    setItem('myne:budget:entries', [...newEntries, ...entries]);
    setItem('myne:budget:sublogs', updatedLogged);
  }
}
