const messages: Record<string, string> = {
  'auth/invalid-email': 'البريد الإلكتروني غير صالح',
  'auth/missing-password': 'كلمة المرور مطلوبة',
  'auth/weak-password': 'كلمة المرور ضعيفة، استخدم 6 أحرف على الأقل',
  'auth/email-already-in-use': 'البريد الإلكتروني مستخدم بالفعل',
  'auth/invalid-credential': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
  'auth/user-not-found': 'لا يوجد حساب بهذا البريد الإلكتروني',
  'auth/wrong-password': 'كلمة المرور غير صحيحة',
  'auth/network-request-failed': 'تعذر الاتصال بالشبكة',
  'auth/operation-not-allowed': 'تسجيل الدخول بالبريد وكلمة المرور غير مفعّل',
  'auth/configuration-not-found': 'خدمة الحسابات غير مهيأة، فعّل البريد وكلمة المرور من إعدادات فايربيس',
  'auth/too-many-requests': 'محاولات كثيرة، حاول لاحقًا',
};

export function authErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = String((error as { code: unknown }).code);
    if (messages[code]) {
      return messages[code];
    }
  }
  return 'حدث خطأ غير متوقع، حاول مرة أخرى';
}
