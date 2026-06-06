import React from 'react';
import { Clock3, LogOut, MessageCircle, ShieldCheck } from 'lucide-react';
import type { Profile } from '../types';
import { RollingText } from './RollingText';

interface PendingApprovalViewProps {
  profile: Profile | null;
  userEmail: string;
  onLogout: () => void;
}

const statusCopy = {
  pending: {
    title: 'Akses beta sedang direview',
    body: 'Akun Anda sudah masuk, tapi dashboard Warungify baru terbuka setelah kami approve dari daftar beta.',
    badge: 'Pending review',
  },
  waitlist: {
    title: 'Anda masuk waitlist beta',
    body: 'Kuota batch aktif sedang penuh. Kami akan kabari lewat WhatsApp ketika batch berikutnya dibuka.',
    badge: 'Waitlist',
  },
  rejected: {
    title: 'Akses beta belum tersedia',
    body: 'Akun ini belum masuk batch beta saat ini. Anda tetap bisa menunggu kabar pembukaan batch berikutnya.',
    badge: 'Not approved',
  },
  approved: {
    title: 'Akses sudah approved',
    body: 'Silakan refresh halaman jika dashboard belum terbuka otomatis.',
    badge: 'Approved',
  },
};

export const PendingApprovalView: React.FC<PendingApprovalViewProps> = ({ profile, userEmail, onLogout }) => {
  const betaStatus = profile?.betaStatus || 'pending';
  const copy = statusCopy[betaStatus];

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
            <p className="mt-3 text-xs font-bold text-slate-900">Review batch</p>
            <p className="mt-1 text-[11px] leading-normal text-slate-500">Akses diberikan bertahap untuk seller yang paling sesuai.</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <MessageCircle className="h-4 w-4 text-emerald-600" />
            <p className="mt-3 text-xs font-bold text-slate-900">Approval via WA</p>
            <p className="mt-1 text-[11px] leading-normal text-slate-500">Kabar approval dikirim ke nomor WhatsApp dari form beta.</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <p className="mt-3 text-xs font-bold text-slate-900">Email login</p>
            <p className="mt-1 text-[11px] leading-normal text-slate-500">Akun aktif untuk {profile?.email || userEmail}.</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] font-medium leading-relaxed text-slate-400">
            Sudah menerima pesan approval? Refresh halaman atau login ulang dengan email yang sama.
          </p>
          <button
            type="button"
            onClick={onLogout}
            className="group inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-bold text-white transition-all duration-500 hover:bg-white hover:text-slate-950 shadow-sm"
          >
            <LogOut className="h-3.5 w-3.5" />
            <RollingText>Logout</RollingText>
          </button>
        </div>
      </div>
    </div>
  );
};
