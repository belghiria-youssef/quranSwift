import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/core/theme/colors';
import { fonts, latinOr } from '@/core/theme/fonts';
import { MainTabParamList } from '@/navigation/types';
import { navigationRef } from '@/navigation/navigationRef';
import { Button } from '@/presentation/components/Button';
import { ConfirmDialog } from '@/presentation/components/ConfirmDialog';
import { InputDialog } from '@/presentation/components/InputDialog';
import { TimeDialog } from '@/presentation/components/TimeDialog';
import { Strip } from '@/presentation/components/Strip';
import { Toggle } from '@/presentation/components/Toggle';
import { useToast } from '@/presentation/components/Toast';
import { useAuth } from '@/presentation/hooks/useAuth';
import { useProfile } from '@/presentation/hooks/useProfile';
import { useProfileDates } from '@/presentation/hooks/useProfileDates';
import { bestStreak, recentHeatmap } from '@/domain/usecases/readingHistory';
import { describeProgress, pageToHizb } from '@/domain/usecases/quranProgress';
import {
  ensureReminderPermission,
  loadReminder,
  notificationsAvailable,
  ReminderState,
  saveReminder,
  scheduleDailyReminder,
} from '@/presentation/utils/dailyReminder';

type Props = BottomTabScreenProps<MainTabParamList, 'Profile'>;

const HEATMAP_WEEKS = 5;
const BADGES = [
  { target: 3, label: 'البداية' },
  { target: 7, label: 'الأسبوع' },
  { target: 14, label: 'الأسبوعين' },
  { target: 30, label: 'الشهر' },
];

export function ProfileScreen(_props: Props) {
  const { user, signOut, renameSelf } = useAuth();
  const { entries, loading } = useProfile();
  const dates = useProfileDates();
  const toast = useToast();
  const [reminder, setReminder] = useState<ReminderState>({ on: false, hour: 21, minute: 0 });
  const [reminderBusy, setReminderBusy] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    let active = true;
    loadReminder().then((state) => {
      if (!active) {
        return;
      }
      setReminder(state);
      if (state.on && notificationsAvailable()) {
        scheduleDailyReminder(state.hour, state.minute).catch(() => undefined);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const toggleReminder = async (next: boolean) => {
    if (reminderBusy) {
      return;
    }
    setReminderBusy(true);
    try {
      if (next) {
        if (notificationsAvailable()) {
          const granted = await ensureReminderPermission();
          if (!granted) {
            toast.show('لازم تسمح بالإشعارات باش نذكّروك');
            return;
          }
        }
        await saveReminder({ on: true, hour: reminder.hour, minute: reminder.minute });
        setReminder({ ...reminder, on: true });
        toast.show(
          notificationsAvailable()
            ? 'تم تفعيل التذكير اليومي'
            : 'تم التفعيل، وغادي يوصل التذكير فالنسخة النهائية',
        );
      } else {
        await saveReminder({ on: false, hour: reminder.hour, minute: reminder.minute });
        setReminder({ ...reminder, on: false });
        toast.show('تم إيقاف التذكير');
      }
    } catch {
      toast.show('تعذر تحديث التذكير');
    } finally {
      setReminderBusy(false);
    }
  };

  const { streak, latestPage } = useMemo(() => {
    const memberships = entries.map((entry) => entry.membership).filter(Boolean);
    const streak = Math.max(0, ...memberships.map((m) => m!.streak));
    const latestPage = Math.max(0, ...memberships.map((m) => m!.latestPage));
    return { streak, latestPage };
  }, [entries]);

  const heatmap = useMemo(() => recentHeatmap(dates, HEATMAP_WEEKS * 7), [dates]);
  const best = Math.max(bestStreak(dates), streak);

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.grow}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroRow}>
            <View style={styles.avatar}>
              <Text
                style={[
                  styles.avatarLabel,
                  { fontFamily: latinOr(user?.displayName, fonts.display, fonts.latinBold) },
                ]}
              >
                {user?.displayName?.trim().charAt(0) || '؟'}
              </Text>
            </View>
            <View style={styles.heroText}>
              <Text
                style={[styles.name, { fontFamily: latinOr(user?.displayName, fonts.display, fonts.latinBold) }]}
              >
                {user?.displayName}
              </Text>
              <Text style={styles.email}>{user?.email}</Text>
            </View>
          </View>

          <View style={styles.stats}>
            <Stat number={streak} label="أيام متتالية" index={0} />
            <Stat number={latestPage} label="صفحة" index={1} />
            <Stat number={entries.length} label="فرق" index={2} />
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.h2}>نشاطي</Text>
          <HeatmapGrid data={heatmap} />
          <Text style={styles.caption}>آخر {HEATMAP_WEEKS} أسابيع، كل مربع يوم</Text>

          <View style={styles.badges}>
            {BADGES.map((badge) => {
              const unlocked = best >= badge.target;
              return (
                <View key={badge.target} style={[styles.badgeCard, unlocked && styles.badgeCardOn]}>
                  <View style={[styles.badgeCircle, unlocked && styles.badgeCircleOn]}>
                    <Text style={[styles.badgeNum, unlocked && styles.badgeNumOn]}>{badge.target}</Text>
                  </View>
                  <Text style={[styles.badgeLabel, unlocked && styles.badgeLabelOn]}>{badge.label}</Text>
                </View>
              );
            })}
          </View>

          <Text style={styles.h2}>تقدمي في الفرق</Text>
          {loading ? (
            <Text style={styles.empty}>جارٍ التحميل…</Text>
          ) : entries.length === 0 ? (
            <Text style={styles.empty}>ما عندك حتى فريق.</Text>
          ) : (
            entries.map((entry) => {
              const membership = entry.membership;
              const hizb =
                membership && membership.latestPage >= 1 ? pageToHizb(membership.latestPage) : 0;
              const percentage =
                membership && membership.latestPage >= 1
                  ? describeProgress(membership.latestPage).percentage
                  : 0;
              return (
                <View key={entry.teamId} style={styles.teamRow}>
                  <View style={styles.teamRowGrow}>
                    <Text style={[styles.teamName, { fontFamily: latinOr(entry.teamName, fonts.bodySemi, fonts.latinSemi) }]}>
                      {entry.teamName}
                    </Text>
                    <Text style={styles.teamMeta}>
                      الحزب {hizb} · {percentage}%
                    </Text>
                  </View>
                  <Strip filled={hizb} style={styles.strip} />
                </View>
              );
            })
          )}

          <View style={styles.reminderRow}>
            <View style={styles.teamRowGrow}>
              <Text style={styles.reminderTitle}>تذكير يومي</Text>
              <Text style={styles.reminderSub}>قبل ما تضيع السلسلة</Text>
            </View>
            <Toggle
              value={reminder.on}
              onChange={toggleReminder}
              disabled={reminderBusy}
              accessibilityLabel="تذكير يومي"
            />
          </View>

          {reminder.on ? (
            <Pressable
              style={styles.timeRow}
              onPress={() => setTimeOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="تغيير وقت التذكير"
            >
              <Text style={styles.reminderTitle}>وقت التذكير</Text>
              <Text style={styles.timeValue}>
                {String(reminder.hour).padStart(2, '0')}:
                {String(reminder.minute).padStart(2, '0')}
              </Text>
            </Pressable>
          ) : null}

          <Button
            label="تعديل الاسم"
            variant="outline"
            onPress={() => setRenameOpen(true)}
            style={styles.logout}
          />

          <Button
            label="تسجيل الخروج"
            danger
            onPress={() => setConfirmLogout(true)}
            style={styles.logoutSmall}
          />
        </View>
      </ScrollView>

      <TimeDialog
        visible={timeOpen}
        hour={reminder.hour}
        minute={reminder.minute}
        onCancel={() => setTimeOpen(false)}
        onConfirm={async (hour, minute) => {
          await saveReminder({ on: true, hour, minute });
          setReminder({ on: true, hour, minute });
          setTimeOpen(false);
          toast.show('تم تحديث وقت التذكير');
        }}
      />

      <InputDialog
        visible={renameOpen}
        title="تعديل الاسم"
        label="الاسم"
        initialValue={user?.displayName ?? ''}
        confirmLabel="حفظ"
        onCancel={() => setRenameOpen(false)}
        onSubmit={async (value) => {
          await renameSelf(value);
          setRenameOpen(false);
          toast.show('تم تحديث الاسم');
        }}
      />

      <ConfirmDialog
        visible={confirmLogout}
        title="تسجيل الخروج؟"
        message="تقدمك محفوظ، وتقدر ترجع فأي وقت."
        cancelLabel="إلغاء"
        confirmLabel="خروج"
        danger
        onCancel={() => setConfirmLogout(false)}
        onConfirm={async () => {
          await signOut().catch(() => undefined);
          navigationRef.reset({ index: 0, routes: [{ name: 'Auth', params: {} }] });
        }}
      />
    </View>
  );
}

function Stat({ number, label, index }: { number: number; label: string; index: number }) {
  return (
    <View style={[styles.stat, index > 0 && styles.statBorder]}>
      <Text style={styles.statNum}>{number}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function HeatmapGrid({ data }: { data: boolean[] }) {
  const cells = [...data];
  while (cells.length < HEATMAP_WEEKS * 7) {
    cells.push(false);
  }
  const rows: boolean[][] = [];
  for (let i = 0; i < HEATMAP_WEEKS; i++) {
    rows.push(cells.slice(i * 7, i * 7 + 7));
  }
  return (
    <View style={styles.grid}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.gridRow}>
          {row.map((on, cellIndex) => (
            <View key={`${rowIndex}-${cellIndex}`} style={[styles.cell, on && styles.cellOn]} />
          ))}
        </View>
      ))}
    </View>
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
    paddingBottom: 24,
  },
  hero: {
    backgroundColor: colors.em,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 24,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: {
    fontFamily: fonts.display,
    fontSize: 30,
    color: colors.em,
  },
  heroText: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: fonts.display,
    fontSize: 23,
    color: colors.heroText,
  },
  email: {
    fontFamily: fonts.latin,
    fontSize: 13,
    color: colors.heroSub,
    marginTop: 2,
  },
  stats: {
    flexDirection: 'row',
    marginTop: 14,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statBorder: {
    borderStartWidth: 1,
    borderStartColor: '#24524a',
  },
  statNum: {
    fontFamily: fonts.display,
    fontSize: 30,
    color: colors.gold,
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.heroSub,
    marginTop: 2,
  },
  body: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 14,
  },
  h2: {
    fontFamily: fonts.display,
    fontSize: 19,
    color: colors.ink,
  },
  grid: {
    marginTop: 10,
    marginBottom: 6,
    gap: 5,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 5,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 5,
    backgroundColor: colors.heatOff,
  },
  cellOn: {
    backgroundColor: colors.gold,
  },
  caption: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.mute,
    marginBottom: 16,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  badgeCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.chipBg,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 2,
    gap: 4,
    opacity: 0.55,
  },
  badgeCardOn: {
    backgroundColor: colors.em,
    opacity: 1,
  },
  badgeCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.stripOff,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCircleOn: {
    backgroundColor: colors.gold,
  },
  badgeNum: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.mute,
  },
  badgeNumOn: {
    color: colors.em,
  },
  badgeLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.mute,
  },
  badgeLabelOn: {
    color: colors.heroSoft,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  teamRowGrow: {
    flex: 1,
    minWidth: 0,
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
  strip: {
    width: 80,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  reminderTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.ink,
  },
  reminderSub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.mute,
    marginTop: 2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  timeValue: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.em,
  },
  logout: {
    marginTop: 16,
  },
  logoutSmall: {
    marginTop: 10,
  },
  empty: {
    textAlign: 'center',
    color: colors.mute,
    paddingVertical: 18,
    fontSize: 14,
    lineHeight: 26,
  },
});
