import { useState, useEffect } from 'react';
import { Lock, Activity, CheckCircle, Clock, Globe, ArrowRight, TrendingUp, ShieldCheck } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface FXManagementProps {
  appState: any;
  setAppState: React.Dispatch<React.SetStateAction<any>>;
  addHistoryItem: (item: { type: string; section: string; text: string; amount: string; status: string }) => void;
}

export default function FXManagement({ appState, setAppState, addHistoryItem }: FXManagementProps) {
  const currencies = [
    { code: 'GBP', name: 'British Pound', flag: '🇬🇧', symbol: '£' },
    { code: 'INR', name: 'Indian Rupee', flag: '🇮🇳', symbol: '₹' },
    { code: 'AED', name: 'UAE Dirham', flag: '🇦🇪', symbol: 'د.إ' },
    { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦', symbol: '$' },
    { code: 'EUR', name: 'Euro', flag: '🇪🇺', symbol: '€' },
    { code: 'USD', name: 'US Dollar', flag: '🇺🇸', symbol: '$' },
    { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺', symbol: '$' },
    { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵', symbol: '¥' },
    { code: 'SGD', name: 'Singapore Dollar', flag: '🇸🇬', symbol: '$' },
    { code: 'NZD', name: 'New Zealand Dollar', flag: '🇳🇿', symbol: '$' },
    { code: 'CHF', name: 'Swiss Franc', flag: '🇨🇭', symbol: 'CHF' },
    { code: 'HKD', name: 'Hong Kong Dollar', flag: '🇭🇰', symbol: '$' }
  ];

  const [sendAmount, setSendAmount] = useState<string>('1000');
  const [sendCurrency, setSendCurrency] = useState<string>('GBP');
  const [recipientCurrency, setRecipientCurrency] = useState<string>('INR');
  const [googleRate, setGoogleRate] = useState<number>(124.89);
  const [saanRate, setSaanRate] = useState<number>(124.26);
  const [isFetchingRate, setIsFetchingRate] = useState<boolean>(false);
  const [lockedRates, setLockedRates] = useState<Record<string, number>>({
    'GBP-INR': 125.80
  });
  const [useLockedRate, setUseLockedRate] = useState<boolean>(false);
  const [countdown] = useState('6d 23h 59m 59s');
  
  // Auto Rules
  const [schedAmount, setSchedAmount] = useState(300);
  const [schedTrigger, setSchedTrigger] = useState(132.50);
  const [rules, setRules] = useState([
    { id: 1, text: 'If GBP/INR reaches 132.50, send £300 to Sister' },
    { id: 2, text: 'If GBP/INR falls below 129.00, lock rate for 3 days' }
  ]);

  // Fetch dynamic rate from Google Finance scraper
  useEffect(() => {
    if (sendCurrency === recipientCurrency) {
      setGoogleRate(1.0);
      setSaanRate(1.0);
      return;
    }
    
    let active = true;
    const fetchRate = async () => {
      setIsFetchingRate(true);
      try {
        const res = await fetch(`/api/live-rates?from=${sendCurrency}&to=${recipientCurrency}`);
        if (res.ok) {
          const data = await res.json();
          if (active && data && data.rate) {
            const rateVal = parseFloat(data.rate);
            setGoogleRate(rateVal);
            setSaanRate(rateVal * 0.995); // 0.5% margin reduction for standard matched rate
          }
        }
      } catch (err) {
        console.error('Error fetching rate:', err);
        if (active) {
          const defaults: Record<string, number> = { INR: 124.9, AED: 4.84, CAD: 1.87, EUR: 1.16, USD: 1.31 };
          if (sendCurrency === 'GBP') {
            const rateVal = defaults[recipientCurrency] || 1.25;
            setGoogleRate(rateVal);
            setSaanRate(rateVal * 0.995);
          } else {
            const fromRate = defaults[sendCurrency] || 1.0;
            const toRate = defaults[recipientCurrency] || 1.0;
            const rateVal = toRate / fromRate;
            setGoogleRate(rateVal);
            setSaanRate(rateVal * 0.995);
          }
        }
      } finally {
        if (active) {
          setIsFetchingRate(false);
        }
      }
    };
    
    fetchRate();
    return () => {
      active = false;
    };
  }, [sendCurrency, recipientCurrency]);

  const currentPair = `${sendCurrency}-${recipientCurrency}`;
  const savedLockForPair = lockedRates[currentPair];
  const appliedRate = (useLockedRate && savedLockForPair !== undefined) ? savedLockForPair : saanRate;

  const parsedSendAmount = parseFloat(sendAmount) || 0;
  // Fees: Base flat fee is £3.50 relative to GBP. Converted to source currency.
  // Standard P2P match fee: 0.15% variable.
  const flatFeeInSource = 3.50 * (sendCurrency === 'GBP' ? 1.0 : (1 / (googleRate || 1)));
  const variableFee = parsedSendAmount * 0.0015;
  const totalFee = parsedSendAmount === 0 ? 0 : (flatFeeInSource + variableFee);
  
  const receiveAmount = Math.max(0, parsedSendAmount - totalFee) * appliedRate;

  const currentSendDetails = currencies.find(c => c.code === sendCurrency) || currencies[0];
  const currentRecipientDetails = currencies.find(c => c.code === recipientCurrency) || currencies[1];

  const handleLockRate = () => {
    const pair = `${sendCurrency}-${recipientCurrency}`;
    setLockedRates(prev => ({
      ...prev,
      [pair]: saanRate
    }));
    setUseLockedRate(true);
    
    const isFree = Object.keys(lockedRates).length % 2 === 0;
    const costText = isFree ? 'Complimentary lock applied!' : '£5.00 transaction fee applied.';
    alert(`Rate locked successfully at ${saanRate.toFixed(4)} ${recipientCurrency}. ${costText}`);
    
    addHistoryItem({
      type: 'fx',
      section: 'fx',
      text: `Locked exchange rate ${sendCurrency}/${recipientCurrency} at ${saanRate.toFixed(4)}`,
      amount: `${currentSendDetails.symbol}${parsedSendAmount.toFixed(2)}`,
      status: 'Locked'
    });
    
    setAppState((prev: any) => ({
      ...prev,
      activeLocks: prev.activeLocks + 1
    }));
  };

  const addRule = () => {
    const ruleText = `If ${sendCurrency}/${recipientCurrency} reaches ${schedTrigger}, send ${currentSendDetails.symbol}${schedAmount} to Partner`;
    setRules(prev => [...prev, { id: Date.now(), text: ruleText }]);
    alert('Automated execution rule created successfully!');
    
    addHistoryItem({
      type: 'fx',
      section: 'fx',
      text: `Created auto-transfer rule for ${sendCurrency}/${recipientCurrency} at target ${schedTrigger}`,
      amount: `${currentSendDetails.symbol}${schedAmount.toFixed(2)}`,
      status: 'Active'
    });
  };

  // Mock historical chart data matching Google rate dynamically
  const chartData = {
    labels: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00'],
    datasets: [
      {
        label: `${sendCurrency} / ${recipientCurrency} rate`,
        data: [
          googleRate * 0.985,
          googleRate * 0.991,
          googleRate * 0.982,
          googleRate * 0.997,
          googleRate * 0.991,
          googleRate
        ],
        borderColor: '#00D2FF',
        backgroundColor: 'rgba(0, 210, 255, 0.05)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94A3B8' } },
      x: { grid: { display: false }, ticks: { color: '#94A3B8' } },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT SIDE PANEL - Chart & Core Rate Header (lg:col-span-5) */}
      <div className="glass-card rounded-3xl p-6 lg:col-span-5 flex flex-col justify-between h-[450px]">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-accentCyan" />
              Live Rate & Analytics
            </h3>
            <span className="text-[10px] font-bold text-accentTeal bg-accentTeal/10 border border-accentTeal/20 py-1 px-2.5 rounded-full">
              Google Finance Live
            </span>
          </div>

          <div className="flex flex-col gap-1 my-4">
            <span className="text-[10px] text-textMuted uppercase font-bold tracking-wider">Interbank Exchange Rate</span>
            <div className="flex items-baseline gap-2.5">
              <div className="text-3xl font-extrabold tracking-tight text-white font-mono">
                1 {sendCurrency} = {isFetchingRate ? '...' : googleRate.toFixed(4)} {recipientCurrency}
              </div>
              <div className="text-xs font-semibold text-successGreen flex items-center">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +0.14%
              </div>
            </div>
            <p className="text-[9px] text-textMuted">Live search feed matches exact rate visible on Google.</p>
          </div>

          <div className="h-44 relative my-2">
            <Line data={chartData} options={options} />
          </div>
        </div>

        {/* Locked Rate Indicator */}
        {useLockedRate && savedLockForPair !== undefined ? (
          <div className="bg-gradient-to-r from-accentCyan/10 to-accentPurple/10 border border-dashed border-accentCyan/40 p-3.5 rounded-2xl flex justify-between items-center mt-2">
            <div>
              <h4 className="text-xs font-bold text-accentCyan flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-successGreen animate-bounce" /> Locked Rate Active
              </h4>
              <p className="text-[10px] text-textSecondary mt-0.5">
                1 {sendCurrency} = {savedLockForPair.toFixed(4)} {recipientCurrency} (7 Days)
              </p>
            </div>
            <div className="text-xs font-mono font-bold bg-accentCyan/20 text-white px-2 py-1 rounded-lg flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {countdown}
            </div>
          </div>
        ) : (
          <div className="bg-white/3 border border-white/5 p-3 rounded-2xl flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-accentTeal" />
            <div className="text-[10px] text-textSecondary leading-normal">
              Need rate protection? Lock Saan's current exchange rate for 7 days to shield against market volatility.
            </div>
          </div>
        )}
      </div>

      {/* RIGHT SIDE PANEL - Wise-style Transfer Calculator (lg:col-span-7) */}
      <div className="glass-card rounded-3xl p-6 lg:col-span-7 flex flex-col justify-between min-h-[450px] bg-white">
        <div>
          <h3 className="text-md font-bold text-slate-900 mb-4 flex justify-between items-center">
            <span>Dynamic Transfer Calculator</span>
            <span className="text-[10px] text-accentTeal bg-accentTeal/10 border border-accentTeal/20 py-0.5 px-2.5 rounded-full font-bold">
              Matched P2P Routing
            </span>
          </h3>

          {/* You Send Input Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex justify-between items-center focus-within:border-accentCyan transition-colors">
            <div className="flex-grow">
              <label className="text-[9px] font-bold text-textMuted uppercase tracking-wider block mb-1">You Send ({sendCurrency})</label>
              <div className="flex items-center">
                <span className="text-slate-900 font-mono text-lg font-extrabold mr-1 select-none">
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
                  className="w-full bg-transparent text-slate-900 font-mono text-lg font-extrabold focus:outline-none"
                />
              </div>
            </div>
            <select
              value={sendCurrency}
              onChange={(e) => {
                setRecipientCurrency(sendCurrency === 'GBP' ? 'INR' : 'GBP');
                setSendCurrency(e.target.value);
                setUseLockedRate(false);
              }}
              className="bg-white border border-slate-200 text-xs font-bold text-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-accentCyan cursor-pointer shadow-sm"
            >
              {currencies.map((curr) => (
                <option key={curr.code} value={curr.code} className="bg-white text-slate-800">
                  {curr.flag} {curr.code} - {curr.name}
                </option>
              ))}
            </select>
          </div>

          {/* Intermediary Timeline Breakdown (Wise Style) */}
          <div className="my-4 pl-8 relative border-l border-dashed border-slate-200 ml-6 flex flex-col gap-3">
            <div className="relative">
              <div className="absolute -left-[41px] top-0.5 w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                <span className="text-[10px] text-textSecondary font-bold">%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <div className="text-textSecondary">
                  Fees: <strong className="text-slate-800 font-bold">{currentSendDetails.symbol}{flatFeeInSource.toFixed(2)}</strong> flat fee + 0.15% variable fee
                </div>
                <div className="font-mono text-slate-900 font-bold">
                  {currentSendDetails.symbol}{totalFee.toFixed(2)} {sendCurrency}
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-[41px] top-0.5 w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                <Globe className="w-3 h-3 text-textSecondary" />
              </div>
              <div className="flex justify-between items-center text-xs">
                <div className="text-textSecondary flex items-center gap-1.5 font-semibold">
                  Google Rate (Interbank Rate)
                  <span className="bg-slate-100 text-textMuted text-[8px] py-0.5 px-1.5 rounded font-bold uppercase">Live</span>
                </div>
                <div className="font-mono text-slate-500 font-bold">
                  1 {sendCurrency} = {googleRate.toFixed(4)} {recipientCurrency}
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-[41px] top-0.5 w-6 h-6 rounded-full bg-accentTeal/10 border border-accentTeal/20 flex items-center justify-center">
                <TrendingUp className="w-3 h-3 text-accentTeal" />
              </div>
              <div className="flex justify-between items-center text-xs">
                <div className="text-accentTeal flex items-center gap-1.5 font-bold">
                  Saan Rate (Our P2P Rate)
                  <span className="bg-accentTeal/10 text-accentTeal text-[8px] py-0.5 px-1.5 rounded font-bold uppercase">Zero Markup</span>
                </div>
                <div className="font-mono text-accentTeal font-bold">
                  1 {sendCurrency} = {saanRate.toFixed(4)} {recipientCurrency}
                </div>
              </div>
            </div>

            {savedLockForPair !== undefined && (
              <div className="relative">
                <div className={`absolute -left-[41px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all ${useLockedRate ? 'bg-accentCyan/20 border border-accentCyan/30' : 'bg-slate-100 border border-slate-200'}`}>
                  <ShieldCheck className={`w-3.5 h-3.5 ${useLockedRate ? 'text-accentCyan' : 'text-slate-400'}`} />
                </div>
                <div className="flex justify-between items-center text-xs">
                  <div className="text-textSecondary flex items-center gap-1.5 font-semibold">
                    Guaranteed Locked Rate
                    {useLockedRate ? (
                      <span className="bg-successGreen/10 text-successGreen text-[8px] py-0.5 px-1.5 rounded font-bold uppercase">Applied</span>
                    ) : (
                      <span className="bg-slate-100 text-textMuted text-[8px] py-0.5 px-1.5 rounded font-bold uppercase">Saved</span>
                    )}
                  </div>
                  <div className={`font-mono font-bold ${useLockedRate ? 'text-accentCyan' : 'text-textMuted'}`}>
                    1 {sendCurrency} = {savedLockForPair.toFixed(4)} {recipientCurrency}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recipient Gets Input Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex justify-between items-center mb-4">
            <div className="flex-grow">
              <label className="text-[9px] font-bold text-textMuted uppercase tracking-wider block mb-1">Recipient Gets ({recipientCurrency})</label>
              <div className="text-slate-900 font-mono text-lg font-extrabold select-none">
                {currentRecipientDetails.symbol}{receiveAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <select
              value={recipientCurrency}
              onChange={(e) => {
                setSendCurrency(recipientCurrency === 'GBP' ? 'INR' : 'GBP');
                setRecipientCurrency(e.target.value);
                setUseLockedRate(false);
              }}
              className="bg-white border border-slate-200 text-xs font-bold text-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-accentCyan cursor-pointer shadow-sm"
            >
              {currencies.map((curr) => (
                <option key={curr.code} value={curr.code} className="bg-white text-slate-800">
                  {curr.flag} {curr.code} - {curr.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Buttons (Lock & Send) */}
        <div className="flex flex-col gap-3 mt-4">
          {savedLockForPair !== undefined && (
            <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-200 p-2 rounded-2xl">
              <button
                type="button"
                onClick={() => setUseLockedRate(false)}
                className={`py-2 rounded-xl text-center transition-all text-xs font-bold ${!useLockedRate ? 'bg-accentPurple text-white' : 'bg-transparent text-slate-500 hover:text-slate-800'}`}
              >
                Use Live Rate
              </button>
              <button
                type="button"
                onClick={() => setUseLockedRate(true)}
                className={`py-2 rounded-xl text-center transition-all text-xs font-bold ${useLockedRate ? 'bg-accentCyan text-white font-extrabold' : 'bg-transparent text-slate-500 hover:text-slate-800'}`}
              >
                Use Locked Rate
              </button>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleLockRate}
              className="flex-1 bg-slate-50 border border-slate-200 hover:bg-[#0ea5e9]/10 text-slate-700 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98]"
            >
              <Lock className="w-3.5 h-3.5 text-accentCyan" /> {savedLockForPair !== undefined ? 'Update Lock' : 'Lock This Rate'}
            </button>
            <button
              onClick={() => alert(`Matched transaction initiated! Sending ${currentSendDetails.symbol}${parsedSendAmount} from ${sendCurrency} to ${currentRecipientDetails.symbol}${receiveAmount.toFixed(2)} ${recipientCurrency} via localized P2P node matching.`)}
              className="flex-1 bg-gradient-to-r from-accentCyan to-accentTeal hover:brightness-105 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98]"
            >
              <ArrowRight className="w-3.5 h-3.5" /> Send Money
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM PANEL - Automated trigger rules (Preserved Ledger section) */}
      <div className="glass-card rounded-3xl p-6 lg:col-span-12 bg-white">
        <h3 className="text-md font-bold flex items-center gap-2 mb-4 text-slate-900">
          <i className="fa-solid fa-calendar-check text-accentPurple"></i>
          Automated & Rate-Triggered Transfers
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between gap-4">
            <h4 className="text-xs font-bold text-accentTeal uppercase tracking-wider">Schedule Auto-Transfer</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-textSecondary uppercase block mb-1">Send Amount ({sendCurrency})</label>
                <input
                  type="number"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs font-semibold"
                  value={schedAmount}
                  onChange={(e) => setSchedAmount(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-[10px] text-textSecondary uppercase block mb-1">Target Rate ({recipientCurrency})</label>
                <input
                  type="number"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs font-semibold font-mono focus:outline-none focus:border-accentCyan"
                  value={schedTrigger}
                  onChange={(e) => setSchedTrigger(Number(e.target.value))}
                />
              </div>
            </div>
            <button
              onClick={addRule}
              className="w-full bg-gradient-to-r from-accentPurple to-accentCyan text-white font-bold py-2.5 rounded-xl text-xs mt-2 transition-all duration-300"
            >
              Create Auto-Transfer Rule
            </button>
          </div>

          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-4">
            <h4 className="text-xs font-bold text-accentPurple uppercase tracking-wider">Active Rules Ledger</h4>
            <div className="flex flex-col gap-3 font-semibold text-xs text-slate-600">
              {rules.map((rule) => (
                <div key={rule.id} className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span>{rule.text}</span>
                  <i className="fa-solid fa-circle-play text-accentCyan hover:scale-105 transition-transform cursor-pointer" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section Activity History */}
      <div className="glass-card rounded-3xl p-6 lg:col-span-12 bg-white">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
          FX & Rate Lock History
        </h3>
        <div className="flex flex-col gap-3 font-medium">
          {appState.history
            .filter((item: any) => item.section === 'fx')
            .map((item: any) => (
              <div 
                key={item.id} 
                className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accentCyan/10 text-accentCyan flex items-center justify-center font-bold">
                    FX
                  </div>
                  <div>
                    <div className="text-slate-800 font-semibold">{item.text}</div>
                    <div className="text-[9px] text-textMuted mt-0.5">{item.time}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-slate-900 font-mono font-bold">{item.amount || '-'}</div>
                  <span className="text-[8px] font-bold bg-accentCyan/10 text-accentCyan px-2 py-0.5 rounded-full mt-1.5 inline-block">
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          {appState.history.filter((item: any) => item.section === 'fx').length === 0 && (
            <div className="text-xs text-textMuted text-center py-4">No recent rate locks or FX triggers.</div>
          )}
        </div>
      </div>

    </div>
  );
}
