import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { CircleAlert, Flag, RefreshCw, ShieldCheck } from 'lucide-react-native';
import {
  IncidentCategory,
  PublicContentReportReason,
  type PublicPostSummary,
} from '@dahamiz/shared-types';
import { fontSizes, fontWeights, radii, spacing } from '@dahamiz/design-tokens';
import { ActionButton } from '../../components/ui/ActionButton';
import { Surface } from '../../components/ui/Surface';
import { getFirebaseAuth } from '../auth/firebase';
import { useLocale } from '../../lib/locale';
import { loadPublicFeed, reportPublicPost } from '../../lib/api-client';
import { PublicAreaFilter, type PublicAreaFilters } from '../map/PublicAreaFilter';
import { useTheme } from '../../theme/ThemeProvider';

const categories: readonly (IncidentCategory | 'ALL')[] = [
  'ALL',
  ...Object.values(IncidentCategory),
];

const reportReasons = [
  PublicContentReportReason.INACCURATE,
  PublicContentReportReason.PERSONAL_DATA,
  PublicContentReportReason.DANGEROUS_CONTENT,
  PublicContentReportReason.OTHER,
] as const;

function reportReasonLabelKey(reason: PublicContentReportReason) {
  switch (reason) {
    case PublicContentReportReason.INACCURATE:
      return 'feedReasonInaccurate';
    case PublicContentReportReason.PERSONAL_DATA:
      return 'feedReasonPersonalData';
    case PublicContentReportReason.DANGEROUS_CONTENT:
      return 'feedReasonDangerous';
    case PublicContentReportReason.OTHER:
      return 'feedReasonOther';
  }
}

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

export function PublicFeed() {
  const { colors } = useTheme();
  const { locale, t } = useLocale();
  const [posts, setPosts] = useState<PublicPostSummary[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<IncidentCategory | undefined>();
  const [area, setArea] = useState<PublicAreaFilters>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [reportingPost, setReportingPost] = useState<PublicPostSummary | null>(null);
  const [notice, setNotice] = useState('');

  const load = useCallback(
    async (nextPage: number, replace: boolean) => {
      if (replace) setLoading(true);
      else setLoadingMore(true);
      setHasError(false);
      try {
        const result = await loadPublicFeed({
          page: nextPage,
          limit: 20,
          ...(selectedCategory ? { category: selectedCategory } : {}),
          ...area,
        });
        setPosts((current) => (replace ? result.data : [...current, ...result.data]));
        setPage(result.pagination.page);
        setHasNextPage(result.pagination.hasNextPage);
      } catch {
        setHasError(true);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [area, selectedCategory],
  );

  useFocusEffect(
    useCallback(() => {
      void load(1, true);
    }, [load]),
  );

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.textPrimary }]}>
            {t('feedTitle')}
          </Text>
          <Text style={[styles.intro, { color: colors.textSecondary }]}>{t('feedBody')}</Text>
        </View>
        <ShieldCheck size={23} color={colors.brandPrimary} />
      </View>

      <View style={styles.filters}>
        {categories.map((category) => {
          const active = category === 'ALL' ? !selectedCategory : selectedCategory === category;
          return (
            <Pressable
              key={category}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => {
                setSelectedCategory(category === 'ALL' ? undefined : category);
                setNotice('');
              }}
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

      {notice ? (
        <Surface style={[styles.notice, { backgroundColor: colors.statusSuccessBackground }]}>
          <Text style={[styles.noticeText, { color: colors.textPrimary }]}>{notice}</Text>
        </Surface>
      ) : null}

      {loading ? (
        <ActivityIndicator accessibilityLabel={t('feedLoading')} color={colors.brandPrimary} />
      ) : hasError ? (
        <Surface style={[styles.emptyState, { backgroundColor: colors.statusWarningBackground }]}>
          <CircleAlert size={22} color={colors.statusWarning} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            {t('feedErrorTitle')}
          </Text>
          <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
            {t('feedErrorBody')}
          </Text>
          <ActionButton
            label={t('feedRetry')}
            variant="secondary"
            icon={<RefreshCw size={17} color={colors.brandPrimary} />}
            onPress={() => void load(1, true)}
          />
        </Surface>
      ) : posts.length === 0 ? (
        <Surface style={styles.emptyState}>
          <ShieldCheck size={24} color={colors.brandPrimary} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            {t('feedEmptyTitle')}
          </Text>
          <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
            {t('feedEmptyBody')}
          </Text>
        </Surface>
      ) : (
        <View style={styles.postList}>
          {posts.map((post) => (
            <Surface key={post.id} style={styles.postCard}>
              <View style={styles.postMeta}>
                <Text style={[styles.category, { color: colors.brandPrimary }]}>
                  {t(categoryLabelKey(post.category))}
                </Text>
                <Text style={[styles.date, { color: colors.textTertiary }]}>
                  {new Date(post.publishedAt).toLocaleDateString(
                    locale === 'tr' ? 'tr-TR' : 'en-US',
                  )}
                </Text>
              </View>
              <Text
                accessibilityRole="header"
                style={[styles.postTitle, { color: colors.textPrimary }]}
              >
                {post.title}
              </Text>
              {post.body ? (
                <Text style={[styles.postBody, { color: colors.textSecondary }]}>{post.body}</Text>
              ) : null}
              {post.mediaUrl ? (
                <Image
                  accessibilityLabel={post.title}
                  source={{ uri: post.mediaUrl }}
                  contentFit="cover"
                  style={styles.image}
                  cachePolicy="none"
                />
              ) : null}
              <View style={styles.postFooter}>
                <Text style={[styles.location, { color: colors.textSecondary }]}>
                  {[post.location.district, post.location.city].filter(Boolean).join(' · ')}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('feedReportContent')}
                  onPress={() => setReportingPost(post)}
                  style={styles.reportButton}
                >
                  <Flag size={15} color={colors.statusWarning} />
                  <Text style={[styles.reportText, { color: colors.textSecondary }]}>
                    {t('feedReportContent')}
                  </Text>
                </Pressable>
              </View>
              <Text style={[styles.reviewNote, { color: colors.textTertiary }]}>
                {t('feedHumanReviewed')}
              </Text>
            </Surface>
          ))}
          {hasNextPage ? (
            <ActionButton
              label={loadingMore ? t('feedLoading') : t('feedLoadMore')}
              variant="secondary"
              disabled={loadingMore}
              onPress={() => void load(page + 1, false)}
            />
          ) : null}
        </View>
      )}

      <ContentReportModal
        post={reportingPost}
        onClose={() => setReportingPost(null)}
        onSuccess={() => {
          setReportingPost(null);
          setNotice(t('feedReportSuccess'));
        }}
      />
    </View>
  );
}

function ContentReportModal({
  post,
  onClose,
  onSuccess,
}: {
  post: PublicPostSummary | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const [reason, setReason] = useState<PublicContentReportReason>(
    PublicContentReportReason.INACCURATE,
  );
  const [details, setDetails] = useState('');
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (post) {
      setReason(PublicContentReportReason.INACCURATE);
      setDetails('');
      setError(false);
      setSubmitting(false);
    }
  }, [post?.id]);

  async function submit() {
    if (!post) return;
    setSubmitting(true);
    setError(false);
    try {
      const user = getFirebaseAuth().currentUser;
      if (!user) throw new Error('A signed-in account is required.');
      await reportPublicPost(await user.getIdToken(), post.id, reason, details);
      setDetails('');
      onSuccess();
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={post !== null} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Surface style={styles.modalCard}>
          <Text
            accessibilityRole="header"
            style={[styles.modalTitle, { color: colors.textPrimary }]}
          >
            {t('feedReportTitle')}
          </Text>
          <Text style={[styles.modalBody, { color: colors.textSecondary }]}>
            {t('feedReportBody')}
          </Text>
          <View style={styles.reasonList}>
            {reportReasons.map((item) => {
              const active = item === reason;
              return (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setReason(item)}
                  style={[
                    styles.reason,
                    {
                      backgroundColor: active ? colors.brandPrimary : colors.backgroundCard,
                      borderColor: colors.borderDefault,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.reasonText,
                      { color: active ? colors.textOnBrand : colors.textPrimary },
                    ]}
                  >
                    {t(reportReasonLabelKey(item))}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            accessibilityLabel={t('feedReportDetails')}
            maxLength={500}
            multiline
            onChangeText={setDetails}
            placeholder={t('feedReportDetails')}
            placeholderTextColor={colors.textTertiary}
            style={[
              styles.detailsInput,
              { color: colors.textPrimary, borderColor: colors.borderDefault },
            ]}
            value={details}
          />
          {error ? (
            <Text
              accessibilityLiveRegion="polite"
              style={[styles.error, { color: colors.statusError }]}
            >
              {t('feedReportError')}
            </Text>
          ) : null}
          <View style={styles.modalActions}>
            <ActionButton label={t('feedCancel')} variant="secondary" onPress={onClose} />
            <ActionButton
              label={submitting ? t('feedLoading') : t('feedReportSubmit')}
              disabled={submitting}
              onPress={() => void submit()}
            />
          </View>
        </Surface>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing[4] },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  headingCopy: { flex: 1, gap: spacing[1] },
  title: { fontSize: fontSizes['2xl'], fontWeight: fontWeights.bold },
  intro: { fontSize: fontSizes.sm, lineHeight: 21 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  filter: {
    minHeight: 44,
    borderRadius: radii.full,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing[3],
  },
  filterText: { fontSize: fontSizes.xs, fontWeight: fontWeights.semibold },
  notice: { padding: spacing[3] },
  noticeText: { fontSize: fontSizes.sm, lineHeight: 20 },
  emptyState: { alignItems: 'center', gap: spacing[3], padding: spacing[6] },
  emptyTitle: { fontSize: fontSizes.lg, fontWeight: fontWeights.bold, textAlign: 'center' },
  emptyBody: { fontSize: fontSizes.sm, lineHeight: 21, textAlign: 'center' },
  postList: { gap: spacing[4] },
  postCard: { gap: spacing[3] },
  postMeta: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing[2] },
  category: { fontSize: fontSizes.xs, fontWeight: fontWeights.bold },
  date: { fontSize: fontSizes.xs },
  postTitle: { fontSize: fontSizes.xl, fontWeight: fontWeights.bold, lineHeight: 26 },
  postBody: { fontSize: fontSizes.sm, lineHeight: 22 },
  image: { height: 220, width: '100%', borderRadius: radii.lg, backgroundColor: '#e8e4db' },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  location: { flex: 1, fontSize: fontSizes.xs },
  reportButton: { flexDirection: 'row', alignItems: 'center', gap: spacing[1], minHeight: 44 },
  reportText: { fontSize: fontSizes.xs },
  reviewNote: { fontSize: fontSizes.xs },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20,25,20,0.48)',
    justifyContent: 'flex-end',
    padding: spacing[3],
  },
  modalCard: { gap: spacing[3] },
  modalTitle: { fontSize: fontSizes.xl, fontWeight: fontWeights.bold },
  modalBody: { fontSize: fontSizes.sm, lineHeight: 21 },
  reasonList: { gap: spacing[2] },
  reason: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing[3],
    borderRadius: radii.md,
    borderWidth: 1,
  },
  reasonText: { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold },
  detailsInput: {
    minHeight: 82,
    maxHeight: 140,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing[3],
    textAlignVertical: 'top',
    fontSize: fontSizes.sm,
  },
  error: { fontSize: fontSizes.sm },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing[2] },
});
