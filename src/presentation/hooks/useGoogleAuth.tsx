import { useEffect, useState } from 'react';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import { Button } from '@/presentation/components/Button';
import { useToast } from '@/presentation/components/Toast';
import { useAuth } from '@/presentation/hooks/useAuth';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

export function isGoogleConfigured(): boolean {
  return Boolean(WEB_CLIENT_ID);
}

let configured = false;
function ensureConfigured() {
  if (configured || !WEB_CLIENT_ID) {
    return;
  }
  GoogleSignin.configure({ webClientId: WEB_CLIENT_ID, offlineAccess: false });
  configured = true;
}

export function GoogleSignInButton({ disabled = false }: { disabled?: boolean }) {
  const { signInWithGoogle } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    ensureConfigured();
  }, []);

  const onPress = async () => {
    if (!WEB_CLIENT_ID) {
      toast.show('خاصك تضبط Google client ID فـ .env');
      return;
    }
    setBusy(true);
    try {
      ensureConfigured();
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (isSuccessResponse(response)) {
        const idToken = response.data.idToken;
        if (idToken) {
          await signInWithGoogle(idToken);
        } else {
          toast.show('تعذر الدخول بجوجل');
        }
      }
    } catch (error) {
      if (isErrorWithCode(error)) {
        if (error.code === statusCodes.IN_PROGRESS) {
          return;
        }
        if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          toast.show('خدمة Google Play ماشي متوفرة فهاد الجهاز');
          return;
        }
      }
      toast.show('تعذر الدخول بجوجل');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      label="الدخول بحساب جوجل"
      variant="outline"
      onPress={onPress}
      loading={busy}
      disabled={disabled}
    />
  );
}
