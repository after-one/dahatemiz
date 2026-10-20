import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { CalendarDays, CircleAlert, Leaf, Trophy } from 'lucide-react-native';
import type {
  CommunityEventSummary,
  CommunityTeamSummary,
  LeaderboardEntry,
  TeamLeaderboardEntry,
} from '@dahamiz/shared-types';
import { fontSizes, fontWeights, radii, spacing } from '@dahamiz/design-tokens';
import { ActionButton } from '../../src/components/ui/ActionButton';
import { AppScreen, Stack } from '../../src/components/screen/AppScreen';
import { Surface } from '../../src/components/ui/Surface';
import { getFirebaseAuth } from '../../src/features/auth/firebase';
import {
  joinCommunityEvent,
  joinCommunityTeam,
  leaveCommunityTeam,
  loadCommunityEvents,
  loadCommunityTeams,
  loadLeaderboard,
  loadTeamLeaderboard,
} from '../../src/lib/api-client';
import { useLocale } from '../../src/lib/locale';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function ChallengesScreen() {
  const { colors } = useTheme();
  const { locale, t } = useLocale();
  const [events, setEvents] = useState<CommunityEventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [joiningId, setJoiningId] = useState<string>();
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [teams, setTeams] = useState<CommunityTeamSummary[]>([]);
  const [teamLeaderboard, setTeamLeaderboard] = useState<TeamLeaderboardEntry[]>([]);
  const [leaderboardLoaded, setLeaderboardLoaded] = useState(false);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState(false);
  const [joiningTeamId, setJoiningTeamId] = useState<string>();

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const user = getFirebaseAuth().currentUser;
      if (!user) throw new Error('Sign-in required.');
      const result = await loadCommunityEvents(await user.getIdToken());
      setEvents(result.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadEvents();
    }, [loadEvents]),
  );

  async function join(eventId: string) {
    setJoiningId(eventId);
    setError(false);
    try {
      const user = getFirebaseAuth().currentUser;
      if (!user) throw new Error('Sign-in required.');
      await joinCommunityEvent(await user.getIdToken(), eventId);
      setEvents((current) =>
        current.map((event) =>
          event.id === eventId
            ? { ...event, joined: true, participantCount: event.participantCount + 1 }
            : event,
        ),
      );
    } catch {
      setError(true);
    } finally {
      setJoiningId(undefined);
    }
  }

  async function fetchLeaderboard() {
    if (!city.trim()) return;
    setLeaderboardLoading(true);
    setLeaderboardError(false);
    try {
      const user = getFirebaseAuth().currentUser;
      if (!user) throw new Error('Sign-in required.');
      const token = await user.getIdToken();
      const [people, nextTeams, teamsBoard] = await Promise.all([
        loadLeaderboard(city, district),
        loadCommunityTeams(token, city, district),
        loadTeamLeaderboard(city, district),
      ]);
      setLeaderboard(people.data);
      setTeams(nextTeams.data);
      setTeamLeaderboard(teamsBoard.data);
      setLeaderboardLoaded(true);
    } catch {
      setLeaderboardError(true);
    } finally {
      setLeaderboardLoading(false);
    }
  }

  async function toggleTeam(team: CommunityTeamSummary) {
    setJoiningTeamId(team.id);
    setLeaderboardError(false);
    try {
      const user = getFirebaseAuth().currentUser;
      if (!user) throw new Error('Sign-in required.');
      const token = await user.getIdToken();
      if (team.joined) await leaveCommunityTeam(token, team.id);
      else await joinCommunityTeam(token, team.id);
      setTeams((current) =>
        current.map((item) =>
          item.id === team.id
            ? {
                ...item,
                joined: !item.joined,
                memberCount: Math.max(0, item.memberCount + (item.joined ? -1 : 1)),
              }
            : item,
        ),
      );
    } catch {
      setLeaderboardError(true);
    } finally {
      setJoiningTeamId(undefined);
    }
  }

  return (
    <AppScreen>
      <Stack>
        <View style={styles.heading}>
          <View style={styles.headingIcon}>
            <Leaf size={24} color={colors.brandPrimary} />
          </View>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.textPrimary }]}>
            {t('challengesTitle')}
          </Text>
        </View>
        <Text style={[styles.body, { color: colors.textSecondary }]}>{t('challengesBody')}</Text>
        <Surface style={[styles.impactNote, { backgroundColor: colors.brandHero }]}>
          <Text style={[styles.noteText, { color: colors.textPrimary }]}>
            {t('challengeVerifiedNote')}
          </Text>
        </Surface>

        <View style={styles.sectionHeading}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t('challengeEvents')}
          </Text>
          <CalendarDays size={20} color={colors.brandPrimary} />
        </View>
        {loading ? (
          <ActivityIndicator accessibilityLabel={t('feedLoading')} color={colors.brandPrimary} />
        ) : error ? (
          <Surface style={styles.stateCard}>
            <CircleAlert size={22} color={colors.statusWarning} />
            <Text style={[styles.stateText, { color: colors.textSecondary }]}>
              {t('challengeLoadError')}
            </Text>
            <ActionButton
              label={t('feedRetry')}
              variant="secondary"
              onPress={() => void loadEvents()}
            />
          </Surface>
        ) : events.length === 0 ? (
          <Surface style={styles.stateCard}>
            <CalendarDays size={22} color={colors.brandPrimary} />
            <Text style={[styles.stateTitle, { color: colors.textPrimary }]}>
              {t('challengeEmptyTitle')}
            </Text>
            <Text style={[styles.stateText, { color: colors.textSecondary }]}>
              {t('challengeEmptyBody')}
            </Text>
          </Surface>
        ) : (
          <View style={styles.eventList}>
            {events.map((event) => (
              <Surface key={event.id} style={styles.eventCard}>
                <Text style={[styles.eventTitle, { color: colors.textPrimary }]}>
                  {event.title}
                </Text>
                <Text style={[styles.eventBody, { color: colors.textSecondary }]}>
                  {event.description}
                </Text>
                <Text style={[styles.eventMeta, { color: colors.textTertiary }]}>
                  {[event.district, event.city].filter(Boolean).join(' · ')} ·{' '}
                  {new Date(event.startsAt).toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </Text>
                <Text style={[styles.eventMeta, { color: colors.textSecondary }]}>
                  {t('challengeParticipantCount', { count: String(event.participantCount) })}
                </Text>
                <ActionButton
                  label={
                    event.joined
                      ? t('challengeJoined')
                      : joiningId === event.id
                        ? t('feedLoading')
                        : t('challengeJoin')
                  }
                  disabled={event.joined || joiningId !== undefined}
                  onPress={() => void join(event.id)}
                />
              </Surface>
            ))}
          </View>
        )}

        <View style={styles.sectionHeading}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t('challengeLeaderboard')}
          </Text>
          <Trophy size={20} color={colors.brandPrimary} />
        </View>
        <Surface style={styles.leaderboardCard}>
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>
            {t('challengeLeaderboardPrivacy')}
          </Text>
          <View style={styles.fields}>
            <TextInput
              accessibilityLabel={t('feedCity')}
              maxLength={120}
              onChangeText={setCity}
              placeholder={t('feedCity')}
              placeholderTextColor={colors.textTertiary}
              style={[
                styles.input,
                { color: colors.textPrimary, borderColor: colors.borderDefault },
              ]}
              value={city}
            />
            <TextInput
              accessibilityLabel={t('feedDistrict')}
              maxLength={120}
              onChangeText={setDistrict}
              placeholder={t('feedDistrict')}
              placeholderTextColor={colors.textTertiary}
              style={[
                styles.input,
                { color: colors.textPrimary, borderColor: colors.borderDefault },
              ]}
              value={district}
            />
          </View>
          <ActionButton
            label={leaderboardLoading ? t('feedLoading') : t('challengeLeaderboardShow')}
            disabled={leaderboardLoading || !city.trim()}
            onPress={() => void fetchLeaderboard()}
          />
          {leaderboardError ? (
            <Text style={[styles.stateText, { color: colors.statusError }]}>
              {t('challengeLoadError')}
            </Text>
          ) : null}
          {leaderboardLoaded && leaderboard.length === 0 ? (
            <Text style={[styles.stateText, { color: colors.textSecondary }]}>
              {t('challengeLeaderboardEmpty')}
            </Text>
          ) : null}
          {leaderboard.map((entry) => (
            <View key={`${entry.rank}-${entry.displayName}`} style={styles.rankRow}>
              <Text style={[styles.rank, { color: colors.brandPrimary }]}>{entry.rank}</Text>
              <Text style={[styles.rankName, { color: colors.textPrimary }]}>
                {entry.displayName}
              </Text>
              <Text style={[styles.rankXp, { color: colors.textSecondary }]}>
                {entry.totalXp} XP
              </Text>
            </View>
          ))}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t('challengeTeams')}
          </Text>
          {leaderboardLoaded && teams.length === 0 ? (
            <Text style={[styles.stateText, { color: colors.textSecondary }]}>
              {t('challengeTeamsEmpty')}
            </Text>
          ) : null}
          {teams.map((team) => (
            <View key={team.id} style={styles.teamRow}>
              <View style={styles.teamCopy}>
                <Text style={[styles.rankName, { color: colors.textPrimary }]}>{team.name}</Text>
                <Text style={[styles.eventMeta, { color: colors.textSecondary }]}>
                  {team.description} ·{' '}
                  {t('challengeTeamMembers', { count: String(team.memberCount) })}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                disabled={joiningTeamId !== undefined}
                onPress={() => void toggleTeam(team)}
                style={[styles.teamButton, { backgroundColor: colors.statusSuccessBackground }]}
              >
                <Text style={[styles.teamButtonText, { color: colors.brandPrimary }]}>
                  {joiningTeamId === team.id
                    ? t('feedLoading')
                    : team.joined
                      ? t('challengeTeamLeave')
                      : t('challengeTeamJoin')}
                </Text>
              </Pressable>
            </View>
          ))}
          {teamLeaderboard.length ? (
            <>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {t('challengeTeamLeaderboard')}
              </Text>
              {teamLeaderboard.map((entry) => (
                <View key={`${entry.rank}-${entry.teamName}`} style={styles.rankRow}>
                  <Text style={[styles.rank, { color: colors.brandPrimary }]}>{entry.rank}</Text>
                  <Text style={[styles.rankName, { color: colors.textPrimary }]}>
                    {entry.teamName}
                  </Text>
                  <Text style={[styles.rankXp, { color: colors.textSecondary }]}>
                    {entry.totalXp} XP
                  </Text>
                </View>
              ))}
            </>
          ) : null}
        </Surface>
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  headingIcon: {
    width: 46,
    height: 46,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F0E7',
  },
  title: { fontSize: fontSizes['2xl'], fontWeight: fontWeights.bold },
  body: { fontSize: fontSizes.md, lineHeight: 23 },
  impactNote: { padding: spacing[4] },
  noteText: { fontSize: fontSizes.sm, lineHeight: 21, fontWeight: fontWeights.medium },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: fontSizes.lg, fontWeight: fontWeights.bold },
  stateCard: { alignItems: 'center', gap: spacing[3], padding: spacing[5] },
  stateTitle: { fontSize: fontSizes.md, fontWeight: fontWeights.bold, textAlign: 'center' },
  stateText: { fontSize: fontSizes.sm, lineHeight: 21, textAlign: 'center' },
  eventList: { gap: spacing[3] },
  eventCard: { gap: spacing[3] },
  eventTitle: { fontSize: fontSizes.lg, fontWeight: fontWeights.bold },
  eventBody: { fontSize: fontSizes.sm, lineHeight: 21 },
  eventMeta: { fontSize: fontSizes.xs, lineHeight: 18 },
  leaderboardCard: { gap: spacing[3] },
  fields: { flexDirection: 'row', gap: spacing[2] },
  input: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing[3],
    fontSize: fontSizes.sm,
  },
  rankRow: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  rank: { width: 24, fontSize: fontSizes.md, fontWeight: fontWeights.bold },
  rankName: { flex: 1, fontSize: fontSizes.sm, fontWeight: fontWeights.semibold },
  rankXp: { fontSize: fontSizes.sm },
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  teamCopy: { flex: 1, gap: spacing[1] },
  teamButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing[3],
    borderRadius: radii.full,
  },
  teamButtonText: { fontSize: fontSizes.xs, fontWeight: fontWeights.semibold },
});
