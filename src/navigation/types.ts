import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Auth: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Team: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<MainTabParamList> | undefined;
  Update: undefined;
};