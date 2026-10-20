import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { IncidentCategory } from '@dahamiz/shared-types';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Circle,
  ImagePlus,
  LockKeyhole,
  MapPin,
  X,
} from 'lucide-react-native';
import { fontSizes, fontWeights, radii, spacing } from '@dahamiz/design-tokens';
import { AppScreen, Stack } from '../src/components/screen/AppScreen';
import { ActionButton } from '../src/components/ui/ActionButton';
import { Surface } from '../src/components/ui/Surface';
import { MascotSlot } from '../src/features/brand/MascotSlot';
import {
  clearReportDraft,
  emptyReportDraft,
  loadReportDraft,
  saveDemoReportRecord,
  saveReportDraft,
  type ReportDraft,
  type ReportEvidence,
} from '../src/features/reports/report-storage';
import { ReportLocationMap } from '../src/features/reports/ReportLocationMap';
import { useLocale, type TranslationKey } from '../src/lib/locale';
import { useTheme } from '../src/theme/ThemeProvider';

const categories: { value: IncidentCategory; label: TranslationKey }[] = [
  { value: IncidentCategory.LITTERING, label: 'reportCategoryLitter' },
  { value: IncidentCategory.CIGARETTE_BUTTS, label: 'reportCategoryCigarette' },
  { value: IncidentCategory.ILLEGAL_DUMPING, label: 'reportCategoryDumping' },
  { value: IncidentCategory.CONSTRUCTION_DEBRIS, label: 'reportCategoryConstruction' },
  { value: IncidentCategory.VEHICLE_DISCHARGE, label: 'reportCategoryVehicle' },
  { value: IncidentCategory.OVERFLOWING_WASTE, label: 'reportCategoryOverflow' },
  { value: IncidentCategory.WATER_POLLUTION, label: 'reportCategoryWater' },
  { value: IncidentCategory.AIR_POLLUTION, label: 'reportCategoryAir' },
  { value: IncidentCategory.OTHER, label: 'reportCategoryOther' },
];

const stepLabels: TranslationKey[] = [
  'reportStepMedia',
  'reportStepCategory',
  'reportStepDetails',
  'reportStepReview',
];

export default function ReportFlowScreen() {
  const { colors } = useTheme();
  const { t } = useLocale();
  const [draft, setDraft] = useState<ReportDraft>(emptyReportDraft);
  const [step, setStep] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [simulateFailure, setSimulateFailure] = useState(false);

  useEffect(() => {
    let active = true;
    void loadReportDraft()
      .then((savedDraft) => {
        if (active && savedDraft) setDraft(savedDraft);
      })
      .catch(() => {
        if (active) setError(t('reportDraftLoadError'));
      })
      .finally(() => {
        if (active) setHydrated(true);
      });
    return () => {
      active = false;
    };
  }, [t]);

  useEffect(() => {
    if (!hydrated || completed) return;
    setSaving(true);
    const timeout = setTimeout(() => {
      void saveReportDraft({ ...draft, updatedAt: new Date().toISOString() })
        .then(() => setError(''))
        .catch(() => setError(t('reportSubmitError')))
        .finally(() => setSaving(false));
    }, 400);
    return () => clearTimeout(timeout);
  }, [completed, draft, hydrated, t]);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.value === draft.category),
    [draft.category],
  );
  const canContinue =
    step === 0
      ? draft.evidence.length > 0
      : step === 1
        ? draft.category !== null
        : step === 2
          ? !draft.eventDate || isValidTurkishDate(draft.eventDate)
          : true;

  const updateDraft = useCallback((changes: Partial<ReportDraft>) => {
    setDraft((current) => ({ ...current, ...changes, updatedAt: new Date().toISOString() }));
    setError('');
  }, []);

  async function addFromLibrary() {
    setError('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsMultipleSelection: true,
        selectionLimit: 3,
        quality: 0.8,
      });
      if (result.canceled) return;
      const files: ReportEvidence[] = result.assets.map((asset) => ({
        uri: asset.uri,
        type: asset.type === 'video' ? 'video' : 'image',
        fileName: asset.fileName ?? null,
      }));
      updateDraft({ evidence: [...draft.evidence, ...files].slice(0, 3) });
    } catch {
      setError(t('reportMediaError'));
    }
  }

  async function takePhoto() {
    setError('');
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setError(t('reportCameraDenied'));
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset) return;
      updateDraft({
        evidence: [
          ...draft.evidence,
          { uri: asset.uri, type: 'image' as const, fileName: asset.fileName ?? null },
        ].slice(0, 3),
      });
    } catch {
      setError(t('reportMediaError'));
    }
  }

  async function addCurrentLocation() {
    setBusy(true);
    setError('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setError(t('reportLocationDenied'));
        return;
      }
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      updateDraft({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });
    } catch {
      setError(t('reportLocationDenied'));
    } finally {
      setBusy(false);
    }
  }

  async function submitDemo() {
    if (!draft.category || !draft.consent) return;
    setBusy(true);
    setError('');
    try {
      await saveReportDraft(draft);
      await new Promise<void>((resolve) => setTimeout(resolve, 650));
      if (simulateFailure) {
        setError(t('reportSubmitError'));
        return;
      }
      await saveDemoReportRecord({
        id: `DEMO-${Date.now().toString(36).toUpperCase()}`,
        category: draft.category,
        createdAt: new Date().toISOString(),
        status: 'DEMO_RECEIVED',
      });
      await clearReportDraft();
      setCompleted(true);
      setStep(4);
    } catch {
      setError(t('reportSubmitError'));
    } finally {
      setBusy(false);
    }
  }

  function exitFlow() {
    router.back();
  }

  async function saveDraftAndExit() {
    setBusy(true);
    setError('');
    try {
      await saveReportDraft({ ...draft, updatedAt: new Date().toISOString() });
      router.back();
    } catch {
      setError(t('reportSubmitError'));
    } finally {
      setBusy(false);
    }
  }

  if (!hydrated) {
    return (
      <AppScreen>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.brandPrimary} />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <Stack>
        <View style={styles.topRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('navBack')}
            onPress={exitFlow}
            style={styles.backButton}
          >
            <ArrowLeft size={20} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.topCopy}>
            <Text style={[styles.eyebrow, { color: colors.brandPrimary }]}>
              {t('authDemoLabel')}
            </Text>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.textPrimary }]}>
              {step === 4 ? t('reportSuccessTitle') : t('reportFlowTitle')}
            </Text>
          </View>
        </View>

        {step < 4 ? (
          <View style={styles.progressRow} accessibilityLabel={`${step + 1}/4`}>
            {stepLabels.map((label, index) => (
              <View key={label} style={styles.progressItem}>
                <View
                  style={[
                    styles.progressDot,
                    { backgroundColor: index <= step ? colors.brandPrimary : colors.borderDefault },
                  ]}
                />
                <Text
                  style={[
                    styles.progressLabel,
                    { color: index <= step ? colors.textPrimary : colors.textTertiary },
                  ]}
                >
                  {t(label)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {step === 0 ? (
          <Stack>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t('reportStepMedia')}
            </Text>
            <Surface style={[styles.mediaBox, { backgroundColor: colors.brandHero }]}>
              {draft.evidence.length > 0 ? (
                <View style={styles.mediaGrid}>
                  {draft.evidence.map((asset, index) => (
                    <View key={`${asset.uri}-${index}`} style={styles.mediaItem}>
                      {asset.type === 'image' ? (
                        <Image source={{ uri: asset.uri }} style={styles.preview} />
                      ) : (
                        <View style={[styles.preview, styles.videoPreview]}>
                          <Text style={[styles.videoLabel, { color: colors.textOnBrand }]}>
                            VIDEO
                          </Text>
                        </View>
                      )}
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t('reportRemoveMedia')}
                        onPress={() =>
                          updateDraft({ evidence: draft.evidence.filter((_, i) => i !== index) })
                        }
                        style={[
                          styles.removeButton,
                          { backgroundColor: colors.backgroundElevated },
                        ]}
                      >
                        <X size={15} color={colors.textPrimary} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.mediaEmpty}>
                  <ImagePlus size={32} color={colors.brandPrimary} />
                  <Text style={[styles.muted, { color: colors.textSecondary }]}>
                    {t('reportMediaEmpty')}
                  </Text>
                </View>
              )}
            </Surface>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              {t('reportMediaHint')}
            </Text>
            <ActionButton
              label={t('reportChooseMedia')}
              variant="secondary"
              icon={<ImagePlus size={18} color={colors.brandPrimary} />}
              onPress={() => void addFromLibrary()}
            />
            <ActionButton
              label={t('reportTakePhoto')}
              variant="quiet"
              icon={<Circle size={18} color={colors.brandPrimary} />}
              onPress={() => void takePhoto()}
            />
            {draft.evidence.length ? (
              <Text style={[styles.hint, { color: colors.textSecondary }]}>
                {t('reportMediaCount', { count: String(draft.evidence.length) })}
              </Text>
            ) : null}
          </Stack>
        ) : null}

        {step === 1 ? (
          <Stack>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t('reportCategoryPrompt')}
            </Text>
            <View style={styles.categoryGrid}>
              {categories.map((category) => {
                const selected = draft.category === category.value;
                return (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    key={category.value}
                    onPress={() => updateDraft({ category: category.value })}
                    style={[
                      styles.categoryItem,
                      {
                        backgroundColor: selected
                          ? colors.statusSuccessBackground
                          : colors.backgroundCard,
                        borderColor: selected ? colors.brandPrimary : colors.borderDefault,
                      },
                    ]}
                  >
                    <Text style={[styles.categoryText, { color: colors.textPrimary }]}>
                      {t(category.label)}
                    </Text>
                    {selected ? <Check size={18} color={colors.brandPrimary} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </Stack>
        ) : null}

        {step === 2 ? (
          <Stack>
            <Surface style={styles.locationCard}>
              <View style={styles.inlineIcon}>
                <MapPin size={20} color={colors.brandPrimary} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  {t('reportLocationTitle')}
                </Text>
              </View>
              <Text style={[styles.muted, { color: colors.textSecondary }]}>
                {t('reportLocationBody')}
              </Text>
              <Text style={[styles.hint, { color: colors.textSecondary }]}>
                {t('reportMapPinHint')}
              </Text>
              <ReportLocationMap
                latitude={draft.latitude}
                longitude={draft.longitude}
                onSelect={(latitude, longitude) => updateDraft({ latitude, longitude })}
                accessibilityLabel={t('reportMapPinLabel')}
                pinTitle={t('reportLocationAdded')}
                pinDescription={t('reportMapPinHint')}
                pinColor={colors.brandPrimary}
                backgroundColor={colors.backgroundElevated}
              />
              <ActionButton
                label={t('reportUseLocation')}
                variant="secondary"
                onPress={() => void addCurrentLocation()}
                disabled={busy}
              />
              {draft.latitude !== null ? (
                <ActionButton
                  label={t('reportLocationClear')}
                  variant="quiet"
                  onPress={() => updateDraft({ latitude: null, longitude: null })}
                />
              ) : null}
              <Text style={[styles.hint, { color: colors.textSecondary }]}>
                {draft.latitude !== null ? t('reportLocationAdded') : t('reportLocationMissing')}
              </Text>
            </Surface>
            <Field
              label={t('reportLocationManual')}
              value={draft.district}
              placeholder={t('reportLocationManual')}
              onChangeText={(district) => updateDraft({ district: district.slice(0, 80) })}
              colors={colors}
            />
            <Field
              label={t('reportDescription')}
              value={draft.description}
              placeholder={t('reportDescriptionPlaceholder')}
              onChangeText={(description) =>
                updateDraft({ description: description.slice(0, 400) })
              }
              colors={colors}
              multiline
            />
            <Field
              label={t('reportEventDate')}
              value={draft.eventDate}
              placeholder={t('reportDatePlaceholder')}
              onChangeText={(eventDate) => updateDraft({ eventDate: eventDate.slice(0, 24) })}
              colors={colors}
            />
            {draft.eventDate && !isValidTurkishDate(draft.eventDate) ? (
              <Text style={[styles.dateError, { color: colors.statusWarning }]}>
                {t('reportDateInvalid')}
              </Text>
            ) : null}
          </Stack>
        ) : null}

        {step === 3 ? (
          <Stack>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t('reportReviewTitle')}
            </Text>
            <Surface style={styles.reviewCard}>
              <View style={styles.reviewLine}>
                <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>
                  {t('reportReviewMediaLabel')}
                </Text>
                <Text style={[styles.reviewValue, { color: colors.textPrimary }]}>
                  {t('reportReviewMedia', { count: String(draft.evidence.length) })}
                </Text>
              </View>
              <View style={styles.reviewLine}>
                <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>
                  {t('reportReviewCategory')}
                </Text>
                <Text style={[styles.reviewValue, { color: colors.textPrimary }]}>
                  {selectedCategory ? t(selectedCategory.label) : '—'}
                </Text>
              </View>
              <View style={styles.reviewLine}>
                <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>
                  {t('reportReviewLocation')}
                </Text>
                <Text style={[styles.reviewValue, { color: colors.textPrimary }]}>
                  {draft.district ||
                    (draft.latitude !== null
                      ? t('reportLocationAdded')
                      : t('reportLocationMissing'))}
                </Text>
              </View>
              <View style={styles.reviewLine}>
                <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>
                  {t('reportReviewDescription')}
                </Text>
                <Text style={[styles.reviewValue, { color: colors.textPrimary }]}>
                  {draft.description || '—'}
                </Text>
              </View>
              {draft.eventDate ? (
                <Text style={[styles.hint, { color: colors.textSecondary }]}>
                  {draft.eventDate}
                </Text>
              ) : null}
            </Surface>
            <Surface style={[styles.privacyCard, { backgroundColor: colors.statusInfoBackground }]}>
              <LockKeyhole size={20} color={colors.statusInfo} />
              <View style={styles.copy}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  {t('reportFlowPrivacyTitle')}
                </Text>
                <Text style={[styles.muted, { color: colors.textSecondary }]}>
                  {t('reportFlowPrivacyBody')}
                </Text>
              </View>
            </Surface>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: draft.consent }}
              onPress={() => updateDraft({ consent: !draft.consent })}
              style={styles.consentRow}
            >
              {draft.consent ? (
                <CheckCircle2 size={22} color={colors.brandPrimary} />
              ) : (
                <Circle size={22} color={colors.textTertiary} />
              )}
              <Text style={[styles.muted, styles.consentText, { color: colors.textPrimary }]}>
                {t('reportPrivacyConsent')}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: simulateFailure }}
              onPress={() => setSimulateFailure((value) => !value)}
              style={styles.failureTest}
            >
              <Text style={[styles.failureLabel, { color: colors.textSecondary }]}>
                {simulateFailure ? '☑' : '□'} {t('reportFailureTest')}
              </Text>
              <Text style={[styles.hint, { color: colors.textTertiary }]}>
                {t('reportFailureHint')}
              </Text>
            </Pressable>
          </Stack>
        ) : null}

        {step === 4 ? (
          <Stack>
            <View style={styles.successMascot}>
              <MascotSlot
                state="proud"
                size="md"
                speechBubble={t('reportSuccessTitle')}
                accessibleDescription={t('reportSuccessTitle')}
              />
            </View>
            <Surface
              style={[styles.successCard, { backgroundColor: colors.statusSuccessBackground }]}
            >
              <CheckCircle2 size={24} color={colors.statusSuccess} />
              <Text style={[styles.statusTitle, { color: colors.textPrimary }]}>
                {t('reportStatusDemo')}
              </Text>
              <Text style={[styles.muted, { color: colors.textSecondary }]}>
                {t('reportSuccessBody')}
              </Text>
            </Surface>
            <ActionButton label={t('reportClose')} onPress={exitFlow} />
          </Stack>
        ) : null}

        {error ? (
          <Surface style={[styles.errorBox, { backgroundColor: colors.statusWarningBackground }]}>
            <Text style={[styles.muted, { color: colors.textPrimary }]}>{error}</Text>
            {error === t('reportSubmitError') ? (
              <ActionButton
                label={t('reportTryAgain')}
                variant="secondary"
                onPress={() => void submitDemo()}
                disabled={busy}
              />
            ) : null}
          </Surface>
        ) : null}

        {step < 4 ? (
          <View style={styles.footer}>
            {step > 0 ? (
              <ActionButton
                label={t('reportBack')}
                variant="quiet"
                onPress={() => setStep((current) => Math.max(0, current - 1))}
                disabled={busy}
              />
            ) : (
              <ActionButton
                label={t('reportSaveDraft')}
                variant="quiet"
                onPress={() => void saveDraftAndExit()}
                disabled={busy}
              />
            )}
            {step < 3 ? (
              <ActionButton
                label={t('reportContinue')}
                onPress={() => setStep((current) => Math.min(3, current + 1))}
                disabled={!canContinue || busy}
              />
            ) : (
              <ActionButton
                label={busy ? t('reportSubmitting') : t('reportSubmitDemo')}
                onPress={() => void submitDemo()}
                disabled={!draft.consent || busy}
                icon={busy ? <ActivityIndicator color={colors.textOnBrand} /> : undefined}
              />
            )}
          </View>
        ) : null}
        {saving ? (
          <Text style={[styles.saveHint, { color: colors.textTertiary }]}>
            {t('reportDraftSaved')}
          </Text>
        ) : null}
      </Stack>
    </AppScreen>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChangeText,
  colors,
  multiline = false,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  colors: ReturnType<typeof useTheme>['colors'];
  multiline?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[
          styles.input,
          multiline && styles.multiline,
          {
            color: colors.textPrimary,
            backgroundColor: colors.backgroundCard,
            borderColor: colors.borderDefault,
          },
        ]}
        maxLength={multiline ? 400 : 80}
      />
      {multiline ? (
        <Text style={[styles.counter, { color: colors.textTertiary }]}>{value.length}/400</Text>
      ) : null}
    </View>
  );
}

function isValidTurkishDate(value: string): boolean {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value);
  if (!match) return false;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  topCopy: { flex: 1, gap: 2 },
  eyebrow: { fontSize: 10, fontWeight: fontWeights.bold, letterSpacing: 1 },
  title: { fontSize: fontSizes.xl, fontWeight: fontWeights.bold },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing[1] },
  progressItem: { alignItems: 'center', gap: spacing[1], flex: 1 },
  progressDot: { width: 8, height: 8, borderRadius: radii.full },
  progressLabel: { fontSize: 10, fontWeight: fontWeights.medium },
  sectionTitle: { fontSize: fontSizes.md, fontWeight: fontWeights.bold, lineHeight: 22 },
  mediaBox: { minHeight: 190, justifyContent: 'center' },
  mediaEmpty: { alignItems: 'center', gap: spacing[3], padding: spacing[3] },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  mediaItem: { width: '31%', aspectRatio: 1, position: 'relative' },
  preview: { width: '100%', height: '100%', borderRadius: radii.md, backgroundColor: '#83918A' },
  videoPreview: { alignItems: 'center', justifyContent: 'center' },
  videoLabel: { fontSize: fontSizes.sm, fontWeight: fontWeights.bold },
  removeButton: {
    position: 'absolute',
    top: spacing[1],
    right: spacing[1],
    width: 28,
    height: 28,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muted: { fontSize: fontSizes.sm, lineHeight: 21 },
  hint: { fontSize: fontSizes.xs, lineHeight: 18 },
  categoryGrid: { gap: spacing[2] },
  categoryItem: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryText: { fontSize: fontSizes.sm, fontWeight: fontWeights.medium },
  locationCard: { gap: spacing[3] },
  inlineIcon: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  fieldWrap: { gap: spacing[2] },
  fieldLabel: { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing[3],
    fontSize: fontSizes.sm,
  },
  multiline: { minHeight: 120, paddingTop: spacing[3] },
  counter: { alignSelf: 'flex-end', fontSize: fontSizes.xs },
  reviewCard: { gap: spacing[3] },
  reviewLine: { gap: spacing[1] },
  reviewLabel: { fontSize: fontSizes.xs },
  reviewValue: { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold },
  privacyCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  copy: { flex: 1, gap: spacing[2] },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[2],
  },
  consentText: { flex: 1, fontWeight: fontWeights.medium },
  failureTest: { gap: spacing[1], paddingVertical: spacing[2] },
  failureLabel: { fontSize: fontSizes.xs, fontWeight: fontWeights.medium },
  footer: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing[2] },
  errorBox: { gap: spacing[2] },
  saveHint: { alignSelf: 'center', fontSize: fontSizes.xs },
  dateError: { fontSize: fontSizes.xs },
  successMascot: { alignItems: 'center', minHeight: 170, justifyContent: 'center' },
  successCard: { alignItems: 'center', gap: spacing[3] },
  statusTitle: { fontSize: fontSizes.md, fontWeight: fontWeights.bold, textAlign: 'center' },
});
