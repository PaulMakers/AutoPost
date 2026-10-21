import React from 'react';
import { X, BookOpen, Key, Webhook, ShieldAlert, Cpu } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#161824] p-6 shadow-2xl relative text-left scrollbar-thin">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#5865F2]/20 border border-[#5865F2]/30 text-[#5865F2] flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Panduan Lengkap Discord Autopost
            </h3>
            <p className="text-xs text-slate-400">
              Instruksi setup, cara mendapatkan token, webhook, dan batas API
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-300">
          {/* Section 1: Webhook (Paling Direkomendasikan) */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
            <h4 className="font-bold text-sm text-[#57F287] flex items-center gap-2 mb-2">
              <Webhook className="w-4 h-4" />
              1. Cara Menggunakan Webhook (Direkomendasikan & 100% Aman)
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 ml-1">
              <li>Buka Discord di PC/Web, masuk ke server tujuan Anda.</li>
              <li>Klik kanan nama Channel atau klik ikon roda gigi (Edit Channel).</li>
              <li>Pilih menu <strong>Integrations (Integrasi)</strong> &gt; <strong>Webhooks</strong>.</li>
              <li>Klik <strong>New Webhook (Buat Webhook)</strong>.</li>
              <li>Beri nama dan klik <strong>Copy Webhook URL</strong>.</li>
              <li>Paste URL ke kolom input Webhook pada aplikasi ini. Webhook tidak memerlukan Bot Token atau Channel ID!</li>
            </ol>
          </div>

          {/* Section 2: Bot Token & Channel ID */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
            <h4 className="font-bold text-sm text-[#5865F2] flex items-center gap-2 mb-2">
              <Key className="w-4 h-4" />
              2. Cara Menggunakan Discord Bot Token
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 ml-1">
              <li>Kunjungi <strong>Discord Developer Portal</strong> (discord.com/developers/applications).</li>
              <li>Buat aplikasi baru &gt; Buka tab <strong>Bot</strong> &gt; Klik <strong>Reset Token</strong>.</li>
              <li>Salin token tersebut dan masukkan ke aplikasi ini.</li>
              <li>Undang bot ke server dengan izin: <em>Send Messages</em> dan <em>Embed Links</em>.</li>
              <li>Untuk mendapatkan <strong>Channel ID</strong>: Aktifkan <em>Developer Mode</em> di Discord (User Settings &gt; Advanced &gt; Developer Mode), lalu klik kanan channel dan pilih <strong>Copy Channel ID</strong>.</li>
            </ol>
          </div>

          {/* Section 3: Template Variabel */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
            <h4 className="font-bold text-sm text-[#FEE75C] flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4" />
              3. Variabel Template Pesan
            </h4>
            <p className="mb-2 text-slate-400">
              Anda dapat menyisipkan variabel otomatis berikut ke dalam teks pesan:
            </p>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="p-2 rounded bg-black/40 border border-white/5">
                <code className="text-[#5865F2] font-bold">{'{date}'}</code> : Tanggal hari ini
              </div>
              <div className="p-2 rounded bg-black/40 border border-white/5">
                <code className="text-[#5865F2] font-bold">{'{time}'}</code> : Jam:Menit:Detik
              </div>
              <div className="p-2 rounded bg-black/40 border border-white/5">
                <code className="text-[#5865F2] font-bold">{'{counter}'}</code> : Nomor urutan kirim
              </div>
              <div className="p-2 rounded bg-black/40 border border-white/5">
                <code className="text-[#5865F2] font-bold">{'{random}'}</code> : Kode acak 5 digit
              </div>
            </div>
          </div>

          {/* Section 4: Batasan & Aturan Keamanan Discord */}
          <div className="p-3.5 rounded-xl bg-[#ED4245]/10 border border-[#ED4245]/20 text-slate-300">
            <h4 className="font-bold text-sm text-[#ED4245] flex items-center gap-2 mb-1.5">
              <ShieldAlert className="w-4 h-4" />
              4. Aturan Keamanan & Rate Limit Discord
            </h4>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Delay Minimum:</strong> Minimal 3 detik (Sistem otomatis membatasi jika dibawah 3s).</li>
              <li><strong>Rate Limit Maksimal:</strong> Discord membatasi maksimal 30 request per menit per channel/webhook.</li>
              <li><strong>Jitter Mode:</strong> Aktifkan variasi delay acak agar ritme pengiriman tidak kaku.</li>
              <li><strong>Auto-Stop:</strong> Sistem otomatis berhenti jika terjadi 3x error berturut-turut untuk melindungi akun.</li>
            </ul>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-semibold text-xs transition-all cursor-pointer"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
