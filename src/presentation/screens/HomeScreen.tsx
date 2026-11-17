import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/core/theme/colors';
import { fonts, latinOr } from '@/core/theme/fonts';
import { HIZB_START_PAGES } from '@/core/constants/hizbs';
import { MainTabParamList } from '@/navigation/types';
import { navigationRef } from '@/navigation/navigationRef';
import { Button } from '@/presentation/components/Button';
import { FlameIcon } from '@/presentation/components/CelebrateDialog';
import { TeamChips } from '@/presentation/components/Chips';
import { Hero } from '@/presentation/components/Hero';
import { Ring } from '@/presentation/components/Ring';
import { Strip } from '@/presentation/components/Strip';
import { TeamSheet } from '@/presentation/components/TeamSheet';
import { WeekDots } from '@/presentation/components/WeekDots';
import { useActiveTeam } from '@/presentation/context/ActiveTeamContext';
import { useAuth } from '@/presentation/hooks/useAuth';
import { useMyReadingDates } from '@/presentation/hooks/useMyReadingDates';
import { useMyTeamProgress } from '@/presentation/hooks/useMyTeamProgress';
import { useTeamMembers } from '@/presentation/hooks/useTeamMembers';
import { bestStreak, hasReadToday, readOnDays } from '@/domain/usecases/readingHistory';
import { describeProgress, pageToHizb } from '@/domain/usecases/quranProgress';

type Props = BottomTabScreenProps<MainTabParamList, 'Home'>;

const HIZB_COUNT = HIZB_START_PAGES.length;
const BADGE_MILESTONES = [3, 7, 14, 30];
const BADGE_LABELS: Record<number, string> = {
  3: 'البداية',
  7: 'الأسبوع',
  14: 'الأسبوعين',
  30: 'الشهر',
};

export function HomeScreen(_props: Props) {
  const { user } = useAuth();
  const { teams, activeTeam, setActiveTeamId } = useActiveTeam();
  const { members } = useTeamMembers(activeTeam?.id ?? '');
  const myProgress = useMyTeamProgress();
  const myDates = useMyReadingDates(activeTeam?.id ?? '');
  const [sheetVisible, setSheetVisible] = useState(false);

  const me = members.find((member) => member.userId === user?.uid);
  const myHizb = me && me.latestPage >= 1 ? pageToHizb(me.latestPage) : 0;
  const reading = me && me.latestPage >= 1 ? describeProgress(me.latestPage) : null;
  const week = readOnDays(myDates, 7);
  const doneToday = hasReadToday(myDates);
  const streak = me?.streak ?? 0;
  const best = Math.max(bestStreak(myDates), streak);
  const nextBadge = BADGE_MILESTONES.find((milestone) => milestone > streak) ?? null;
  const daysLeft = Math.ceil((HIZB_COUNT - myHizb) / 2);

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.grow}
        showsVerticalScrollIndicator={false}
      >
        <Hero>
          <Text style={styles.small}>السلام عليكم</Text>
          <Text style={[styles.h1, { fontFamily: latinOr(user?.displayName, fonts.display, fonts.latinBold) }]}>
            {user?.displayName}
          </Text>

          {teams.length > 1 ? (
            <TeamChips
              options={teams.map((team) => ({ key: team.id, label: team.name }))}
              value={activeTeam?.id ?? ''}
              onChange={setActiveTeamId}
            />
          ) : null}

          <Ring filled={myHizb} sub={`من ${HIZB_COUNT} حزبا`} />

          <Text style={styles.pos}>
            {reading
              ? `الجزء ${reading.juz} · ${reading.surahName} · ${reading.percentage}%`
              : 'لم تبدأ بعد'}
          </Text>

          <WeekDots readDays={week} />

          <View style={styles.streakCard}>
            <View style={styles.flameBox}>
              <FlameIcon width={24} height={24} />
            </View>
            <View style={styles.streakGrow}>
              <View style={styles.streakLine}>
                <Text style={styles.streakNumber}>{streak}</Text>
                <Text style={styles.streakText}>أيام متتالية</Text>
              </View>
              <Text style={styles.streakMeta}>أفضل سلسلة: {best} يوم</Text>
              <View style={styles.streakTrack}>
                <StreakBar
                  percent={nextBadge ? Math.min(100, (streak / nextBadge) * 100) : 100}
                />
              </View>
              <Text style={styles.streakMeta}>
                {nextBadge
                  ? `باقي ${nextBadge - streak} ${nextBadge - streak === 1 ? 'يوم' : 'أيام'} لوسام ${BADGE_LABELS[nextBadge]}`
                  : 'جمعتي كل الأوسمة'}
              </Text>
            </View>
          </View>

          <Text style={styles.est}>
            {myHizb >= HIZB_COUNT
              ? 'مبروك، ختمتي!'
              : `على وتيرة 2 حزب فاليوم، باقي ${daysLeft} يوم لختمتك`}
          </Text>

          <Button
            label={doneToday ? 'حدّث مرة أخرى' : 'حدّث تقدمي اليوم'}
            onPress={() => navigationRef.navigate('Update')}
            variant="gold"
          />
        </Hero>

        <View style={styles.body}>
          <View style={styles.rowHeader}>
            <Text style={styles.h2}>فريقي</Text>
            <Pressable
              style={styles.addTeam}
              onPress={() => setSheetVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="إضافة فريق"
            >
              <Text style={styles.addTeamLabel}>+ فريق</Text>
            </Pressable>
          </View>

          {teams.length === 0 ? (
            <Text style={styles.empty}>
              ما عندك حتى فريق.{'\n'}أنشئ واحد ولا انضم برمز دعوة.
            </Text>
          ) : (
            teams.map((team) => {
              const member = myProgress[team.id];
              const hizb = member && member.latestPage >= 1 ? pageToHizb(member.latestPage) : 0;
              return (
                <Pressable
                  key={team.id}
                  style={styles.teamRow}
                  onPress={() => {
                    setActiveTeamId(team.id);
                    navigationRef.navigate('Tabs', { screen: 'Team' });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`فريق ${team.name}`}
                >
                  <View style={styles.teamGrow}>
                    <Text style={[styles.teamName, { fontFamily: latinOr(team.name, fonts.bodySemi, fonts.latinSemi) }]}>
                      {team.name}
                    </Text>
                    <Text style={styles.teamMeta}>
                      {team.members.length} أعضاء · أنت فالحزب {hizb}
                    </Text>
                    <Strip filled={hizb} />
                  </View>
                  <Chevron />
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      <TeamSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} />
    </View>
  );
}

function StreakBar({ percent }: { percent: number }) {
  const reduced = useReducedMotion();
  const w = useSharedValue(reduced ? percent : 0);

  useEffect(() => {
    w.value = reduced
      ? percent
      : withTiming(percent, { duration: 450, easing: Easing.out(Easing.quad) });
  }, [percent, reduced, w]);

  const animated = useAnimatedStyle(() => ({ width: `${w.value}%` }));

  return <Animated.View style={[styles.streakFill, animated]} />;
}

function Chevron() {
  return (
    <Svg width={9} height={15} viewBox="0 0 9 15">
      <Path
        d="M7.5 1.5L1.5 7.5l6 6"
        stroke={colors.mute}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.paper,
    direction: 'rtl',
  },
  grow: {
    flexGrow: 1,
  },
  small: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.heroSub,
  },
  h1: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.heroText,
    lineHeight: 34,
  },
  pos: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.heroSoft,
    marginTop: 6,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.em2,
    borderRadius: 18,
    padding: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  flameBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(200, 160, 74, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakGrow: {
    flex: 1,
  },
  streakLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakNumber: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.heroText,
  },
  streakText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.heroText,
  },
  streakMeta: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.heroSub,
    marginTop: 3,
  },
  streakTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.tickOff,
    marginTop: 6,
    overflow: 'hidden',
  },
  streakFill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: 4,
  },
  est: {
    textAlign: 'center',
    fontSize: 13,
    color: colors.heroSub,
    marginBottom: 12,
  },
  body: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 24,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  h2: {
    fontFamily: fonts.display,
    fontSize: 19,
    color: colors.ink,
  },
  addTeam: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: colors.em,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTeamLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.em,
  },
  empty: {
    textAlign: 'center',
    color: colors.mute,
    paddingVertical: 22,
    paddingHorizontal: 10,
    fontSize: 14,
    lineHeight: 26,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  teamGrow: {
    flex: 1,
  },
  teamName: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.ink,
  },
  teamMeta: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.mute,
    marginTop: 2,
  },
});
