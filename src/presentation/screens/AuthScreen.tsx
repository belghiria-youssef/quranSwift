import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '@/core/theme/colors';
import { fonts } from '@/core/theme/fonts';
import { Button } from '@/presentation/components/Button';
import { Segmented } from '@/presentation/components/Chips';
import { Field } from '@/presentation/components/Field';
import { Hero } from '@/presentation/components/Hero';
import { useToast } from '@/presentation/components/Toast';
import { useAuth } from '@/presentation/hooks/useAuth';
import { GoogleSignInButton, isGoogleConfigured } from '@/presentation/hooks/useGoogleAuth';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export function AuthScreen() {
  const { signIn, signUp, resetPassword } = useAuth();
  const toast = useToast();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [resetting, setResetting] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);

  const showGoogle = isGoogleConfigured();

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();
    let ok = true;
    if (mode === 'up' && trimmedName.length < 2) {
      setNameError('اكتب اسمك');
      ok = false;
    } else {
      setNameError('');
    }
    if (!EMAIL_RE.test(trimmedEmail)) {
      setEmailError('اكتب بريد إلكتروني صحيح');
      ok = false;
    } else {
      setEmailError('');
    }
    if (password.length < 6) {
      setPasswordError('كلمة المرور 6 رموز على الأقل');
      ok = false;
    } else {
      setPasswordError('');
    }
    if (!ok) {
      return;
    }
    setLoading(true);
    try {
      if (mode === 'up') {
        await signUp({ displayName: trimmedName, email: trimmedEmail, password });
      } else {
        await signIn({ email: trimmedEmail, password });
      }
    } catch {
      setEmailError('تعذر الدخول، تحقق من البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    const trimmedEmail = email.trim();
    if (!EMAIL_RE.test(trimmedEmail)) {
      setEmailError('اكتب بريد إلكتروني صحيح');
      return;
    }
    setEmailError('');
    setLoading(true);
    try {
      await resetPassword(trimmedEmail);
      toast.show('صيفطنا ليك رابط استعادة كلمة المرور');
      setResetting(false);
    } catch {
      setEmailError('تعذر إرسال الرابط، تحقق من البريد');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Hero padTop={44} style={styles.hero}>
          <Text style={styles.brand}>QuranSwift</Text>
          <Text style={styles.tagline}>
            نقرأ معا،{'\n'}ونتقدم معا
          </Text>
        </Hero>
        <View style={styles.body}>
          {resetting ? (
            <>
              <Text style={styles.resetTitle}>استعادة كلمة المرور</Text>
              <Text style={styles.resetHint}>
                دخل بريدك الإلكتروني وصيفطنا ليك رابط تبدل بيه كلمة المرور.
              </Text>
              <Field
                label="البريد الإلكتروني"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setEmailError('');
                }}
                error={emailError}
                placeholder="name@mail.com"
                keyboardType="email-address"
                dirLtr
              />
              <Button
                label="إرسال رابط الاستعادة"
                onPress={handleReset}
                loading={loading}
                style={styles.submit}
              />
              <Pressable
                style={styles.link}
                onPress={() => {
                  setResetting(false);
                  setEmailError('');
                }}
                accessibilityRole="button"
              >
                <Text style={styles.linkText}>رجوع</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Segmented
                options={[
                  { key: 'in', label: 'دخول' },
                  { key: 'up', label: 'حساب جديد' },
                ]}
                value={mode}
                onChange={(key) => setMode(key as 'in' | 'up')}
              />
              {mode === 'up' ? (
                <Field
                  label="الاسم"
                  value={name}
                  onChangeText={setName}
                  error={nameError}
                  autoCapitalize="words"
                />
              ) : null}
              <Field
                label="البريد الإلكتروني"
                value={email}
                onChangeText={setEmail}
                error={emailError}
                placeholder="name@mail.com"
                keyboardType="email-address"
                dirLtr
              />
              <Field
                label="كلمة المرور"
                value={password}
                onChangeText={setPassword}
                error={passwordError}
                secure
                dirLtr
              />
              {mode === 'in' ? (
                <Pressable
                  style={styles.link}
                  onPress={() => setResetting(true)}
                  accessibilityRole="button"
                >
                  <Text style={styles.linkText}>نسيت كلمة المرور؟</Text>
                </Pressable>
              ) : null}
              <Button
                label={
                  loading
                    ? mode === 'up'
                      ? 'جارٍ إنشاء الحساب…'
                      : 'جارٍ الدخول…'
                    : mode === 'up'
                      ? 'إنشاء حساب'
                      : 'تسجيل الدخول'
                }
                onPress={handleSubmit}
                loading={loading}
                style={styles.submit}
              />
              <Text style={styles.or}>أو</Text>
              {showGoogle ? (
                <GoogleSignInButton disabled={loading} />
              ) : (
                <Button
                  label="الدخول بحساب جوجل"
                  variant="outline"
                  onPress={() => toast.show('خاصك تضبط Google client ID فـ .env باش يخدم')}
                />
              )}
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.paper,
    direction: 'rtl',
  },
  container: {
    flexGrow: 1,
  },
  hero: {
    alignItems: 'center',
    paddingBottom: 36,
  },
  brand: {
    fontFamily: fonts.displayMd,
    fontSize: 20,
    color: colors.gold,
  },
  tagline: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.heroText,
    marginTop: 10,
    textAlign: 'center',
  },
  body: {
    padding: 24,
    paddingTop: 20,
  },
  resetTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.ink,
    marginBottom: 6,
  },
  resetHint: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.mute,
    lineHeight: 22,
    marginBottom: 14,
  },
  link: {
    alignSelf: 'flex-start',
    minHeight: 40,
    justifyContent: 'center',
    marginBottom: 6,
  },
  linkText: {
    fontFamily: fonts.bodyMd,
    fontSize: 14,
    color: colors.em,
  },
  submit: {
    marginTop: 4,
  },
  or: {
    textAlign: 'center',
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.mute,
    marginVertical: 12,
  },
});
