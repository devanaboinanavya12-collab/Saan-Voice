import React, { useState } from 'react';
import { ShieldAlert, FileText, CheckCircle2, RefreshCw, UploadCloud, AlertCircle, Mic, Users, Play, Volume2 } from 'lucide-react';

interface EmergencyPayoutProps {
  appState: any;
  setAppState: React.Dispatch<React.SetStateAction<any>>;
  onPayoutInitiated: (
    amount: number,
    category?: string,
    fileName?: string,
    desc?: string,
    score?: number,
    fraudLikelihood?: number,
    currency?: string,
    user?: string,
    voiceMemoRecorded?: boolean,
    voiceMemoText?: string,
    voiceCorrelation?: number
  ) => void;
  addHistoryItem: (item: { type: string; section: string; text: string; amount: string; status: string }) => void;
}

const extractTextFromFile = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    const isText = file.name.endsWith('.txt') || file.name.endsWith('.csv') || file.name.endsWith('.json') || file.name.endsWith('.md');
    
    if (isText) {
      reader.onload = (e) => {
        resolve((e.target?.result as string) || '');
      };
      reader.readAsText(file);
    } else {
      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        const arr = new Uint8Array(buffer);
        let str = '';
        let chunk = '';
        for (let i = 0; i < arr.length; i++) {
          const charCode = arr[i];
          if ((charCode >= 32 && charCode <= 126) || charCode === 10 || charCode === 13) {
            chunk += String.fromCharCode(charCode);
          } else {
            if (chunk.trim().length > 3) {
              str += chunk + '\n';
            }
            chunk = '';
          }
          if (str.length > 30000) break;
        }
        if (chunk.trim().length > 3) {
          str += chunk;
        }
        resolve(str);
      };
      reader.onerror = () => resolve('');
      reader.readAsArrayBuffer(file);
    }
  });
};

export default function EmergencyPayout({ appState, setAppState, onPayoutInitiated, addHistoryItem }: EmergencyPayoutProps) {
  const [category, setCategory] = useState('hospital');
  const [otherDetail, setOtherDetail] = useState('');
  const [amount, setAmount] = useState(500);
  const [desc, setDesc] = useState('');
  
  // Simulation Profile State
  const [currentUser, setCurrentUser] = useState('Rushi');
  
  // Uploaded File Info State
  const [fileText, setFileText] = useState('');
  const [fileFingerprint, setFileFingerprint] = useState('');

  // Scanner states
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [fileName, setFileName] = useState('');
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [releaseButtonVisible, setReleaseButtonVisible] = useState(false);

  // New Requested Currency State
  const [payoutCurrency, setPayoutCurrency] = useState('GBP');

  // Input Validation Error State
  const [validationError, setValidationError] = useState(false);

  // Authenticity results state
  const [matchScore, setMatchScore] = useState(0);
  const [fraudLikelihood, setFraudLikelihood] = useState(0);
  const [fraudReason, setFraudReason] = useState('');
  const [categoryMatch, setCategoryMatch] = useState('');
  const [trustLevel, setTrustLevel] = useState<'high' | 'medium' | 'low' | 'critical'>('medium');

  // Voice Explanation Memo states
  const [voiceMemoRecorded, setVoiceMemoRecorded] = useState(false);
  const [voiceMemoText, setVoiceMemoText] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Social Bypass Vouch state
  const [vouchState, setVouchState] = useState<'idle' | 'broadcasting' | 'vouched_1' | 'completed'>('idle');
  const [claimSubmitted, setClaimSubmitted] = useState(false);

  const playChime = (success: boolean) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;
      if (success) {
        [659.25, 830.61, 987.77].forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.12, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.6);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.6);
        });
      }
    } catch (e) {}
  };

  const simulateVoiceRecording = () => {
    setIsRecordingVoice(true);
    setRecordingSeconds(0);
    
    const timer = setInterval(() => {
      setRecordingSeconds(prev => {
        if (prev >= 3) {
          clearInterval(timer);
          return 3;
        }
        return prev + 1;
      });
    }, 1000);

    setTimeout(() => {
      setIsRecordingVoice(false);
      setVoiceMemoRecorded(true);
      
      let text = 'Emergency hospital medical treatment bill context Delhi Apollo';
      if (category === 'airport') text = 'Airport cancellation flight delay penalty fee Heathrow';
      else if (category === 'visa') text = 'Urgent passport and border clearance entry visa fee';
      else if (category === 'tuition') text = 'University tuition fee semester payment deadline penalty';
      else if (category === 'family') text = 'Family medical support prescription pharmacy payment';
      else if (category === 'rent') text = 'Accommodation rent tenancy deposit emergency flat fee';
      
      setVoiceMemoText(text);
      setConsoleLogs(prev => [
        ...prev,
        `[System] Spoken Voice Explanation recorded successfully: "${text}"`
      ]);
      playChime(true);
    }, 3200);
  };

  const startGuarantorVouchSimulation = () => {
    setVouchState('broadcasting');
    setConsoleLogs(prev => [
      ...prev,
      `[00:23] Vouch request broadcasted. Link shared with Sarah, Priya, and Ahmed...`
    ]);

    setTimeout(() => {
      setVouchState('vouched_1');
      setConsoleLogs(prev => [
        ...prev,
        `[00:25] Guarantor Priya co-signed. Trust Score verified. UPI local ledger validation: SUCCESS.`
      ]);
      playChime(true);
    }, 2000);

    setTimeout(() => {
      setVouchState('completed');
      setConsoleLogs(prev => [
        ...prev,
        `[00:27] Guarantor Ahmed co-signed. AED local settlement validation: SUCCESS. Vouch quorum (2/2) met.`
      ]);
      playChime(true);

      let creditingAmount = amount;
      if (payoutCurrency === 'INR') {
        creditingAmount = amount / 100;
      } else if (payoutCurrency === 'AED') {
        creditingAmount = amount / 4.6;
      }

      setAppState((prev: any) => {
        const updatedClaims = prev.claims.map((c: any, idx: number) => {
          if (idx === 0) {
            return { ...c, status: 'Verified', vouchers: ['Priya', 'Ahmed'], autoCleared: false };
          }
          return c;
        });

        const nextHistoryItem = {
          id: Date.now(),
          type: 'emergency',
          section: 'emergency',
          text: `[Social Bypass] Claim approved via Guarantor Vouch (Priya & Ahmed)`,
          time: 'Just now',
          amount: `+£${creditingAmount.toFixed(2)}`,
          status: 'Released'
        };

        return {
          ...prev,
          loanBalance: prev.loanBalance + creditingAmount,
          claims: updatedClaims,
          history: [nextHistoryItem, ...prev.history]
        };
      });
    }, 4000);
  };

  const simulateAIVerification = () => {
    if (!fileName) {
      alert('Please upload an emergency invoice first.');
      return;
    }
    
    if (!desc.trim()) {
      setValidationError(true);
      alert('Please fill in the Urgency Brief Context before running the AI Authenticity Scan.');
      return;
    }
    
    setValidationError(false);
    setIsScanning(true);
    setHasScanned(false);
    setReleaseButtonVisible(false);
    setClaimSubmitted(false);
    setVouchState('idle');
    setConsoleLogs([
      `[00:01] Initializing Saan Document Authenticity Scan for User: ${currentUser}...`,
      `[00:02] Fetching cloud verification nodes in London and Paris...`,
    ]);

    setTimeout(() => {
      setConsoleLogs(prev => [...prev, '[00:07] Running OCR text extraction from document metadata and binary streams...']);
    }, 700);

    setTimeout(() => {
      const logsToAdd: string[] = [];
      
      const registryStr = localStorage.getItem('uploaded_documents_registry') || '[]';
      const registry = JSON.parse(registryStr);
      const duplicateEntry = registry.find((r: any) => r.fingerprint === fileFingerprint);
      
      let finalScore = 95.0;
      let finalFraud = 0.01;
      let reason = '';
      let isDuplicate = false;
      let isPromo = false;
      let matchingCategoryName = '';
      
      const categoryNames: Record<string, string> = {
        hospital: 'Medical/Hospital Invoice Match',
        airport: 'Aviation/Airline Delay Match',
        visa: 'Immigration/Visa Fee Match',
        tuition: 'Educational Tuition Invoice Match',
        family: 'Family Support Verification Match',
        rent: 'Tenancy/Accommodation Agreement Match',
        other: 'Custom Urgent Expense Verification'
      };
      
      matchingCategoryName = categoryNames[category] || 'Custom Verification';
      
      if (duplicateEntry) {
        if (duplicateEntry.uploadedBy !== currentUser) {
          isDuplicate = true;
          logsToAdd.push(`[00:12] CRITICAL FRAUD DETECTED: This exact document was previously submitted by user '${duplicateEntry.uploadedBy}' on ${duplicateEntry.timestamp}!`);
          finalScore = 4.2;
          finalFraud = 99.8;
          reason = `Duplicate submission: identical file size & name uploaded by '${duplicateEntry.uploadedBy}'.`;
        } else {
          logsToAdd.push(`[00:12] Notice: You have already submitted this document on ${duplicateEntry.timestamp}. Re-evaluating...`);
        }
      }
      
      const lowercaseFileName = fileName.toLowerCase();
      const lowercaseText = fileText.toLowerCase();
      
      const promoKeywords = ['flyer', 'sale', 'promo', 'coupon', 'discount', 'deal', 'special offer', 'advertising', 'retailer', 'catalog'];
      const detectedPromo = promoKeywords.find(kw => lowercaseFileName.includes(kw) || lowercaseText.includes(kw));
      
      if (detectedPromo && !isDuplicate) {
        isPromo = true;
        logsToAdd.push(`[00:15] WARNING: Commercial or advertising terms detected ('${detectedPromo}'). This document appears to be a promotional flyer.`);
        finalScore = 8.5;
        finalFraud = 94.5;
        reason = `Document identified as a promotional flyer or advertisement rather than an official emergency receipt.`;
      }
      
      const categoryKeywords: Record<string, string[]> = {
        hospital: ['hospital', 'medical', 'doctor', 'treatment', 'clinic', 'patient', 'health', 'invoice', 'receipt', 'surgery', 'medicine', 'prescription', 'st marys', 'mary', 'bill', 'nurse'],
        airport: ['flight', 'airline', 'airport', 'delay', 'ticket', 'boarding', 'cancel', 'passenger', 'seat', 'booking', 'heathrow', 'gatwick'],
        visa: ['visa', 'immigration', 'border', 'customs', 'passport', 'entry', 'fee', 'permit', 'embassy', 'travel', 'control'],
        tuition: ['tuition', 'university', 'college', 'school', 'semester', 'fee', 'student', 'education', 'enrolment', 'course', 'class'],
        family: ['medical', 'treatment', 'care', 'prescription', 'receipt', 'hospital', 'patient', 'pharmacy'],
        rent: ['rent', 'landlord', 'tenancy', 'lease', 'housing', 'flat', 'apartment', 'deposit', 'utility', 'renting', 'tenants'],
        other: []
      };
      
      const keywords = categoryKeywords[category] || [];
      let matchCount = 0;
      const matchedWords: string[] = [];
      
      keywords.forEach(kw => {
        if (lowercaseText.includes(kw) || lowercaseFileName.includes(kw)) {
          matchCount++;
          matchedWords.push(kw);
        }
      });
      
      if (!isDuplicate && !isPromo) {
        if (category !== 'other' && keywords.length > 0 && matchCount === 0) {
          logsToAdd.push(`[00:18] WARNING: Category mismatch detected. Document contains zero keywords related to '${category}' emergencies.`);
          finalScore = 14.8;
          finalFraud = 78.5;
          reason = `Category mismatch: Uploaded document does not contain keywords relevant to the selected emergency.`;
        } else {
          const densityRatio = keywords.length > 0 ? matchCount / 4 : 1; 
          const baseScore = 80 + Math.min(18, densityRatio * 18);
          finalScore = parseFloat(baseScore.toFixed(1));
          finalFraud = parseFloat((Math.max(0.01, 100 - finalScore - (matchCount > 0 ? 5 : 0))).toFixed(2));
          logsToAdd.push(`[00:18] Metadata validation complete. Found ${matchCount} category keywords: [${matchedWords.slice(0, 4).join(', ')}].`);
        }
      }
      
      if (!duplicateEntry && !isDuplicate) {
        const newEntry = {
          fingerprint: fileFingerprint,
          uploadedBy: currentUser,
          timestamp: new Date().toLocaleTimeString() + ' ' + new Date().toLocaleDateString(),
          category: category
        };
        registry.push(newEntry);
        localStorage.setItem('uploaded_documents_registry', JSON.stringify(registry));
      }
      
      let calculatedTrust: 'high' | 'medium' | 'low' | 'critical' = 'medium';
      if (isDuplicate) {
        calculatedTrust = 'critical';
      } else if (isPromo) {
        calculatedTrust = 'low';
      } else if (voiceMemoRecorded) {
        calculatedTrust = finalScore >= 90 ? 'high' : 'medium';
        logsToAdd.push(`[00:19] Voice ID Biometrics matched successfully. Spoken transcript context matches OCR text with 98.2% correlation.`);
      } else {
        calculatedTrust = 'medium';
        logsToAdd.push(`[00:19] Warning: Spoken explanation missing. Voice ID matching bypassed. Underwriting trust rating capped at MEDIUM.`);
      }
      
      setMatchScore(finalScore);
      setFraudLikelihood(finalFraud);
      setFraudReason(reason);
      setCategoryMatch(matchingCategoryName);
      setTrustLevel(calculatedTrust);
      
      logsToAdd.push(`[00:22] AI Authenticity Scan Finished. Authenticity Score: ${finalScore}% (${calculatedTrust.toUpperCase()} TRUST).`);
      
      setConsoleLogs(prev => [...prev, ...logsToAdd]);
      setIsScanning(false);
      setHasScanned(true);
      
      addHistoryItem({
        type: 'emergency',
        section: 'emergency',
        text: `Ran AI Scan on invoice ${fileName} (${calculatedTrust.toUpperCase()} TRUST)`,
        amount: `£${amount.toFixed(2)}`,
        status: 'Completed'
      });
      
      if (finalScore >= 50 && calculatedTrust !== 'critical') {
        setReleaseButtonVisible(true);
      } else {
        setReleaseButtonVisible(false);
      }
    }, 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      setConsoleLogs(['[System] File uploaded: ' + file.name + ` (${(file.size / 1024).toFixed(1)} KB)`]);
      
      try {
        const text = await extractTextFromFile(file);
        setFileText(text);
        setFileFingerprint(`${file.name}_${file.size}`);
      } catch (err) {
        console.error("Text extraction error:", err);
        setFileText('');
      }
    }
  };

  const handleRelease = () => {
    onPayoutInitiated(
      amount, 
      categoryMatch || category, 
      fileName, 
      desc, 
      matchScore, 
      fraudLikelihood, 
      payoutCurrency, 
      currentUser,
      voiceMemoRecorded,
      voiceMemoText,
      voiceMemoRecorded ? 98.2 : 0
    );
    setReleaseButtonVisible(false);
    setClaimSubmitted(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Input request panel */}
      <div className="glass-card rounded-3xl p-8 flex flex-col justify-between gap-5 bg-white">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-100 pb-4">
            <h3 className="text-md font-bold flex items-center gap-2 text-slate-900">
              <FileText className="w-5 h-5 text-accentCyan" />
              Emergency Funding Request
            </h3>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase">User:</span>
                <select
                  value={currentUser}
                  onChange={(e) => setCurrentUser(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-[10px] text-slate-800 font-bold rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                >
                  <option value="Rushi">Rushi</option>
                  <option value="Aarav">Aarav</option>
                  <option value="Siddharth">Siddharth</option>
                </select>
              </div>
              
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('uploaded_documents_registry');
                  alert('Simulated document database registry has been reset.');
                }}
                className="bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 text-[9px] font-bold text-slate-600 rounded-lg px-2 py-1 transition-all"
                title="Clear upload history registry to test duplicate fraud detection"
              >
                Reset DB
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Emergency Category</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-xs font-semibold focus:outline-none focus:border-accentCyan cursor-pointer"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="hospital">Medical / Hospital Bill Verification</option>
                <option value="airport">Airport Delays & Penalty Fees</option>
                <option value="visa">Urgent Visa / Border Clearance Fee</option>
                <option value="tuition">Tuition Deadline Penalty</option>
                <option value="family">Family Medical Support</option>
                <option value="rent">Accommodation / Rent Emergency</option>
                <option value="other">Other / Custom Emergency</option>
              </select>
            </div>

            {category === 'other' && (
              <div className="animate-fadeIn">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Specify Custom Emergency</label>
                <input
                  type="text"
                  placeholder="Describe your emergency here..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-xs font-semibold focus:outline-none focus:border-accentCyan"
                  value={otherDetail}
                  onChange={(e) => setOtherDetail(e.target.value)}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Amount Required (GBP)</label>
                <input
                  type="number"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-xs font-semibold focus:outline-none focus:border-accentCyan font-mono"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                />
              </div>
              <div className="flex flex-col justify-end">
                <div className="text-[10px] text-textMuted leading-relaxed pb-1">Interest Rate: <span className="text-accentTeal font-bold">1.5% Flat</span> (Emergency discounted)</div>
              </div>
            </div>

            {/* In which currency they want money */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Payout Currency</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-xs font-semibold focus:outline-none focus:border-accentCyan cursor-pointer"
                value={payoutCurrency}
                onChange={(e) => setPayoutCurrency(e.target.value)}
              >
                <option value="GBP">🇬🇧 GBP - British Pound</option>
                <option value="INR">🇮🇳 INR - Indian Rupee</option>
                <option value="AED">🇦🇪 AED - UAE Dirham</option>
                <option value="CAD">🇨🇦 CAD - Canadian Dollar</option>
                <option value="EUR">🇪🇺 EUR - Euro</option>
                <option value="USD">🇺🇸 USD - US Dollar</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Evidence / Official Invoice Upload (JPEG, PDF)</label>
              <div
                onClick={() => document.getElementById('evidence-file-input')?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-accentCyan hover:bg-accentCyan/5 rounded-2xl p-6 text-center cursor-pointer flex flex-col items-center gap-2 transition-all duration-300 bg-slate-50"
              >
                <UploadCloud className="w-8 h-8 text-slate-400 hover:text-accentCyan transition-colors duration-300" />
                <span className="text-xs font-semibold text-slate-700">Drag & Drop invoice or Click to Browse</span>
                <span className="text-[10px] text-slate-400">Hospital receipts, flight bills, or Border cleared logs</span>
                <input
                  type="file"
                  id="evidence-file-input"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
              {fileName && <div className="text-xs text-accentCyan font-bold mt-2.5">Uploaded: {fileName}</div>}
            </div>

            {/* Vocal Explanation Memo Widget */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-accentPurple" />
                Vocal Explanation Memo (Optional - Bypasses Audit Delay)
              </label>
              
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={simulateVoiceRecording}
                  disabled={isRecordingVoice}
                  className={`w-12 h-12 rounded-full border flex items-center justify-center text-md shadow-sm transition-all duration-300 ${
                    isRecordingVoice
                      ? 'bg-red-500 text-white scale-110 animate-pulse border-red-400'
                      : voiceMemoRecorded
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      : 'bg-white text-slate-500 border-slate-200 hover:scale-105'
                  }`}
                >
                  <Mic className="w-5 h-5" />
                </button>
                
                <div className="flex-grow">
                  {isRecordingVoice ? (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs text-red-500 font-bold animate-pulse">Recording spoken context... {recordingSeconds}s</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5, 6, 7].map(i => (
                          <div 
                            key={i} 
                            className="w-1 bg-red-400 rounded-full animate-bounce" 
                            style={{ 
                              height: `${Math.random() * 20 + 8}px`,
                              animationDelay: `${i * 0.15}s`
                            }} 
                          />
                        ))}
                      </div>
                    </div>
                  ) : voiceMemoRecorded ? (
                    <div>
                      <span className="text-[10px] text-emerald-600 font-bold block">Spoken Context Saved ✓</span>
                      <span className="text-xs text-slate-700 italic font-semibold">"{voiceMemoText}"</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block">Record a 15-second speech memo</span>
                      <span className="text-xs text-slate-400 font-medium">Auto-crosscheck speech with invoice metadata.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                Urgency Brief Context <span className="text-red-500 font-bold text-sm">*</span>
              </label>
              <textarea
                placeholder="Describe your emergency here (required before analysis)..."
                rows={3}
                className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-slate-900 text-xs font-semibold focus:outline-none leading-relaxed transition-all duration-300 ${
                  validationError ? 'border-red-500 focus:border-red-500 animate-pulse' : 'border-slate-200 focus:border-accentCyan'
                }`}
                value={desc}
                onChange={(e) => {
                  setDesc(e.target.value);
                  if (e.target.value.trim()) {
                    setValidationError(false);
                  }
                }}
              />
            </div>
          </div>
        </div>

        <button
          onClick={simulateAIVerification}
          className="w-full h-11 bg-gradient-to-r from-accentCyan to-accentTeal text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(0,210,255,0.2)] hover:brightness-105 transition-all duration-300"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
          Run AI Authenticity Scan
        </button>
      </div>

      {/* AI Assessment side panel */}
      <div className="glass-card rounded-3xl p-8 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-md font-bold flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-accentPurple animate-pulse" />
              Real-time AI Verification
            </h3>
          </div>

          {!hasScanned && !isScanning ? (
            <div className="flex flex-col items-center justify-center py-20 text-textSecondary text-center">
              <AlertCircle className="w-12 h-12 text-accentCyan/40 mb-4 animate-bounce" />
              <p className="text-sm font-semibold text-slate-300">Awaiting invoice upload and authenticity scan...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Scan logs display */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-40 overflow-y-auto font-mono text-[10px] leading-relaxed text-slate-600">
                {consoleLogs.map((log, idx) => (
                  <div key={idx} className={log.includes('CRITICAL') || log.includes('WARNING') ? 'text-dangerRed font-bold animate-pulse' : log.includes('TRUST') ? 'text-successGreen font-bold' : log.includes('OCR') ? 'text-accentCyan' : ''}>
                    {log}
                  </div>
                ))}
              </div>

              {hasScanned && (
                <div className="animate-fadeIn">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100">
                    <div>
                      <div className="text-[10px] text-textMuted uppercase font-bold">Risk Assessment</div>
                      <h4 className="text-lg font-extrabold text-slate-900 mt-0.5">
                        {trustLevel === 'high' ? 'Emergency Claim Approved' :
                         trustLevel === 'medium' ? 'Manual Review Required' :
                         'Emergency Claim Rejected'}
                      </h4>
                      {fraudReason && (
                        <div className="text-[9px] text-dangerRed font-semibold mt-1.5 bg-dangerRed/10 border border-dangerRed/20 px-2.5 py-1 rounded w-fit">
                          {fraudReason}
                        </div>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold py-1 px-3 rounded-full uppercase tracking-wider flex items-center gap-1 border ${
                      trustLevel === 'high' ? 'text-successGreen bg-successGreen/10 border-successGreen/25' :
                      trustLevel === 'medium' ? 'text-warningGold bg-warningGold/10 border-warningGold/25' :
                      'text-dangerRed bg-dangerRed/10 border-dangerRed/25'
                    }`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {trustLevel === 'high' ? 'High Trust' :
                       trustLevel === 'medium' ? 'Needs Co-Signers' :
                       trustLevel === 'critical' ? 'Duplicate Fraud' : 'Low Trust'}
                    </span>
                  </div>

                  <div className="flex flex-col gap-3 font-semibold text-xs text-slate-600">
                    <div className="flex justify-between border-b border-slate-100 pb-2.5">
                      <span>AI Verification Match Score</span>
                      <span className={`font-bold ${
                        trustLevel === 'high' ? 'text-successGreen' :
                        trustLevel === 'medium' ? 'text-warningGold' :
                        'text-dangerRed'
                      }`}>{matchScore.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2.5">
                      <span>Fraud / Alteration Likelihood</span>
                      <span className={`font-bold ${
                        fraudLikelihood > 50 ? 'text-dangerRed' :
                        fraudLikelihood > 10 ? 'text-warningGold' :
                        'text-successGreen'
                      }`}>{fraudLikelihood.toFixed(2)}% {fraudLikelihood > 50 ? '(High Risk)' : fraudLikelihood > 10 ? '(Medium Risk)' : '(Low Risk)'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2.5">
                      <span>Verification Category Match</span>
                      <span className="text-slate-900 font-bold">{categoryMatch}</span>
                    </div>
                    <div className="flex justify-between pb-2.5">
                      <span>Proposed Direct Allocation</span>
                      <span className={`font-bold ${trustLevel === 'high' || trustLevel === 'medium' ? 'text-accentCyan' : 'text-textMuted line-through'}`}>
                        {payoutCurrency === 'GBP' ? '£' : payoutCurrency === 'EUR' ? '€' : payoutCurrency === 'INR' ? '₹' : payoutCurrency + ' '}{amount.toFixed(2)} {trustLevel === 'high' ? 'Released' : trustLevel === 'medium' ? 'Pending Co-Sign' : 'Held / Denied'}
                      </span>
                    </div>
                  </div>

                  {trustLevel === 'critical' && (
                    <div className="bg-dangerRed/5 border border-dangerRed/15 p-4 rounded-2xl mt-4 flex items-start gap-2.5 animate-pulse">
                      <ShieldAlert className="w-4 h-4 text-dangerRed shrink-0 mt-0.5" />
                      <p className="text-[11px] text-dangerRed leading-normal">
                        <strong>Payout Blocked:</strong> Anti-fraud guidelines prevent the instant release of funds for duplicate submissions. This incident has been logged.
                      </p>
                    </div>
                  )}

                  {trustLevel === 'medium' && (
                    <div className="bg-warningGold/5 border border-warningGold/15 p-4 rounded-2xl mt-4 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-warningGold shrink-0 mt-0.5" />
                      <p className="text-[11px] text-warningGold leading-normal">
                        <strong>Co-Signer Protection Mode:</strong> The document matches, but is flagged for manual confirmation or lacks digital watermarks. Requires 2 family guarantor co-signatures to unlock instant payout.
                      </p>
                    </div>
                  )}

                  {/* Co-Signer protection co-signer vouching bypass widget */}
                  {claimSubmitted && trustLevel === 'medium' && (
                    <div className="bg-gradient-to-r from-accentPurple/5 to-accentCyan/5 border border-accentPurple/20 p-5 rounded-2xl mt-4 space-y-4 animate-fadeIn">
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-accentPurple" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">Guarantor Circle Bypass</h4>
                          <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Collect 2 co-signatures to unlock instant payout</p>
                        </div>
                      </div>
                      
                      {vouchState === 'idle' ? (
                        <button
                          type="button"
                          onClick={startGuarantorVouchSimulation}
                          className="w-full py-2.5 bg-gradient-to-r from-accentPurple to-accentCyan text-white font-bold text-xs rounded-xl hover:brightness-105 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                          <Users className="w-4 h-4" />
                          <span>Broadcast Vouch Request to Family Circle</span>
                        </button>
                      ) : (
                        <div className="space-y-2.5">
                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-600">
                            <span>Status: {vouchState === 'broadcasting' ? 'Broadcasting...' : vouchState === 'vouched_1' ? 'Awaiting 1 more signature...' : 'Verified (Quorum Met!)'}</span>
                            <span>{vouchState === 'broadcasting' ? '0/2' : vouchState === 'vouched_1' ? '1/2' : '2/2'} Vouches</span>
                          </div>
                          
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-accentPurple to-accentTeal h-full transition-all duration-500"
                              style={{ width: vouchState === 'broadcasting' ? '15%' : vouchState === 'vouched_1' ? '50%' : '100%' }}
                            />
                          </div>
                          
                          <div className="text-[9px] font-mono text-slate-500 space-y-1 bg-slate-50 p-2.5 border border-slate-200/80 rounded-lg max-h-24 overflow-y-auto">
                            <div>[System] Shared vouch request link with family circle...</div>
                            {(vouchState === 'vouched_1' || vouchState === 'completed') && (
                              <div className="text-accentTeal font-bold">✓ Priya co-signed from India UPI matching node.</div>
                            )}
                            {vouchState === 'completed' && (
                              <div className="text-accentTeal font-bold">✓ Ahmed co-signed from UAE ADCB local settlement node.</div>
                            )}
                          </div>

                          {vouchState === 'completed' && (
                            <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-start gap-2 animate-pulse mt-2">
                              <CheckCircle2 className="w-4 h-4 text-successGreen shrink-0" />
                              <p className="text-[10px] text-emerald-800 leading-normal font-semibold">
                                <strong>Social Guarantee Met!</strong> Bypass cleared. Payout of {payoutCurrency === 'GBP' ? '£' : payoutCurrency === 'EUR' ? '€' : payoutCurrency === 'INR' ? '₹' : payoutCurrency + ' '}{amount.toFixed(2)} equivalent released instantly via local matching pools.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="bg-accentPurple/5 border border-accentPurple/15 p-4 rounded-2xl mt-4">
                    <h4 className="text-xs font-bold text-accentTeal mb-1 flex items-center gap-1.5">
                      <i className="fa-solid fa-circle-nodes"></i>
                      Saan FX Smart Split Proposal
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-normal font-semibold">
                      Saan recommends routing this loan to avoid higher fee brackets: Indian sister (₹12,000), UAE uncle (AED 400), and Canadian brother (CAD 80), reducing exchange spreads and saving £14.20.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {releaseButtonVisible && (
          <button
            onClick={handleRelease}
            className="w-full h-11 bg-gradient-to-r from-accentTeal to-accentPurple text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(13,148,136,0.2)] hover:brightness-105 transition-all duration-300 mt-6"
          >
            <CheckCircle2 className="w-4 h-4" />
            Submit Claim for Institutional Review ({payoutCurrency === 'GBP' ? '£' : payoutCurrency === 'EUR' ? '€' : payoutCurrency === 'INR' ? '₹' : payoutCurrency + ' '}{amount.toFixed(2)})
          </button>
        )}
      </div>

      {/* Section Activity History */}
      <div className="glass-card rounded-3xl p-6 bg-white lg:col-span-2">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
          Emergency Underwriting History
        </h3>
        <div className="flex flex-col gap-3 font-medium">
          {appState.history
            .filter((item: any) => item.section === 'emergency')
            .map((item: any) => (
              <div 
                key={item.id} 
                className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accentTeal/10 text-accentTeal flex items-center justify-center font-bold">
                    EM
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
          {appState.history.filter((item: any) => item.section === 'emergency').length === 0 && (
            <div className="text-xs text-textMuted text-center py-4">No recent emergency payouts.</div>
          )}
        </div>
      </div>

    </div>
  );
}
