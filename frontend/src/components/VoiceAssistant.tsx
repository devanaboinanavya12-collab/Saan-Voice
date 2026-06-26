import { useState, useEffect, useRef } from 'react';
import { Mic, Send, Info, Volume2 } from 'lucide-react';

interface VoiceAssistantProps {
  onTriggerAction: (actionData: { action: string; targetTab: string; speechText: string; parameters?: any }) => void;
  appState: any;
}

export default function VoiceAssistant({ onTriggerAction, appState }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [statusText, setStatusText] = useState('Click the mic to speak, or choose a command below.');
  const [userSpeech, setUserSpeech] = useState('Awaiting voice input...');
  const [saanReply, setSaanReply] = useState('Hello Rushi! Speak to me to send money, lock rates, or manage your emergency payout.');
  const [textInput, setTextInput] = useState('');
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const waveAnimationId = useRef<number | null>(null);

  // Sound Synthesis helpers
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Find best English voice
    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')));
    if (enVoice) utterance.voice = enVoice;
    
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    
    utterance.onstart = () => {
      setIsSpeaking(true);
      startWaveAnimation(3);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      stopWaveAnimation();
    };

    window.speechSynthesis.speak(utterance);
  };

  // Wave Visualizer animation
  const startWaveAnimation = (speedMultiplier: number = 1) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let phase = 0;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = isSpeaking ? '#7B2CBF' : '#00D2FF';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x++) {
        const amplitude = isSpeaking ? 15 : isListening ? 12 : 3;
        const frequency = isSpeaking ? 0.05 : isListening ? 0.04 : 0.01;
        const y = canvas.height / 2 + Math.sin(x * frequency + phase) * amplitude * Math.sin(x * 0.005);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      
      phase += 0.1 * speedMultiplier;
      waveAnimationId.current = requestAnimationFrame(render);
    };
    render();
  };

  const stopWaveAnimation = () => {
    if (waveAnimationId.current) {
      cancelAnimationFrame(waveAnimationId.current);
    }
    // Static calm line
    startWaveAnimation(0.2);
  };

  useEffect(() => {
    startWaveAnimation(0.2);
    return () => {
      if (waveAnimationId.current) cancelAnimationFrame(waveAnimationId.current);
    };
  }, [isListening, isSpeaking]);

  const processQueryText = async (text: string) => {
    setUserSpeech(`You: "${text}"`);
    setStatusText('Processing query with Saan AI...');
    
    try {
      // Connect to our backend local chat API proxy
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, state: appState }),
      });

      if (!response.ok) {
        throw new Error('API server returned an error');
      }

      const result = await response.json();
      setSaanReply(`Saan: "${result.speechText}"`);
      setStatusText('Awaiting command...');
      
      // Speak response aloud
      speakText(result.speechText);
      
      // Programmatic action dispatch
      onTriggerAction(result);
    } catch (e) {
      console.error(e);
      // Fallback offline responses for demonstration
      processFallbackOfflineQuery(text);
    }
  };

  const processFallbackOfflineQuery = (text: string) => {
    const query = text.toLowerCase();
    let reply = "I heard you, but my API backend is currently offline. Let's look up your query locally.";
    let action = 'UNKNOWN';
    let targetTab = 'overview';
    let parameters: any = {};

    if (query.includes('rate') || query.includes('exchange') || query.includes('rupee')) {
      reply = `The current GBP to INR exchange rate is ${appState.fxRates.INR || '131.50'}. Let's view the live FX engine.`;
      action = 'NAVIGATE_TAB';
      targetTab = 'fx-management';
    } else if (query.includes('lock')) {
      reply = `Perfect. I am locking the GBP to INR exchange rate at ${appState.fxRates.INR || '131.50'} for seven days.`;
      action = 'LOCK_RATE';
      targetTab = 'fx-management';
      parameters = { currency: 'INR', rate: appState.fxRates.INR };
    } else if (query.includes('split') || query.includes('optimize') || query.includes('repayment')) {
      reply = "Analyzing your outstanding loan balances. By utilizing Zero-Border split routing, we can save £18.40 today.";
      action = 'OPTIMIZE_REPAYMENT';
      targetTab = 'p2p-trust';
    } else if (query.includes('loan') || query.includes('balance') || query.includes('debt')) {
      reply = `You have £84 remaining out of your original £300 loan. Your community has repaid 72% so far.`;
      action = 'CHECK_LOAN';
      targetTab = 'loan-repayment';
    } else if (query.includes('match') || query.includes('p2p')) {
      reply = "Opening your local P2P settlement ledger. We have matched your transfer with local UK and Indian counterparts.";
      action = 'NAVIGATE_TAB';
      targetTab = 'p2p-trust';
    } else if (query.includes('guarantee') || query.includes('trust')) {
      reply = "Opening your Social Trust network. You have active micro-guarantees from your Sister, Uncle, and Brother.";
      action = 'NAVIGATE_TAB';
      targetTab = 'p2p-trust';
    }

    setSaanReply(`Saan: "${reply}"`);
    setStatusText('Awaiting command...');
    speakText(reply);
    onTriggerAction({ action, targetTab, speechText: reply, parameters });
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatusText('Speech Recognition API not supported in this browser.');
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setIsListening(true);
      setStatusText('Listening... Speak now');
      startWaveAnimation(2);
    };

    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      processQueryText(transcript);
    };

    rec.onerror = (event: any) => {
      console.error(event.error);
      setIsListening(false);
      setStatusText(`Error listening: ${event.error}`);
      stopWaveAnimation();
    };

    rec.onend = () => {
      setIsListening(false);
      stopWaveAnimation();
    };

    rec.start();
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    processQueryText(textInput);
    setTextInput('');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Console panel */}
      <div className="glass-card rounded-3xl p-8 flex flex-col items-center justify-between text-center relative overflow-hidden bg-gradient-radial">
        <div className="relative w-36 h-36 mt-4 flex items-center justify-center">
          <div
            className="absolute inset-0 rounded-full blur-2xl opacity-60 bg-[radial-gradient(circle,var(--accentCyan)_0%,rgba(123,44,191,0.3)_50%,transparent_80%)] animate-pulse"
            style={{ transform: isSpeaking ? 'scale(1.25)' : isListening ? 'scale(1.1)' : 'scale(0.95)' }}
          />
          <button
            onClick={startListening}
            className={`w-24 h-24 rounded-full border-2 border-white/20 flex items-center justify-center cursor-pointer shadow-xl z-10 transition-all duration-300 ${
              isListening
                ? 'bg-gradient-to-r from-dangerRed to-accentPurple scale-110 animate-pulse shadow-dangerRed/50'
                : 'bg-gradient-to-r from-accentPurple to-accentCyan hover:scale-105 hover:shadow-accentCyan/30'
            }`}
          >
            <Mic className="w-8 h-8 text-white" />
          </button>
        </div>

        <div className="mt-4">
          <h3 className="text-lg font-bold text-slate-900">Hey Saan AI Assistant</h3>
          <p className="text-xs text-textSecondary mt-1" id="voice-status-display">{statusText}</p>
        </div>

        {/* Oscilloscope Waveform */}
        <div className="w-full h-16 my-4 overflow-hidden flex justify-center">
          <canvas ref={canvasRef} width="400" height="60" className="w-full max-w-[400px] h-full" />
        </div>

        {/* Dialog bubble */}
        <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left flex flex-col justify-between h-44 gap-3 shadow-inner">
          <div className="overflow-y-auto pr-1 flex flex-col gap-2.5">
            <div className="text-[12px] leading-relaxed text-textSecondary font-medium">
              <span className="text-accentCyan font-bold">You: </span>
              {userSpeech}
            </div>
            <div className="text-[12px] leading-relaxed text-slate-800 font-medium">
              <span className="text-accentTeal font-bold">Saan: </span>
              {saanReply}
            </div>
          </div>

          <form onSubmit={handleTextSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Type your command..."
              className="flex-grow bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-xs font-semibold focus:outline-none focus:border-accentCyan"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-accentCyan to-accentTeal hover:brightness-105 text-white font-bold p-2.5 rounded-xl shadow-md transition-all duration-300"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Preset Scenario Commands panel */}
      <div className="glass-card rounded-3xl p-8 flex flex-col justify-between bg-white text-slate-800">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-bold flex items-center gap-2 text-slate-900">
              <Volume2 className="w-5 h-5 text-accentPurple" />
              Interactive Visa Prototypes
            </h3>
          </div>
          <p className="text-xs text-textSecondary leading-relaxed mb-6 font-semibold">
            Test how our AI system works in real time by clicking these preset scenario commands. The assistant will trigger corresponding UI tabs and speak the answer aloud.
          </p>

          <div className="flex flex-col gap-5">
            <div>
              <div className="text-[10px] text-textMuted font-bold uppercase tracking-wider mb-2">Live P2P & Trust Networks</div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => processQueryText("Show my local matching transfers")}
                  className="bg-slate-50 border border-slate-200 hover:border-accentCyan hover:text-accentCyan hover:bg-accentCyan/10 px-3.5 py-2 rounded-full text-xs font-bold text-slate-600 cursor-pointer transition-all duration-300"
                >
                  Show local P2P matches
                </button>
                <button
                  onClick={() => processQueryText("Check my social trust guarantees")}
                  className="bg-slate-50 border border-slate-200 hover:border-accentCyan hover:text-accentCyan hover:bg-accentCyan/10 px-3.5 py-2 rounded-full text-xs font-bold text-slate-600 cursor-pointer transition-all duration-300"
                >
                  Check trust score
                </button>
              </div>
            </div>

            <div>
              <div className="text-[10px] text-textMuted font-bold uppercase tracking-wider mb-2">Exchange rate Queries</div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => processQueryText("What is the current GBP to INR exchange rate?")}
                  className="bg-slate-50 border border-slate-200 hover:border-accentCyan hover:text-accentCyan hover:bg-accentCyan/10 px-3.5 py-2 rounded-full text-xs font-bold text-slate-600 cursor-pointer transition-all duration-300"
                >
                  GBP to INR rate?
                </button>
                <button
                  onClick={() => processQueryText("Lock the current GBP rate for seven days")}
                  className="bg-slate-50 border border-slate-200 hover:border-accentCyan hover:text-accentCyan hover:bg-accentCyan/10 px-3.5 py-2 rounded-full text-xs font-bold text-slate-600 cursor-pointer transition-all duration-300"
                >
                  Lock rate for 7 days
                </button>
              </div>
            </div>

            <div>
              <div className="text-[10px] text-textMuted font-bold uppercase tracking-wider mb-2">Lending & Splits</div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => processQueryText("Suggest an optimized repayment split")}
                  className="bg-slate-50 border border-slate-200 hover:border-accentCyan hover:text-accentCyan hover:bg-accentCyan/10 px-3.5 py-2 rounded-full text-xs font-bold text-slate-600 cursor-pointer transition-all duration-300"
                >
                  Optimize repayment split
                </button>
                <button
                  onClick={() => processQueryText("Check my outstanding loan balance")}
                  className="bg-slate-50 border border-slate-200 hover:border-accentCyan hover:text-accentCyan hover:bg-accentCyan/10 px-3.5 py-2 rounded-full text-xs font-bold text-slate-600 cursor-pointer transition-all duration-300"
                >
                  Check loan progress
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-accentPurple/5 border border-accentPurple/15 p-4 rounded-xl mt-6 flex items-start gap-3">
          <Info className="w-4 h-4 text-accentPurple shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-600 font-semibold leading-normal">
            This module leverages browser native **SpeechRecognition** and **SpeechSynthesis** API. Ensure your microphone is allowed and volume is turned up to hear Saan Voice speak.
          </p>
        </div>
      </div>
    </div>
  );
}
