import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginPortal from './components/LoginPortal';
import DashboardOverview from './components/DashboardOverview';
import EmergencyPayout from './components/EmergencyPayout';
import ZeroBorderP2P from './components/ZeroBorderP2P';
import SocialTrust from './components/SocialTrust';
import FXManagement from './components/FXManagement';
import CollaborativeRepay from './components/CollaborativeRepay';
import VoiceAssistant from './components/VoiceAssistant';
import LandingPage from './components/LandingPage';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [userRole, setUserRole] = useState<'user' | 'admin'>('user');
  const [loginPortalInitialMode, setLoginPortalInitialMode] = useState<'signin' | 'signup'>('signin');
  const [loginPortalInitialRole, setLoginPortalInitialRole] = useState<'user' | 'admin'>('user');

  // Shared Global App State
  const [appState, setAppState] = useState({
    loanBalance: 1250.00,
    loanPaid: 2500.00,
    loanTotal: 5000.00,
    activeLocks: 3,
    locksUsedThisYear: 3,
    isSubscribed: false,
    savedAmount: 437.00,
    activeEmergencies: 2,
    familyContributions: 45000,
    currentFrom: 'GBP',
    currentTo: 'INR',
    fxRates: {
      INR: '131.50',
      AED: '4.67',
      CAD: '1.74',
      EUR: '1.18',
      USD: '1.27'
    },
    fxTrends: {
      INR: [130.80, 131.10, 130.90, 131.40, 131.20, 131.50],
      AED: [4.65, 4.68, 4.66, 4.67, 4.66, 4.67],
      CAD: [1.72, 1.73, 1.75, 1.74, 1.73, 1.74],
      EUR: [1.17, 1.19, 1.18, 1.18, 1.17, 1.18],
      USD: [1.25, 1.26, 1.28, 1.27, 1.26, 1.27]
    },
    history: [
      { id: 1, type: 'system', section: 'system', text: 'System initialized. Zero-Border routing node active.', time: '10 mins ago', amount: '', status: 'Active' },
      { id: 2, type: 'fx', section: 'fx', text: 'Locked exchange rate GBP/INR at 131.50', time: '1 hour ago', amount: '£300.00', status: 'Locked' },
      { id: 3, type: 'emergency', section: 'emergency', text: 'AI Approved Emergency Medical Payout', time: '2 hours ago', amount: '£500.00', status: 'Released' },
      { id: 4, type: 'p2p', section: 'p2p', text: 'Matched local transfer SZB-8902 in Rushi circle', time: '3 hours ago', amount: '£100.00', status: 'Settled' }
    ],
    claims: [
      { id: 'claim-1', user: 'Rushi', category: 'Medical/Hospital Invoice Match', amount: 500, fileName: 'hospital_bill_delhi.pdf', desc: 'Emergency appendectomy surgery invoice', status: 'Pending Review', score: 94.8, fraudLikelihood: 8.0, time: '2 hours ago', currency: 'INR', voiceMemoRecorded: true, voiceMemoText: 'Hospital bill Delhi Apollo appendectomy surgery', voiceCorrelation: 96.5, vouchers: [] as string[], autoCleared: false },
      { id: 'claim-2', user: 'Aarav', category: 'Aviation/Airline Delay Match', amount: 350, fileName: 'flight_ticket.pdf', desc: 'Flight cancelled due to extreme weather conditions', status: 'Pending Review', score: 81.2, fraudLikelihood: 12.0, time: '3 hours ago', currency: 'GBP', voiceMemoRecorded: false, voiceMemoText: '', voiceCorrelation: 0, vouchers: [] as string[], autoCleared: false }
    ],
    nodePools: [
      { id: 'pool-uk', name: 'UK Settlement Pool (GBP)', balance: 45000, activeTransactions: 14, status: 'Optimal' },
      { id: 'pool-in', name: 'India Settlement Pool (INR)', balance: 1850000, activeTransactions: 32, status: 'Optimal' },
      { id: 'pool-uae', name: 'UAE Settlement Pool (AED)', balance: 120000, activeTransactions: 9, status: 'Optimal' }
    ]
  });

  const addHistoryItem = (item: { type: string; section: string; text: string; amount: string; status: string }) => {
    setAppState((prev: any) => ({
      ...prev,
      history: [
        {
          id: Date.now(),
          type: item.type,
          section: item.section,
          text: item.text,
          time: 'Just now',
          amount: item.amount,
          status: item.status
        },
        ...(prev.history || [])
      ]
    }));
  };

  // Pull real-world exchange rates from local Google Finance scraper in React
  const fetchRealRates = async () => {
    try {
      const res = await fetch('/api/live-rates');
      if (res.ok) {
        const data = await res.json();
        if (data && data.rates) {
          setAppState((prev) => ({
            ...prev,
            fxRates: {
              INR: parseFloat(data.rates.INR).toFixed(4),
              AED: parseFloat(data.rates.AED).toFixed(4),
              CAD: parseFloat(data.rates.CAD).toFixed(4),
              EUR: parseFloat(data.rates.EUR).toFixed(4),
              USD: parseFloat(data.rates.USD).toFixed(4)
            }
          }));
        }
      }
    } catch (e) {
      console.warn("Google Finance live rates endpoint offline, maintaining baseline prototype data.");
    }
  };

  useEffect(() => {
    fetchRealRates();
    // Poll every 60 seconds
    const interval = setInterval(fetchRealRates, 60000);
    return () => clearInterval(interval);
  }, []);

  // AI Voice Assistant trigger action handler
  const handleTriggerAction = (actionData: { action: string; targetTab: string; speechText: string; parameters?: any }) => {
    const { action, targetTab, parameters } = actionData;
    
    if (targetTab) {
      setActiveTab(targetTab);
    }

    if (action === 'LOCK_RATE' && parameters) {
      setAppState(prev => ({
        ...prev,
        activeLocks: prev.activeLocks + 1
      }));
    } else if (action === 'SCHEDULE_TRANSFER' && parameters) {
      alert(`Automated scheduling rule created for £${parameters.amount || 300} under optimization matrix.`);
    }
  };

  const handlePayoutInitiated = (
    amount: number,
    category: string = 'Medical',
    fileName?: string,
    desc?: string,
    score?: number,
    fraudLikelihood?: number,
    currency?: string,
    user?: string,
    voiceMemoRecorded?: boolean,
    voiceMemoText?: string,
    voiceCorrelation?: number
  ) => {
    const activeCurrency = currency || 'GBP';
    const activeUser = user || 'Rushi';
    const cleanScore = score || 95.0;
    const cleanFraud = fraudLikelihood || 5.0;

    // Evaluate Auto-Clear Rules: high confidence, voice explanation, and small amount
    const isAutoClearEligible = (cleanScore >= 90) && voiceMemoRecorded && (amount < 500);
    const finalStatus = isAutoClearEligible ? 'Verified' : 'Pending Review';

    const newClaim = {
      id: `claim-${Date.now()}`,
      user: activeUser,
      category: category,
      amount: amount,
      fileName: fileName || 'invoice.pdf',
      desc: desc || 'Emergency Funding Request',
      status: finalStatus,
      score: cleanScore,
      fraudLikelihood: cleanFraud,
      time: 'Just now',
      currency: activeCurrency,
      voiceMemoRecorded: !!voiceMemoRecorded,
      voiceMemoText: voiceMemoText || '',
      voiceCorrelation: voiceCorrelation || 0,
      vouchers: [] as string[],
      autoCleared: isAutoClearEligible
    };

    setAppState(prev => {
      let updatedLoanBalance = prev.loanBalance;
      let activeEmergenciesChange = isAutoClearEligible ? 0 : 1;

      if (isAutoClearEligible) {
        let creditingAmount = amount;
        if (activeCurrency === 'INR') {
          creditingAmount = amount / 100;
        } else if (activeCurrency === 'AED') {
          creditingAmount = amount / 4.6;
        }
        updatedLoanBalance += creditingAmount;
      }

      const nextHistoryItem = {
        id: Date.now(),
        type: 'emergency',
        section: 'emergency',
        text: isAutoClearEligible
          ? `[AI Auto-Clear] Approved emergency ${category} claim instantly`
          : `Submitted emergency ${category} claim for review`,
        time: 'Just now',
        amount: `${activeCurrency === 'GBP' ? '£' : activeCurrency === 'EUR' ? '€' : activeCurrency === 'INR' ? '₹' : activeCurrency} ${amount.toFixed(2)}`,
        status: finalStatus
      };

      return {
        ...prev,
        loanBalance: updatedLoanBalance,
        activeEmergencies: prev.activeEmergencies + activeEmergenciesChange,
        claims: [newClaim, ...(prev.claims || [])],
        history: [nextHistoryItem, ...(prev.history || [])]
      };
    });

    if (isAutoClearEligible) {
      let creditedInGBP = amount;
      if (activeCurrency === 'INR') creditedInGBP = amount / 100;
      else if (activeCurrency === 'AED') creditedInGBP = amount / 4.6;
      alert(`[AI AUTO-CLEAR] High trust match & voice ID biometrics verified! Payout of £${creditedInGBP.toFixed(2)} equivalent released instantly to your local matching node.`);
    } else {
      alert(`Emergency claim of ${activeCurrency} ${amount.toFixed(2)} has been submitted for Organization Audit review.`);
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <LandingPage
          appState={appState}
          onOpenLogin={(mode, role = 'user') => {
            setLoginPortalInitialMode(mode);
            setLoginPortalInitialRole(role);
            setIsLoginOpen(true);
          }}
        />
        {isLoginOpen && (
          <LoginPortal
            initialMode={loginPortalInitialMode}
            initialRole={loginPortalInitialRole}
            onLoginSuccess={(role) => {
              setIsAuthenticated(true);
              setIsLoginOpen(false);
              setUserRole(role);
              if (role === 'admin') {
                setActiveTab('admin-overview');
              } else {
                setActiveTab('overview');
              }
            }}
            onClose={() => setIsLoginOpen(false)}
          />
        )}
      </>
    );
  }

  // Define titles/subtitles for header based on active tab
  const getHeaderDetails = () => {
    switch (activeTab) {
      case 'overview':
        return { title: 'Dashboard Overview', sub: 'Real-time statistics & global cross-border transactions' };
      case 'emergency':
        return { title: 'AI Emergency Verification Gateway', sub: 'Verify financial emergencies & route automated funding paths' };
      case 'p2p-trust':
        return { title: 'Zero-Border Matching & Social Trust', sub: 'Settle cross-border payments locally & leverage guarantor circles' };
      case 'fx-management':
        return { title: 'Dynamic FX Management System', sub: 'Lock exchange rates, review analytics & automate cross-border paths' };
      case 'loan-repayment':
        return { title: 'Collaborative Repayment & Lending Hub', sub: 'Coordinate family contributions & minimize currency overheads' };
      case 'voice-assistant':
        return { title: 'Saan Voice Assistant Console', sub: 'Execute transactions & verify details hands-free via Hey Saan' };
      case 'admin-overview':
        return { title: 'Organization Console', sub: 'System-wide performance, fraud monitors, and volume matrices' };
      case 'claims-audit':
        return { title: 'Emergency Claims Audit Board', sub: 'Review pending borrower invoices, OCR confidence matchers, and release payouts' };
      case 'settlement-pool':
        return { title: 'P2P Settlement Pools', sub: 'Clear pool imbalances, manage local reserves, and clearance rules' };
      case 'system-logs':
        return { title: 'System Security Logs', sub: 'Audit trails of blocked duplicates, system logins, and network status' };
      default:
        return { title: 'Saan Dashboard', sub: 'Secure Global Payments' };
    }
  };

  const headerDetails = getHeaderDetails();

  return (
    <div className="flex min-h-screen relative font-sans text-textPrimary bg-bgPrimary">
      {/* Background Animated Glows */}
      <div className="bg-glow-container">
        <div className="bg-grid-overlay" />
        <div className="bg-glow bg-glow-1" />
        <div className="bg-glow bg-glow-2" />
      </div>

      {/* Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => setIsAuthenticated(false)} userRole={userRole} />

      {/* Main Panel */}
      <main className="ml-72 flex-grow p-10 max-w-[1400px]">
        <Header
          title={headerDetails.title}
          subTitle={headerDetails.sub}
          onOpenVoiceModal={() => setActiveTab('voice-assistant')}
        />

        {/* Tab switcher renderer */}
        <div className="mt-8">
          {(activeTab === 'overview' || activeTab === 'admin-overview' || activeTab === 'claims-audit' || activeTab === 'settlement-pool' || activeTab === 'system-logs') && (
            <DashboardOverview
              appState={appState}
              setAppState={setAppState}
              onNavigateToTab={setActiveTab}
              addHistoryItem={addHistoryItem}
              userRole={userRole}
              activeTab={activeTab}
            />
          )}
          {activeTab === 'emergency' && (
            <EmergencyPayout appState={appState} setAppState={setAppState} onPayoutInitiated={handlePayoutInitiated} addHistoryItem={addHistoryItem} />
          )}
          {activeTab === 'p2p-trust' && (
            <div className="flex flex-col gap-6">
              <ZeroBorderP2P appState={appState} setAppState={setAppState} addHistoryItem={addHistoryItem} />
              <SocialTrust appState={appState} setAppState={setAppState} addHistoryItem={addHistoryItem} />
            </div>
          )}
          {activeTab === 'fx-management' && (
            <FXManagement appState={appState} setAppState={setAppState} addHistoryItem={addHistoryItem} />
          )}
          {activeTab === 'loan-repayment' && (
            <CollaborativeRepay appState={appState} setAppState={setAppState} addHistoryItem={addHistoryItem} />
          )}
          {activeTab === 'voice-assistant' && (
            <VoiceAssistant appState={appState} onTriggerAction={handleTriggerAction} />
          )}
        </div>
      </main>
    </div>
  );
}
