import type { LinkingOptions } from '@react-navigation/native';

import type { RootStackParamList } from './types';

/**
 * Deep-linking map, preserving the app's `letbreath://` scheme.
 * e.g. letbreath://session, letbreath://settings, letbreath://explore
 */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['letbreath://'],
  config: {
    screens: {
      Tabs: {
        screens: {
          Home: '',
          Explore: 'explore',
        },
      },
      Session: 'session',
      Settings: 'settings',
    },
  },
};
