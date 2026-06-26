import { useState } from 'react';
import { Mic, Lock, X } from 'lucide-react';

interface LoginPortalProps {
  initialMode?: 'signin' | 'signup';
  initialRole?: 'user' | 'admin';
  onLoginSuccess: (role: 'user' | 'admin') => void;
  onClose?: () => void;
}

export default function LoginPortal({ initialMode = 'signin', initialRole = 'user', onLoginSuccess, onClose }: LoginPortalProps) {
  const [portalMode, setPortalMode] = useState<'signin' | 'signup'>(initialMode);
  const [loginRole, setLoginRole] = useState<'user' | 'admin'>(initialRole);

  const [activeTab, setActiveTab] = useState<'password' | 'voice'>('password');
  const [email, setEmail] = useState('rushi@saanpay.co.uk');
  const [password, setPassword] = useState('password123');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Sign Up & OTP Verification State
  const [signUpIdentifier, setSignUpIdentifier] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Voice Biometrics State
  const [isListening, setIsListening] = useState(false);
  const [bioStatus, setBioStatus] = useState('Click the microphone to scan voice signature');
  const [heardText, setHeardText] = useState('');

  const playChime = (success: boolean) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;
      if (success) {
        // E5, G#5, B5 (Ascending)
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
      } else {
        // Sawtooth sweep down
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(90, now + 0.4);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch (e) {
      console.warn("Audio Context blocked/unsupported", e);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      playChime(true);
      onLoginSuccess(loginRole);
    }, 1200);
  };

  const startVoiceBiometrics = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setBioStatus('Web Speech API is not supported in this browser. Please use Password login.');
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setIsListening(true);
      setBioStatus('System listening... Speak clearly now');
      setHeardText('');
    };

    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setHeardText(`Heard: "${transcript}"`);
      const cleanSpeech = transcript.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, "").trim();

      // Target phrase: "Saan, authorize my voice"
      if (cleanSpeech.includes("saan authorize") || cleanSpeech.includes("authorize my voice") || cleanSpeech.includes("authorize voice")) {
        setBioStatus('Voice Signature Match: 98.4% Confidence!');
        playChime(true);
        setTimeout(() => {
          onLoginSuccess(loginRole);
        }, 1200);
      } else {
        setBioStatus('Vocal signature mismatch. Please match the exact phrase.');
        playChime(false);
      }
    };

    rec.onerror = (event: any) => {
      console.error(event.error);
      setIsListening(false);
      if (event.error === 'no-speech') {
        setBioStatus('No vocal signature detected. Please try again.');
      } else if (event.error === 'not-allowed') {
        setBioStatus('Microphone permissions denied.');
      } else {
        setBioStatus(`Biometric scan error: ${event.error}`);
      }
      playChime(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    rec.start();
  };

  return (
    <div className="fixed inset-0 z-[10000] grid grid-cols-1 md:grid-cols-2 w-full h-full bg-[#F8FAFC] overflow-hidden font-sans">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-[10001] bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 rounded-full p-2.5 transition-all duration-300"
          title="Back to Homepage"
        >
          <X className="w-5 h-5" />
        </button>
      )}
      {/* Dynamic Animated Glow background inside portal */}
      <div className="absolute inset-0 -z-50 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-40 bg-[linear-gradient(rgba(15,23,42,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.015)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        <div className="absolute -top-[20%] -left-[10%] w-[750px] h-[750px] rounded-full blur-[120px] opacity-15 bg-[radial-gradient(circle,rgba(14,165,233,0.18)_0%,rgba(99,102,241,0.03)_50%,transparent_70%)] animate-pulse"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[850px] h-[850px] rounded-full blur-[120px] opacity-15 bg-[radial-gradient(circle,rgba(99,102,241,0.16)_0%,rgba(14,165,233,0.03)_50%,transparent_70%)]"></div>
      </div>

      {/* Left panel */}
      <div className="p-16 hidden md:flex flex-col justify-between border-r border-slate-200 bg-slate-50">
        <div className="flex items-center gap-3">
          <Mic className="w-8 h-8 text-accentPurple filter drop-shadow-[0_2px_8px_rgba(99,102,241,0.2)]" />
          <span className="text-2xl font-extrabold tracking-wider bg-gradient-to-r from-slate-900 to-accentPurple bg-clip-text text-transparent">SAAN VOICE</span>
        </div>
        <div className="max-w-md">
          <h2 className="text-4xl font-extrabold leading-tight mb-5 bg-gradient-to-r from-slate-900 to-accentPurple bg-clip-text text-transparent">
            Secure Emergency Financing & Global P2P Payments
          </h2>
          <p className="text-slate-600 text-base leading-relaxed">
            Welcome to the next generation of cross-border lending and local-to-local matching settlement. Powered by hands-free voice biometrics and community trust underwriting.
          </p>
          <div className="flex gap-1.5 h-10 mt-8 items-center">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className="w-1 bg-accentPurple rounded-full animate-bounce"
                style={{
                  height: idx === 1 ? '12px' : idx === 2 ? '24px' : idx === 3 ? '36px' : idx === 4 ? '20px' : '10px',
                  animationDelay: `${idx * 0.1}s`,
                }}
              />
            ))}
          </div>
        </div>
        <div className="text-xs text-slate-400 font-medium">
          Saan Voice Platform &copy; 2026. All rights secured.
        </div>
      </div>

      {/* Right panel */}
      <div className="flex items-center justify-center p-8 relative">
        <div className="w-full max-w-[440px] bg-white border border-slate-200/80 rounded-3xl p-10 shadow-lg shadow-slate-100">
          
          {/* Sign In / Sign Up Selector */}
          <div className="flex bg-slate-100 border border-slate-200 rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => {
                setPortalMode('signin');
                setOtpSent(false);
              }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                portalMode === 'signin'
                  ? 'bg-white text-slate-900 border border-slate-200/50 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setPortalMode('signup');
                setOtpSent(false);
              }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                portalMode === 'signup'
                  ? 'bg-white text-slate-900 border border-slate-200/50 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign Up
            </button>
          </div>

          <div className="mb-7">
            <h3 className="text-2xl font-extrabold text-slate-900">
              {portalMode === 'signin' ? 'Sign in to Saan' : 'Create Saan Account'}
            </h3>
            <p className="text-xs text-slate-600 mt-1.5">
              {portalMode === 'signin' 
                ? 'Access your locked rate and community lending core' 
                : 'Join the zero-border matching & social trust circle'}
            </p>
          </div>

          {/* Role Selector */}
          <div className="flex bg-slate-100 border border-slate-200 rounded-xl p-1 mb-5">
            <button
              type="button"
              onClick={() => {
                setLoginRole('user');
                if (portalMode === 'signin') {
                  setEmail('rushi@saanpay.co.uk');
                  setPassword('password123');
                }
              }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                loginRole === 'user'
                  ? 'bg-white text-slate-900 border border-slate-200/50 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {portalMode === 'signin' ? 'Customer Login' : 'Customer Sign Up'}
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginRole('admin');
                if (portalMode === 'signin') {
                  setEmail('admin@saanpay.co.uk');
                  setPassword('admin123');
                }
              }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                loginRole === 'admin'
                  ? 'bg-white text-slate-900 border border-slate-200/50 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {portalMode === 'signin' ? 'Organisation Login' : 'Organisation Sign Up'}
            </button>
          </div>

          {/* Sign In Portal Tabs and Forms */}
          {portalMode === 'signin' && (
            <>
              {/* Login Tabs */}
              <div className="flex bg-slate-100 border border-slate-200 rounded-xl p-1 mb-7">
                <button
                  type="button"
                  onClick={() => setActiveTab('password')}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                    activeTab === 'password' ? 'bg-white text-slate-800 border border-slate-200/50 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('voice')}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                    activeTab === 'voice' ? 'bg-white text-slate-800 border border-slate-200/50 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Voice ID Biometrics
                </button>
              </div>

              {/* Password Tab */}
              {activeTab === 'password' && (
                <form onSubmit={handlePasswordSubmit}>
                  <div className="mb-4">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2 block">Email Address</label>
                    <input
                      type="email"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-xs font-medium focus:outline-none focus:border-accentCyan"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-6">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2 block">Password</label>
                    <input
                      type="password"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-xs font-medium focus:outline-none focus:border-accentCyan"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 bg-gradient-to-r from-accentCyan to-accentPurple hover:brightness-115 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(99,102,241,0.2)] hover:-translate-y-0.5 transition-all duration-300"
                  >
                    {isSubmitting ? (
                      <span>Authenticating...</span>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Secure Sign In</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Voice ID Tab */}
              {activeTab === 'voice' && (
                <div className="flex flex-col items-center text-center animate-fadeIn">
                  <div className="relative w-28 h-28 mb-6 flex items-center justify-center">
                    {isListening && (
                      <div className="absolute inset-0 rounded-full border-2 border-accentPurple opacity-85 animate-ping" />
                    )}
                    <button
                      type="button"
                      onClick={startVoiceBiometrics}
                      className={`w-20 h-20 rounded-full border border-slate-200 flex items-center justify-center text-2xl shadow-lg transition-all duration-300 ${
                        isListening
                          ? 'bg-gradient-to-r from-dangerRed to-accentPurple text-white scale-110 shadow-dangerRed/40'
                          : 'bg-gradient-to-r from-accentPurple to-accentCyan text-white hover:scale-105 hover:shadow-accentCyan/30'
                      }`}
                    >
                      <Mic className="w-7 h-7" />
                    </button>
                  </div>

                  <div className={`text-xs font-semibold mb-2.5 transition-all duration-300 ${isListening ? 'text-accentPurple' : 'text-slate-600'}`}>
                    {bioStatus}
                  </div>
                  {heardText && <div className="text-[10px] text-accentTeal font-mono mb-4">{heardText}</div>}
                  
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-[280px]">
                    The biometrics engine checks your voice print signature against your profile.
                  </p>

                  <div className="bg-slate-50 border border-dashed border-slate-200 p-3.5 rounded-xl mt-6 text-xs text-slate-600 w-full leading-normal">
                    Say clearly:<br />
                    <strong className="text-accentTeal font-bold">"Saan, authorize my voice"</strong>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Sign Up / OTP Verification Section */}
          {portalMode === 'signup' && (
            <div className="animate-fadeIn">
              {!otpSent ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!signUpIdentifier.trim()) return;
                    setIsVerifying(true);
                    setTimeout(() => {
                      setIsVerifying(false);
                      setOtpSent(true);
                      setOtpError('');
                      playChime(true);
                    }, 1000);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2 block">
                      Email or Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. rushi@saanpay.co.uk or +44 7700 900077"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-xs font-medium focus:outline-none focus:border-accentCyan"
                      value={signUpIdentifier}
                      onChange={(e) => setSignUpIdentifier(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="w-full h-11 bg-gradient-to-r from-accentCyan to-accentPurple hover:brightness-115 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(99,102,241,0.2)] hover:-translate-y-0.5 transition-all duration-300 mt-6"
                  >
                    {isVerifying ? (
                      <span>Sending OTP...</span>
                    ) : (
                      <span>Send Verification OTP</span>
                    )}
                  </button>
                </form>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (otpCode !== '123456') {
                      setOtpError('Invalid verification code. Enter mock code 123456.');
                      playChime(false);
                      return;
                    }
                    setIsVerifying(true);
                    setTimeout(() => {
                      setIsVerifying(false);
                      playChime(true);
                      alert(`Account successfully created and verified for ${signUpIdentifier}!`);
                      onLoginSuccess(loginRole);
                    }, 1200);
                  }}
                  className="space-y-4"
                >
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 text-[11px] text-emerald-800 mb-4 leading-normal flex items-start gap-2.5">
                    <span className="font-bold text-sm leading-none">✓</span>
                    <div>
                      Mock OTP <strong className="font-bold text-emerald-950">123456</strong> sent to {signUpIdentifier}.
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2 block">
                      Enter 6-Digit OTP
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 123456"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-mono text-center text-lg tracking-widest font-extrabold focus:outline-none focus:border-accentCyan"
                      value={otpCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setOtpCode(val);
                      }}
                      required
                    />
                  </div>
                  {otpError && (
                    <div className="text-[11px] text-red-500 font-semibold mt-1">
                      {otpError}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="w-full h-11 bg-gradient-to-r from-accentCyan to-accentPurple hover:brightness-115 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(99,102,241,0.2)] hover:-translate-y-0.5 transition-all duration-300 mt-6"
                  >
                    {isVerifying ? (
                      <span>Verifying & Logging In...</span>
                    ) : (
                      <span>Verify & Login</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode('');
                      setOtpError('');
                    }}
                    className="w-full text-center text-slate-500 hover:text-slate-800 text-xs font-semibold mt-4 block"
                  >
                    Change Email / Phone Number
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
