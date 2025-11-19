import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hereornot.app',
  appName: 'Here Or Not',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;
