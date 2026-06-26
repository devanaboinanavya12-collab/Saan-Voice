import { useState, useEffect } from 'react';
import { 
  Send, ArrowDownLeft, Upload, Landmark, Sparkles, Terminal, Activity, 
  Check, X, Lock, ShieldAlert, CheckCircle2, 
  Bell, BarChart2, UserCheck, Volume2, Coins, CheckSquare, RefreshCw, Mic, Users 
} from 'lucide-react';

interface DashboardOverviewProps {
  appState: any;
  setAppState: React.Dispatch<React.SetStateAction<any>>;
  onNavigateToTab: (tabId: string) => void;
  addHistoryItem: (item: { type: string; section: string; text: string; amount: string; status: string }) => void;
  userRole?: 'user' | 'admin';
  activeTab?: string;
}

export default function DashboardOverview({ 
  appState, 
  setAppState, 
  onNavigateToTab, 
  addHistoryItem,
  userRole = 'user',
  activeTab = 'overview'
}: DashboardOverviewProps) {
  // Navigation & interaction states
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('500');
  const [showBanner, setShowBanner] = useState(true);

  // Subscription Upgrade modal state
  const [showSubModal, setShowSubModal] = useState(false);

  // Emergency Center Modals
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  // Rate widget states
  const [countdown, setCountdown] = useState(10);
  const [targetRate, setTargetRate] = useState('132.50');
  const [rateAlerts, setRateAlerts] = useState<string[]>([]);
  const [alertSuccessMessage, setAlertSuccessMessage] = useState('');

  // Dynamic live rate values
  const [liveRates, setLiveRates] = useState({
    INR: 131.50,
    AED: 4.67,
    USD: 1.27,
    EUR: 1.18,
    CAD: 1.74
  });

  const [rateChanges, setRateChanges] = useState({
    INR: 'up',
    AED: 'down',
    USD: 'up',
    EUR: 'flat',
    CAD: 'up'
  });

  // Countdown timer to simulate live rate updates
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Trigger slight live rates jitter
          setLiveRates((rates) => {
            const newINR = parseFloat((rates.INR + (Math.random() - 0.5) * 0.15).toFixed(2));
            const newAED = parseFloat((rates.AED + (Math.random() - 0.5) * 0.01).toFixed(2));
            const newUSD = parseFloat((rates.USD + (Math.random() - 0.5) * 0.005).toFixed(2));
            const newEUR = parseFloat((rates.EUR + (Math.random() - 0.5) * 0.003).toFixed(2));
            const newCAD = parseFloat((rates.CAD + (Math.random() - 0.5) * 0.006).toFixed(2));

            // Check alerts
            rateAlerts.forEach((alertVal) => {
              const parsedVal = parseFloat(alertVal);
              if (newINR >= parsedVal && rates.INR < parsedVal) {
                // Trigger notification in appState
                addHistoryItem({
                  type: 'system',
                  section: 'fx',
                  text: `Rate Alert Triggered: GBP/INR reached target ${parsedVal}`,
                  amount: '',
                  status: 'Alert Active'
                });
              }
            });

            return {
              INR: newINR,
              AED: newAED,
              USD: newUSD,
              EUR: newEUR,
              CAD: newCAD
            };
          });

          // Jitter indicators
          setRateChanges({
            INR: Math.random() > 0.4 ? 'up' : 'down',
            AED: Math.random() > 0.6 ? 'up' : 'down',
            USD: Math.random() > 0.3 ? 'up' : 'down',
            EUR: Math.random() > 0.5 ? 'up' : 'flat',
            CAD: Math.random() > 0.35 ? 'up' : 'down'
          });

          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [rateAlerts]);

  // Set current rates inside global appState too
  useEffect(() => {
    setAppState((prev: any) => ({
      ...prev,
      fxRates: {
        INR: liveRates.INR.toFixed(2),
        AED: liveRates.AED.toFixed(2),
        USD: liveRates.USD.toFixed(2),
        EUR: liveRates.EUR.toFixed(2),
        CAD: liveRates.CAD.toFixed(2)
      }
    }));
  }, [liveRates]);

  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRate) return;
    setRateAlerts((prev) => [...prev, targetRate]);
    setAlertSuccessMessage(`Alert created! We'll log a notification when rate reaches ${targetRate}`);
    setTimeout(() => setAlertSuccessMessage(''), 4000);

    addHistoryItem({
      type: 'fx',
      section: 'fx',
      text: `Set GBP/INR target alert at ${targetRate}`,
      amount: '',
      status: 'Set'
    });
  };

  const handleLockRateAction = () => {
    // Check limit: user gets 3 free locks.
    if (appState.locksUsedThisYear >= 3 && !appState.isSubscribed) {
      setShowSubModal(true);
    } else {
      setAppState((prev: any) => ({
        ...prev,
        activeLocks: prev.activeLocks + 1,
        locksUsedThisYear: prev.locksUsedThisYear + 1
      }));

      const activePair = `${appState.currentFrom || 'GBP'} → ${appState.currentTo || 'INR'}`;
      const lockedVal = appState.fxRates[appState.currentTo] || '131.50';

      addHistoryItem({
        type: 'fx',
        section: 'fx',
        text: `Locked rate for ${activePair} at ${lockedVal}`,
        amount: '£500.00 matched',
        status: 'Locked'
      });

      alert(`Rate for ${activePair} locked successfully for 7 days!`);
    }
  };

  const handleSubscribe = () => {
    setAppState((prev: any) => ({
      ...prev,
      isSubscribed: true,
      activeLocks: prev.activeLocks + 1
    }));

    addHistoryItem({
      type: 'deposit',
      section: 'system',
      text: 'Upgraded to Premium Unlimited Rate Lock Subscription (£5.99/mo)',
      amount: '-£5.99',
      status: 'Active'
    });

    setShowSubModal(false);
    alert('Thank you for subscribing to Premium! Unlimited rate locking is now enabled.');
  };

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(depositAmount) || 0;
    if (amountVal <= 0) return;

    setAppState((prev: any) => ({
      ...prev,
      loanBalance: prev.loanBalance + amountVal
    }));

    addHistoryItem({
      type: 'deposit',
      section: 'system',
      text: 'Deposited mock funds into Saan Wallet',
      amount: `£${amountVal.toFixed(2)}`,
      status: 'Completed'
    });

    setIsAddMoneyOpen(false);
    alert(`Successfully deposited £${amountVal.toFixed(2)} mock funds into your wallet!`);
  };

  const handleContribution = () => {
    const amt = 200;
    setAppState((prev: any) => {
      const newPaid = Math.min(prev.loanPaid + amt, prev.loanTotal);
      return {
        ...prev,
        loanPaid: newPaid,
        savedAmount: prev.savedAmount + 18.50,
        familyContributions: prev.familyContributions + 26200 // Add simulated INR equivalent
      };
    });

    addHistoryItem({
      type: 'repay',
      section: 'repay',
      text: 'Added loan contribution from Priya (Direct Local Settlement)',
      amount: '£200.00',
      status: 'Settled'
    });

    alert('Simulation: Priya contributed £200.00 locally, reducing outstanding balance and saving conversion overheads.');
  };

  const inviteFamilyMember = () => {
    addHistoryItem({
      type: 'p2p',
      section: 'repay',
      text: 'Sent loan repayment split invitation link to family group',
      amount: '',
      status: 'Shared'
    });
    alert('Invite link copied to clipboard! Shared repayment tracking node with Priya, John, and Ahmed.');
  };

  const handleApproveClaim = (claimId: string) => {
    const claim = appState.claims?.find((c: any) => c.id === claimId);
    if (!claim) return;

    let creditingAmount = claim.amount;
    if (claim.currency === 'INR') {
      creditingAmount = claim.amount / 100;
    } else if (claim.currency === 'AED') {
      creditingAmount = claim.amount / 4.6;
    }

    setAppState((prev: any) => {
      const updatedClaims = prev.claims.map((c: any) => {
        if (c.id === claimId) {
          return { ...c, status: 'Verified' };
        }
        return c;
      });

      const pendingCount = updatedClaims.filter((c: any) => c.status === 'Pending Review').length;

      const updatedHistory = [
        {
          id: Date.now(),
          type: 'emergency',
          section: 'emergency',
          text: `Claim ${claim.id} Approved: Credited ${claim.currency || 'GBP'} ${claim.amount} to ${claim.user}`,
          time: 'Just now',
          amount: `+£${creditingAmount.toFixed(2)}`,
          status: 'Released'
        },
        ...prev.history
      ];

      return {
        ...prev,
        loanBalance: prev.loanBalance + creditingAmount,
        activeEmergencies: pendingCount,
        claims: updatedClaims,
        history: updatedHistory
      };
    });

    alert(`Claim ${claimId} approved! Credited £${creditingAmount.toFixed(2)} equivalent to borrower ${claim.user}'s wallet.`);
  };

  const handleRejectClaim = (claimId: string) => {
    setAppState((prev: any) => {
      const updatedClaims = prev.claims.map((c: any) => {
        if (c.id === claimId) {
          return { ...c, status: 'Rejected' };
        }
        return c;
      });

      const pendingCount = updatedClaims.filter((c: any) => c.status === 'Pending Review').length;

      const updatedHistory = [
        {
          id: Date.now(),
          type: 'emergency',
          section: 'emergency',
          text: `Claim ${claimId} Rejected by Auditor`,
          time: 'Just now',
          amount: '',
          status: 'Rejected'
        },
        ...prev.history
      ];

      return {
        ...prev,
        activeEmergencies: pendingCount,
        claims: updatedClaims,
        history: updatedHistory
      };
    });

    alert(`Claim ${claimId} rejected by institutional audit.`);
  };

  const handleTriggerClearing = () => {
    setAppState((prev: any) => {
      const updatedPools = prev.nodePools.map((p: any) => {
        if (p.id === 'pool-uk') {
          return { ...p, balance: p.balance + 5000, activeTransactions: 0, status: 'Rebalanced' };
        }
        if (p.id === 'pool-in') {
          return { ...p, balance: p.balance - 650000, activeTransactions: 0, status: 'Rebalanced' };
        }
        return { ...p, activeTransactions: 0, status: 'Rebalanced' };
      });

      const updatedHistory = [
        {
          id: Date.now(),
          type: 'system',
          section: 'system',
          text: `P2P Node Pools Cleared & Rebalanced globally`,
          time: 'Just now',
          amount: '',
          status: 'Cleared'
        },
        ...prev.history
      ];

      return {
        ...prev,
        nodePools: updatedPools,
        history: updatedHistory
      };
    });

    alert("Automated clearing settlement successfully triggered! local balances matched and nodes rebalanced.");
  };

  const handleInjectLiquidity = (poolId: string) => {
    setAppState((prev: any) => {
      const updatedPools = prev.nodePools.map((p: any) => {
        if (p.id === poolId) {
          const increase = p.id === 'pool-in' ? 1000000 : 10000;
          return { ...p, balance: p.balance + increase };
        }
        return p;
      });
      return {
        ...prev,
        nodePools: updatedPools
      };
    });
    alert("Injected emergency liquidity reserves into node pool.");
  };

  const renderAdminConsole = () => {
    const pendingClaims = appState.claims?.filter((c: any) => c.status === 'Pending Review') || [];
    const auditedClaims = appState.claims?.filter((c: any) => c.status !== 'Pending Review') || [];

    return (
      <div className="flex flex-col gap-8 text-slate-800 animate-fadeIn">
        
        {/* Top Institutional Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:30px_30px]"></div>
          <div className="relative z-10 flex items-center gap-4">
            <span className="w-12 h-12 rounded-full bg-accentCyan/20 text-accentCyan flex items-center justify-center">
              <Landmark className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Institutional Operations Center</h2>
              <p className="text-xs text-slate-400 mt-0.5">Clearing node statuses, verifying active emergency payouts, and managing system threat ratings.</p>
            </div>
          </div>
          <span className="px-3.5 py-1.5 rounded-full bg-accentPurple/25 border border-accentPurple/45 text-accentPurple text-xs font-bold tracking-wider relative z-10">
            ADMIN CREDENTIALS ACTIVE
          </span>
        </div>

        {/* ADMIN OVERVIEW TAB */}
        {activeTab === 'admin-overview' && (
          <div className="flex flex-col gap-8">
            {/* GRID OF 6 METRIC CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="glass-card rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Users</span>
                <div className="mt-2.5">
                  <div className="text-lg font-extrabold text-slate-900">1,420 Active</div>
                  <span className="text-[9px] text-successGreen font-bold block mt-0.5">+12.4% this month</span>
                </div>
              </div>
              <div className="glass-card rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Verified Emergencies</span>
                <div className="mt-2.5">
                  <div className="text-lg font-extrabold text-slate-900">384 Claims</div>
                  <span className="text-[9px] text-accentTeal font-bold block mt-0.5">99.1% Clearance rate</span>
                </div>
              </div>
              <div className="glass-card rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Fraud Attempts</span>
                <div className="mt-2.5">
                  <div className="text-lg font-extrabold text-dangerRed">3 Blocked</div>
                  <span className="text-[9px] text-slate-400 font-bold block mt-0.5">Hash matches detected</span>
                </div>
              </div>
              <div className="glass-card rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Transfer Volume</span>
                <div className="mt-2.5">
                  <div className="text-lg font-extrabold text-slate-900 font-mono">£845,200</div>
                  <span className="text-[9px] text-successGreen font-bold block mt-0.5 font-sans">Zero swift wire fee</span>
                </div>
              </div>
              <div className="glass-card rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Active Rate Locks</span>
                <div className="mt-2.5">
                  <div className="text-lg font-extrabold text-slate-900">24 Locks</div>
                  <span className="text-[9px] text-accentPurple font-bold block mt-0.5">Subscription active</span>
                </div>
              </div>
              <div className="glass-card rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">OCR Scan Success</span>
                <div className="mt-2.5">
                  <div className="text-lg font-extrabold text-successGreen">97.4% Rate</div>
                  <span className="text-[9px] text-slate-400 font-bold block mt-0.5 font-sans">Mean time: 1.8 seconds</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Recent duplicate attempts & alerts */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                <div className="glass-card rounded-3xl p-6">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2.5 border-b border-slate-100 mb-4">
                    <ShieldAlert className="w-4 h-4 text-dangerRed" /> Active Security & Duplicate Upload Warnings
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="p-3.5 bg-dangerRed/5 border border-dangerRed/15 rounded-2xl flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-dangerRed/10 text-dangerRed flex items-center justify-center shrink-0">⚠️</span>
                      <div>
                        <div className="font-bold text-slate-900">Duplicate Hash Match Detected on 'medical_bill_7119.pdf'</div>
                        <p className="text-slate-600 mt-1">User 'Aarav' attempted to upload a document identical in content to 'medical_bill_7119.pdf' previously uploaded by 'Siddharth'. AI auto-blocked instant disbursal rule.</p>
                        <span className="text-[9px] text-slate-400 mt-1 block">Threat score: 99.8% • Log Reference #DE-90812</span>
                      </div>
                    </div>
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-accentCyan/10 text-accentCyan flex items-center justify-center shrink-0">ℹ️</span>
                      <div>
                        <div className="font-bold text-slate-900">Guarantor Verification Circle Limits Exceeded</div>
                        <p className="text-slate-600 mt-1">User 'Rushi' requesting emergency payout of £800. Active co-signers in circle ('Sarah', 'Ahmed') currently have only £600 remaining available under trust limits.</p>
                        <span className="text-[9px] text-slate-400 mt-1 block font-sans">Requires manual audit approval • Log Reference #GU-40291</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Node pool overview quick summary */}
                <div className="glass-card rounded-3xl p-6">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2.5 border-b border-slate-100 mb-4">
                    <Activity className="w-4 h-4 text-accentCyan" /> P2P Settlement Clearance Pools
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="text-[10px] text-slate-400 font-bold uppercase border-b border-slate-100">
                          <th className="py-2">Pool Name</th>
                          <th className="py-2">Reserve Balance</th>
                          <th className="py-2">Pending Matches</th>
                          <th className="py-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-slate-700 font-medium">
                        {appState.nodePools?.map((pool: any) => (
                          <tr key={pool.id}>
                            <td className="py-3 font-bold">{pool.name}</td>
                            <td className="py-3 font-mono font-bold">
                              {pool.id === 'pool-in' ? '₹' : '£'}
                              {pool.balance.toLocaleString()}
                            </td>
                            <td className="py-3">{pool.activeTransactions} active matches</td>
                            <td className="py-3 text-right">
                              <span className="bg-successGreen/15 text-successGreen px-2 py-0.5 rounded-full font-bold text-[9px]">
                                {pool.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => onNavigateToTab('settlement-pool')}
                      className="text-xs font-bold text-accentPurple hover:underline flex items-center gap-1"
                    >
                      Manage Settlement Node Pools →
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Pending claims snapshot */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <div className="glass-card rounded-3xl p-5 flex flex-col gap-4">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-accentTeal" /> Pending Claims Queue ({pendingClaims.length})
                  </h3>
                  <div className="space-y-3">
                    {pendingClaims.map((claim: any) => (
                      <div key={claim.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-2 text-xs">
                        <div className="flex justify-between items-center font-bold">
                          <span className="text-slate-900 flex items-center gap-1.5 flex-wrap">
                            <span>{claim.user} ({claim.category})</span>
                            {claim.status === 'Awaiting Voice Memo' && (
                              <span className="text-[8px] bg-sky-50 text-sky-600 border border-sky-200 px-1.5 py-0.5 rounded font-bold uppercase animate-pulse shrink-0">Awaiting Memo</span>
                            )}
                          </span>
                          <span className="text-accentTeal font-mono">
                            {claim.currency === 'GBP' ? '£' : claim.currency === 'EUR' ? '€' : claim.currency === 'INR' ? '₹' : claim.currency}
                            {claim.amount}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500">File: {claim.fileName} • Time: {claim.time}</div>
                        <div className="text-[10px] text-slate-600 italic bg-white p-2 rounded-lg border border-slate-100">"{claim.desc}"</div>
                        <button
                          onClick={() => onNavigateToTab('claims-audit')}
                          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded-lg text-[10px] font-bold text-center mt-1 transition-colors"
                        >
                          Review Invoice & AI Metrics
                        </button>
                      </div>
                    ))}
                    {pendingClaims.length === 0 && (
                      <div className="text-xs text-slate-400 text-center py-6">No emergency claims awaiting review.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CLAIMS AUDIT TAB */}
        {activeTab === 'claims-audit' && (
          <div className="flex flex-col gap-6 font-medium">
            <div className="glass-card rounded-3xl p-6 bg-white border border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-3 border-b border-slate-100 mb-5">
                <CheckSquare className="w-4 h-4 text-accentPurple" /> Pending Claims Review Queue
              </h3>
              
              <div className="flex flex-col gap-4">
                {pendingClaims.map((claim: any) => (
                  <div key={claim.id} className="border border-slate-200 rounded-3xl p-6 bg-slate-50/50 flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden">
                    <div className="flex-grow space-y-4">
                      {/* Top title line */}
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-accentPurple font-bold uppercase tracking-wider bg-accentPurple/10 px-2 py-0.5 rounded-full">
                              {claim.category}
                            </span>
                            {claim.status === 'Awaiting Voice Memo' && (
                              <span className="text-[9px] text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full font-bold uppercase animate-pulse">
                                Awaiting Voice Memo
                              </span>
                            )}
                          </div>
                          <h4 className="text-md font-bold text-slate-900 mt-1.5">Requested by: <span className="text-accentCyan">{claim.user}</span></h4>
                          <span className="text-[10px] text-slate-400 block">Uploaded File: <strong className="text-slate-600 font-mono">{claim.fileName}</strong> • Submitted: {claim.time}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block text-sans">Amount Requested</span>
                          <span className="text-lg font-black text-slate-950 font-mono">
                            {claim.currency === 'GBP' ? '£' : claim.currency === 'EUR' ? '€' : claim.currency === 'INR' ? '₹' : claim.currency}
                            {claim.amount.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Brief description context */}
                      <div className="bg-white p-3 border border-slate-100 rounded-2xl text-xs text-slate-700 leading-normal">
                        <strong className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Urgency Brief Context:</strong>
                        "{claim.desc}"
                      </div>

                      {/* Voice transcript display */}
                      {claim.voiceMemoRecorded && claim.voiceMemoText && (
                        <div className="bg-emerald-50/60 p-3 border border-emerald-100/50 rounded-2xl text-xs text-emerald-800 leading-normal flex items-start gap-2.5">
                          <Mic className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-[9px] text-emerald-600 font-bold uppercase block mb-0.5">Vocal Explanation context transcript:</strong>
                            "{claim.voiceMemoText}"
                          </div>
                        </div>
                      )}

                      {/* AI Ingested verification metrics */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-3 border border-slate-100 rounded-2xl text-center">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">AI OCR Match</span>
                          <span className="text-md font-bold text-slate-900 block mt-1">{claim.score}%</span>
                        </div>
                        <div className="bg-white p-3 border border-slate-100 rounded-2xl text-center">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Voice Biometric Match</span>
                          <span className={`text-md font-bold block mt-1 ${claim.voiceMemoRecorded ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {claim.voiceMemoRecorded ? `${claim.voiceCorrelation || 98.2}%` : 'No Voice Memo'}
                          </span>
                        </div>
                        <div className="bg-white p-3 border border-slate-100 rounded-2xl text-center">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Guarantor Circle Vouch</span>
                          <span className={`text-xs font-bold block mt-1.5 ${claim.vouchers?.length > 0 ? 'text-accentTeal' : 'text-slate-400'}`}>
                            {claim.vouchers && claim.vouchers.length > 0 
                              ? `Vouched: ${claim.vouchers.join(' & ')}` 
                              : 'No vouches yet'}
                          </span>
                        </div>
                        <div className="bg-white p-3 border border-slate-100 rounded-2xl text-center flex flex-col justify-center">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block text-sans">Fraud / Alteration</span>
                          <span className={`text-md font-bold block mt-0.5 ${claim.fraudLikelihood > 20 ? 'text-dangerRed' : 'text-successGreen'}`}>
                            {claim.fraudLikelihood}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="w-full md:w-52 flex flex-col justify-center gap-2 border-t md:border-t-0 md:border-l border-slate-200/80 pt-4 md:pt-0 md:pl-6 shrink-0">
                      <button
                        onClick={() => handleApproveClaim(claim.id)}
                        className="w-full py-2.5 bg-gradient-to-r from-accentTeal to-accentPurple text-white text-xs font-bold rounded-xl shadow-md hover:brightness-105 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" /> Approve Payout
                      </button>
                      
                      {claim.status !== 'Awaiting Voice Memo' && !claim.voiceMemoRecorded && (
                        <button
                          type="button"
                          onClick={() => {
                            setAppState((prev: any) => {
                              const updatedClaims = prev.claims.map((c: any) => {
                                if (c.id === claim.id) {
                                  return { ...c, status: 'Awaiting Voice Memo' };
                                }
                                return c;
                              });
                              return {
                                ...prev,
                                claims: updatedClaims,
                                history: [
                                  {
                                    id: Date.now(),
                                    type: 'system',
                                    section: 'emergency',
                                    text: `Auditor requested voice explanation memo for claim ${claim.id}`,
                                    time: 'Just now',
                                    amount: '',
                                    status: 'Awaiting Info'
                                  },
                                  ...prev.history
                                ]
                              };
                            });
                            alert(`Requested additional Voice Explanation Memo from borrower ${claim.user}.`);
                          }}
                          className="w-full py-2.5 bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold rounded-xl hover:bg-sky-100 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Mic className="w-4 h-4" /> Request Voice Memo
                        </button>
                      )}

                      <button
                        onClick={() => handleRejectClaim(claim.id)}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                      >
                        <X className="w-4 h-4" /> Reject Claim
                      </button>
                    </div>
                  </div>
                ))}
                {pendingClaims.length === 0 && (
                  <div className="text-xs text-slate-400 text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
                    No emergency claims awaiting review. All clear!
                  </div>
                )}
              </div>
            </div>

            {/* Audited History panel */}
            <div className="glass-card rounded-3xl p-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2.5 border-b border-slate-100 mb-4">
                Audited Claims History Log
              </h3>
              <div className="space-y-3 font-semibold text-xs text-slate-700">
                {auditedClaims.map((claim: any) => (
                  <div key={claim.id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        claim.status === 'Verified' ? 'bg-successGreen/10 text-successGreen' : 'bg-dangerRed/10 text-dangerRed'
                      }`}>
                        {claim.status === 'Verified' ? '✓' : '✕'}
                      </div>
                      <div>
                        <div className="text-slate-800">{claim.user} - {claim.category}</div>
                        <span className="text-[9px] text-slate-400 font-normal">File: {claim.fileName} • Status: <strong className={claim.status === 'Verified' ? 'text-successGreen' : 'text-dangerRed'}>{claim.status}</strong></span>
                      </div>
                    </div>
                    <div className="text-right font-mono font-bold text-slate-900">
                      {claim.currency === 'GBP' ? '£' : claim.currency === 'EUR' ? '€' : claim.currency === 'INR' ? '₹' : claim.currency}
                      {claim.amount}
                    </div>
                  </div>
                ))}
                {auditedClaims.length === 0 && (
                  <div className="text-xs text-slate-400 text-center py-4">No claims have been processed yet.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SETTLEMENT POOLS TAB */}
        {activeTab === 'settlement-pool' && (
          <div className="flex flex-col gap-6">
            <div className="glass-card rounded-3xl p-6 bg-white">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-4 mb-6 gap-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-accentCyan" /> P2P Settlement Clearance Pools
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Real-time mock reserves for matching local payments avoiding international wires.</p>
                </div>
                <button
                  onClick={handleTriggerClearing}
                  className="bg-accentPurple hover:brightness-105 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Trigger Manual Clearing Rule
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {appState.nodePools?.map((pool: any) => (
                  <div key={pool.id} className="border border-slate-200 rounded-3xl p-5 bg-slate-50 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                        <span>{pool.name}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] border ${
                          pool.status === 'Optimal' ? 'text-successGreen bg-successGreen/15 border-successGreen/25' : 'text-accentPurple bg-accentPurple/15 border-accentPurple/25'
                        }`}>{pool.status}</span>
                      </div>
                      <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
                        {pool.id === 'pool-in' ? '₹' : '£'}
                        {pool.balance.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500 font-semibold mt-1">
                        Active Transactions Matched: <strong className="text-slate-800">{pool.activeTransactions} clearance rules</strong>
                      </div>
                    </div>
                    <button
                      onClick={() => handleInjectLiquidity(pool.id)}
                      className="w-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 py-2 rounded-xl text-xs font-bold text-center transition-colors"
                    >
                      Inject Liquidity reserves
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-3xl p-6">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">
                P2P Settlement Clearing Logs
              </h3>
              <div className="space-y-3 font-semibold text-xs text-slate-700">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center">
                  <span>Rebalanced Local Reserves: INR pool clearance completed (India matching Node SZB-492)</span>
                  <span className="font-mono text-[10px] text-slate-400">10 mins ago</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center">
                  <span>UK settlement reserve injection manual trigger (+£10,000)</span>
                  <span className="font-mono text-[10px] text-slate-400">1 hour ago</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center">
                  <span>Match completed GBP/INR: Routed £500 to ₹58,000 internally</span>
                  <span className="font-mono text-[10px] text-slate-400">2 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SYSTEM SECURITY LOGS TAB */}
        {activeTab === 'system-logs' && (
          <div className="flex flex-col gap-6">
            <div className="glass-card rounded-3xl p-6 bg-slate-950 text-white font-mono border border-slate-850">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4 text-xs font-bold">
                <span className="text-accentCyan flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-successGreen inline-block animate-ping"></span>
                  SAAN SECURITY TERMINAL LOGS
                </span>
                <span className="text-slate-400">Audit Active • UTC 2026</span>
              </div>
              <div className="space-y-2 text-xs leading-normal max-h-96 overflow-y-auto">
                <div className="text-slate-400">[09:42:10] [SYSTEM] Initialization complete. All matching channels listening on WebSockets.</div>
                <div className="text-slate-400">[09:30:15] [ADMIN] Session opened for administrator: admin@saanpay.co.uk</div>
                <div className="text-successGreen">[09:12:44] [OCR] Ingested document: 'hospital_bill_delhi.pdf'. Extraction match confidence: 94.8%. Category matched: Medical/Hospital Invoice.</div>
                <div className="text-slate-400">[08:45:00] [SYSTEM] Clearing node 'pool-uk' rebalanced with +£5,000 clearance.</div>
                <div className="text-warningGold">[08:34:12] [AI-GUARD] Document 'invoice.pdf' flagged for manual review: co-signer circle limits pending validation.</div>
                <div className="text-dangerRed animate-pulse">[08:02:44] [FRAUD-ATTEMPT] Duplicate file block: identical payload hash matching 'medical_bill_7119.pdf' rejected from Aarav account. IP logged.</div>
                <div className="text-slate-400">[07:15:30] [SYSTEM] Daily exchange rates database sync check passed (Google Finance endpoint verified).</div>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  };

  if (userRole === 'admin') {
    return renderAdminConsole();
  }

  const remainingDue = appState.loanTotal - appState.loanPaid;
  const currentPairString = `${appState.currentFrom || 'GBP'} → ${appState.currentTo || 'INR'}`;
  const currentPairRate = appState.fxRates[appState.currentTo || 'INR'] || '131.50';

  return (
    <div className="flex flex-col gap-8 relative text-slate-800">
      
      {/* 1. MOCK FUNDS DEPOSIT MODAL */}
      {isAddMoneyOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 border border-slate-200 shadow-xl rounded-3xl relative">
            <button 
              onClick={() => setIsAddMoneyOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <span className="text-lg">✕</span>
            </button>
            <h3 className="text-md font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Landmark className="w-5 h-5 text-accentCyan" /> Add Mock Funds to Wallet
            </h3>
            <form onSubmit={handleDeposit} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] text-slate-500 uppercase block mb-1">Deposit Amount (GBP)</label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-3 focus-within:border-accentCyan transition-colors">
                  <span className="text-slate-800 font-mono font-bold mr-1.5">£</span>
                  <input
                    type="number"
                    required
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full bg-transparent text-slate-900 font-mono text-sm font-bold focus:outline-none"
                    placeholder="Enter amount"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-accentCyan to-accentTeal hover:brightness-105 text-white font-bold py-2.5 rounded-xl text-xs transition-all duration-300 shadow-md"
              >
                Confirm Deposit
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. RATE LOCK SUBSCRIPTION UPGRADE MODAL */}
      {showSubModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-7 border border-slate-200 shadow-2xl rounded-3xl relative text-center">
            <button 
              onClick={() => setShowSubModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-14 h-14 bg-accentPurple/10 text-accentPurple rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-2">Annual Rate Lock Limit Reached</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              You have already utilized your <span className="font-bold text-slate-900">3 free annual rate locks</span>. 
              Unlock unlimited rate protection shields instantly with a monthly subscription.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Premium Rate Shield</div>
              <div className="text-2xl font-black text-slate-900 mt-1 font-mono">£5.99 / mo</div>
              <div className="text-[10px] text-accentTeal font-bold mt-1">Cancel anytime • Unlimited active locks</div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleSubscribe}
                className="w-full bg-gradient-to-r from-accentPurple to-accentCyan text-white font-bold py-3 rounded-xl text-xs shadow-lg hover:brightness-105 active:scale-95 transition-all"
              >
                Upgrade to Premium
              </button>
              <button
                onClick={() => setShowSubModal(false)}
                className="w-full bg-transparent hover:bg-slate-50 text-slate-500 font-bold py-2 rounded-xl text-xs transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. TRACK VERIFICATION PIPELINE MODAL */}
      {showTrackModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 border border-slate-200 shadow-xl rounded-3xl relative">
            <button onClick={() => setShowTrackModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-successGreen" /> Emergency Pipeline Tracker
            </h3>
            <div className="flex flex-col gap-4 font-semibold text-xs text-slate-700">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-successGreen text-white flex items-center justify-center text-[10px]">✓</div>
                <div>
                  <div className="text-slate-900 font-bold">OCR Ingestion</div>
                  <div className="text-[10px] text-slate-400 font-normal">Parsed invoices from hospital nodes successfully.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-successGreen text-white flex items-center justify-center text-[10px]">✓</div>
                <div>
                  <div className="text-slate-900 font-bold">Document Authentication Check</div>
                  <div className="text-[10px] text-slate-400 font-normal">Metadata check passed. Fingerprint verified.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-accentCyan text-white flex items-center justify-center text-[10px] animate-pulse">2</div>
                <div>
                  <div className="text-slate-900 font-bold">Guarantor Validation</div>
                  <div className="text-[10px] text-slate-400 font-normal">Verifying co-signer co-signing limits. (Active)</div>
                </div>
              </div>
              <div className="flex items-start gap-3 opacity-50">
                <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px]">3</div>
                <div>
                  <div className="text-slate-900 font-bold">Automated Liquidity Disbursal</div>
                  <div className="text-[10px] text-slate-400 font-normal">Escrow setup via local settlement match pools.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. VIEW AI ANALYSIS METRICS MODAL */}
      {showAnalysisModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 border border-slate-200 shadow-xl rounded-3xl relative">
            <button onClick={() => setShowAnalysisModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-accentPurple" /> AI Verification Log & Audit
            </h3>
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-800">Confidence Match Rate</span>
                  <span className="font-mono text-accentTeal font-bold text-sm">94.8%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-accentTeal h-full" style={{ width: '94.8%' }}></div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-800">Fraud/Risk Threat Rating</span>
                  <span className="font-mono text-successGreen font-bold">LOW (8 / 100)</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-successGreen h-full" style={{ width: '8%' }}></div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 space-y-1.5">
                <div className="font-bold text-slate-800 uppercase text-[9px] tracking-wider">AI Flags Summary</div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <Check className="w-3.5 h-3.5 text-successGreen" /> Doctor registry matched (FMC India database).
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <Check className="w-3.5 h-3.5 text-successGreen" /> Timestamps check aligned with air travel records.
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <Check className="w-3.5 h-3.5 text-successGreen" /> Currency conversion rates locked cleanly.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOP NOTIFICATION BANNER */}
      {showBanner && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex justify-between items-center relative">
          <div className="flex items-center gap-3 text-xs leading-normal">
            <span className="w-8 h-8 rounded-full bg-accentCyan/10 text-accentCyan flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </span>
            <div className="text-slate-600 font-medium">
              We've updated how Saan Voice processes zero-border local matches. Outstanding loans can be co-signed instantly. 
              <button 
                onClick={() => onNavigateToTab('p2p-trust')}
                className="text-accentPurple hover:underline font-bold ml-1.5"
              >
                Find out more
              </button>
            </div>
          </div>
          <button 
            onClick={() => setShowBanner(false)}
            className="text-slate-400 hover:text-slate-700 transition-all ml-4"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TOP SUMMARY CARDS (7 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        
        {/* 1. Due Amount Card */}
        <div className="glass-card rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Due Amount</span>
          <div className="mt-2.5">
            <div className="text-lg font-extrabold text-slate-900 font-mono">
              £{remainingDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[9px] text-slate-400 font-bold block mt-0.5">Remaining Out of £5,000</span>
          </div>
        </div>

        {/* 2. Paid Money Card */}
        <div className="glass-card rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Paid Money</span>
          <div className="mt-2.5">
            <div className="text-lg font-extrabold text-slate-900 font-mono">
              £{appState.loanPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[9px] text-successGreen font-bold block mt-0.5">50% Total Repaid</span>
          </div>
        </div>

        {/* 3. Total Family Contribution */}
        <div className="glass-card rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Family Contributions</span>
          <div className="mt-2.5">
            <div className="text-lg font-extrabold text-slate-900 font-mono">
              ₹{appState.familyContributions.toLocaleString()}
            </div>
            <span className="text-[9px] text-slate-400 font-bold block mt-0.5">Received Locally</span>
          </div>
        </div>

        {/* 4. Active Emergency Requests */}
        <div className="glass-card rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Active Emergencies</span>
          <div className="mt-2.5">
            <div className="text-lg font-extrabold text-slate-900">
              {appState.activeEmergencies} Pending
            </div>
            <span className="text-[9px] text-amber-600 font-bold block mt-0.5">Awaiting Review</span>
          </div>
        </div>

        {/* 5. Rate Locks */}
        <div className="glass-card rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Rate Locks</span>
          <div className="mt-2.5">
            <div className="text-lg font-extrabold text-slate-900 font-mono">
              {appState.activeLocks} Active
            </div>
            <span className="text-[9px] text-accentTeal font-bold block mt-0.5">
              {appState.isSubscribed ? 'Premium: Unlimited' : `${appState.locksUsedThisYear}/3 Used`}
            </span>
          </div>
        </div>

        {/* 6. Live Exchange Rate of Chosen Pair */}
        <div className="glass-card rounded-2xl p-4 flex flex-col justify-between border-accentPurple/20 bg-gradient-to-br from-white to-accentPurple/5">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Chosen Pair Rate</span>
          <div className="mt-2.5">
            <div className="text-xs font-bold text-slate-700 mb-0.5">{currentPairString}</div>
            <div className="text-lg font-black text-accentPurple font-mono">
              {currentPairRate}
            </div>
            <span className="text-[9px] text-accentPurple font-bold block mt-0.5">Live Match active</span>
          </div>
        </div>

        {/* 7. Money Saved Card */}
        <div className="glass-card rounded-2xl p-4 flex flex-col justify-between border-successGreen/25 bg-gradient-to-br from-white to-successGreen/5">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Money Saved</span>
          <div className="mt-2.5">
            <div className="text-lg font-black text-successGreen font-mono">
              £{appState.savedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[9px] text-slate-400 font-bold block mt-0.5">P2P Fees Avoided</span>
          </div>
        </div>

      </div>

      {/* CORE SECTIONS - THREE COLUMN DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN (lg:col-span-4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* A. Live Exchange Rate Widget */}
          <div className="glass-card rounded-3xl p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-accentCyan" /> Live Exchange Rate Widget
              </h3>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-slate-400 font-mono">Refreshes in {countdown}s</span>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-200 border-t-accentCyan animate-spin" />
              </div>
            </div>

            {/* Rates Table */}
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-[10px] text-slate-400 font-bold uppercase border-b border-slate-100">
                  <th className="py-2">Pair</th>
                  <th className="py-2">Rate</th>
                  <th className="py-2 text-right">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700 font-medium">
                <tr>
                  <td className="py-2 flex items-center gap-1">🇬🇧 → 🇮🇳 GBP/INR</td>
                  <td className="py-2 font-mono font-bold text-slate-900">{liveRates.INR.toFixed(2)}</td>
                  <td className="py-2 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      rateChanges.INR === 'up' ? 'bg-successGreen/10 text-successGreen' : 'bg-dangerRed/10 text-dangerRed'
                    }`}>
                      {rateChanges.INR === 'up' ? '↑' : '↓'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 flex items-center gap-1">🇬🇧 → 🇦🇪 GBP/AED</td>
                  <td className="py-2 font-mono font-bold text-slate-900">{liveRates.AED.toFixed(2)}</td>
                  <td className="py-2 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      rateChanges.AED === 'up' ? 'bg-successGreen/10 text-successGreen' : 'bg-dangerRed/10 text-dangerRed'
                    }`}>
                      {rateChanges.AED === 'up' ? '↑' : '↓'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 flex items-center gap-1">🇬🇧 → 🇺🇸 GBP/USD</td>
                  <td className="py-2 font-mono font-bold text-slate-900">{liveRates.USD.toFixed(2)}</td>
                  <td className="py-2 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      rateChanges.USD === 'up' ? 'bg-successGreen/10 text-successGreen' : 'bg-dangerRed/10 text-dangerRed'
                    }`}>
                      {rateChanges.USD === 'up' ? '↑' : '↓'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 flex items-center gap-1">🇬🇧 → 🇪🇺 GBP/EUR</td>
                  <td className="py-2 font-mono font-bold text-slate-900">{liveRates.EUR.toFixed(2)}</td>
                  <td className="py-2 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      rateChanges.EUR === 'up' ? 'bg-successGreen/10 text-successGreen' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {rateChanges.EUR === 'up' ? '↑' : '→'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 flex items-center gap-1">🇬🇧 → 🇨🇦 GBP/CAD</td>
                  <td className="py-2 font-mono font-bold text-slate-900">{liveRates.CAD.toFixed(2)}</td>
                  <td className="py-2 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      rateChanges.CAD === 'up' ? 'bg-successGreen/10 text-successGreen' : 'bg-dangerRed/10 text-dangerRed'
                    }`}>
                      {rateChanges.CAD === 'up' ? '↑' : '↓'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Target Rate Alerts */}
            <form onSubmit={handleAddAlert} className="pt-2 border-t border-slate-100">
              <div className="flex gap-2">
                <div className="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center focus-within:border-accentCyan transition-colors">
                  <span className="text-[10px] text-slate-400 uppercase font-bold mr-1.5">Alert at GBP/INR:</span>
                  <input 
                    type="text" 
                    value={targetRate} 
                    onChange={(e) => setTargetRate(e.target.value)}
                    className="w-full bg-transparent text-slate-800 font-mono text-xs font-bold focus:outline-none"
                  />
                </div>
                <button 
                  type="submit" 
                  className="bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 font-bold px-3 rounded-xl text-xs transition-colors"
                >
                  Set Alert
                </button>
              </div>
              {alertSuccessMessage && (
                <div className="text-[9px] text-successGreen font-bold mt-1.5">{alertSuccessMessage}</div>
              )}
            </form>

            <button 
              onClick={handleLockRateAction}
              className="w-full bg-accentTeal hover:brightness-105 text-white font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm mt-1"
            >
              <Lock className="w-3.5 h-3.5" /> Lock Current Rate {currentPairString}
            </button>
          </div>

          {/* B. Transfer Center */}
          <div className="glass-card rounded-3xl p-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Send className="w-4 h-4 text-accentPurple" /> Transfer Center Quick Actions
            </h3>
            
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => onNavigateToTab('fx-management')}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 py-3 px-2 rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center gap-1 cursor-pointer"
              >
                <Send className="w-4 h-4 text-accentCyan" /> Send Money
              </button>
              <button 
                onClick={() => onNavigateToTab('p2p-trust')}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 py-3 px-2 rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center gap-1 cursor-pointer"
              >
                <ArrowDownLeft className="w-4 h-4 text-accentPurple" /> Request Money
              </button>
              <button 
                onClick={handleLockRateAction}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 py-3 px-2 rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center gap-1 cursor-pointer"
              >
                <Lock className="w-4 h-4 text-accentTeal" /> Lock Exchange Rate
              </button>
              <button 
                onClick={() => {
                  alert('Simulation: Transfer scheduled for local matching settlement logic under optimized timeline.');
                  addHistoryItem({ type: 'fx', section: 'fx', text: 'Scheduled automated matching rule for GBP/INR', amount: '£400.00', status: 'Scheduled' });
                }}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 py-3 px-2 rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center gap-1 cursor-pointer"
              >
                <Activity className="w-4 h-4 text-warningGold" /> Schedule Transfer
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400 font-bold uppercase">Routing Status</span>
                <span className="text-successGreen font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-successGreen rounded-full inline-block animate-pulse"></span> Zero-Border Active
                </span>
              </div>
              <div className="text-[10px] text-slate-500 font-semibold leading-normal">
                Estimated savings from local settlement: <span className="text-successGreen font-bold">£43.50</span> per £500 transfer.
              </div>
            </div>
          </div>

          {/* C. Zero-Border Matching Illustration */}
          <div className="glass-card rounded-3xl p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-accentPurple uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-accentPurple" /> Zero-Border Matching
              </h3>
              <span className="text-[9px] text-successGreen font-bold bg-successGreen/10 border border-successGreen/25 px-2 py-0.5 rounded-full">
                Local Match Found
              </span>
            </div>
            
            <div className="space-y-3.5 text-xs">
              <p className="text-slate-500 leading-normal text-[11px]">
                Saan coordinates local settlements avoiding swift wire codes:
              </p>
              
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-2 relative">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">You send:</span>
                  <span className="font-mono text-slate-900 font-bold">£500 UK → India</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200/60 pt-1.5">
                  <span className="font-bold text-slate-800">Matched with:</span>
                  <span className="font-mono text-slate-900 font-bold">₹58,000 India → UK</span>
                </div>
              </div>

              <div className="flex items-center justify-between font-semibold text-[10px] bg-successGreen/5 border border-successGreen/15 p-2.5 rounded-xl text-successGreen">
                <span>Result: Local settlement completed</span>
                <span>Wire fee avoided</span>
              </div>

              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400 font-bold uppercase">Money saved</span>
                <span className="font-bold text-slate-900 font-mono">£45.00</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400 font-bold uppercase">Settlement Status</span>
                <span className="px-2 py-0.5 rounded bg-successGreen/15 text-successGreen font-bold">Matched & Cleared</span>
              </div>
            </div>
          </div>

          {/* D. Voice Assistant Panel */}
          <div className="glass-card rounded-3xl p-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Volume2 className="w-4 h-4 text-accentCyan" /> Voice Assistant Panel
            </h3>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex-grow">
                <div className="text-[10px] text-slate-400 font-bold uppercase">🎙️ Hey Saan Voice</div>
                <div className="text-xs text-slate-700 font-semibold mt-1">"Hey Saan, lock GBP to INR rate"</div>
              </div>
              <button 
                onClick={() => onNavigateToTab('voice-assistant')}
                className="w-10 h-10 rounded-full bg-accentCyan hover:brightness-105 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer shrink-0"
              >
                <i className="fa-solid fa-microphone text-sm"></i>
              </button>
            </div>

            <div className="text-[10px] text-slate-500 font-semibold space-y-1">
              <span className="text-slate-400 font-bold uppercase block">Recent commands</span>
              <div className="p-2 border border-slate-100 rounded-lg bg-white space-y-1">
                <div className="flex justify-between">
                  <span>• Show exchange rates</span>
                  <span className="text-slate-400 font-mono text-[9px]">10 mins ago</span>
                </div>
                <div className="flex justify-between">
                  <span>• Lock GBP to INR rate</span>
                  <span className="text-slate-400 font-mono text-[9px]">1 hour ago</span>
                </div>
                <div className="flex justify-between">
                  <span>• Upload emergency document</span>
                  <span className="text-slate-400 font-mono text-[9px]">2 hours ago</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* MIDDLE COLUMN (lg:col-span-4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* A. Emergency Center */}
          <div className="glass-card rounded-3xl p-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <ShieldAlert className="w-4 h-4 text-accentTeal" /> Emergency Center
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-[10px] text-slate-400 font-bold uppercase border-b border-slate-100">
                    <th className="py-2">Type</th>
                    <th className="py-2">Status</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700 font-medium">
                  <tr>
                    <td className="py-2.5">Hospital Invoice</td>
                    <td className="py-2.5">
                      <span className="bg-successGreen/15 text-successGreen px-2 py-0.5 rounded-full font-bold text-[9px]">
                        Verified
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-slate-900">₹25,000</td>
                  </tr>
                  <tr>
                    <td className="py-2.5">Flight Booking</td>
                    <td className="py-2.5">
                      <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold text-[9px]">
                        Pending Review
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-slate-900">£350</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-2 mt-1">
              <button 
                onClick={() => onNavigateToTab('emergency')}
                className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" /> Upload Document
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setShowTrackModal(true)}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold py-2 rounded-xl text-[10px] transition-colors"
                >
                  Track Verification
                </button>
                <button 
                  onClick={() => setShowAnalysisModal(true)}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold py-2 rounded-xl text-[10px] transition-colors"
                >
                  View AI Analysis
                </button>
              </div>
            </div>
          </div>

          {/* B. AI Verification Results */}
          <div className="glass-card rounded-3xl p-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <CheckCircle2 className="w-4 h-4 text-successGreen" /> AI Verification Results
            </h3>

            <div className="space-y-2.5 text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-2 text-successGreen font-bold bg-successGreen/5 border border-successGreen/15 p-2 rounded-xl">
                <span>✅</span>
                <span>Document Verified Successfully</span>
              </div>
              <div className="flex items-center gap-2 text-amber-700 font-bold bg-amber-50 border border-amber-200 p-2 rounded-xl">
                <span>⚠</span>
                <span>Missing Information (Secondary ID requested)</span>
              </div>
              <div className="flex items-center gap-2 text-dangerRed font-bold bg-dangerRed/5 border border-dangerRed/15 p-2 rounded-xl">
                <span>🚫</span>
                <span>No Duplicate Upload Detected</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-1">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Verification Rate</span>
                <span className="text-lg font-extrabold text-slate-900 mt-1 block">94.8%</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Risk Threat Score</span>
                <span className="text-lg font-extrabold text-successGreen mt-1 block">8 / 100</span>
              </div>
            </div>

            <div className="text-[9px] text-slate-500 font-semibold space-y-1">
              <span className="text-slate-400 font-bold uppercase block">Processing History</span>
              <div className="p-2 border border-slate-100 rounded-lg bg-white font-mono space-y-1">
                <div className="flex justify-between">
                  <span>• Ingestion: OCR complete</span>
                  <span className="text-slate-400">08:34:10</span>
                </div>
                <div className="flex justify-between">
                  <span>• Metadata match check</span>
                  <span className="text-slate-400">08:34:12</span>
                </div>
                <div className="flex justify-between">
                  <span>• Hash duplication search</span>
                  <span className="text-slate-400">08:34:15</span>
                </div>
              </div>
            </div>
          </div>

          {/* C. Guarantor Circle */}
          <div className="glass-card rounded-3xl p-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <UserCheck className="w-4 h-4 text-accentCyan" /> Guarantor Circle
            </h3>

            <div className="text-xs text-slate-500 leading-normal text-[11px] -mt-1.5">
              Trusted community nodes who back your cross-border emergency underwriting parameters:
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-[10px] text-slate-400 font-bold uppercase border-b border-slate-100">
                    <th className="py-2">Name</th>
                    <th className="py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700 font-medium">
                  <tr>
                    <td className="py-2">Sarah (Sister)</td>
                    <td className="py-2 text-right">
                      <span className="bg-successGreen/15 text-successGreen px-2 py-0.5 rounded-full font-bold text-[9px]">
                        Verified
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2">Ahmed (Uncle)</td>
                    <td className="py-2 text-right">
                      <span className="bg-successGreen/15 text-successGreen px-2 py-0.5 rounded-full font-bold text-[9px]">
                        Verified
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2">Ravi (Friend)</td>
                    <td className="py-2 text-right">
                      <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold text-[9px]">
                        Pending
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-slate-800">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Trust Score</span>
                <span className="text-xs font-black text-slate-900 block mt-0.5">94%</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Borrow Limit</span>
                <span className="text-xs font-black text-slate-900 block mt-0.5">+£1,500</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Interest Red.</span>
                <span className="text-xs font-black text-successGreen block mt-0.5">-2.5%</span>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN (lg:col-span-4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* A. Family Repayment Hub */}
          <div className="glass-card rounded-3xl p-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Coins className="w-4 h-4 text-accentPurple" /> Family Repayment Hub
            </h3>

            {/* Repayment Progress bar */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                <span className="text-slate-800">Loan Repayment Progress</span>
                <span className="text-slate-900 font-mono">£{appState.loanPaid.toLocaleString()} / £{appState.loanTotal.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full border border-slate-200/50 overflow-hidden relative">
                <div 
                  className="bg-gradient-to-r from-accentTeal to-accentPurple h-full transition-all duration-500" 
                  style={{ width: `${(appState.loanPaid / appState.loanTotal) * 100}%` }}
                />
              </div>
              <span className="text-[9px] text-slate-400 font-bold block mt-1.5 text-right">
                {Math.round((appState.loanPaid / appState.loanTotal) * 100)}% Repaid
              </span>
            </div>

            {/* Contributors List */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide block">Repayment Contributors</span>
              <div className="divide-y divide-slate-100">
                <div className="py-1.5 flex justify-between items-center text-xs font-medium text-slate-700">
                  <span>John (Uncle)</span>
                  <span className="font-mono font-bold text-slate-900">£500.00</span>
                </div>
                <div className="py-1.5 flex justify-between items-center text-xs font-medium text-slate-700">
                  <span>Priya (Sister)</span>
                  <span className="font-mono font-bold text-slate-900">£800.00</span>
                </div>
                <div className="py-1.5 flex justify-between items-center text-xs font-medium text-slate-700">
                  <span>Ahmed (Uncle)</span>
                  <span className="font-mono font-bold text-slate-900">£1,200.00</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1">
              <button 
                onClick={inviteFamilyMember}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold py-2 rounded-xl text-[10px] transition-colors"
              >
                Invite Family
              </button>
              <button 
                onClick={handleContribution}
                className="bg-accentPurple/10 hover:bg-accentPurple/20 text-accentPurple border border-accentPurple/20 font-bold py-2 rounded-xl text-[10px] transition-colors"
              >
                Add Contribution
              </button>
            </div>
          </div>

          {/* B. Notifications Center */}
          <div className="glass-card rounded-3xl p-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Bell className="w-4 h-4 text-accentCyan" /> Notifications Center
            </h3>

            <div className="space-y-3 font-semibold text-xs text-slate-700">
              <div className="flex items-start gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-accentCyan mt-1 shrink-0"></div>
                <div>
                  <div className="text-slate-800">Rate alert triggered (GBP/INR target reached)</div>
                  <span className="text-[9px] text-slate-400 font-normal">Just now</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-successGreen mt-1 shrink-0"></div>
                <div>
                  <div className="text-slate-800">Emergency hospital request approved by AI</div>
                  <span className="text-[9px] text-slate-400 font-normal">2 hours ago</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-accentPurple mt-1 shrink-0"></div>
                <div>
                  <div className="text-slate-800">Family contribution payment received from Priya</div>
                  <span className="text-[9px] text-slate-400 font-normal">3 hours ago</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-successGreen mt-1 shrink-0"></div>
                <div>
                  <div className="text-slate-800">Guarantor Sarah verified successfully</div>
                  <span className="text-[9px] text-slate-400 font-normal">1 day ago</span>
                </div>
              </div>
            </div>
          </div>

          {/* C. Analytics Section */}
          <div className="glass-card rounded-3xl p-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <BarChart2 className="w-4 h-4 text-accentTeal" /> Analytics & Trends
            </h3>

            <div className="space-y-4">
              {/* Trends Graph */}
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Exchange Trends (GBP → INR, USD, AED)</span>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-center justify-center">
                  <svg viewBox="0 0 100 35" className="w-full h-16 text-accentCyan overflow-visible">
                    {/* Grid lines */}
                    <line x1="0" y1="10" x2="100" y2="10" stroke="#F1F5F9" strokeWidth="0.5" />
                    <line x1="0" y1="20" x2="100" y2="20" stroke="#F1F5F9" strokeWidth="0.5" />
                    <line x1="0" y1="30" x2="100" y2="30" stroke="#F1F5F9" strokeWidth="0.5" />
                    
                    {/* GBP-INR Line */}
                    <path d="M 0 30 Q 20 22 40 18 T 80 12 T 100 8" fill="none" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="100" cy="8" r="1.5" fill="#6366F1" />
                    
                    {/* GBP-USD Line */}
                    <path d="M 0 25 Q 30 20 60 22 T 100 15" fill="none" stroke="#0EA5E9" strokeWidth="1" strokeDasharray="2" strokeLinecap="round" />
                    
                    {/* Labels */}
                    <text x="2" y="8" fill="#64748B" fontSize="3" fontWeight="bold">GBP-INR</text>
                    <text x="2" y="32" fill="#64748B" fontSize="3" fontWeight="bold">GBP-USD</text>
                  </svg>
                </div>
              </div>

              {/* Activity Histogram */}
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">User Activity (Transfers, Repayments, Emergencies)</span>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-center justify-center">
                  <svg viewBox="0 0 100 25" className="w-full h-12 text-slate-200">
                    <line x1="0" y1="25" x2="100" y2="25" stroke="#E2E8F0" strokeWidth="0.5" />
                    {/* Bars */}
                    <rect x="5" y="5" width="8" height="20" rx="1.5" fill="#0EA5E9" />
                    <rect x="18" y="10" width="8" height="15" rx="1.5" fill="#6366F1" />
                    <rect x="31" y="8" width="8" height="17" rx="1.5" fill="#0D9488" />
                    <rect x="44" y="12" width="8" height="13" rx="1.5" fill="#0EA5E9" />
                    <rect x="57" y="3" width="8" height="22" rx="1.5" fill="#6366F1" />
                    <rect x="70" y="9" width="8" height="16" rx="1.5" fill="#0D9488" />
                    <rect x="83" y="14" width="8" height="11" rx="1.5" fill="#0EA5E9" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* D. Admin Dashboard Card */}
          <div className="glass-card rounded-3xl p-5 flex flex-col gap-3.5 border-slate-200 bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200/60">
              <Terminal className="w-4 h-4 text-slate-800" /> Admin Platform Monitor
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-700">
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Total Users</span>
                <span className="text-slate-900">1,420 Active</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Verified Emergencies</span>
                <span className="text-slate-900">384 Claims</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Fraud Attempts</span>
                <span className="text-dangerRed">3 Blocked</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Transferred Volume</span>
                <span className="text-slate-900 font-mono">£845,200</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Active Locks Count</span>
                <span className="text-slate-900">24 Locks</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">OCR Scan Success</span>
                <span className="text-successGreen">97.4% Success</span>
              </div>
            </div>

            <div className="border-t border-slate-200/60 pt-3 flex justify-between items-center text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1">💰 Total Fees Saved:</span>
              <span className="text-successGreen font-mono font-black text-sm">£14,850</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
