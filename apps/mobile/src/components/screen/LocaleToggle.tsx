import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fontSizes, fontWeights, radii, spacing } from '@dahamiz/design-tokens';
import { useTheme } from '../../theme/ThemeProvider';
import { useLocale } from '../../lib/locale';

export function LocaleToggle() {
  const { colors } = useTheme();
  const { locale, setLocale, t } = useLocale();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={t('languageToggleLabel')}
      style={styles.row}
    >
      {(['tr', 'en'] as const).map((option) => {
        const selected = option === locale;
        return (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => setLocale(option)}
            style={[
              styles.option,
              { backgroundColor: selected ? colors.brandPrimary : colors.backgroundCard },
            ]}
          >
            <Text
              style={[styles.text, { color: selected ? colors.textOnBrand : colors.textSecondary }]}
            >
              {option.toUpperCase()}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  option: {
    minWidth: 42,
    minHeight: 44,
    paddingHorizontal: spacing[2],
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontSize: fontSizes.xs, fontWeight: fontWeights.bold },
});
