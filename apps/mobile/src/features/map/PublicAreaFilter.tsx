import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { fontSizes, radii, spacing } from '@dahamiz/design-tokens';
import { ActionButton } from '../../components/ui/ActionButton';
import { useLocale } from '../../lib/locale';
import { useTheme } from '../../theme/ThemeProvider';

export interface PublicAreaFilters {
  city?: string;
  district?: string;
}

export function PublicAreaFilter({ onApply }: { onApply: (filters: PublicAreaFilters) => void }) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');

  return (
    <View style={styles.container}>
      <View style={styles.fields}>
        <TextInput
          accessibilityLabel={t('feedCity')}
          autoCapitalize="words"
          maxLength={120}
          onChangeText={setCity}
          placeholder={t('feedCity')}
          placeholderTextColor={colors.textTertiary}
          returnKeyType="next"
          style={[styles.input, { color: colors.textPrimary, borderColor: colors.borderDefault }]}
          value={city}
        />
        <TextInput
          accessibilityLabel={t('feedDistrict')}
          autoCapitalize="words"
          maxLength={120}
          onChangeText={setDistrict}
          placeholder={t('feedDistrict')}
          placeholderTextColor={colors.textTertiary}
          returnKeyType="done"
          style={[styles.input, { color: colors.textPrimary, borderColor: colors.borderDefault }]}
          value={district}
        />
      </View>
      <ActionButton
        label={t('feedAreaApply')}
        variant="secondary"
        onPress={() =>
          onApply({
            ...(city.trim() ? { city: city.trim() } : {}),
            ...(district.trim() ? { district: district.trim() } : {}),
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing[2] },
  fields: { flexDirection: 'row', gap: spacing[2] },
  input: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing[3],
    fontSize: fontSizes.sm,
  },
});
