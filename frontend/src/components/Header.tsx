// React import removed because it is unused
import { Mic } from 'lucide-react';

interface HeaderProps {
  title: string;
  subTitle: string;
  onOpenVoiceModal: () => void;
}

export default function Header({ title, subTitle, onOpenVoiceModal }: HeaderProps) {
  return (
    <div className="flex justify-between items-center mb-9">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
        <p className="text-textSecondary text-sm mt-1">{subTitle}</p>
      </div>
      <div className="flex items-center gap-5">
        <button
          onClick={onOpenVoiceModal}
          className="bg-gradient-to-r from-accentPurple to-accentCyan text-white px-5 py-2.5 rounded-full font-semibold text-xs flex items-center gap-2 shadow-[0_4px_15px_rgba(123,44,191,0.3)] hover:scale-105 hover:shadow-[0_6px_20px_rgba(0,210,255,0.4)] transition-all duration-300"
        >
          <Mic className="w-4 h-4" />
          Talk to Saan
        </button>
        <div className="bg-slate-100 border border-slate-200/60 px-3.5 py-1.5 rounded-full flex items-center gap-2.5 text-xs font-medium backdrop-blur-md">
          <div className="w-6 h-6 rounded-full bg-accentCyan text-bgPrimary flex items-center justify-center font-bold text-[10px]">
            RU
          </div>
          <span className="text-slate-800">Rushi (UK borrower)</span>
        </div>
      </div>
    </div>
  );
}
