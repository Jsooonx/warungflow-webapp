import React from 'react';
import { Clock3, LogOut, MessageCircle, ShieldCheck } from 'lucide-react';
import type { Profile } from '../types';
import { RollingText } from './RollingText';

interface PendingApprovalViewProps {
  profile: Profile | null;
  userEmail: string;
  onLogout: () => void;
  lang?: 'id' | 'en';
}

export const PendingApprovalView: React.FC<PendingApprovalViewProps> = ({ 
  profile, 
  userEmail, 
  onLogout,
  lang = 'id'
}) => {
  const betaStatus = profile?.betaStatus || 'pending';
  const copy = {
    pending: {
      title: lang === 'id' ? 'Akses beta sedang direview' : 'Beta access is pending review',
      body: lang === 'id' ? 'Akun Anda sudah masuk, tapi dashboard Warungify baru terbuka setelah kami approve dari daftar beta.' : 'Your account is registered, but the Warungify dashboard will only open after we approve you from the beta list.',
      badge: lang === 'id' ? 'Pending review' : 'Pending review',
    },
    waitlist: {
      title: lang === 'id' ? 'Anda masuk waitlist beta' : 'You are on the beta waitlist',
      body: lang === 'id' ? 'Kuota batch aktif sedang penuh. Kami akan kabari lewat WhatsApp ketika batch berikutnya dibuka.' : 'The active batch quota is currently full. We will notify you via WhatsApp when the next batch opens.',
      badge: lang === 'id' ? 'Waitlist' : 'Waitlist',
    },
    rejected: {
      title: lang === 'id' ? 'Akses beta belum tersedia' : 'Beta access not available yet',
      body: lang === 'id' ? 'Akun ini belum masuk batch beta saat ini. Anda tetap bisa menunggu kabar pembukaan batch berikutnya.' : 'This account is not in the current beta batch. You can still wait for news on the next batch opening.',
      badge: lang === 'id' ? 'Not approved' : 'Not approved',
    },
    approved: {
      title: lang === 'id' ? 'Akses sudah approved' : 'Access approved',
      body: lang === 'id' ? 'Silakan refresh halaman jika dashboard belum terbuka otomatis.' : 'Please refresh the page if the dashboard does not open automatically.',
      badge: lang === 'id' ? 'Approved' : 'Approved',
    },
  }[betaStatus];

  return (
    <div className="min-h-screen w-screen bg-slate-50 flex items-center justify-center px-5 py-10 font-sans">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl shadow-slate-900/6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/Logo-warungify.png" alt="Warungify Logo" className="h-11 w-11 rounded-2xl object-contain" />
            <div>
              <p className="text-lg font-extrabold text-slate-950 leading-none">Warungify</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">Beta Access</p>
            </div>
          </div>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-amber-700">
            {copy.badge}
          </span>
        </div>

        <div className="mt-8 space-y-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">{copy.title}</h1>
          <p className="text-sm leading-relaxed text-slate-500">{copy.body}</p>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <Clock3 className="h-4 w-4 text-amber-500" />
            <p className="mt-3 text-xs font-bold text-slate-900">
              {lang === 'id' ? 'Review batch' : 'Batch review'}
            </p>
            <p className="mt-1 text-[11px] leading-normal text-slate-500">
              {lang === 'id' 
                ? 'Akses diberikan bertahap untuk seller yang paling sesuai.' 
                : 'Access is granted gradually to the most suitable sellers.'}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <MessageCircle className="h-4 w-4 text-emerald-600" />
            <p className="mt-3 text-xs font-bold text-slate-900">
              {lang === 'id' ? 'Approval via WA' : 'Approval via WA'}
            </p>
            <p className="mt-1 text-[11px] leading-normal text-slate-500">
              {lang === 'id' 
                ? 'Kabar approval dikirim ke nomor WhatsApp dari form beta.' 
                : 'Approval notice is sent to the WhatsApp number from the beta form.'}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <p className="mt-3 text-xs font-bold text-slate-900">
              {lang === 'id' ? 'Login email' : 'Email login'}
            </p>
            <p className="mt-1 text-[11px] leading-normal text-slate-500">
              {lang === 'id' ? `Akun aktif untuk ${profile?.email || userEmail}.` : `Active account for ${profile?.email || userEmail}.`}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] font-medium leading-relaxed text-slate-400">
            {lang === 'id' 
              ? 'Sudah menerima pesan approval? Refresh halaman atau login ulang dengan email yang sama.' 
              : 'Already received the approval message? Refresh the page or log in again with the same email.'}
          </p>
          <button
            type="button"
            onClick={onLogout}
            className="group inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-bold text-white transition-all duration-500 hover:bg-white hover:text-slate-950 shadow-sm cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <RollingText>{lang === 'id' ? 'Logout' : 'Logout'}</RollingText>
          </button>
        </div>
      </div>
    </div>
  );
};
