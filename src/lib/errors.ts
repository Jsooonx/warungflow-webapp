export const getFriendlyErrorMessage = (error: unknown, fallback = 'Something went wrong. Please try again.', lang: 'id' | 'en' = 'id') => {
  const rawMessage = error instanceof Error ? error.message : String(error || '');
  const message = rawMessage.toLowerCase();

  if (lang === 'en') {
    if (message.includes('failed to fetch') || message.includes('network')) {
      return 'Connection to database lost. Check your internet and try again.';
    }
    if (message.includes('invalid login credentials')) {
      return 'Email or password does not match. Please check and try again.';
    }
    if (message.includes('email not confirmed')) {
      return 'Email has not been verified. Check your inbox and click the verification link first.';
    }
    if (message.includes('user already registered')) {
      return 'This email is already registered. Please login or use password reset.';
    }
    if (message.includes('jwt') || message.includes('session') || message.includes('auth')) {
      return 'Login session issue. Please log out and log in again.';
    }
    if (message.includes('row-level security') || message.includes('permission') || message.includes('policy')) {
      return 'Database access denied. Make sure this account has correct workspace permissions.';
    }
    if (message.includes('invoice_sent_at') || message.includes('column')) {
      return 'Database update required. Run the latest Supabase schema, then try again.';
    }
    if (message.includes('duplicate') || message.includes('unique')) {
      return 'Duplicate data exists. Refresh the page and try again.';
    }
    return rawMessage || fallback;
  }

  // Indonesian fallback
  if (message.includes('failed to fetch') || message.includes('network')) {
    return 'Koneksi ke database terputus. Cek internet Anda lalu coba lagi.';
  }
  if (message.includes('invalid login credentials')) {
    return 'Email atau password belum cocok. Cek kembali lalu coba lagi.';
  }
  if (message.includes('email not confirmed')) {
    return 'Email belum diverifikasi. Buka inbox Anda dan klik link verifikasi terlebih dahulu.';
  }
  if (message.includes('user already registered')) {
    return 'Email ini sudah terdaftar. Silakan login atau gunakan reset password.';
  }
  if (message.includes('jwt') || message.includes('session') || message.includes('auth')) {
    return 'Sesi login bermasalah. Silakan logout lalu login ulang.';
  }
  if (message.includes('row-level security') || message.includes('permission') || message.includes('policy')) {
    return 'Akses database ditolak. Pastikan akun ini punya izin workspace yang benar.';
  }
  if (message.includes('invoice_sent_at') || message.includes('column')) {
    return 'Database perlu di-update. Jalankan schema Supabase terbaru, lalu coba lagi.';
  }
  if (message.includes('duplicate') || message.includes('unique')) {
    return 'Data yang sama sudah ada. Refresh halaman lalu coba lagi.';
  }

  return rawMessage || fallback;
};

