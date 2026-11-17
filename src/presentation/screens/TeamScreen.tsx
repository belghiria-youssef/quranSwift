import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { readingSystemDaily } from '@/core/constants/readingSystems';
import { toDateKey } from '@/core/utils/date';
import { errorMessage } from '@/core/utils/errorMessage';
import { colors } from '@/core/theme/colors';
import { fonts, latinOr } from '@/core/theme/fonts';
import { MainTabParamList } from '@/navigation/types';
import { navigationRef } from '@/navigation/navigationRef';
import { Button } from '@/presentation/components/Button';
import { ConfirmDialog } from '@/presentation/components/ConfirmDialog';
import { InputDialog } from '@/presentation/components/InputDialog';
import { FlameIcon } from '@/presentation/components/CelebrateDialog';
import { TeamChips } from '@/presentation/components/Chips';
import { Strip } from '@/presentation/components/Strip';
import { useToast } from '@/presentation/components/Toast';
import { useActiveTeam } from '@/presentation/context/ActiveTeamContext';
import { useAuth } from '@/presentation/hooks/useAuth';
import { useTeamMembers } from '@/presentation/hooks/useTeamMembers';
import { teamStreak } from '@/domain/usecases/readingHistory';
import { describeProgress, pageToHizb } from '@/domain/usecases/quranProgress';
import { Membership } from '@/domain/entities/Membership';

type Props = BottomTabScreenProps<MainTabParamList, 'Team'>;

export function TeamScreen(_props: Props) {
  const { activeTeam, teams, setActiveTeamId, deleteTeam, renameTeam } = useActiveTeam();
  const { user } = useAuth();
  const { members, loading } = useTeamMembers(activeTeam?.id ?? '');
  const toast = useToast();
  const [nudged, setNudged] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);

  const todayKey = toDateKey(new Date());
  const nudgeKey = activeTeam ? `qs.nudges.${activeTeam.id}.${todayKey}` : '';

  useEffect(() => {
    if (!nudgeKey) {
      setNudged(new Set());
      return undefined;
    }
    let active = true;
    AsyncStorage.getItem(nudgeKey)
      .then((value) => {
        if (active) {
          setNudged(new Set(value ? (JSON.parse(value) as string[]) : []));
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [nudgeKey]);

  const nudge = (member: Membership) => {
    setNudged((prev) => {
      const next = new Set(prev).add(member.userId);
      AsyncStorage.setItem(nudgeKey, JSON.stringify([...next])).catch(() => undefined);
      return next;
    });
    toast.show(`أرسلنا تذكير لطيف لـ${member.displayName}`);
  };

  const sorted = [...members].sort(
    (a, b) => b.latestPage - a.latestPage || a.displayName.localeCompare(b.displayName),
  );
  const me = members.find((member) => member.userId === user?.uid);
  const readToday = members.filter((member) => member.lastReadDate === todayKey).length;
  const teamDays = teamStreak(members);
  const isCreator = activeTeam?.creatorId === user?.uid;

  const handleDelete = async () => {
    if (!activeTeam) {
      return;
    }
    setDeleting(true);
    try {
      await deleteTeam(activeTeam.id);
      setConfirmDelete(false);
      toast.show('تم حذف الفريق');
      navigationRef.navigate('Tabs', { screen: 'Home' });
    } catch (caught) {
      toast.show(errorMessage(caught, 'تعذر حذف الفريق'));
    } finally {
      setDeleting(false);
    }
  };

  const copyCode = async () => {
    if (!activeTeam) {
      return;
    }
    await Clipboard.setStringAsync(activeTeam.inviteCode).catch(() => undefined);
    toast.show('تم نسخ الرمز');
  };

  if (!activeTeam) {
    return (
      <View style={styles.flex}>
        <View style={styles.noTeam}>
          <Text style={styles.noTeamText}>ما عندك حتى فريق.</Text>
          <Button label="توجه للرئيسية" onPress={() => navigationRef.navigate('Tabs', { screen: 'Home' })} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.grow}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.heroSub}>الفريق</Text>
          <Text style={[styles.h1, { fontFamily: latinOr(activeTeam.name, fonts.display, fonts.latinBold) }]}>
            {activeTeam.name}
          </Text>

          {teams.length > 1 ? (
            <TeamChips
              options={teams.map((team) => ({ key: team.id, label: team.name }))}
              value={activeTeam.id}
              onChange={setActiveTeamId}
            />
          ) : null}

          <Pressable
            style={styles.code}
            onPress={copyCode}
            accessibilityRole="button"
            accessibilityLabel="نسخ رمز الدعوة"
          >
            <Text style={styles.codeLabel}>{activeTeam.inviteCode}</Text>
            <CopyIcon />
          </Pressable>

          <Text style={styles.today}>
            {readToday} من {members.length} قرأوا اليوم · سلسلة الفريق: {teamDays} أيام
          </Text>
          <View style={styles.bar}>
            <View
              style={[styles.fill, { width: `${members.length ? (readToday / members.length) * 100 : 0}%` }]}
            />
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.h2}>الترتيب حسب التقدم</Text>
          <Text style={styles.systemNote}>{readingSystemDaily(activeTeam.readingSystem)}</Text>

          {loading ? (
            <ActivityIndicator color={colors.em} style={styles.loading} />
          ) : sorted.length === 0 ? (
            <Text style={styles.empty}>
              ما من أعضاء بعد.{'\n'}شارك رمز الدعوة مع أصدقائك.
            </Text>
          ) : (
            sorted.map((member, index) => (
              <MemberRow
                key={member.userId}
                member={member}
                rank={index + 1}
                isMe={member.userId === user?.uid}
                readToday={member.lastReadDate === todayKey}
                nudged={nudged.has(member.userId)}
                onNudge={() => nudge(member)}
              />
            ))
          )}

          <Button
            label="حدّث تقدمي"
            onPress={() => navigationRef.navigate('Update')}
            style={styles.cta}
          />

          {isCreator ? (
            <>
              <Button
                label="تعديل اسم الفريق"
                variant="outline"
                onPress={() => setRenameOpen(true)}
                style={styles.cta}
              />
              <Button
                label={deleting ? 'جارٍ الحذف…' : 'حذف الفريق'}
                danger
                onPress={() => setConfirmDelete(true)}
                style={styles.deleteBtn}
              />
            </>
          ) : null}
        </View>
      </ScrollView>

      <InputDialog
        visible={renameOpen}
        title="تعديل اسم الفريق"
        label="اسم الفريق"
        initialValue={activeTeam.name}
        confirmLabel="حفظ"
        onCancel={() => setRenameOpen(false)}
        onSubmit={async (value) => {
          await renameTeam(activeTeam.id, value);
          setRenameOpen(false);
          toast.show('تم تحديث اسم الفريق');
        }}
      />

      <ConfirmDialog
        visible={confirmDelete}
        title="حذف الفريق؟"
        message="غادي يتحذف الفريق لكل الأعضاء، وما تقدرش ترجّعو. متأكد؟"
        cancelLabel="إلغاء"
        confirmLabel="حذف"
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
    </View>
  );
}

function MemberRow({
  member,
  rank,
  isMe,
  readToday,
  nudged,
  onNudge,
}: {
  member: Membership;
  rank: number;
  isMe: boolean;
  readToday: boolean;
  nudged: boolean;
  onNudge: () => void;
}) {
  const hizb = member.latestPage >= 1 ? pageToHizb(member.latestPage) : 0;
  const surah = hizb > 0 ? describeProgress(member.latestPage).surahName : '';
  const isFirst = rank === 1;
  const showStreak = readToday || isMe;

  return (
    <>
      <View style={[styles.row, isMe && styles.rowMe]}>
        <Text style={[styles.rank, isFirst && styles.rankFirst]}>{rank}</Text>
        <View style={styles.avatar}>
          <Text
            style={[
              styles.avatarLabel,
              { fontFamily: latinOr(member.displayName, fonts.display, fonts.latinBold) },
            ]}
          >
            {member.displayName.trim().charAt(0) || '؟'}
          </Text>
        </View>
        <View style={styles.rowGrow}>
          <View style={styles.nameLine}>
            <Text style={[styles.name, { fontFamily: latinOr(member.displayName, fonts.bodySemi, fonts.latinSemi) }]}>
              {member.displayName}
            </Text>
            {isMe ? <Text style={styles.tag}>أنت</Text> : null}
          </View>
          <Text style={styles.meta}>الحزب {hizb} · {surah || 'لم يبدأ بعد'}</Text>
          <Strip filled={hizb} gold={isFirst} />
        </View>
        <View style={styles.side}>
          {showStreak ? (
            <View style={[styles.streakPill, member.streak > 0 && styles.streakPillOn]}>
              {member.streak > 0 ? <FlameIcon width={14} height={14} /> : null}
              <Text style={[styles.streakLabel, member.streak > 0 && styles.streakLabelOn]}>
                {member.streak} {member.streak === 1 ? 'يوم' : 'أيام'}
              </Text>
            </View>
          ) : (
            <Pressable
              style={[styles.nudge, nudged && styles.nudgeDone]}
              disabled={nudged}
              onPress={onNudge}
              accessibilityRole="button"
              accessibilityState={{ disabled: nudged }}
              accessibilityLabel={`تذكير ${member.displayName}`}
            >
              <Text style={[styles.nudgeLabel, nudged && styles.nudgeLabelDone]}>
                {nudged ? 'تم التذكير' : 'ذكّره'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </>
  );
}

function CopyIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        d="M9 9h11v11H9z"
        stroke={colors.gold}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M5 15V6a2 2 0 012-2h9"
        stroke={colors.gold}
        strokeWidth={2}
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
  hero: {
    backgroundColor: colors.em,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
  },
  heroSub: {
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
  code: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    minHeight: 44,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.gold,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  codeLabel: {
    fontFamily: fonts.latinSemi,
    fontSize: 14,
    color: colors.gold,
    letterSpacing: 3,
  },
  today: {
    marginTop: 14,
    fontSize: 14,
    color: colors.heroSoft,
  },
  bar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.tickOff,
    marginTop: 6,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: 4,
  },
  body: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 24,
  },
  h2: {
    fontFamily: fonts.display,
    fontSize: 19,
    color: colors.ink,
  },
  systemNote: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.mute,
    marginTop: 4,
    marginBottom: 10,
  },
  loading: {
    marginTop: 24,
  },
  empty: {
    textAlign: 'center',
    color: colors.mute,
    paddingVertical: 22,
    paddingHorizontal: 10,
    fontSize: 14,
    lineHeight: 26,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowMe: {
    backgroundColor: colors.meRow,
    marginHorizontal: -22,
    paddingHorizontal: 22,
    borderBottomColor: 'transparent',
  },
  rank: {
    width: 20,
    textAlign: 'center',
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.mute,
  },
  rankFirst: {
    color: colors.gold,
    fontSize: 22,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.em,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.gold,
  },
  rowGrow: {
    flex: 1,
    minWidth: 0,
  },
  nameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.ink,
  },
  tag: {
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: colors.em,
    color: colors.white,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  meta: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.mute,
    marginTop: 2,
  },
  side: {
    justifyContent: 'center',
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.chipBg,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  streakPillOn: {
    backgroundColor: colors.gold,
  },
  streakLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.mute,
  },
  streakLabelOn: {
    color: colors.goldInk,
  },
  nudge: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: colors.gold,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nudgeDone: {
    borderColor: colors.line,
  },
  nudgeLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.goldText,
  },
  nudgeLabelDone: {
    color: colors.mute,
  },
  cta: {
    marginTop: 14,
  },
  deleteBtn: {
    marginTop: 10,
  },
  noTeam: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
    backgroundColor: colors.paper,
  },
  noTeamText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.mute,
    textAlign: 'center',
  },
});
