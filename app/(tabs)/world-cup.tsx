import { Ionicons } from '@expo/vector-icons';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { ParamListBase } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useFocusEffect, useNavigation } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FeedHeader } from '@/components/FeedHeader';
import { WorldCupTab, WorldCupTabBar } from '@/components/WorldCupTabBar';
import { WORLD_CUP_GROUP_CARD_MIN_HEIGHT } from '@/constants/Layout';
import {
  WORLD_CUP_KNOCKOUT_COLUMN_WIDTH,
  WORLD_CUP_LIVE_POLL_INTERVAL_MS,
  WORLD_CUP_TAB_ENABLED,
} from '@/constants/worldCup';
import { useTheme } from '@/hooks/useTheme';
import {
  fetchWorldCupFeed,
  hasLiveMatches,
  sortMatchesForScores,
  WorldCupBracketRound,
  WorldCupGroup,
  WorldCupGroupTeam,
  WorldCupMatch,
  WorldCupUpdate,
} from '@/services/worldCupFeed';
import { openPublisherArticle } from '@/utils/openPublisherBrowser';

function formatKickoff(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatPublished(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function LiveBadge() {
  const { colors } = useTheme();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.35, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return (
    <View style={styles.liveBadge}>
      <Animated.View style={[styles.liveDot, { backgroundColor: colors.accent, opacity: pulse }]} />
      <Text style={[styles.matchStatus, { color: colors.accent }]}>Live</Text>
    </View>
  );
}

function MatchCard({ match }: { match: WorldCupMatch }) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.matchCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
        match.isLive && { borderColor: colors.accent },
      ]}>
      <View style={styles.matchMetaRow}>
        {match.isLive ? (
          <LiveBadge />
        ) : (
          <Text style={[styles.matchStatus, { color: colors.textSecondary }]}>{match.status}</Text>
        )}
        {match.statusDetail ? (
          <Text style={[styles.matchDetail, { color: colors.textSecondary }]} numberOfLines={1}>
            {match.statusDetail}
          </Text>
        ) : null}
      </View>

      <View style={styles.teamsRow}>
        <TeamColumn team={match.home} align="left" />
        <Text style={[styles.scoreDivider, { color: colors.textSecondary }]}>vs</Text>
        <TeamColumn team={match.away} align="right" />
      </View>

      <Text style={[styles.kickoff, { color: colors.textSecondary }]}>
        {formatKickoff(match.startTime)}
        {match.venue ? ` · ${match.venue}` : ''}
      </Text>
    </View>
  );
}

function BracketMatchCard({ match }: { match: WorldCupMatch }) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.bracketMatchCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
        match.isLive && { borderColor: colors.accent },
      ]}>
      <View style={styles.bracketTeamRow}>
        <BracketTeamLine team={match.home} colors={colors} />
        <BracketTeamLine team={match.away} colors={colors} />
      </View>
      <Text style={[styles.bracketKickoff, { color: colors.textSecondary }]} numberOfLines={1}>
        {match.isLive ? 'Live' : match.status}
        {match.statusDetail ? ` · ${match.statusDetail}` : ''}
      </Text>
    </View>
  );
}

function BracketTeamLine({
  team,
  colors,
}: {
  team: WorldCupMatch['home'];
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={styles.bracketTeamLine}>
      {team.logoUrl ? (
        <Image source={{ uri: team.logoUrl }} style={styles.bracketLogo} contentFit="contain" />
      ) : (
        <View style={[styles.bracketLogoFallback, { backgroundColor: colors.border }]}>
          <Text style={[styles.bracketAbbrev, { color: colors.text }]}>{team.abbrev}</Text>
        </View>
      )}
      <Text
        style={[
          styles.bracketTeamName,
          { color: team.winner ? colors.accent : colors.text },
        ]}
        numberOfLines={1}>
        {team.name}
      </Text>
      <Text
        style={[
          styles.bracketTeamScore,
          { color: team.winner ? colors.accent : colors.textSecondary },
        ]}>
        {team.score}
      </Text>
    </View>
  );
}

function GroupStandingsCard({ group }: { group: WorldCupGroup }) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.groupCard,
        { backgroundColor: colors.surface, borderColor: colors.border, minHeight: WORLD_CUP_GROUP_CARD_MIN_HEIGHT },
      ]}>
      <Text style={[styles.groupTitle, { color: colors.text }]}>{group.name}</Text>
      <View style={styles.groupHeaderRow}>
        <Text style={[styles.groupHeaderCell, styles.groupTeamCell, { color: colors.textSecondary }]}>
          Team
        </Text>
        <Text style={[styles.groupHeaderCell, { color: colors.textSecondary }]}>P</Text>
        <Text style={[styles.groupHeaderCell, { color: colors.textSecondary }]}>GD</Text>
        <Text style={[styles.groupHeaderCell, { color: colors.textSecondary }]}>Pts</Text>
      </View>
      {group.teams.map((team, index) => (
        <GroupTeamRow key={`${group.name}-${team.abbrev}`} team={team} rank={index + 1} />
      ))}
    </View>
  );
}

function GroupTeamRow({ team, rank }: { team: WorldCupGroupTeam; rank: number }) {
  const { colors } = useTheme();
  const advances = rank <= 2;

  return (
    <View style={styles.groupTeamRow}>
      <View style={styles.groupTeamCell}>
        {team.logoUrl ? (
          <Image source={{ uri: team.logoUrl }} style={styles.groupLogo} contentFit="contain" />
        ) : (
          <View style={[styles.groupLogoFallback, { backgroundColor: colors.border }]}>
            <Text style={[styles.groupAbbrev, { color: colors.text }]}>{team.abbrev}</Text>
          </View>
        )}
        <Text
          style={[
            styles.groupTeamName,
            { color: advances ? colors.accent : colors.text },
          ]}
          numberOfLines={1}>
          {team.abbrev}
        </Text>
      </View>
      <Text style={[styles.groupStat, { color: colors.textSecondary }]}>{team.played}</Text>
      <Text style={[styles.groupStat, { color: colors.textSecondary }]}>
        {team.goalDiff > 0 ? `+${team.goalDiff}` : team.goalDiff}
      </Text>
      <Text style={[styles.groupStat, { color: colors.text, fontFamily: 'InterSemiBold' }]}>
        {team.points}
      </Text>
    </View>
  );
}

function GroupStandingsGrid({ groups }: { groups: WorldCupGroup[] }) {
  const { colors } = useTheme();

  if (groups.length === 0) {
    return (
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        Group standings not available yet.
      </Text>
    );
  }

  return (
    <View style={styles.groupGrid}>
      {groups.map((group) => (
        <GroupStandingsCard key={group.name} group={group} />
      ))}
    </View>
  );
}

function BracketView({ groups, rounds }: { groups: WorldCupGroup[]; rounds: WorldCupBracketRound[] }) {
  const { colors } = useTheme();

  if (groups.length === 0 && rounds.length === 0) {
    return (
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        Bracket not available yet.
      </Text>
    );
  }

  return (
    <View style={styles.bracketSections}>
      {groups.length > 0 ? (
        <View style={styles.bracketSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Group Stage</Text>
          <Text style={[styles.tabHint, { color: colors.textSecondary }]}>
            Top two in each group advance. Standings from ESPN.
          </Text>
          <GroupStandingsGrid groups={groups} />
        </View>
      ) : null}

      {rounds.length > 0 ? (
        <View style={styles.bracketSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Knockout Stage</Text>
          <Text style={[styles.tabHint, { color: colors.textSecondary }]}>
            Swipe horizontally through rounds.
          </Text>
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bracketScrollContent}>
            {rounds.map((round) => (
              <View
                key={round.slug}
                style={[styles.bracketRoundColumn, { width: WORLD_CUP_KNOCKOUT_COLUMN_WIDTH }]}>
                <Text style={[styles.bracketRoundTitle, { color: colors.text }]}>{round.label}</Text>
                {round.detail ? (
                  <Text style={[styles.bracketRoundDetail, { color: colors.textSecondary }]}>
                    {round.detail}
                  </Text>
                ) : null}
                <View style={styles.bracketMatchList}>
                  {round.matches.map((match) => (
                    <BracketMatchCard key={match.id} match={match} />
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

function TeamColumn({
  team,
  align,
}: {
  team: WorldCupMatch['home'];
  align: 'left' | 'right';
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.teamColumn, align === 'right' && styles.teamColumnRight]}>
      {team.logoUrl ? (
        <Image source={{ uri: team.logoUrl }} style={styles.teamLogo} contentFit="contain" />
      ) : (
        <View style={[styles.teamLogoFallback, { backgroundColor: colors.border }]}>
          <Text style={[styles.teamAbbrev, { color: colors.text }]}>{team.abbrev}</Text>
        </View>
      )}
      <Text
        style={[
          styles.teamName,
          { color: colors.text },
          team.winner && styles.teamWinner,
          align === 'right' && styles.textRight,
        ]}
        numberOfLines={2}>
        {team.name}
      </Text>
      <Text
        style={[
          styles.teamScore,
          { color: team.winner ? colors.accent : colors.text },
          align === 'right' && styles.textRight,
        ]}>
        {team.score}
      </Text>
    </View>
  );
}

function UpdateRow({ update }: { update: WorldCupUpdate }) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={() => openPublisherArticle(update.url)}
      style={({ pressed }) => [
        styles.updateRow,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { opacity: 0.75 },
      ]}>
      {update.imageUrl ? (
        <Image source={{ uri: update.imageUrl }} style={styles.updateThumb} contentFit="cover" />
      ) : (
        <View style={[styles.updateThumbFallback, { backgroundColor: colors.accentMuted }]}>
          <Ionicons name="football-outline" size={20} color={colors.accent} />
        </View>
      )}
      <View style={styles.updateBody}>
        <Text style={[styles.updateSource, { color: colors.textSecondary }]}>{update.source}</Text>
        <Text style={[styles.updateTitle, { color: colors.text }]} numberOfLines={3}>
          {update.title}
        </Text>
        {update.excerpt ? (
          <Text style={[styles.updateExcerpt, { color: colors.textSecondary }]} numberOfLines={2}>
            {update.excerpt}
          </Text>
        ) : null}
        <Text style={[styles.updateTime, { color: colors.textSecondary }]}>
          {formatPublished(update.publishedAt)}
        </Text>
      </View>
      <Ionicons name="open-outline" size={16} color={colors.textSecondary} />
    </Pressable>
  );
}

export default function WorldCupScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<ParamListBase>>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<WorldCupTab>('scores');
  const [matches, setMatches] = useState<WorldCupMatch[]>([]);
  const [groups, setGroups] = useState<WorldCupGroup[]>([]);
  const [bracket, setBracket] = useState<WorldCupBracketRound[]>([]);
  const [updates, setUpdates] = useState<WorldCupUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const load = useCallback(async (mode: 'initial' | 'refresh' | 'silent') => {
    if (mode === 'initial') setIsLoading(true);
    else if (mode === 'refresh') setIsRefreshing(true);

    try {
      const result = await fetchWorldCupFeed();
      setMatches(result.matches);
      setGroups(result.groups);
      setBracket(result.bracket);
      setUpdates(result.updates);
      setError(result.error ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load World Cup feed');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const sortedMatches = useMemo(() => sortMatchesForScores(matches), [matches]);
  const shouldPollLiveScores = isFocused && hasLiveMatches(matches);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      void load('initial');
    }, [load]),
  );

  useFocusEffect(
    useCallback(() => {
      const unsubscribe = navigation.addListener('tabPress', () => {
        if (!navigation.isFocused()) return;
        void load('refresh');
      });
      return unsubscribe;
    }, [navigation, load]),
  );

  useEffect(() => {
    if (!shouldPollLiveScores) return;

    const intervalId = setInterval(() => {
      void load('silent');
    }, WORLD_CUP_LIVE_POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [shouldPollLiveScores, load]);

  if (isLoading && matches.length === 0 && updates.length === 0 && groups.length === 0 && bracket.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <FeedHeader
        title="World Cup"
        subtitle="2026 · Temporary tab"
        titleTrailing={<Ionicons name="trophy" size={22} color={colors.accent} />}
      />
      <WorldCupTabBar activeTab={activeTab} onSelectTab={setActiveTab} />
      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 24,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => load('refresh')}
            tintColor={colors.text}
            colors={[colors.text]}
            progressBackgroundColor={colors.surface}
          />
        }>
        {error ? (
          <Text style={[styles.errorText, { color: colors.accent }]}>{error}</Text>
        ) : null}

        {activeTab === 'bracket' ? (
          <View style={styles.tabContent}>
            <BracketView groups={groups} rounds={bracket} />
          </View>
        ) : null}

        {activeTab === 'scores' ? (
          <View style={styles.tabContent}>
            {sortedMatches.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No upcoming matches in the next week.
              </Text>
            ) : (
              <View style={styles.matchList}>
                {sortedMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </View>
            )}
          </View>
        ) : null}

        {activeTab === 'news' ? (
          <View style={styles.tabContent}>
            {updates.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No news updates available right now.
              </Text>
            ) : (
              <View style={styles.updateList}>
                {updates.map((update) => (
                  <UpdateRow key={update.id} update={update} />
                ))}
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 8,
  },
  notificationCopy: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notificationText: {
    flex: 1,
    gap: 2,
  },
  notificationLabel: {
    fontFamily: 'InterSemiBold',
    fontSize: 14,
    lineHeight: 18,
  },
  notificationDetail: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    marginTop: 16,
  },
  tabHint: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'LoraBold',
    fontSize: 18,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  bracketSections: {
    gap: 28,
  },
  bracketSection: {
    gap: 4,
  },
  groupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  groupCard: {
    width: '47%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  groupTitle: {
    fontFamily: 'InterSemiBold',
    fontSize: 12,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingBottom: 2,
  },
  groupHeaderCell: {
    width: 28,
    fontFamily: 'InterMedium',
    fontSize: 10,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  groupTeamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  groupTeamCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  groupLogo: {
    width: 16,
    height: 16,
  },
  groupLogoFallback: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupAbbrev: {
    fontFamily: 'InterSemiBold',
    fontSize: 7,
  },
  groupTeamName: {
    flex: 1,
    fontFamily: 'InterMedium',
    fontSize: 11,
    lineHeight: 14,
  },
  groupStat: {
    width: 28,
    fontFamily: 'Inter',
    fontSize: 11,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 16,
    marginBottom: 4,
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: 15,
    lineHeight: 22,
  },
  matchList: {
    gap: 12,
  },
  matchCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  matchMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  matchStatus: {
    fontFamily: 'InterSemiBold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  matchDetail: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 12,
    textAlign: 'right',
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  teamColumn: {
    flex: 1,
    gap: 4,
  },
  teamColumnRight: {
    alignItems: 'flex-end',
  },
  teamLogo: {
    width: 36,
    height: 36,
  },
  teamLogoFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamAbbrev: {
    fontFamily: 'InterSemiBold',
    fontSize: 11,
  },
  teamName: {
    fontFamily: 'InterSemiBold',
    fontSize: 15,
    lineHeight: 20,
  },
  teamWinner: {
    fontFamily: 'InterSemiBold',
  },
  teamScore: {
    fontFamily: 'LoraBold',
    fontSize: 28,
    lineHeight: 32,
  },
  scoreDivider: {
    fontFamily: 'Inter',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  textRight: {
    textAlign: 'right',
  },
  kickoff: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 17,
  },
  bracketScrollContent: {
    gap: 12,
    paddingRight: 24,
  },
  bracketRoundColumn: {
    gap: 8,
  },
  bracketRoundTitle: {
    fontFamily: 'InterSemiBold',
    fontSize: 13,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  bracketRoundDetail: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 16,
  },
  bracketMatchList: {
    gap: 8,
  },
  bracketMatchCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  bracketTeamRow: {
    gap: 6,
  },
  bracketTeamLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bracketLogo: {
    width: 20,
    height: 20,
  },
  bracketLogoFallback: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bracketAbbrev: {
    fontFamily: 'InterSemiBold',
    fontSize: 8,
  },
  bracketTeamName: {
    flex: 1,
    fontFamily: 'InterMedium',
    fontSize: 12,
    lineHeight: 16,
  },
  bracketTeamScore: {
    fontFamily: 'InterSemiBold',
    fontSize: 13,
    minWidth: 16,
    textAlign: 'right',
  },
  bracketKickoff: {
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 14,
  },
  updateList: {
    gap: 12,
  },
  updateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  updateThumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
  },
  updateThumbFallback: {
    width: 72,
    height: 72,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateBody: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  updateSource: {
    fontFamily: 'InterMedium',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  updateTitle: {
    fontFamily: 'InterSemiBold',
    fontSize: 15,
    lineHeight: 20,
  },
  updateExcerpt: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 18,
  },
  updateTime: {
    fontFamily: 'Inter',
    fontSize: 12,
  },
});
