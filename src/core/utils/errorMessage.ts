const firestoreMessages: Record<string, string> = {
  unavailable: 'تعذر الاتصال بالخادم، تحقق من الإنترنت',
  'permission-denied': 'لا تملك صلاحية تنفيذ هذا الإجراء',
  'not-found': 'العنصر غير موجود',
  'already-exists': 'العنصر موجود بالفعل',
  'failed-precondition': 'قاعدة البيانات غير مهيأة، تأكد من تفعيلها',
  'deadline-exceeded': 'انتهت مهلة الاتصال، حاول مرة أخرى',
};

export function errorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = String((error as { code: unknown }).code);
    if (firestoreMessages[code]) {
      return firestoreMessages[code];
    }
  }
  if (error instanceof Error && error.message && !/firebase|offline|network/i.test(error.message)) {
    return error.message;
  }
  return fallback;
}
