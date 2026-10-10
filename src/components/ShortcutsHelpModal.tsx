import React from 'react';
import { X, Keyboard, Zap } from 'lucide-react';

interface ShortcutsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsHelpModal: React.FC<ShortcutsHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const SHORTCUTS = [
    { key: 'Spacebar', desc: 'Play / Pause หรือ Step แท่งเทียนถัดไปเมื่อหยุดอยู่' },
    { key: 'Right Arrow (→)', desc: 'Next Bar (ขยับไปข้างหน้าทีละแท่ง)' },
    { key: 'Key B', desc: 'เปิดออเดอร์ Buy Market ทันทีตามค่าที่ตั้งไว้' },
    { key: 'Key S', desc: 'เปิดออเดอร์ Sell Market ทันทีตามค่าที่ตั้งไว้' },
    { key: 'Key R', desc: 'สุ่มสถานการณ์ใหม่ (Random Scenario)' },
    { key: 'Key M', desc: 'เปิด/ปิด Blind Mode (ซ่อนวันที่บนแกนเวลา)' },
    { key: 'Chart Click', desc: 'คลิกบนกราฟเพื่อดึงระดับราคานั้นมากรอกเป็น SL หรือ TP อัตโนมัติ' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-tv-surface border border-tv-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-tv-border bg-tv-bg/50">
          <div className="flex items-center gap-2">
            <Keyboard className="text-tv-blue" size={18} />
            <h3 className="text-sm font-bold text-white">คีย์ลัดและการใช้งาน (Keyboard Shortcuts)</h3>
          </div>
          <button onClick={onClose} className="text-tv-muted hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="bg-tv-bg border border-tv-border rounded-xl p-3 divide-y divide-tv-border">
            {SHORTCUTS.map((s, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                <span className="text-tv-text">{s.desc}</span>
                <kbd className="px-2 py-0.5 bg-tv-surface border border-tv-border rounded font-mono text-[11px] font-bold text-amber-300">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>

          <div className="bg-tv-blue/10 border border-tv-blue/30 rounded-xl p-3 flex items-start gap-2.5">
            <Zap className="text-tv-blue shrink-0 mt-0.5" size={16} />
            <div className="space-y-1 text-tv-text text-[11px]">
              <strong className="text-white block font-semibold">สูตรคำนวณทองคำ (Gold Contract Specifications):</strong>
              <p>• 1.00 Lot = 100 Troy Ounces</p>
              <p>• การขยับราคา $1.00 = 100 Pips ($100 กำไร/ขาดทุนต่อ 1 Lot)</p>
              <p>• หากตั้ง SL หรือ TP ระบบจะตรวจจับและปิดออเดอร์ให้อัตโนมัติทันทีที่แท่งเทียนถัดไปแตะราคา</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
