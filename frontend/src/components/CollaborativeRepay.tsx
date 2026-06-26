import { useState } from 'react';
import { Users, Sparkles, Send } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface CollaborativeRepayProps {
  appState: any;
  setAppState: React.Dispatch<React.SetStateAction<any>>;
  addHistoryItem: (item: { type: string; section: string; text: string; amount: string; status: string }) => void;
}

export default function CollaborativeRepay({ appState, setAppState, addHistoryItem }: CollaborativeRepayProps) {
  const [nodes, setNodes] = useState({
    india: true,
    uae: true,
    canada: true,
    germany: false,
  });

  const remaining = appState.loanBalance - appState.loanPaid;
  const percentRepaid = Math.round((appState.loanPaid / appState.loanBalance) * 100);

  const toggleNode = (node: keyof typeof nodes) => {
    setNodes(prev => ({ ...prev, [node]: !prev[node] }));
  };

  const simulateFamilyContribution = () => {
    if (appState.loanPaid >= appState.loanBalance) {
      alert('Loan is already fully repaid!');
      return;
    }
    const payment = 50;
    const nextPaid = Math.min(appState.loanPaid + payment, appState.loanBalance);
    
    setAppState((prev: any) => ({
      ...prev,
      loanPaid: nextPaid,
      savedAmount: prev.savedAmount + 4.2 // increment simulated savings
    }));

    addHistoryItem({
      type: 'repay',
      section: 'repay',
      text: 'Received mock family contribution payment (P2P Split)',
      amount: `£${payment.toFixed(2)}`,
      status: 'Settled'
    });

    alert(`Successfully processed mock Family Contribution of £${payment.toFixed(2)}!`);
  };

  // Circular gauge chart data
  const chartData = {
    labels: ['Repaid', 'Remaining'],
    datasets: [
      {
        data: [appState.loanPaid, remaining],
        backgroundColor: ['#00E5FF', 'rgba(255, 255, 255, 0.05)'],
        borderColor: ['#00E5FF', 'rgba(255, 255, 255, 0.1)'],
        borderWidth: 1,
        cutout: '80%',
      },
    ],
  };

  const chartOptions = {
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    responsive: true,
    maintainAspectRatio: false,
  };

  // Dynamic savings calculations based on nodes selected
  const activeCount = Object.values(nodes).filter(Boolean).length;
  const standardCost = 100 + activeCount * 5.8;
  const optimizedCost = 82 + activeCount * 1.8;
  const savings = standardCost - optimizedCost;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Outstanding loan gauge */}
      <div className="glass-card rounded-3xl p-6 lg:col-span-4 flex flex-col justify-between items-center text-center h-[380px]">
        <div className="w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-accentCyan" />
              Lending & Progress
            </h3>
          </div>
          
          <div className="relative w-40 h-40 mx-auto mt-4 flex items-center justify-center">
            <Doughnut data={chartData} options={chartOptions} />
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-slate-900">{percentRepaid}%</span>
              <span className="text-[10px] text-textMuted uppercase font-bold tracking-wide">Repaid</span>
            </div>
          </div>
        </div>

        <div className="w-full mt-4">
          <div className="text-xs text-textSecondary font-semibold">
            Remaining Loan: <strong className="text-slate-800">£{remaining.toFixed(2)}</strong> of £{appState.loanBalance.toFixed(2)}
          </div>
          <button
            onClick={simulateFamilyContribution}
            className="w-full bg-gradient-to-r from-accentCyan to-accentTeal hover:brightness-105 text-white font-bold py-2.5 rounded-xl text-xs mt-4 shadow-md transition-all duration-300"
          >
            Mock Family Contribution (£50)
          </button>
        </div>
      </div>

      {/* AI split optimizer table */}
      <div className="glass-card rounded-3xl p-6 lg:col-span-8 flex flex-col justify-between h-[380px] bg-white text-slate-800">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-bold flex items-center gap-2 text-slate-900">
              <Sparkles className="w-5 h-5 text-accentTeal" />
              Saan AI Repayment Optimizer Matrix
            </h3>
            <span className="text-[10px] font-bold text-accentTeal bg-accentTeal/10 border border-accentTeal/20 py-1 px-3 rounded-full uppercase">
              Optimized Split
            </span>
          </div>
          <p className="text-xs text-textSecondary leading-relaxed mb-4 font-semibold">
            Configure active contributor nodes globally. The system distributes the remaining repayment balance in local currencies to avoid bank markups.
          </p>

          {/* Node check lists */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-4 text-slate-800">
            <div className="text-[10px] text-textMuted font-bold uppercase tracking-wider mb-2">Active Repayment Nodes</div>
            <div className="flex flex-wrap gap-4 text-xs font-semibold text-textSecondary">
              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                <input type="checkbox" checked={nodes.india} onChange={() => toggleNode('india')} /> Sister (India - INR)
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                <input type="checkbox" checked={nodes.uae} onChange={() => toggleNode('uae')} /> Uncle (UAE - AED)
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                <input type="checkbox" checked={nodes.canada} onChange={() => toggleNode('canada')} /> Brother (Canada - CAD)
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                <input type="checkbox" checked={nodes.germany} onChange={() => toggleNode('germany')} /> Friend (Germany - EUR)
              </label>
            </div>
          </div>

          {/* Metrics splits */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <div className="text-[10px] text-textMuted uppercase font-bold">Standard Transfer Cost</div>
              <div className="text-lg font-bold text-slate-900 mt-1">£{standardCost.toFixed(2)}</div>
            </div>
            <div className="p-4 bg-slate-50 border border-accentTeal/20 rounded-xl text-center">
              <div className="text-[10px] text-accentTeal uppercase font-bold">Saan AI Optimized Cost</div>
              <div className="text-lg font-bold text-successGreen mt-1">£{optimizedCost.toFixed(2)}</div>
              <div className="text-[9px] text-accentTeal font-bold mt-1 bg-accentTeal/10 py-0.5 rounded">Saved £{savings.toFixed(2)}!</div>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-textSecondary font-semibold border-t border-slate-100 pt-3 mt-3 flex justify-between">
          <span>Allocation routing active: INR ({nodes.india ? 'On' : 'Off'}), AED ({nodes.uae ? 'On' : 'Off'}), CAD ({nodes.canada ? 'On' : 'Off'}), EUR ({nodes.germany ? 'On' : 'Off'})</span>
        </div>
      </div>

      {/* Ledger list of contributors */}
      <div className="glass-card rounded-3xl p-6 lg:col-span-12 bg-white text-slate-800">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-md font-bold flex items-center gap-2 text-slate-900">
            <Users className="w-5 h-5 text-accentCyan" />
            Contributor Ledger
          </h3>
          <button
            onClick={() => alert('Invite links shared via WhatsApp/Email to guarantor co-signers.')}
            className="bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 font-bold py-1.5 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all duration-300"
          >
            <Send className="w-3.5 h-3.5" /> Send Contribution Request Link
          </button>
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs font-semibold text-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-successGreen/10 text-successGreen flex items-center justify-center font-bold">IN</div>
              <div>
                <div className="text-slate-900">Sister (Indira)</div>
                <div className="text-[10px] text-textMuted font-semibold">India - Rel: Immediate Family</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-slate-900">₹13,150.00 (split equivalent)</div>
              <span className="text-[9px] bg-successGreen/10 text-successGreen px-2 py-0.5 rounded-full mt-1.5 inline-block font-bold">Paid - Settled Locally</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs font-semibold text-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-successGreen/10 text-successGreen flex items-center justify-center font-bold">AE</div>
              <div>
                <div className="text-slate-900">Uncle (Kabir)</div>
                <div className="text-[10px] text-textMuted font-semibold">UAE - Rel: Extended Family</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-slate-900">308.00 AED (split equivalent)</div>
              <span className="text-[9px] bg-successGreen/10 text-successGreen px-2 py-0.5 rounded-full mt-1.5 inline-block font-bold">Paid - Settled Locally</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs font-semibold text-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-warningGold/10 text-warningGold flex items-center justify-center font-bold">CA</div>
              <div>
                <div className="text-slate-900">Brother (Aarav)</div>
                <div className="text-[10px] text-textMuted font-semibold">Canada - Rel: Immediate Family</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-slate-900">87.00 CAD (split equivalent)</div>
              <span className="text-[9px] bg-warningGold/10 text-warningGold px-2 py-0.5 rounded-full mt-1.5 inline-block font-bold">Pending Matching Release</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section Activity History */}
      <div className="glass-card rounded-3xl p-6 lg:col-span-12 bg-white text-slate-800">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
          Collaborative Repayment History
        </h3>
        <div className="flex flex-col gap-3 font-medium">
          {appState.history
            .filter((item: any) => item.section === 'repay')
            .map((item: any) => (
              <div 
                key={item.id} 
                className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accentCyan/10 text-accentCyan flex items-center justify-center font-bold">
                    RP
                  </div>
                  <div>
                    <div className="text-slate-800 font-semibold">{item.text}</div>
                    <div className="text-[9px] text-textMuted mt-0.5">{item.time}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-slate-900 font-mono font-bold">{item.amount || '-'}</div>
                  <span className="text-[8px] font-bold bg-successGreen/10 text-successGreen px-2 py-0.5 rounded-full mt-1.5 inline-block">
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          {appState.history.filter((item: any) => item.section === 'repay').length === 0 && (
            <div className="text-xs text-textMuted text-center py-4">No recent repayments or contributor history.</div>
          )}
        </div>
      </div>

    </div>
  );
}
