import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.perim.app',
  appName: "Perim'",
  webDir: 'dist',
  android: {
    buildOptions: {
      keystorePath: undefined,
    },
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#E84A1A',
      sound: 'beep.wav',
    },
  },
};

export default config;
