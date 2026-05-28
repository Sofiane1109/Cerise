import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { daysUntil } from './store.js';

const isNative = Capacitor.isNativePlatform();

export async function requestNotificationPermission() {
  if (!isNative) return false;
  const { display } = await LocalNotifications.requestPermissions();
  return display === 'granted';
}

export async function scheduleExpiryNotifications(products) {
  if (!isNative) return;

  await LocalNotifications.cancel({ notifications: await getPendingIds() });

  const active = products.filter(p => p.status === 'active');
  const notifications = [];

  for (const p of active) {
    const days = daysUntil(p.expiryDate);

    if (days === 3) {
      notifications.push({
        id: hashId(p.id + '_3'),
        title: `${p.name} expire dans 3 jours`,
        body: `${p.location} · pense à l'utiliser`,
        schedule: { at: morningOf(3) },
        smallIcon: 'ic_stat_icon_config_sample',
      });
    }

    if (days === 1) {
      notifications.push({
        id: hashId(p.id + '_1'),
        title: `${p.name} expire demain`,
        body: `${p.location} · dernière chance !`,
        schedule: { at: morningOf(1) },
        smallIcon: 'ic_stat_icon_config_sample',
      });
    }

    if (days === 0) {
      notifications.push({
        id: hashId(p.id + '_0'),
        title: `${p.name} expire aujourd'hui`,
        body: `${p.location} · mange-le ce soir`,
        schedule: { at: new Date(Date.now() + 5000) },
        smallIcon: 'ic_stat_icon_config_sample',
      });
    }
  }

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications });
  }
}

async function getPendingIds() {
  const { notifications } = await LocalNotifications.getPending();
  return notifications.map(n => ({ id: n.id }));
}

function morningOf(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(9, 0, 0, 0);
  return d;
}

function hashId(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 2147483647;
}
