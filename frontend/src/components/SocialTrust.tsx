import { useState, useEffect } from 'react';
import { ShieldCheck, UserCheck, Plus, Share2, Info } from 'lucide-react';

interface GuarantorItem {
  id: string | number;
  name: string;
  country: string;
  relation: string;
  status: string;
  scoreContribution: string;
}

interface SocialTrustProps {
  appState: any;
  setAppState: React.Dispatch<React.SetStateAction<any>>;
  addHistoryItem: (item: { type: string; section: string; text: string; amount: string; status: string }) => void;
}

export default function SocialTrust({ addHistoryItem }: SocialTrustProps) {
  const [guarantors, setGuarantors] = useState<GuarantorItem[]>([]);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const fetchTrustNodes = async () => {
      try {
        const res = await fetch('/api/trust');
        if (res.ok) {
          const data = await res.json();
          setGuarantors(data.map((item: any) => ({
            id: item.id,
            name: item.guarantor_name,
            country: item.country,
            relation: item.relation,
            status: item.status,
            scoreContribution: item.score_contribution
          })));
        } else {
          throw new Error();
        }
      } catch (e) {
        // Fallback local mockup list if database/server is offline
        setGuarantors([
          { id: 'indira', name: 'Sister (Indira)', country: 'India', relation: 'Immediate Family', status: 'Active Guarantor', scoreContribution: '+35%' },
          { id: 'kabir', name: 'Uncle (Kabir)', country: 'UAE', relation: 'Extended Family', status: 'Active Guarantor', scoreContribution: '+25%' },
          { id: 'aarav', name: 'Brother (Aarav)', country: 'Canada', relation: 'Immediate Family', status: 'Active Guarantor', scoreContribution: '+20%' },
          { id: 'german-friend', name: 'Friend (Max)', country: 'Germany', relation: 'Colleague', status: 'Pending Verification', scoreContribution: '+14%' }
        ]);
      }
    };
    fetchTrustNodes();
  }, []);

  const sendGuaranteeRequest = () => {
    setToastMessage('Guarantor request link copied to clipboard!');
    navigator.clipboard.writeText('https://saanpay.co.uk/trust-invite?user=rushi');
    
    addHistoryItem({
      type: 'p2p',
      section: 'p2p',
      text: 'Sent community co-signer guarantor invitation link',
      amount: '',
      status: 'Pending'
    });
    
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
      
      {/* Trust Gauge / Explanation card */}
      <div className="glass-card rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-bgSecondary/80 to-bgSecondary/30">
        
        {toastMessage && (
          <div className="absolute top-4 left-4 right-4 bg-accentTeal text-bgPrimary font-bold text-xs py-2 px-3 rounded-lg text-center shadow-lg transition-all duration-300">
            {toastMessage}
          </div>
        )}

        <div>
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-md font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-successGreen" />
              Social Trust Underwriting
            </h3>
            <span className="text-[10px] font-bold text-successGreen bg-successGreen/15 border border-successGreen/30 py-1 px-2.5 rounded-full">
              Trust: 94%
            </span>
          </div>

          <p className="text-xs text-textSecondary leading-relaxed mb-6">
            UK high-street banks require local credit checks, which shuts out international students and expats. Saan uses community backing—allowing trusted relatives globally to co-sign and unlock your lending limits.
          </p>

          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-2xl mb-4 text-center">
            <div className="text-4xl font-extrabold text-slate-900">4.7 / 5.0</div>
            <div className="text-[10px] text-accentTeal font-bold uppercase tracking-wider mt-1.5">Social Trust Score</div>
            <div className="text-[10px] text-textMuted mt-1 font-semibold">Underwritten Credit Limit: £500.00</div>
          </div>
        </div>

        <div className="text-[11px] text-textMuted flex items-start gap-2 border-t border-slate-100 pt-4 font-semibold">
          <Info className="w-3.5 h-3.5 text-accentCyan shrink-0 mt-0.5" />
          <span>If any node repays late, it affects the group's collective credit limit, establishing social accountability.</span>
        </div>
      </div>

      {/* Guarantor Nodes list */}
      <div className="glass-card rounded-3xl p-6 lg:col-span-2 flex flex-col justify-between bg-white text-slate-800">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-bold flex items-center gap-2 text-slate-900">
              <UserCheck className="w-5 h-5 text-accentCyan" />
              Active Co-signer Guarantors
            </h3>
            <button
              onClick={sendGuaranteeRequest}
              className="bg-accentCyan/10 border border-accentCyan/20 hover:bg-accentCyan/20 text-accentTeal text-xs font-bold py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition-all duration-300"
            >
              <Plus className="w-3.5 h-3.5" />
              Request Guarantor
            </button>
          </div>
          <p className="text-xs text-textSecondary leading-normal mb-5 font-semibold">
            These active nodes guarantee your loans, directly improving your approval rating and saving currency transaction fees.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {guarantors.map((item) => (
              <div key={item.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between gap-3 relative">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                    <span className="text-[10px] text-textMuted mt-0.5 block font-semibold">{item.relation} ({item.country})</span>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    item.status.includes('Active')
                      ? 'bg-successGreen/10 border border-successGreen/25 text-successGreen'
                      : 'bg-warningGold/10 border border-warningGold/25 text-warningGold'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] border-t border-slate-100 pt-2 font-semibold">
                  <span className="text-textSecondary">Trust Impact Score</span>
                  <span className="text-accentCyan font-bold">{item.scoreContribution}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={sendGuaranteeRequest}
            className="flex-1 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all duration-300"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share Co-Sign Invite link
          </button>
        </div>
      </div>

    </div>
  );
}
