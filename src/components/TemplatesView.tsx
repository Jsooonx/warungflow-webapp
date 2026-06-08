import React, { useState } from 'react';
import type { Template } from '../types';
import { MessageSquare, Clipboard, Check, Info, Lightbulb } from 'lucide-react';
import { RollingText } from './RollingText';

interface TemplatesViewProps {
  templates: Template[];
  onTemplateCopied: (label: string) => void;
  lang?: 'id' | 'en';
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({ templates, onTemplateCopied, lang = 'id' }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyRaw = (body: string, id: string, label: string) => {
    navigator.clipboard.writeText(body).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      onTemplateCopied(label);
    });
  };

  // Template variable preview data
  const previewData = {
    nama: 'Pelanggan Baru',
    total: '95.000',
    tracking: 'RESI82910398'
  };

  const getPreviewText = (body: string) => {
    return body
      .replace(/{nama}/g, previewData.nama)
      .replace(/{total}/g, previewData.total)
      .replace(/{tracking}/g, previewData.tracking);
  };

  return (
    <div className="flex-1 p-4 sm:p-8 overflow-y-visible lg:overflow-y-auto space-y-6 select-none bg-slate-50/50 page-transition-enter">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">{lang === 'id' ? 'Template WhatsApp' : 'WhatsApp Templates'}</h2>
        <p className="text-xs text-slate-400 mt-1">{lang === 'id' ? 'Template notifikasi sistem bawaan untuk komunikasi pelanggan.' : 'Predefined system message templates for client communication notifications.'}</p>
      </div>

      {/* Info notice bar */}
      <div className="p-4 bg-blue-50 border border-blue-200/50 rounded-xl flex gap-3 text-xs text-blue-800">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">{lang === 'id' ? 'Template Kelolaan Sistem' : 'System Managed Templates'}</p>
          <p className="text-[11px] text-blue-700/90 mt-0.5 leading-normal">
            {lang === 'id'
              ? 'Untuk MVP v1, template pesan ini dikelola secara global. Saat Anda mengklik aksi notifikasi WhatsApp di baris order, aplikasi akan secara otomatis memformat pesan menggunakan data variabel order (Nama, Harga, Kode Tracking), lalu membuka WhatsApp.'
              : 'For MVP v1, these templates are managed globally. When clicking the WhatsApp alert action on any order row, the app automatically populates and formats these templates with the customer\'s order variables (Name, Price, Tracking Code) and opens the WhatsApp browser tab.'}
          </p>
        </div>
      </div>

      {/* Templates Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {templates.map((tpl) => {
          const isCopied = copiedId === tpl.id;
          const isOrderFormat = tpl.type === 'order_format';
          
          // Translate template name if systems managed
          let translatedName = tpl.name;
          if (tpl.type === 'payment_confirmation') translatedName = lang === 'id' ? 'Tagihan Pembayaran' : 'Payment Bill';
          if (tpl.type === 'processing') translatedName = lang === 'id' ? 'Konfirmasi Lunas' : 'Payment Confirmation';
          if (tpl.type === 'shipping') translatedName = lang === 'id' ? 'Notifikasi Resi' : 'Shipping Receipt';
          if (tpl.type === 'order_format') translatedName = lang === 'id' ? 'Format Order WhatsApp' : 'WhatsApp Order Format';

          return (
            <div 
              key={tpl.id} 
              className={`premium-card overflow-hidden flex flex-col transition-all duration-300 ${
                isOrderFormat 
                  ? 'border-emerald-300/80 bg-gradient-to-br from-white via-white to-emerald-50/20 shadow-md shadow-emerald-600/5 ring-1 ring-emerald-500/10 md:scale-[1.02]' 
                  : ''
              }`}
            >
              
              {/* Header card title */}
              <div className={`h-12 px-5 border-b flex items-center justify-between shrink-0 ${
                isOrderFormat 
                  ? 'border-emerald-100 bg-emerald-50/40' 
                  : 'border-slate-100 bg-slate-50/50'
              }`}>
                <div className="flex items-center gap-2">
                  <MessageSquare className={`w-3.5 h-3.5 ${isOrderFormat ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold text-slate-800">{translatedName}</span>
                  {isOrderFormat && (
                    <span className="ml-2 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-600 text-white flex items-center gap-0.5 tracking-wide">
                      {lang === 'id' ? 'LEBIH CEPAT' : 'SAVE TIME'}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleCopyRaw(tpl.body, tpl.id, tpl.name)}
                  className={`group h-7 px-2.5 rounded-md text-[10px] font-semibold border flex items-center gap-1.5 transition-all duration-500 cursor-pointer ${
                    isCopied 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                    : isOrderFormat
                        ? 'bg-white border-transparent text-emerald-600 hover:bg-emerald-600 hover:text-white shadow-xs'
                        : 'bg-white border-transparent text-slate-500 hover:bg-slate-950 hover:text-white shadow-xs'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3 h-3" />
                      <RollingText compact>{lang === 'id' ? 'Disalin' : 'Copied'}</RollingText>
                    </>
                  ) : (
                    <>
                      <Clipboard className="w-3 h-3 transition-transform duration-500 group-hover:-translate-y-0.5" />
                      <RollingText compact>{lang === 'id' ? 'Salin Mentah' : 'Copy Raw'}</RollingText>
                    </>
                  )}
                </button>
              </div>

              {/* Template Body Description */}
              <div className="flex-1 p-5 space-y-4">
                
                {isOrderFormat && (
                  <div className="px-3.5 py-2.5 bg-emerald-50/60 border border-emerald-100 rounded-xl text-[10.5px] text-emerald-800 leading-relaxed">
                    <p className="font-bold flex items-center gap-1.5">
                      <Lightbulb className="w-3 h-3" />
                      {lang === 'id' ? 'Tip Hemat Waktu' : 'Time Saving Tip'}
                    </p>
                    <p className="text-emerald-700 mt-1 font-medium">
                      {lang === 'id'
                        ? 'Kirim format kosong ini ke pelanggan baru Anda. Saat mereka membalas dengan format yang sudah diisi, Anda tinggal menyalin balasannya ke sistem untuk memproses orderan secara cepat tanpa ketik manual satu per satu!'
                        : 'Send this empty format to your new customers. When they reply with the filled format, simply copy and paste the message into the system to process the order instantly without manual typing!'}
                    </p>
                  </div>
                )}

                {/* Raw Body text */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    {lang === 'id' ? 'Markup Template Mentah' : 'Raw Template Markup'}
                  </span>
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 font-mono text-[10px] text-slate-600 whitespace-pre-wrap leading-relaxed">
                    {tpl.body}
                  </div>
                </div>

                {/* Live Variable Preview */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    {lang === 'id' ? 'Pratinjau Variabel' : 'Variable Preview'}
                  </span>
                  <div className="bg-emerald-50/30 border border-emerald-100 rounded-lg p-3 text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {getPreviewText(tpl.body)}
                  </div>
                </div>

              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
