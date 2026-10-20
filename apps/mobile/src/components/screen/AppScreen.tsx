import { ScrollView, StyleSheet, View } from 'react-native';
import type { PropsWithChildren } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '@dahamiz/design-tokens';
import { useTheme } from '../../theme/ThemeProvider';

interface AppScreenProps extends PropsWithChildren {
  padded?: boolean;
}

export function AppScreen({ children, padded = true }: AppScreenProps) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.backgroundBase }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.content, !padded && styles.flush]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Stack({ children }: PropsWithChildren) {
  return <View style={styles.stack}>{children}</View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    paddingBottom: spacing[10],
  },
  flush: { paddingHorizontal: 0 },
  stack: { gap: spacing[4] },
});
