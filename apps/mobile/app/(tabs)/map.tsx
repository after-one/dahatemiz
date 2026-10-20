import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useFocusEffect } from 'expo-router';
import { CircleAlert, MapPin, RefreshCw, ShieldCheck } from 'lucide-react-native';
import { IncidentCategory, type PublicMapMarker } from '@dahamiz/shared-types';
import { fontSizes, fontWeights, radii, spacing } from '@dahamiz/design-tokens';
import { ActionButton } from '../../src/components/ui/ActionButton';
import { AppScreen, Stack } from '../../src/components/screen/AppScreen';
import { Surface } from '../../src/components/ui/Surface';
import { loadPublicMap } from '../../src/lib/api-client';
import { useLocale } from '../../src/lib/locale';
import { PublicAreaFilter, type PublicAreaFilters } from '../../src/features/map/PublicAreaFilter';
import { useTheme } from '../../src/theme/ThemeProvider';

const categories: readonly (IncidentCategory | 'ALL')[] = [
  'ALL',
  ...Object.values(IncidentCategory),
];

function categoryLabelKey(category: IncidentCategory) {
  switch (category) {
    case IncidentCategory.LITTERING:
      return 'reportCategoryLitter';
    case IncidentCategory.CIGARETTE_BUTTS:
      return 'reportCategoryCigarette';
    case IncidentCategory.ILLEGAL_DUMPING:
      return 'reportCategoryDumping';
    case IncidentCategory.CONSTRUCTION_DEBRIS:
      return 'reportCategoryConstruction';
    case IncidentCategory.VEHICLE_DISCHARGE:
      return 'reportCategoryVehicle';
    case IncidentCategory.OVERFLOWING_WASTE:
      return 'reportCategoryOverflow';
    case IncidentCategory.WATER_POLLUTION:
      return 'reportCategoryWater';
    case IncidentCategory.AIR_POLLUTION:
      return 'reportCategoryAir';
    case IncidentCategory.OTHER:
      return 'reportCategoryOther';
  }
}

export default function MapScreen() {
  const { colors } = useTheme();
  const { t } = useLocale();
  const [markers, setMarkers] = useState<PublicMapMarker[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<IncidentCategory | undefined>();
  const [area, setArea] = useState<PublicAreaFilters>({});
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setHasError(false);
    try {
      const result = await loadPublicMap({
        ...area,
        ...(selectedCategory ? { category: selectedCategory } : {}),
      });
      setMarkers(result.data);
    } catch {
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }, [area, selectedCategory]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <AppScreen>
      <Stack>
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.textPrimary }]}>
            {t('mapTitle')}
          </Text>
          <ShieldCheck size={22} color={colors.brandPrimary} />
        </View>
        <Text style={[styles.body, { color: colors.textSecondary }]}>{t('mapBody')}</Text>
        <View style={styles.filters}>
          {categories.map((category) => {
            const active = category === 'ALL' ? !selectedCategory : selectedCategory === category;
            return (
              <Pressable
                key={category}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setSelectedCategory(category === 'ALL' ? undefined : category)}
                style={[
                  styles.filter,
                  {
                    backgroundColor: active ? colors.brandPrimary : colors.backgroundCard,
                    borderColor: colors.borderDefault,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: active ? colors.textOnBrand : colors.textPrimary },
                  ]}
                >
                  {category === 'ALL' ? t('feedFilterAll') : t(categoryLabelKey(category))}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <PublicAreaFilter onApply={setArea} />

        <View style={styles.mapFrame}>
          <MapView
            accessibilityLabel={t('mapTitle')}
            initialRegion={{ latitude: 39, longitude: 35, latitudeDelta: 8, longitudeDelta: 10 }}
            style={StyleSheet.absoluteFill}
          >
            {markers.map((marker) => (
              <Marker
                key={marker.id}
                coordinate={marker.coordinates}
                title={marker.title}
                description={[marker.location.district, marker.location.city]
                  .filter(Boolean)
                  .join(' · ')}
                pinColor={colors.brandPrimary}
              />
            ))}
          </MapView>
          {loading ? (
            <Surface style={styles.stateCard}>
              <ActivityIndicator color={colors.brandPrimary} />
              <Text style={[styles.stateText, { color: colors.textSecondary }]}>
                {t('mapLoading')}
              </Text>
            </Surface>
          ) : hasError ? (
            <Surface style={styles.stateCard}>
              <CircleAlert size={22} color={colors.statusWarning} />
              <Text style={[styles.stateTitle, { color: colors.textPrimary }]}>
                {t('mapErrorTitle')}
              </Text>
              <Text style={[styles.stateText, { color: colors.textSecondary }]}>
                {t('mapErrorBody')}
              </Text>
              <ActionButton
                label={t('feedRetry')}
                variant="secondary"
                icon={<RefreshCw size={17} color={colors.brandPrimary} />}
                onPress={() => void load()}
              />
            </Surface>
          ) : markers.length === 0 ? (
            <Surface style={styles.stateCard}>
              <MapPin size={22} color={colors.brandPrimary} />
              <Text style={[styles.stateTitle, { color: colors.textPrimary }]}>
                {t('mapEmptyTitle')}
              </Text>
              <Text style={[styles.stateText, { color: colors.textSecondary }]}>
                {t('mapEmptyBody')}
              </Text>
            </Surface>
          ) : null}
        </View>
        <Text style={[styles.privacy, { color: colors.textTertiary }]}>{t('mapApproximate')}</Text>
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: fontSizes['2xl'], fontWeight: fontWeights.bold },
  body: { fontSize: fontSizes.sm, lineHeight: 22 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  filter: {
    minHeight: 44,
    borderRadius: radii.full,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing[3],
  },
  filterText: { fontSize: fontSizes.xs, fontWeight: fontWeights.semibold },
  mapFrame: { height: 450, borderRadius: radii.lg, overflow: 'hidden', backgroundColor: '#e8e4db' },
  stateCard: {
    position: 'absolute',
    left: spacing[4],
    right: spacing[4],
    top: spacing[4],
    alignItems: 'center',
    gap: spacing[2],
  },
  stateTitle: { fontSize: fontSizes.md, fontWeight: fontWeights.bold, textAlign: 'center' },
  stateText: { fontSize: fontSizes.xs, lineHeight: 18, textAlign: 'center' },
  privacy: { fontSize: fontSizes.xs, lineHeight: 18 },
});
