import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { READING_SYSTEMS, readingSystemDaily } from '@/core/constants/readingSystems';
import { colors } from '@/core/theme/colors';
import { fonts } from '@/core/theme/fonts';
import { ReadingSystem } from '@/domain/entities/Team';
import { errorMessage } from '@/core/utils/errorMessage';
import { Button } from '@/presentation/components/Button';
import { BottomSheet } from '@/presentation/components/BottomSheet';
import { Segmented } from '@/presentation/components/Chips';
import { Field } from '@/presentation/components/Field';
import { useActiveTeam } from '@/presentation/context/ActiveTeamContext';
import { useToast } from '@/presentation/components/Toast';

interface TeamSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function TeamSheet({ visible, onClose }: TeamSheetProps) {
  const { createTeam, joinByCode } = useActiveTeam();
  const toast = useToast();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [system, setSystem] = useState<ReadingSystem>('free');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const trimmedName = name.trim();
  const trimmedCode = code.trim().toUpperCase();
  const valid = mode === 'create' ? trimmedName.length >= 2 : trimmedCode.length === 5;

  const reset = () => {
    setName('');
    setCode('');
    setSystem('free');
    setError('');
    setBusy(false);
  };

  const handleSubmit = async () => {
    setError('');
    if (!valid) {
      return;
    }
    setBusy(true);
    try {
      if (mode === 'create') {
        await createTeam(trimmedName, system);
        toast.show('تم إنشاء الفريق، شارك الرمز مع أصدقائك');
      } else {
        await joinByCode(trimmedCode);
        toast.show('انضممت للفريق');
      }
      reset();
      onClose();
    } catch (caught) {
      setError(
        errorMessage(caught, mode === 'create' ? 'تعذر إنشاء الفريق' : 'تعذر الانضمام للفريق'),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Segmented
        options={[
          { key: 'create', label: 'إنشاء فريق' },
          { key: 'join', label: 'انضمام برمز' },
        ]}
        value={mode}
        onChange={(key) => {
          setMode(key as 'create' | 'join');
          setError('');
        }}
      />

      {mode === 'create' ? (
        <>
          <Field
            label="اسم الفريق"
            value={name}
            onChangeText={(value) => {
              setName(value);
              setError('');
            }}
            autoCapitalize="words"
          />
          <Text style={styles.sectionLabel}>نظام القراءة اليومي</Text>
          <Segmented
            options={READING_SYSTEMS.map((option) => ({
              key: option.key,
              label: option.label,
            }))}
            value={system}
            onChange={(key) => setSystem(key as ReadingSystem)}
          />
          <Text style={styles.systemHint}>{readingSystemDaily(system)}</Text>
        </>
      ) : (
        <Field
          label="رمز الدعوة (5 رموز)"
          value={code}
          onChangeText={(value) => {
            setCode(value);
            setError('');
          }}
          autoCapitalize="characters"
          dirLtr
        />
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        label={mode === 'create' ? 'إنشاء' : 'انضمام'}
        onPress={handleSubmit}
        loading={busy}
        disabled={!valid}
      />
      <Text style={styles.cancel} onPress={onClose}>
        إلغاء
      </Text>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    color: colors.ink,
    fontFamily: fonts.bodyMd,
    fontSize: 15,
    marginBottom: 8,
  },
  systemHint: {
    color: colors.mute,
    fontFamily: fonts.body,
    fontSize: 13,
    marginTop: 8,
    marginBottom: 4,
  },
  error: {
    color: colors.danger,
    fontFamily: fonts.body,
    fontSize: 13,
    marginTop: 4,
  },
  cancel: {
    color: colors.mute,
    fontFamily: fonts.body,
    fontSize: 15,
    textAlign: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
});