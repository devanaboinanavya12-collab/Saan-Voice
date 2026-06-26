import { useState, useEffect } from 'react';
import { Mic, Lock, ShieldCheck, Zap, Coins, Globe, ArrowRight, Star, Check, Sparkles, TrendingUp } from 'lucide-react';

interface LandingPageProps {
  appState: any;
  onOpenLogin: (mode: 'signin' | 'signup', role?: 'user' | 'admin') => void;
}

export default function LandingPage({ appState, onOpenLogin }: LandingPageProps) {
  const [sendAmount, setSendAmount] = useState<string>('1000');
  const [sendCurrency, setSendCurrency] = useState<string>('GBP');
  const [recipientCurrency, setRecipientCurrency] = useState<string>('INR');
  const [crossRate, setCrossRate] = useState<number>(131.50);
  const [lockedRates, setLockedRates] = useState<Record<string, number>>({
    'GBP-INR': 125.80,
    'EUR-USD': 1.10
  });
  const [useLockedRate, setUseLockedRate] = useState<boolean>(false);
  const [activeRateTab, setActiveRateTab] = useState<'quick' | 'board'>('quick');
  const [googleRate, setGoogleRate] = useState<number>(131.50);
  
  // Currencies list matching user request for all possible transfers
  const currencies = [
    { code: 'GBP', name: 'British Pound', flag: '🇬🇧', symbol: '£' },
    { code: 'INR', name: 'Indian Rupee', flag: '🇮🇳', symbol: '₹' },
    { code: 'AED', name: 'UAE Dirham', flag: '🇦🇪', symbol: 'د.إ' },
    { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦', symbol: '$' },
    { code: 'EUR', name: 'Euro', flag: '🇪🇺', symbol: '€' },
    { code: 'USD', name: 'US Dollar', flag: '🇺🇸', symbol: '$' }
  ];

  // Helper to fetch live rate relative to GBP base
  const getRateRelativeToGBP = (code: string): number => {
    if (code === 'GBP') return 1.0;
    if (appState.fxRates && appState.fxRates[code]) {
      return parseFloat(appState.fxRates[code]);
    }
    const baselineRates: Record<string, number> = {
      INR: 131.50,
      AED: 4.67,
      CAD: 1.74,
      EUR: 1.18,
      USD: 1.27
    };
    return baselineRates[code] || 1.0;
  };

  // Calculate dynamic cross exchange rate
  useEffect(() => {
    const sendRate = getRateRelativeToGBP(sendCurrency);
    const recipientRate = getRateRelativeToGBP(recipientCurrency);
    
    if (sendCurrency === recipientCurrency) {
      setGoogleRate(1.0);
      setCrossRate(1.0);
    } else {
      // 1 unit of sendCurrency = (recipientRate / sendRate) units of recipientCurrency
      const marketRate = recipientRate / sendRate;
      const customerRate = marketRate * 0.9955; // Apply a 0.45% profit margin reduction
      setGoogleRate(marketRate);
      setCrossRate(customerRate);
    }
  }, [sendCurrency, recipientCurrency, appState.fxRates]);

  // Dynamic fee calculation with capping:
  // Base flat fee is £3.50. We convert this flat fee into the source currency.
  const parsedSendAmount = parseFloat(sendAmount) || 0;
  const flatFeeInSource = 3.50 * getRateRelativeToGBP(sendCurrency);
  const variableFee = parsedSendAmount * 0.0015;
  const standardFee = flatFeeInSource + variableFee;
  
  // Cap the total fee at a maximum of 50% of the send amount (to prevent negative/zero values for small send amount like 1 unit)
  const isFeeCapped = parsedSendAmount > 0 && standardFee > (parsedSendAmount * 0.5);
  const totalFee = parsedSendAmount === 0 ? 0 : Math.min(parsedSendAmount * 0.5, standardFee);
  
  const currentPair = `${sendCurrency}-${recipientCurrency}`;
  const savedLockForPair = lockedRates[currentPair];
  const appliedRate = (useLockedRate && savedLockForPair !== undefined) ? savedLockForPair : crossRate;

  const convertedAmount = parsedSendAmount;
  const receiveAmount = convertedAmount * appliedRate;

  // Selected currencies details
  const currentSendDetails = currencies.find(c => c.code === sendCurrency) || currencies[0];
  const currentRecipientDetails = currencies.find(c => c.code === recipientCurrency) || currencies[1];

  // Bank fee comparison (Simulates traditional bank costing 5% spread + flat fee)
  const bankExchangeRate = appliedRate * 0.95;
  const bankFlatFee = 15.00 * getRateRelativeToGBP(sendCurrency);
  const bankFee = bankFlatFee + (parsedSendAmount * 0.01);
  const bankConvertedAmount = Math.max(0, parsedSendAmount - bankFee);
  const bankReceiveAmount = bankConvertedAmount * bankExchangeRate;
  const totalSavings = Math.max(0, receiveAmount - bankReceiveAmount);
  // savings in source currency
  const totalSavingsSource = totalSavings / appliedRate;

  return (
    <div className="min-h-screen relative font-sans text-slate-800 bg-[#F8FAFC] overflow-x-hidden">
      {/* Background Animated Glows for Light Theme */}
      <div className="bg-glow-container">
        <div className="bg-grid-overlay" />
        <div className="bg-glow bg-glow-1" />
        <div className="bg-glow bg-glow-2" />
      </div>

      {/* Modern Header Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/50 py-4 px-6 md:px-12 flex justify-between items-center transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-accentCyan to-accentPurple flex items-center justify-center shadow-lg shadow-accentCyan/20">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-slate-900 to-accentPurple bg-clip-text text-transparent">
            SAAN VOICE
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
          <a href="#calculator" className="hover:text-accentPurple transition-colors">Calculator</a>
          <a href="#features" className="hover:text-accentPurple transition-colors">Key Pillars</a>
          <a href="#how-it-works" className="hover:text-accentPurple transition-colors">How It Works</a>
          <span className="text-slate-200">|</span>
          <div className="flex items-center gap-1.5 text-accentTeal bg-accentTeal/5 border border-accentTeal/15 px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="font-bold">FCA Compliant Sandbox</span>
          </div>
        </nav>

        <div className="flex items-center gap-4">
          {/* Customer Login */}
          <button
            onClick={() => onOpenLogin('signin', 'user')}
            className="text-xs font-bold px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all text-slate-700"
          >
            Customer Login
          </button>
          {/* Organization Login */}
          <button
            onClick={() => onOpenLogin('signin', 'admin')}
            className="text-xs font-bold px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all text-slate-700"
          >
            Organisation Login
          </button>
          {/* Sign Up */}
          <button
            onClick={() => onOpenLogin('signup', 'user')}
            className="text-xs font-bold px-5 py-2.5 rounded-xl bg-gradient-to-r from-accentCyan to-accentPurple hover:brightness-110 text-white transition-all shadow-[0_4px_15px_rgba(99,102,241,0.25)]"
          >
            Sign Up
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section id="calculator" className="max-w-[1300px] mx-auto px-6 md:px-12 pt-16 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Hero Left Content with creative vector illustration */}
        <div className="lg:col-span-6 flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 bg-accentPurple/10 border border-accentPurple/20 rounded-full px-4 py-2 text-[10px] font-bold text-accentPurple uppercase tracking-wider mb-6 w-fit animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            Creative Remittance Platform
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-slate-900 mb-6">
            Global Transfers <br />
            <span className="bg-gradient-to-r from-accentCyan to-accentPurple bg-clip-text text-transparent">Reimagined for Communities</span>.
          </h1>
          
          <p className="text-slate-600 text-sm md:text-base leading-relaxed mb-8 max-w-xl">
            Saan Voice combines low-cost transparency with local-to-local settlement routing. Lock rates, co-sign with family, and secure transfers hands-free via voice biometrics.
          </p>

          {/* User Drawing 1 Replicated: Minimalist Blue-Outline digital finance landscape */}
          <div className="w-full max-w-[480px] bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm mb-8 flex justify-center items-center">
            <svg viewBox="0 0 800 500" className="w-full h-auto text-accentCyan" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M120 380C120 280 200 200 350 200C500 200 620 260 620 380H120Z" fill="#E0F2FE" fillOpacity="0.4"/>
              <path d="M480 380C480 320 540 280 630 280C720 280 750 320 750 380H480Z" fill="#E0F2FE" fillOpacity="0.5"/>
              <path d="M80 380C80 340 120 310 180 310C240 310 260 340 260 380H80Z" fill="#E0F2FE" fillOpacity="0.3"/>
              
              <rect x="300" y="280" width="180" height="100" rx="6" stroke="#0ea5e9" strokeWidth="2.5" fill="white"/>
              <line x1="300" y1="365" x2="480" y2="365" stroke="#0ea5e9" strokeWidth="2.5"/>
              <path d="M280 380H500L490 395H290L280 380Z" stroke="#0ea5e9" strokeWidth="2.5" fill="#f8fafc"/>
              
              <rect x="335" y="300" width="110" height="50" rx="4" stroke="#6366f1" strokeWidth="2.5" fill="white" transform="rotate(-3 390 325)"/>
              <circle cx="390" cy="325" r="14" stroke="#6366f1" strokeWidth="2" fill="none"/>
              <text x="385" y="331" fill="#6366f1" fontSize="18" fontWeight="bold" fontFamily="sans-serif">$</text>
              
              <rect x="200" y="180" width="70" height="120" rx="10" stroke="#0ea5e9" strokeWidth="2.5" fill="white"/>
              <line x1="200" y1="195" x2="270" y2="195" stroke="#0ea5e9" strokeWidth="2"/>
              <line x1="200" y1="280" x2="270" y2="280" stroke="#0ea5e9" strokeWidth="2"/>
              <circle cx="235" cy="290" r="4" fill="#0ea5e9"/>
              
              <rect x="230" y="210" width="75" height="48" rx="4" stroke="#6366f1" strokeWidth="2" fill="white" transform="rotate(4 267 234)"/>
              <rect x="238" y="218" width="16" height="12" rx="2" fill="#6366f1" opacity="0.3"/>
              <circle cx="285" cy="245" r="3" fill="#6366f1"/>
              <circle cx="292" cy="245" r="3" fill="#0ea5e9"/>
              
              <path d="M510 200H590C595 200 600 204 600 210V270C600 276 595 280 590 280H510C505 280 500 276 500 270V210C500 204 505 200 510 200Z" stroke="#0ea5e9" strokeWidth="2.5" fill="white"/>
              <path d="M565 225H605V255H565C557 255 550 248 550 240C550 232 557 225 565 225Z" stroke="#0ea5e9" strokeWidth="2" fill="#f8fafc"/>
              <circle cx="585" cy="240" r="3.5" fill="#6366f1"/>
              
              <path d="M470 230H500" stroke="#0ea5e9" strokeWidth="2" strokeDasharray="3 3"/>
              <path d="M540 200V175H520" stroke="#0ea5e9" strokeWidth="2"/>
              <circle cx="520" cy="175" r="4" stroke="#0ea5e9" strokeWidth="2" fill="white"/>
              <path d="M560 280V300H580" stroke="#0ea5e9" strokeWidth="2"/>
              <circle cx="580" cy="300" r="4" stroke="#0ea5e9" strokeWidth="2" fill="white"/>
              
              <rect x="160" y="315" width="115" height="75" rx="6" stroke="#0ea5e9" strokeWidth="2.5" fill="white"/>
              <line x1="217" y1="390" x2="217" y2="415" stroke="#0ea5e9" strokeWidth="2.5"/>
              <line x1="195" y1="415" x2="240" y2="415" stroke="#0ea5e9" strokeWidth="2.5"/>
              <circle cx="190" cy="350" r="14" stroke="#6366f1" strokeWidth="2" fill="none"/>
              <text x="182" y="356" fill="#6366f1" fontSize="16" fontWeight="bold">%</text>
              <line x1="215" y1="340" x2="250" y2="340" stroke="#0ea5e9" strokeWidth="2"/>
              <line x1="215" y1="350" x2="250" y2="350" stroke="#0ea5e9" strokeWidth="2"/>
              <text x="252" y="361" fill="#0ea5e9" fontSize="16" fontWeight="bold">$</text>
              
              <rect x="540" y="325" width="50" height="85" rx="6" stroke="#0ea5e9" strokeWidth="2" fill="white"/>
              <rect x="615" y="325" width="50" height="85" rx="6" stroke="#0ea5e9" strokeWidth="2" fill="white"/>
              <circle cx="565" cy="390" r="3" fill="#0ea5e9"/>
              <circle cx="640" cy="390" r="3" fill="#0ea5e9"/>
              <path d="M545 350C555 345 565 348 575 355" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
              <path d="M625 350C615 345 605 348 595 355" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
              <path d="M570 357C575 350 585 345 592 350C598 355 595 365 588 368C580 370 575 365 570 357Z" stroke="#6366f1" strokeWidth="2" fill="#e0f2fe"/>
              
              <circle cx="280" cy="140" r="14" stroke="#0ea5e9" strokeWidth="2" fill="none"/>
              <path d="M280 140A14 14 0 0 1 294 154" stroke="#0ea5e9" strokeWidth="2"/>
              <path d="M280 126A14 14 0 0 1 266 140" stroke="#0ea5e9" strokeWidth="2"/>
              <circle cx="280" cy="140" r="5" fill="#6366f1"/>
              
              <path d="M320 230C350 200 420 200 450 230" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round"/>
              <polygon points="450,230 440,225 448,220" fill="#0ea5e9"/>
              
              <path d="M450 250C420 280 350 280 320 250" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round"/>
              <polygon points="320,250 330,255 322,260" fill="#0ea5e9"/>
              
              <line x1="50" y1="460" x2="750" y2="460" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        {/* Hero Right Calculator Widget */}
        <div className="lg:col-span-6 relative">
          
          {/* User Drawing 2 Replicated: Grey network globe in background */}
          <div className="absolute inset-0 -z-10 opacity-30 select-none pointer-events-none transform scale-110">
            <svg viewBox="0 0 800 800" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="400" cy="400" r="280" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="5 5"/>
              <circle cx="400" cy="400" r="200" stroke="#cbd5e1" strokeWidth="1"/>
              
              <path d="M120 400H680" stroke="#cbd5e1" strokeWidth="1.5"/>
              <path d="M400 120V680" stroke="#cbd5e1" strokeWidth="1.5"/>
              <path d="M165 270C250 350 550 350 635 270" stroke="#cbd5e1" strokeWidth="1.2"/>
              <path d="M165 530C250 450 550 450 635 530" stroke="#cbd5e1" strokeWidth="1.2"/>
              <path d="M270 165C350 250 350 550 270 635" stroke="#cbd5e1" strokeWidth="1.2"/>
              <path d="M530 165C450 250 450 550 530 635" stroke="#cbd5e1" strokeWidth="1.2"/>

              <line x1="280" y1="200" x2="420" y2="240" stroke="#94a3b8" strokeWidth="1.5"/>
              <line x1="420" y1="240" x2="520" y2="350" stroke="#94a3b8" strokeWidth="1.5"/>
              <line x1="520" y1="350" x2="460" y2="520" stroke="#94a3b8" strokeWidth="1.5"/>
              <line x1="460" y1="520" x2="300" y2="480" stroke="#94a3b8" strokeWidth="1.5"/>
              <line x1="300" y1="480" x2="280" y2="200" stroke="#94a3b8" strokeWidth="1.5"/>
              <line x1="420" y1="240" x2="300" y2="480" stroke="#94a3b8" strokeWidth="1"/>
              
              <line x1="280" y1="200" x2="180" y2="340" stroke="#94a3b8" strokeWidth="1.5"/>
              <line x1="180" y1="340" x2="200" y2="520" stroke="#94a3b8" strokeWidth="1.5"/>
              <line x1="200" y1="520" x2="300" y2="480" stroke="#94a3b8" strokeWidth="1.5"/>
              
              <line x1="520" y1="350" x2="620" y2="420" stroke="#94a3b8" strokeWidth="1.5"/>
              <line x1="620" y1="420" x2="460" y2="520" stroke="#94a3b8" strokeWidth="1.5"/>

              <circle cx="280" cy="200" r="22" fill="white" stroke="#6366f1" strokeWidth="3.5"/>
              <circle cx="280" cy="200" r="16" fill="#e0e7ff"/>
              <circle cx="420" cy="240" r="28" fill="white" stroke="#0ea5e9" strokeWidth="3.5"/>
              <circle cx="420" cy="240" r="20" fill="#e0f2fe"/>
              <circle cx="520" cy="350" r="24" fill="white" stroke="#0d9488" strokeWidth="3.5"/>
              <circle cx="520" cy="350" r="18" fill="#ccfbf1"/>
              <circle cx="460" cy="520" r="26" fill="white" stroke="#f59e0b" strokeWidth="3.5"/>
              <circle cx="460" cy="520" r="19" fill="#fef3c7"/>
              <circle cx="300" cy="480" r="24" fill="white" stroke="#ef4444" strokeWidth="3.5"/>
              <circle cx="300" cy="480" r="17" fill="#ffe4e6"/>
              
              <circle cx="180" cy="340" r="14" fill="white" stroke="#94a3b8" strokeWidth="2"/>
              <circle cx="200" cy="520" r="16" fill="white" stroke="#94a3b8" strokeWidth="2"/>
              <circle cx="620" cy="420" r="15" fill="white" stroke="#94a3b8" strokeWidth="2"/>
              
              <circle cx="360" cy="180" r="4" fill="#0ea5e9"/>
              <circle cx="490" cy="200" r="5" fill="#f59e0b"/>
              <circle cx="580" cy="300" r="4" fill="#6366f1"/>
              <circle cx="400" cy="580" r="6" fill="#0d9488"/>
              <circle cx="240" cy="420" r="4" fill="#ef4444"/>
            </svg>
          </div>

          <div className="glass-card rounded-3xl p-6 md:p-8 border border-slate-200/75 shadow-[0_20px_50px_rgba(15,23,42,0.03)] bg-white/90">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex justify-between items-center">
              <span>Live & Quick Rates</span>
              <span className="inline-flex items-center gap-1.5 text-[10px] text-accentTeal bg-accentTeal/5 border border-accentTeal/15 py-0.5 px-2.5 rounded-full font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-accentTeal animate-pulse"></span>
                Live Tracking
              </span>
            </h3>

            {/* Sliding Pill Tab Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6 border border-slate-200/50">
              <button
                type="button"
                onClick={() => setActiveRateTab('quick')}
                className={`flex-1 text-center py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeRateTab === 'quick'
                    ? 'bg-white text-accentPurple shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Quick Converter
              </button>
              <button
                type="button"
                onClick={() => setActiveRateTab('board')}
                className={`flex-1 text-center py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeRateTab === 'board'
                    ? 'bg-white text-accentPurple shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Live Rates Board
              </button>
            </div>

            {activeRateTab === 'quick' ? (
              <div className="space-y-4">
                {/* Send Amount Input */}
                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex justify-between items-center focus-within:border-accentCyan transition-colors">
                  <div className="flex-grow">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">You Send</label>
                    <div className="flex items-center">
                      <span className="text-slate-900 font-mono text-xl md:text-2xl font-extrabold mr-1 select-none">
                        {currentSendDetails.symbol}
                      </span>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={sendAmount}
                        onChange={(e) => {
                          const val = e.target.value.replace(/,/g, '.');
                          if (val === '' || /^\d*\.?\d*$/.test(val)) {
                            setSendAmount(val);
                          }
                        }}
                        className="w-full bg-transparent text-slate-900 font-mono text-xl md:text-2xl font-extrabold focus:outline-none"
                      />
                    </div>
                  </div>
                  <select
                    value={sendCurrency}
                    onChange={(e) => setSendCurrency(e.target.value)}
                    className="bg-white border border-slate-200/80 text-xs font-bold text-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-accentCyan cursor-pointer shadow-sm"
                  >
                    {currencies.map((curr) => (
                      <option key={curr.code} value={curr.code}>
                        {curr.flag} {curr.code}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Recipient Gets output */}
                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex justify-between items-center">
                  <div className="flex-grow">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Recipient gets</label>
                    <div className="text-slate-900 font-mono text-xl md:text-2xl font-extrabold select-none">
                      {currentRecipientDetails.symbol}{(parsedSendAmount * crossRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <select
                    value={recipientCurrency}
                    onChange={(e) => setRecipientCurrency(e.target.value)}
                    className="bg-white border border-slate-200/80 text-xs font-bold text-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-accentCyan cursor-pointer shadow-sm"
                  >
                    {currencies.map((curr) => (
                      <option key={curr.code} value={curr.code}>
                        {curr.flag} {curr.code}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Premium Live Rates Output Screen */}
                <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 border border-indigo-900/50 shadow-md">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-300/80 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Live Exchange Rates
                    </span>
                    <span className="text-[9px] font-bold text-indigo-200/50 uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded border border-white/5">0.45% Margin reduction</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pb-3 border-b border-indigo-900/40 text-xs">
                    <div>
                      <span className="block text-[9px] text-indigo-300/60 uppercase font-bold tracking-wider mb-0.5">Google Live Rate</span>
                      <span className="font-mono text-slate-200">1 {sendCurrency} = <strong className="text-slate-100 font-bold">{googleRate.toFixed(4)}</strong> {recipientCurrency}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[9px] text-emerald-400 uppercase font-bold tracking-wider mb-0.5">Saan rate (-0.45%)</span>
                      <span className="font-mono text-emerald-300">1 {sendCurrency} = <strong className="text-emerald-400 font-bold">{crossRate.toFixed(4)}</strong> {recipientCurrency}</span>
                    </div>
                  </div>

                  <div className="pt-3">
                    <span className="block text-[9px] text-indigo-300/60 uppercase font-bold tracking-wider mb-0.5">Conversion Result</span>
                    <div className="text-lg md:text-xl font-extrabold tracking-tight bg-gradient-to-r from-white to-indigo-100 bg-clip-text text-transparent">
                      {parsedSendAmount.toLocaleString()} {sendCurrency} = {(parsedSendAmount * crossRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {recipientCurrency}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Base Currency Picker */}
                <div className="flex justify-between items-center bg-slate-50 border border-slate-200/60 rounded-2xl p-3.5 px-4">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Base Currency</span>
                  <select
                    value={sendCurrency}
                    onChange={(e) => setSendCurrency(e.target.value)}
                    className="bg-white border border-slate-200/80 text-xs font-bold text-slate-800 rounded-xl px-3 py-1.5 focus:outline-none focus:border-accentCyan cursor-pointer shadow-sm"
                  >
                    {currencies.map((curr) => (
                      <option key={curr.code} value={curr.code}>
                        {curr.flag} {curr.code}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rates List Grid */}
                <div className="divide-y divide-slate-100 border border-slate-200/50 rounded-2xl overflow-hidden bg-slate-50/50 max-h-[220px] overflow-y-auto">
                  {currencies
                    .filter((c) => c.code !== sendCurrency)
                    .map((c) => {
                      const sendRate = getRateRelativeToGBP(sendCurrency);
                      const recipientRate = getRateRelativeToGBP(c.code);
                      const rate = recipientRate / sendRate;
                      return (
                        <div key={c.code} className="flex justify-between items-center p-3 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-2">
                            <span className="text-base select-none">{c.flag}</span>
                            <div>
                              <span className="text-xs font-bold text-slate-700">{sendCurrency} / {c.code}</span>
                              <span className="block text-[9px] text-slate-400 font-semibold">{c.name}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-xs font-bold text-slate-800">
                              {rate.toFixed(4)}
                            </div>
                            <span className="inline-flex items-center gap-1 text-[8px] text-emerald-600 font-bold uppercase tracking-wider">
                              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                              Live
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Main Action Button */}
            <button
              onClick={() => onOpenLogin('signup')}
              className="w-full bg-gradient-to-r from-accentCyan to-accentPurple text-white font-bold py-4 rounded-2xl text-xs mt-6 flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all duration-300 shadow-[0_8px_30px_rgba(99,102,241,0.2)]"
            >
              <span>Get Started & Send Money</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-[9px] text-slate-400 text-center mt-4">
              All transactions matching is handled through verified local accounts under sandbox guidelines. Voice biometrics is required for final execution authorization.
            </p>
          </div>
        </div>
      </section>

      {/* Trust & Reviews Banner */}
      <section className="bg-white border-y border-slate-200/50 py-8">
        <div className="max-w-[1300px] mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex text-warningGold">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-4 h-4 fill-warningGold" />
              ))}
            </div>
            <p className="text-xs text-slate-600 font-semibold">
              Trusted by 250k+ customers. Rated <strong className="text-slate-900">4.8/5</strong> on TrustScore.
            </p>
          </div>
          <div className="flex gap-8 items-center opacity-40 hover:opacity-75 transition-all duration-300">
            <span className="text-sm font-bold tracking-wider text-slate-800">SECURE TRANSACTIONS</span>
            <span className="text-sm font-bold tracking-wider text-slate-800">ZERO BORDER LEDGER</span>
            <span className="text-sm font-bold tracking-wider text-slate-800">VOICE SHIELD BIOMETRICS</span>
          </div>
        </div>
      </section>

      {/* Features Grid - Key Pillars */}
      <section id="features" className="max-w-[1300px] mx-auto px-6 md:px-12 py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs font-bold text-accentPurple uppercase tracking-widest mb-3">Innovation Core</h2>
          <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900">
            Designed for Decentralized Cross-Border Routing
          </h3>
          <p className="text-slate-600 text-xs md:text-sm leading-relaxed mt-4">
            Combining direct local matching settlements with dynamic automated risk gateways and multi-factor voice signature protection.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="glass-card rounded-3xl p-6 md:p-8 flex flex-col justify-between group bg-white border-slate-200">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-accentCyan/10 border border-accentCyan/20 flex items-center justify-center text-accentCyan mb-6 group-hover:scale-110 transition-all">
                <Mic className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-3">Hey Saan Voice ID</h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                Unlock limits and authorize transfers using your unique voice print signature. Advanced biometrics check frequencies and vocal harmonics with 98.4% confidence score.
              </p>
            </div>
            <div className="text-[10px] text-accentCyan font-bold uppercase tracking-wider mt-6 flex items-center gap-1">
              Active Voice Shield <Check className="w-3 h-3" />
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 md:p-8 flex flex-col justify-between group bg-white border-slate-200">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-accentPurple/10 border border-accentPurple/20 flex items-center justify-center text-accentPurple mb-6 group-hover:scale-110 transition-all">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-3">AI Dynamic Rate Shield</h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                Protect your transfers from sudden market swings. Lock-in exchange rates for 7 full days. Complimentary locks on odd schedules, and transparent flat fees thereafter.
              </p>
            </div>
            <div className="text-[10px] text-accentPurple font-bold uppercase tracking-wider mt-6 flex items-center gap-1">
              Guaranteed lock options <Check className="w-3 h-3" />
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 md:p-8 flex flex-col justify-between group bg-white border-slate-200">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-accentTeal/10 border border-accentTeal/20 flex items-center justify-center text-accentTeal mb-6 group-hover:scale-110 transition-all">
                <Zap className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-3">Zero-Border Matching</h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                By bypassing high-cost SWIFT international settlement, our matching algorithm routes transactions locally within countries. Settle payments instantly at near-zero currency overhead.
              </p>
            </div>
            <div className="text-[10px] text-accentTeal font-bold uppercase tracking-wider mt-6 flex items-center gap-1">
              Local-to-Local Route <Check className="w-3 h-3" />
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 md:p-8 flex flex-col justify-between group bg-white border-slate-200">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100/60 border border-emerald-200/80 flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-all">
                <Coins className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-3">Emergency Verification Gateway</h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                Verify sudden financial crises or urgent scenarios. Automate local routing under collateral circles to receive immediate payout paths, bypassing typical credit screening delays.
              </p>
            </div>
            <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-6 flex items-center gap-1">
              Verified Crisis Gateway <Check className="w-3 h-3" />
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 md:p-8 flex flex-col justify-between group bg-white border-slate-200">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100/60 border border-amber-200/80 flex items-center justify-center text-amber-600 mb-6 group-hover:scale-110 transition-all">
                <Globe className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-3">Social Trust Circles</h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                Connect family and friends to build mutual guarantor circles. Leverage collaborative repayments to distribute financial responsibilities and minimize default impacts.
              </p>
            </div>
            <div className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mt-6 flex items-center gap-1">
              Guarantor Circle Verified <Check className="w-3 h-3" />
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 md:p-8 flex flex-col justify-between group bg-white border-slate-200">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-rose-100/60 border border-rose-200/80 flex items-center justify-center text-rose-600 mb-6 group-hover:scale-110 transition-all">
                <Lock className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-3">Bank-Grade Compliance</h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                Operating inside sandbox guidelines, Saan Voice enforces strict identity verification, transaction logging on a secure local database ledger, and regular compliance reports.
              </p>
            </div>
            <div className="text-[10px] text-rose-600 font-bold uppercase tracking-wider mt-6 flex items-center gap-1">
              Full Cryptographic Ledger <Check className="w-3 h-3" />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="max-w-[1300px] mx-auto px-6 md:px-12 py-24 border-t border-slate-200/60">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs font-bold text-accentPurple uppercase tracking-widest mb-3">Workflow Process</h2>
          <h3 className="text-3xl font-extrabold text-slate-900">How to Transfer in 3 Easy Steps</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          <div className="flex flex-col items-center text-center relative">
            <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 text-xl font-black mb-6 shadow-sm">
              1
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Quote Your Transfer</h4>
            <p className="text-slate-600 text-xs max-w-xs leading-relaxed">
              Select your destination country, input the amount, and check live interbank rates. Lock the rate to shield against swings.
            </p>
          </div>

          <div className="flex flex-col items-center text-center relative">
            <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 text-xl font-black mb-6 shadow-sm">
              2
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Voice Print Scan</h4>
            <p className="text-slate-600 text-xs max-w-xs leading-relaxed">
              Verify your identity instantly. Say the passphrase <strong className="text-accentPurple font-bold">"Saan, authorize my voice"</strong> to unlock biometrics.
            </p>
          </div>

          <div className="flex flex-col items-center text-center relative">
            <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 text-xl font-black mb-6 shadow-sm">
              3
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Instant Local Settlement</h4>
            <p className="text-slate-600 text-xs max-w-xs leading-relaxed">
              Saan's decentralized system matches your payment locally. The recipient gets their funds credited instantly.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="bg-white py-20 px-6 md:px-12 text-center max-w-[1100px] mx-auto my-16 rounded-3xl border border-slate-200/50 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-accentCyan/5 to-accentPurple/5 -z-10"></div>
        <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-4">
          Ready to experience the zero-border remittance revolution?
        </h3>
        <p className="text-slate-600 text-xs md:text-sm max-w-xl mx-auto mb-8">
          Save on transfer fees, lock in favorable interbank rates, and access automated emergency underwriting instantly with Saan Voice.
        </p>
        <button
          onClick={() => onOpenLogin('signup')}
          className="bg-gradient-to-r from-accentCyan to-accentPurple text-white font-bold px-8 py-4 rounded-xl text-xs shadow-lg hover:brightness-110 hover:-translate-y-0.5 transition-all duration-300"
        >
          Create Free Sandbox Account
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 py-12 px-6 md:px-12 text-xs text-slate-400 bg-white">
        <div className="max-w-[1300px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-accentPurple" />
              <span className="text-sm font-extrabold text-slate-800 tracking-wider">SAAN VOICE</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Decentralized cross-border lending, local liquidity match settlement, and advanced voice biometrics dashboard.
            </p>
          </div>
          <div>
            <h5 className="font-bold text-slate-700 mb-3">Product</h5>
            <ul className="flex flex-col gap-2 text-slate-500">
              <li><a href="#calculator" className="hover:text-accentPurple transition-colors">Transfer Engine</a></li>
              <li><a href="#features" className="hover:text-accentPurple transition-colors">AI Rate Lock Shield</a></li>
              <li><a href="#features" className="hover:text-accentPurple transition-colors">Emergency Verification</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-slate-700 mb-3">Company</h5>
            <ul className="flex flex-col gap-2 text-slate-500">
              <li><span>Innovator Sandbox</span></li>
              <li><span>Security Auditing</span></li>
              <li><span>UK Pitch Proposal</span></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-slate-700 mb-3">Compliance</h5>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Saan Voice is developed for sandbox demonstration purposes. Voice Biometric recordings are processed locally on-device.
            </p>
          </div>
        </div>
        <div className="max-w-[1300px] mx-auto border-t border-slate-200/50 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400">
          <div>Saan Voice Platform &copy; 2026. All rights secured.</div>
          <div className="flex gap-4">
            <span className="hover:text-slate-700 cursor-pointer">Privacy Policy</span>
            <span>&middot;</span>
            <span className="hover:text-slate-700 cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
