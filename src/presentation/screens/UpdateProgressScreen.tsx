import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { SURAHS } from '@/core/constants/surahs';
import { colors } from '@/core/theme/colors';
import { fonts } from '@/core/theme/fonts';
import { errorMessage } from '@/core/utils/errorMessage';
import { ProgressUnit } from '@/domain/entities/Progress';
import {
  describeProgress,
  isValidHizb,
  isValidJuz,
  isValidSurah,
  pageToHizb,
  pageToJuz,
  pageToSurah,
  unitEndPage,
} from '@/domain/usecases/quranProgress';
import { bestStreak, hasReadToday } from '@/domain/usecases/readingHistory';
import { RootStackParamList } from '@/navigation/types';
import { Button } from '@/presentation/components/Button';
import { CelebrateDialog } from '@/presentation/components/CelebrateDialog';
import { Segmented, TeamChips } from '@/presentation/components/Chips';
import { Field } from '@/presentation/components/Field';
import { useToast } from '@/presentation/components/Toast';
import { useActiveTeam } from '@/presentation/context/ActiveTeamContext';
import { useAuth } from '@/presentation/hooks/useAuth';
import { useMyReadingDates } from '@/presentation/hooks/useMyReadingDates';
import { useRecordProgress } from '@/presentation/hooks/useRecordProgress';
import { useTeamMembers } from '@/presentation/hooks/useTeamMembers';

type Props = NativeStackScreenProps<RootStackParamList, 'Update'>;

const UNITS: { key: ProgressUnit; label: string; max: number }[] = [
  { key: 'hizb', label: 'حزب', max: 60 },
  { key: 'juz', label: 'جزء', max: 30 },
  { key: 'surah', label: 'سورة', max: 114 },
];

const isValidValue = (unit: ProgressUnit, value: number): boolean => {
  if (unit === 'hizb') {
    return isValidHizb(value);
  }
  if (unit === 'juz') {
    return isValidJuz(value);
  }
  if (unit === 'surah') {
    return isValidSurah(value);
  }
  return false;
};

const clamp = (value: number, max: number): number =>
  Math.min(Math.max(Math.trunc(value), 1), max);

const quickAmounts = (unit: ProgressUnit) => {
  if (unit === 'hizb') {
    return ['حزب', 'أحزاب', 'أحزاب'];
  }
  if (unit === 'juz') {
    return ['جزء', 'أجزاء', 'أجزاء'];
  }
  return ['سورة', 'سور', 'سور'];
};

export function UpdateProgressScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { activeTeam, teams, setActiveTeamId } = useActiveTeam();
  const { members } = useTeamMembers(activeTeam?.id ?? '');
  const myDates = useMyReadingDates(activeTeam?.id ?? '');
  const recordProgress = useRecordProgress();
  const toast = useToast();

  const current = members.find((member) => member.userId === user?.uid) ?? null;

  const baseFor = (unitKey: ProgressUnit): number => {
    if (!current || current.latestPage < 1) {
      return 0;
    }
    if (unitKey === 'juz') {
      return pageToJuz(current.latestPage);
    }
    if (unitKey === 'surah') {
      return pageToSurah(current.latestPage).number;
    }
    return pageToHizb(current.latestPage);
  };

  const options =
    !activeTeam || activeTeam.readingSystem === 'free'
      ? UNITS
      : UNITS.filter((option) => option.key === activeTeam.readingSystem);

  const [unit, setUnit] = useState<ProgressUnit>(options[0]?.key ?? 'hizb');
  const [value, setValue] = useState(() => Math.max(1, baseFor(unit)));
  const [surahQuery, setSurahQuery] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [celebration, setCelebration] = useState<{ streak: number; best: number } | null>(null);

  const activeUnit = options.find((option) => option.key === unit);
  const isSurahMode = unit === 'surah';
  const valid = isValidValue(unit, value);
  const preview = valid ? describeProgress(unitEndPage(unit, value)) : null;
  const base = valid ? baseFor(unit) : 0;
  const delta = valid ? value - base : 0;

  const filteredSurahs = useMemo(() => {
    const query = surahQuery.trim();
    if (query === '') {
      return [];
    }
    const isNumber = /^\d+$/.test(query) ? Number(query) : null;
    return SURAHS.filter(
      (surah) =>
        surah.name.includes(query) || (isNumber !== null && surah.number === isNumber),
    ).slice(0, 20);
  }, [surahQuery]);

  if (!activeTeam) {
    return (
      <View style={styles.noTeam}>
        <Text style={styles.mutedLine}>ما عندك حتى فريق لتسجل فيه التقدم.</Text>
        <Button label="رجوع" onPress={() => navigation.goBack()} variant="outline" />
      </View>
    );
  }

  const switchUnit = (key: string) => {
    const next = key as ProgressUnit;
    setUnit(next);
    const preferredMax = UNITS.find((option) => option.key === next)?.max ?? 60;
    setValue(clamp(Math.max(baseFor(next), 1), preferredMax));
    setSurahQuery('');
    setError('');
  };

  const stepBy = (amount: number) => {
    const max = activeUnit?.max ?? 60;
    setValue((v) => clamp(Math.max(1, v) + amount, max));
    setError('');
  };

  const firstToday = !hasReadToday(myDates);

  const landing = () => {
    navigation.navigate('Tabs', { screen: 'Team' });
  };

  const handleSave = async () => {
    setError('');
    if (!preview) {
      setError(isSurahMode ? 'اختر سورة أولًا' : `اختر قيمة من 1 إلى ${activeUnit?.max ?? 114}`);
      return;
    }
    setSaving(true);
    try {
      await recordProgress(activeTeam.id, preview.page);
      if (firstToday) {
        const nextStreak = (current?.streak ?? 0) + 1;
        setCelebration({ streak: nextStreak, best: Math.max(bestStreak(myDates), nextStreak) });
      } else {
        toast.show('تم الحفظ');
        landing();
      }
    } catch (caught) {
      setError(errorMessage(caught, 'تعذر حفظ التقدم'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <View style={styles.header}>
            <Pressable
              style={styles.close}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="إغلاق"
            >
              <Svg width={20} height={20} viewBox="0 0 24 24">
                <Path
                  d="M6 6l12 12M18 6L6 18"
                  stroke={colors.white}
                  strokeWidth={2.2}
                  strokeLinecap="round"
                />
              </Svg>
            </Pressable>
            <Text style={styles.headerTitle}>تحديث التقدم</Text>
            <View style={styles.closeSpacer} />
          </View>
          <Text style={styles.h1}>أين وصلت؟</Text>

          {teams.length > 1 ? (
            <TeamChips
              options={teams.map((team) => ({ key: team.id, label: team.name }))}
              value={activeTeam.id}
              onChange={(teamId) => {
                setActiveTeamId(teamId);
                setValue(Math.max(1, baseFor(unit)));
                setSurahQuery('');
              }}
            />
          ) : null}
        </View>

        <View style={styles.body}>
          {options.length > 1 ? (
            <Segmented
              options={options.map((option) => ({ key: option.key, label: option.label }))}
              value={unit}
              onChange={switchUnit}
            />
          ) : null}

          <View style={styles.stepperCard}>
            <View style={styles.stepper}>
              <StepButton
                label="-"
                disabled={value <= 1}
                onStep={() => stepBy(-1)}
              />
              <TextInput
                style={styles.stepValue}
                value={value === 0 ? '' : String(value)}
                onChangeText={(text) => {
                  const digits = text.replace(/[^0-9]/g, '');
                  const parsed = digits === '' ? 0 : Number(digits);
                  const max = activeUnit?.max ?? 60;
                  setValue(parsed > max ? max : parsed);
                  setError('');
                }}
                keyboardType="number-pad"
                maxLength={3}
                textAlign="center"
                accessibilityLabel="قيمة التقدم"
              />
              <StepButton label="+" onStep={() => stepBy(1)} />
            </View>
            <Text style={styles.range}>من 1 إلى {activeUnit?.max ?? 60}</Text>

            <View style={styles.quickRow}>
              {[1, 2, 3].map((amount) => {
                const max = activeUnit?.max ?? 60;
                const label = `+${amount} ${quickAmounts(unit)[amount - 1]}`;
                return (
                  <Pressable
                    key={amount}
                    style={[styles.quick, value + amount > max && styles.quickDisabled]}
                    onPress={() => stepBy(amount)}
                    disabled={value + amount > max}
                    accessibilityRole="button"
                    accessibilityLabel={label}
                  >
                    <Text style={styles.quickLabel}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {isSurahMode ? (
            <View style={styles.searchCard}>
              <Field
                placeholder="ابحث عن السورة بالاسم أو الرقم"
                value={surahQuery}
                onChangeText={(text) => {
                  setSurahQuery(text);
                  setError('');
                }}
              />
              {surahQuery.trim() === '' ? (
                <Text style={styles.noResult}>اكتب اسم السورة أو رقمها لعرض النتائج</Text>
              ) : filteredSurahs.length === 0 ? (
                <Text style={styles.noResult}>لا توجد نتائج مطابقة</Text>
              ) : (
                filteredSurahs.map((surah) => {
                  const selected = value === surah.number;
                  return (
                    <Pressable
                      key={surah.number}
                      style={[styles.surahRow, selected && styles.surahRowActive]}
                      onPress={() => {
                        setValue(surah.number);
                        setSurahQuery('');
                        setError('');
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                    >
                      <Text style={styles.surahNumber}>{surah.number}</Text>
                      <Text style={[styles.surahName, selected && styles.surahNameActive]}>
                        {surah.name}
                      </Text>
                      {selected ? <Text style={styles.tick}>✓</Text> : null}
                    </Pressable>
                  );
                })
              )}
            </View>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {preview ? (
            <View style={styles.previewBox}>
              <Text style={styles.previewSub}>موضعك الآن</Text>
              <Text style={styles.previewMain}>{preview.surahName}</Text>
              <Text style={styles.previewLine}>
                الجزء {preview.juz} · الحزب {preview.hizb} · {preview.percentage}%
              </Text>
              <DeltaLine delta={delta} base={base} value={value} unit={activeUnit?.label ?? 'حزب'} />
            </View>
          ) : null}

          <Button
            label={saving ? 'جارٍ الحفظ…' : 'احفظ'}
            onPress={handleSave}
            loading={saving}
            disabled={delta === 0}
            variant="gold"
            style={styles.save}
          />
        </View>
      </ScrollView>

      <CelebrateDialog
        visible={celebration !== null}
        streak={celebration?.streak ?? 0}
        best={celebration?.best ?? 0}
        onClose={() => {
          setCelebration(null);
          landing();
        }}
      />
    </>
  );
}

function StepButton({ label, onStep, disabled = false }: { label: string; onStep: () => void; disabled?: boolean }) {
  const [timer, setTimer] = useState<ReturnType<typeof setInterval> | null>(null);

  const clear = () => {
    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
  };

  return (
    <Pressable
      style={[styles.stepBtn, disabled && styles.stepBtnDisabled]}
      disabled={disabled}
      onPressIn={() => {
        onStep();
        setTimer(setInterval(onStep, 240));
      }}
      onPressOut={clear}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.stepLabel}>{label}</Text>
    </Pressable>
  );
}

function DeltaLine({
  delta,
  base,
  value,
  unit,
}: {
  delta: number;
  base: number;
  value: number;
  unit: string;
}) {
  if (delta > 0) {
    return <Text style={styles.deltaOk}>{`من ${base} إلى ${value}، +${delta} ${unit}`}</Text>;
  }
  if (delta < 0) {
    return <Text style={styles.deltaDanger}>تنبيه: هاد القيمة غادي تنقص من تقدمك</Text>;
  }
  return <Text style={styles.deltaMute}>ما تبدل شي</Text>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
    direction: 'rtl',
  },
  content: {
    paddingBottom: 40,
  },
  hero: {
    backgroundColor: colors.em,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeSpacer: {
    width: 44,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.heroSub,
  },
  h1: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.heroText,
    lineHeight: 34,
  },
  body: {
    paddingHorizontal: 22,
    paddingTop: 18,
  },
  stepperCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginTop: 14,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  stepBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: colors.em,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: {
    opacity: 0.3,
  },
  stepLabel: {
    fontFamily: fonts.display,
    fontSize: 30,
    color: colors.em,
    lineHeight: 34,
  },
  stepValue: {
    fontFamily: fonts.display,
    fontSize: 76,
    color: colors.em,
    minWidth: 104,
    textAlign: 'center',
    paddingVertical: 0,
  },
  range: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.mute,
    textAlign: 'center',
    marginTop: 2,
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  quick: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickDisabled: {
    opacity: 0.35,
  },
  quickLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.em,
  },
  searchCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    marginTop: 14,
  },
  surahRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  surahRowActive: {
    backgroundColor: colors.paper,
    borderRadius: 10,
  },
  surahNumber: {
    width: 34,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.mute,
    textAlign: 'center',
  },
  surahName: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
  },
  surahNameActive: {
    fontFamily: fonts.bodySemi,
    color: colors.em2,
  },
  tick: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ok,
  },
  noResult: {
    fontFamily: fonts.body,
    color: colors.mute,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
  },
  previewBox: {
    backgroundColor: colors.em,
    borderRadius: 18,
    padding: 18,
    marginTop: 16,
    alignItems: 'center',
  },
  previewSub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.heroSub,
  },
  previewMain: {
    fontFamily: fonts.display,
    fontSize: 30,
    color: colors.gold,
    marginTop: 2,
  },
  previewLine: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.heroSub,
    marginTop: 6,
  },
  deltaOk: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.ok,
    marginTop: 10,
  },
  deltaDanger: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.danger,
    marginTop: 10,
  },
  deltaMute: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.mute,
    marginTop: 10,
  },
  error: {
    fontFamily: fonts.body,
    color: colors.danger,
    textAlign: 'center',
    marginTop: 12,
  },
  save: {
    marginTop: 18,
  },
  noTeam: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
    backgroundColor: colors.paper,
  },
  mutedLine: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.heroSub,
    textAlign: 'center',
  },
});
