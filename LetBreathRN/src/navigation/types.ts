import type { NavigatorScreenParams } from '@react-navigation/native';

/** Bottom-tab routes (Home + Explore). */
export type TabParamList = {
  Home: undefined;
  Explore: undefined;
};

/** Root stack: the tabs, plus the pushed Session and Settings screens. */
export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  Session: undefined;
  Settings: undefined;
};

declare global {
  namespace ReactNavigation {
    // Makes useNavigation() typed app-wide without per-call generics.
    interface RootParamList extends RootStackParamList {}
  }
}
