import { useState, useEffect } from 'react';
import { ArrowLeftRight, Activity } from 'lucide-react';

interface MatchItem {
  id: number;
  match_code: string;
  userFrom: string;
  userTo: string;
  from: string;
  to: string;
  amountFrom: string;
  amountTo: string;
  status: string;
  time?: string;
}

interface ZeroBorderP2PProps {
  appState: any;
  setAppState: React.Dispatch<React.SetStateAction<any>>;
  addHistoryItem: (item: { type: string; section: string; text: string; amount: string; status: string }) => void;
}

export default function ZeroBorderP2P({ appState, addHistoryItem }: ZeroBorderP2PProps) {
  const [matches, setMatches] = useState<MatchItem[]>([]);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await fetch('/api/matches');
        if (res.ok) {
          const data = await res.json();
          setMatches(data.map((item: any) => ({
            id: item.id,
            match_code: item.match_code,
            userFrom: item.from_user,
            userTo: item.to_user,
            from: item.from_country,
            to: item.to_country,
            amountFrom: item.amount_from,
            amountTo: item.amount_to,
            status: item.status,
            time: item.status.includes('Settled') ? 'Matched' : 'Just now'
          })));
        } else {
          throw new Error();
        }
      } catch (e) {
        // Fallback mockup local nodes if backend server is not running yet
        setMatches([
          { id: 8902, match_code: 'SZB-8902', from: 'UK', to: 'India', amountFrom: '£100.00', amountTo: '₹13,150.00', userFrom: 'Rushi', userTo: 'Aarav', status: 'Settled Locally', time: '5 mins ago' },
          { id: 8903, match_code: 'SZB-8903', from: 'UK', to: 'UAE', amountFrom: '£66.00', amountTo: '308.00 AED', userFrom: 'Rushi', userTo: 'Kabir', status: 'Settled Locally', time: '1 hour ago' },
          { id: 8904, match_code: 'SZB-8904', from: 'UK', to: 'Canada', amountFrom: '£50.00', amountTo: '87.00 CAD', userFrom: 'Rushi', userTo: 'Liam', status: 'Queued - Matching Active', time: 'Just now' }
        ]);
      }
    };
    fetchMatches();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Visual Matching flow card */}
      <div className="glass-card rounded-3xl p-6 lg:col-span-2 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-md font-bold flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-accentCyan animate-pulse" />
              Saan Zero-Border Settlement Flow
            </h3>
            <span className="text-[10px] font-bold text-accentTeal bg-accentTeal/10 border border-accentTeal/20 py-1 px-2.5 rounded-full uppercase tracking-wider">
              Fee-Free Routing
            </span>
          </div>

          <p className="text-xs text-textSecondary leading-relaxed mb-6">
            Instead of flying money over borders and paying standard bank spreads, Saan matches your outgoing GBP transfer with incoming foreign requests. The money never leaves its home country.
          </p>

          {/* Flow diagram boxes */}
          <div className="grid grid-cols-5 items-center gap-2 bg-slate-50 border border-slate-200 p-6 rounded-2xl mb-6 relative">
            {/* UK Local Flow */}
            <div className="col-span-2 flex flex-col items-center p-3.5 bg-white border border-slate-100 rounded-xl text-center z-10">
              <div className="text-[10px] text-textMuted font-bold uppercase tracking-wider mb-1">UK Region</div>
              <div className="flex items-center gap-2 my-2.5">
                <div className="w-8 h-8 rounded-full bg-accentCyan/15 text-accentCyan flex items-center justify-center font-bold text-xs">RU</div>
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-900">Rushi</div>
                  <div className="text-[10px] text-accentCyan font-bold">Sends £100</div>
                </div>
              </div>
              <i className="fa-solid fa-arrow-down text-accentTeal text-xs my-1 animate-bounce"></i>
              <div className="text-[11px] font-bold text-slate-800">Aarav's Brother</div>
              <div className="text-[9px] text-slate-500">Receives £100 (in UK)</div>
            </div>

            {/* Matching bridge */}
            <div className="col-span-1 flex flex-col items-center justify-center text-center">
              <div className="w-9 h-9 rounded-full bg-accentPurple/10 border border-accentPurple/25 text-accentPurple flex items-center justify-center shadow-md">
                <i className="fa-solid fa-shield-halved text-sm"></i>
              </div>
              <div className="text-[9px] font-bold text-accentPurple mt-1.5 uppercase tracking-wide">P2P Match</div>
            </div>

            {/* India Local Flow */}
            <div className="col-span-2 flex flex-col items-center p-3.5 bg-white border border-slate-100 rounded-xl text-center z-10">
              <div className="text-[10px] text-textMuted font-bold uppercase tracking-wider mb-1">India Region</div>
              <div className="flex items-center gap-2 my-2.5">
                <div className="w-8 h-8 rounded-full bg-accentPurple/15 text-accentPurple flex items-center justify-center font-bold text-xs">AA</div>
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-900">Aarav</div>
                  <div className="text-[10px] text-accentPurple font-bold">Sends ₹13,150</div>
                </div>
              </div>
              <i className="fa-solid fa-arrow-down text-accentTeal text-xs my-1 animate-bounce"></i>
              <div className="text-[11px] font-bold text-slate-800">Rushi's Sister</div>
              <div className="text-[9px] text-slate-500">Receives ₹13,150 (in India)</div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-4">
          <div className="text-textSecondary">Traditional Bank Fee: <strong className="line-through text-dangerRed font-medium">£8.50</strong></div>
          <div className="text-accentTeal font-bold">Saan Match Fee: £0.00 (Zero-Border Match)</div>
        </div>
      </div>

      {/* Live matches log queue */}
      <div className="glass-card rounded-3xl p-6 flex flex-col justify-between bg-white">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-bold flex items-center gap-2 text-slate-900">
              <Activity className="w-4 h-4 text-accentPurple" />
              Live Matching Ledger
            </h3>
          </div>
          <p className="text-[11px] text-textSecondary leading-normal mb-4 font-semibold">
            Current matched operations from your global node network in real-time.
          </p>

          <div className="flex flex-col gap-3">
            {matches.map((item) => (
              <div key={item.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono text-textMuted font-bold">{item.id}</span>
                  <span className="text-xs font-bold text-slate-900 mt-1">
                    {item.userFrom} ({item.from}) <ArrowLeftRight className="w-3 h-3 inline mx-1 text-accentCyan" /> {item.userTo} ({item.to})
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold mt-0.5">{item.amountFrom} = {item.amountTo}</span>
                </div>
                <div className="text-right">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    item.status.includes('Settled')
                      ? 'bg-successGreen/10 border border-successGreen/25 text-successGreen'
                      : 'bg-warningGold/10 border border-warningGold/25 text-warningGold'
                  }`}>
                    {item.status}
                  </span>
                  <div className="text-[9px] text-textMuted mt-1">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={() => {
            const amountStr = '£150.00';
            const newMatch = {
              id: Date.now() % 10000,
              match_code: `SZB-${Date.now() % 10000}`,
              from: 'UK',
              to: 'India',
              amountFrom: amountStr,
              amountTo: '₹19,725.00',
              userFrom: 'Rushi',
              userTo: 'Aarav',
              status: 'Queued - Matching Active',
              time: 'Just now'
            };
            setMatches(prev => [newMatch, ...prev]);
            addHistoryItem({
              type: 'p2p',
              section: 'p2p',
              text: 'Requested local matching settlement UK -> India',
              amount: amountStr,
              status: 'Queued'
            });
            alert('Local matching settlement queued! Scanning P2P routing network nodes.');
          }}
          className="w-full bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs mt-4 transition-all duration-300 active:scale-95"
        >
          Request Manual P2P Settlement
        </button>
      </div>

      {/* Section Activity History */}
      <div className="glass-card rounded-3xl p-6 bg-white lg:col-span-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
          Zero-Border & P2P Matching History
        </h3>
        <div className="flex flex-col gap-3 font-medium">
          {appState.history
            .filter((item: any) => item.section === 'p2p')
            .map((item: any) => (
              <div 
                key={item.id} 
                className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accentPurple/10 text-accentPurple flex items-center justify-center font-bold">
                    P2P
                  </div>
                  <div>
                    <div className="text-slate-800 font-semibold">{item.text}</div>
                    <div className="text-[9px] text-textMuted mt-0.5">{item.time}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-slate-900 font-mono font-bold">{item.amount || '-'}</div>
                  <span className="text-[8px] font-bold bg-accentPurple/10 text-accentPurple px-2 py-0.5 rounded-full mt-1.5 inline-block">
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          {appState.history.filter((item: any) => item.section === 'p2p').length === 0 && (
            <div className="text-xs text-textMuted text-center py-4">No recent matched settlements.</div>
          )}
        </div>
      </div>

    </div>
  );
}
