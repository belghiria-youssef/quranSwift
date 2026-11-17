import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/core/theme/colors';
import { fonts } from '@/core/theme/fonts';
import { MainTabParamList } from '@/navigation/types';
import { HomeScreen } from '@/presentation/screens/HomeScreen';
import { ProfileScreen } from '@/presentation/screens/ProfileScreen';
import { TeamScreen } from '@/presentation/screens/TeamScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

type IconName = 'home' | 'team' | 'profile';

function TabIcon({ name, on }: { name: IconName; on: boolean }) {
  const color = on ? colors.gold : colors.mute;
  const stroke = { stroke: color, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };

  return (
    <>
      {name === 'home' ? (
        <Svg width={24} height={24} viewBox="0 0 24 24">
          <Path {...stroke} d="M4 11l8-7 8 7v9H4z" />
        </Svg>
      ) : name === 'team' ? (
        <Svg width={24} height={24} viewBox="0 0 24 24">
          <Circle {...stroke} cx={9} cy={8} r={3} />
          <Circle {...stroke} cx={17} cy={9} r={2.4} />
          <Path {...stroke} d="M3 20c0-3.5 3-6 6-6s6 2.5 6 6" />
          <Path {...stroke} d="M15 14.5c3 0 6 2 6 5.5" />
        </Svg>
      ) : (
        <Svg width={24} height={24} viewBox="0 0 24 24">
          <Circle {...stroke} cx={12} cy={8} r={4} />
          <Path {...stroke} d="M4 21c0-4.5 3.5-7 8-7s8 2.5 8 7" />
        </Svg>
      )}
    </>
  );
}

export function TabNavigator() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'none',
        tabBarStyle: [
          styles.bar,
          { height: 60 + insets.bottom, paddingTop: 6, paddingBottom: insets.bottom + 6 },
        ],
        tabBarActiveTintColor: colors.em,
        tabBarInactiveTintColor: colors.mute,
        tabBarLabelStyle: styles.label,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'الرئيسية',
          tabBarIcon: ({ focused }) => <TabIcon name="home" on={focused} />,
        }}
      />
      <Tab.Screen
        name="Team"
        component={TeamScreen}
        options={{
          tabBarLabel: 'فريقي',
          tabBarIcon: ({ focused }) => <TabIcon name="team" on={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'حسابي',
          tabBarIcon: ({ focused }) => <TabIcon name="profile" on={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.paper,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    paddingTop: 4,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
});