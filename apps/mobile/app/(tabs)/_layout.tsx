import { Tabs } from 'expo-router';
import { Compass, House, Map, UserRound, UsersRound } from 'lucide-react-native';
import { fontSizes, fontWeights, spacing } from '@dahamiz/design-tokens';
import { useLocale } from '../../src/lib/locale';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function TabsLayout() {
  const { colors } = useTheme();
  const { t } = useLocale();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          height: 82,
          paddingTop: spacing[2],
          paddingBottom: spacing[5],
          backgroundColor: colors.backgroundElevated,
          borderTopColor: colors.borderDefault,
        },
        tabBarLabelStyle: { fontSize: fontSizes.xs, fontWeight: fontWeights.semibold },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('tabHome'),
          tabBarIcon: ({ color, size }) => <House color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: t('tabMap'),
          tabBarIcon: ({ color, size }) => <Map color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: t('tabReport'),
          tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="challenges"
        options={{
          title: t('tabChallenges'),
          tabBarIcon: ({ color, size }) => <UsersRound color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabProfile'),
          tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
