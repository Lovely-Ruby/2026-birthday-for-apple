import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  Sparkles, 
  RotateCcw, 
  Volume2,
  VolumeX
} from 'lucide-react';
import confetti from 'canvas-confetti';

// ==========================================
// 1. WIND SOUND SYNTHESIS (Web Audio API)
// ==========================================

// Synthesize a puff of wind noise for candle blowing
const playBlowSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const bufferSize = ctx.sampleRate * 0.4; // 0.4 seconds
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Fill buffer with white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(350, ctx.currentTime); // low pitch wind
    filter.Q.setValueAtTime(1.5, ctx.currentTime);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.38); // fade out
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    noise.start();
    setTimeout(() => {
      try {
        ctx.close();
      } catch (err) {}
    }, 600);
  } catch (e) {
    console.error("Blow sound synthesis failed:", e);
  }
};

// Synthesize a quick click pop sound immediately when seal is clicked
const playUnsealSound = (ctx: AudioContext) => {
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(250, now);
    osc.frequency.exponentialRampToValueAtTime(500, now + 0.06); // sweep up
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.12); // sweep down
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.18);
  } catch (e) {
    console.error("Unseal sound failed:", e);
  }
};

// Synthesize a magical glissando arpeggio when the card pops up
const playPopSound = (ctx: AudioContext, delay = 0.35) => {
  try {
    const now = ctx.currentTime + delay;
    // Magical upward sweeping major scale chord notes (C5, E5, G5, C6, E6, G6, C7)
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00]; 
    
    notes.forEach((freq, idx) => {
      const time = now + idx * 0.05; // 50ms delay between notes
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine'; // pure crystal clear sound
      osc.frequency.setValueAtTime(freq, time);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.01, time + 0.04);
      
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.18, time + 0.02); // rapid attack
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3); // decay
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(time);
      osc.stop(time + 0.35);
    });
  } catch (e) {
    console.error("Pop sound synthesis failed:", e);
  }
};

// Synthesize a warm, romantic chime arpeggio when opening the letter card
const playLetterOpenSound = (ctx: AudioContext) => {
  try {
    const now = ctx.currentTime;
    // Romantic arpeggio (F5, A5, C6, F6)
    const notes = [698.46, 880.00, 1046.50, 1396.91];
    
    notes.forEach((freq, idx) => {
      const time = now + idx * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.15, time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(time);
      osc.stop(time + 0.5);
    });
  } catch (e) {
    console.error("Letter open sound failed:", e);
  }
};


// ==========================================
// 2. ROMANTIC CONFIGURATION FOR 萍
// ==========================================

const TARGET_NAME = "萍";
const BLESSING_TITLE = "祝我最亲爱的萍生日快乐！";
const BLESSING_CONTENT = `致亲爱的萍：

祝宝子萍生日快乐呀！✨
陪你度过的第5个生日! 
又是一年里最特别的一天，愿你新的一岁依然温柔、快乐、被爱包围。
感谢你来到我的生命里，让每一个平凡的日子都变得闪闪发光。
愿你眼里永远有笑意，心底永远有温暖。
无论未来的日子是晴是雨，我都想陪你一起度过，把以后的每一个生日都变成我们美好的回忆。

生日快乐，我的爱人！🎂🎈`;


export default function App() {
  // ==========================================
  // 3. STATES SETUP
  // ==========================================
  
  const [isOpened, setIsOpened] = useState(false); // Has envelope been opened?
  const [envelopeClass, setEnvelopeClass] = useState(''); // Envelope open anim states
  const [currentStep, setCurrentStep] = useState<'letter' | 'cake'>('letter'); // Letter screen -> Cake screen
  
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [areCandlesLit, setAreCandlesLit] = useState(true);
  const [showWishPanel, setShowWishPanel] = useState(false);
  const [typedWish, setTypedWish] = useState('');
  const [wishSubmitted, setWishSubmitted] = useState(false);
  const [lanterns, setLanterns] = useState<{ id: number; drift: number }[]>([]);
  
  // MP3 Audio Player Ref
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio object once
  useEffect(() => {
    audioRef.current = new Audio('./birthday-song.mp3');
    audioRef.current.loop = true;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Generate 20 floating background particles with random delays and paths
  const [particles] = useState(() => 
    Array.from({ length: 20 }, (_, idx) => ({
      id: idx,
      type: idx % 4 === 0 ? 'heart' : idx % 4 === 1 ? 'star' : idx % 4 === 2 ? 'petal' : 'bubble',
      size: Math.random() * 16 + 10,
      left: Math.random() * 95,
      delay: Math.random() * 10,
      duration: Math.random() * 8 + 8,
      drift: Math.random() * 120 - 60
    }))
  );


  // ==========================================
  // 4. ANIMATIONS & CONTROLLERS
  // ==========================================

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isMusicPlaying) {
      audioRef.current.pause();
      setIsMusicPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsMusicPlaying(true))
        .catch(err => console.log("Play failed:", err));
    }
  };

  // Open the envelope
  const handleOpenEnvelope = () => {
    if (envelopeClass.includes('open')) return;
    
    // Create AudioContext inside the user interaction event loop
    let audioCtx: AudioContext | null = null;
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    } catch (e) {
      console.error(e);
    }
    
    setEnvelopeClass('open');
    
    // Play physical clicking sound immediately and schedule the pop-up sound 0.35s later
    if (audioCtx) {
      playUnsealSound(audioCtx);
      playPopSound(audioCtx, 0.35);
      
      const ctxToClose = audioCtx;
      setTimeout(() => {
        try {
          ctxToClose.close();
        } catch (err) {}
      }, 1500);
    }
    
    setTimeout(() => {
      // Fire confetti burst!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      // Secondary side bursts for full mobile screen effect
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
      }, 250);
      
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 400);
    }, 700);
  };

  // Transition to love letter screen
  const handleEnterLetter = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Play sweet chime sound when transition starts
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      playLetterOpenSound(audioCtx);
      setTimeout(() => {
        try {
          audioCtx.close();
        } catch (err) {}
      }, 1500);
    } catch (err) {
      console.error("Failed to play letter open sound:", err);
    }
    
    setIsOpened(true);
    
    // Play MP3 when the letter is opened/expanded
    if (audioRef.current) {
      audioRef.current.play()
        .then(() => setIsMusicPlaying(true))
        .catch(err => console.error("Auto playback failed:", err));
    }
  };

  // Blow candles out
  const handleBlowCandles = () => {
    playBlowSound();
    setAreCandlesLit(false);
    
    // Massive confetti rain
    const end = Date.now() + 3 * 1000;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    // Open the wish panel
    setTimeout(() => {
      setShowWishPanel(true);
    }, 1000);
  };

  // Send floating wish lantern
  const handleSubmitWish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedWish.trim()) return;

    // Create a new lantern animation
    const newId = Date.now();
    const drift = Math.random() * 120 - 60;
    setLanterns(prev => [...prev, { id: newId, drift }]);
    
    setWishSubmitted(true);
    setShowWishPanel(false);

    // Clear lantern element after animation completes
    setTimeout(() => {
      setLanterns(prev => prev.filter(l => l.id !== newId));
    }, 18000);
  };

  // Reset candles & wish state to re-wish
  const handleReWish = () => {
    setAreCandlesLit(true);
    setWishSubmitted(false);
    setTypedWish('');
  };


  // ==========================================
  // 5. RENDER SCREEN
  // ==========================================

  return (
    <div className="desktop-wrapper">
      {/* Blurred glow in desktop background */}
      <div className="desktop-bg-blur" />

      {/* Main simulated phone container */}
      <div className="app-container">
        
        {/* Floating Background Sparkles (Rendered inside phone viewport) */}
        <div className="particle-field">
          {particles.map((p) => {
            const style = {
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              '--drift': `${p.drift}px`
            } as React.CSSProperties;

            if (p.type === 'heart') {
              return <Heart key={p.id} className="particle-heart animate-float-heart" style={style} fill="currentColor" />;
            } else if (p.type === 'star') {
              return <Sparkles key={p.id} className="particle-star animate-float-star" style={style} />;
            } else if (p.type === 'petal') {
              return (
                <svg key={p.id} className="particle-petal" style={style} viewBox="0 0 30 30" fill="currentColor">
                  <path d="M15,5 C10,5 5,10 5,15 C5,25 15,25 15,25 C15,25 25,25 25,15 C25,10 20,5 15,5 Z" />
                </svg>
              );
            }
            return <div key={p.id} className="particle animate-float-particle" style={style} />;
          })}
        </div>

        {/* Music playback toggle widget */}
        {isOpened && (
          <button 
            onClick={toggleMusic}
            className="audio-player-mini group"
            aria-label="Toggle Background Music"
          >
            <div className={`audio-vinyl ${isMusicPlaying ? 'playing' : ''}`}>
              {isMusicPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
            </div>
          </button>
        )}

        {/* ==========================================
            A. ENVELOPE INTRO SCREEN (Step 1)
            ========================================== */}
        {!isOpened && (
          <div className="envelope-screen relative">
            {/* Spinning decorative background orbits */}
            {!envelopeClass.includes('open') && (
              <div className="absolute w-[460px] h-[460px] border border-pink-200/20 rounded-full animate-[spin_60s_linear_infinite] pointer-events-none z-0 flex items-center justify-center">
                <div className="w-[380px] h-[380px] border border-dashed border-pink-200/30 rounded-full flex items-center justify-center">
                  <div className="w-[280px] h-[280px] border border-pink-200/10 rounded-full" />
                </div>
              </div>
            )}

            <h2 className={`font-cursive text-4xl text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-pink-600 to-purple-800 font-bold mb-8 tracking-wider drop-shadow-sm z-10 transition-all duration-500 ${envelopeClass.includes('open') ? 'opacity-0 scale-95 -translate-y-4 pointer-events-none' : 'opacity-100 scale-100'}`}>
              {TARGET_NAME} 亲启
            </h2>

            {/* Simulated Envelope Graphics */}
            <div 
              className={`envelope-wrapper ${envelopeClass}`}
              onClick={handleOpenEnvelope}
            >

              {/* Glowing Aura behind envelope */}
              {!envelopeClass.includes('open') && (
                <div className="envelope-aura absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px]" />
              )}

              {/* Seal Sticker */}
              <div className="heart-seal animate-heartbeat">
                <Heart className="w-5 h-5 fill-current" />
              </div>

              {/* Envelope flap */}
              <div className="envelope-flap" />

              {/* Letter Card that slides up */}
              <div className="letter-card">
                <Heart className="w-8 h-8 text-pink-500 mb-2 animate-bounce" fill="currentColor" />
                <h3 className="text-xl font-bold text-slate-800 mb-1">{BLESSING_TITLE}</h3>
                <p className="text-xs text-slate-500 text-center px-4 line-clamp-3 mb-3">
                  有一封写给你的专属生日信件，点击下方按钮开启这份特别的心意...
                </p>
                <button
                  onClick={handleEnterLetter}
                  className="bg-pink-500 hover:bg-pink-600 active:scale-95 text-white font-bold text-xs py-2 px-5 rounded-full shadow-md transition-all flex items-center gap-1"
                >
                  <span>展开信件</span>
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>

              {/* Front pocket */}
              <div className="envelope-pocket" />
            </div>

            <p className="envelope-tip">
              {!envelopeClass.includes('open') ? '💌 点击信封解封心意' : '💖 点击信中的按钮阅读情书'}
            </p>
          </div>
        )}

        {/* ==========================================
            B. MAIN CONTENT CONTAINER
            ========================================== */}
        {isOpened && (
          <div className="flex-1 flex flex-col justify-between relative z-3 overflow-hidden">
            
            {/* Scrollable Screen Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 flex flex-col justify-start items-center">
              
              {/* STEP 2: SHOW THE LOVE LETTER CARD */}
              {currentStep === 'letter' && (
                <div className="w-full max-w-sm glass-card my-auto animate-shine animate-fade-in">
                  <div className="flex justify-center">
                    <Heart className="w-12 h-12 cake-icon-glow" fill="currentColor" />
                  </div>
                  
                  <h1 className="blessing-title mt-2 text-center">Happy Birthday</h1>
                  <div className="blessing-subtitle text-center">{TARGET_NAME}</div>
                  
                  <div className="blessing-text-wrapper">
                    <p className="blessing-text">
                      {BLESSING_CONTENT}
                    </p>
                  </div>

                  <div className="blessing-signature mt-4">
                    —— 爱你的小王 ✨
                  </div>

                  {/* Glowing action button to enter Cake step */}
                  <button
                    onClick={() => {
                      setCurrentStep('cake');
                      confetti({ particleCount: 30, spread: 40 });
                    }}
                    className="w-full mt-6 py-3.5 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:to-indigo-600 text-white font-bold rounded-full shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                  >
                    <span>一起吹蜡烛许愿 🎂</span>
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* STEP 3: SHOW THE INTERACTIVE BIRTHDAY CAKE */}
              {currentStep === 'cake' && (
                <div className="w-full flex-1 flex flex-col justify-center items-center animate-fade-in relative">
                  
                  {/* Floating Wish Lanterns in background */}
                  <div className="wish-lantern-sky">
                    {lanterns.map((l) => (
                      <div 
                        key={l.id} 
                        className="lantern animate-lantern"
                        style={{
                          left: '50%',
                          '--drift': `${l.drift}px`
                        } as React.CSSProperties}
                      />
                    ))}
                  </div>

                  <h2 className="font-cursive text-3xl text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 font-bold mb-8 text-center drop-shadow-sm">
                    吹灭蜡烛许个愿
                  </h2>

                  {/* HTML/CSS Birthday Cake */}
                  <div className="cake-container scale-95 origin-bottom">
                    
                    {/* Cake candles */}
                    <div className="candles-group">
                      {/* Candle 1 */}
                      <div className="candle">
                        <div className="candle-wick" />
                        <div className={`candle-flame animate-flicker ${!areCandlesLit ? 'blown-out' : ''}`} />
                        <div className={`candle-smoke ${!areCandlesLit ? 'rise' : ''}`} />
                      </div>
                      
                      {/* Candle 2 */}
                      <div className="candle">
                        <div className="candle-wick" />
                        <div className={`candle-flame animate-flicker ${!areCandlesLit ? 'blown-out' : ''}`} style={{ animationDelay: '0.2s' }} />
                        <div className={`candle-smoke ${!areCandlesLit ? 'rise' : ''}`} style={{ animationDelay: '0.1s' }} />
                      </div>

                      {/* Candle 3 */}
                      <div className="candle">
                        <div className="candle-wick" />
                        <div className={`candle-flame animate-flicker ${!areCandlesLit ? 'blown-out' : ''}`} style={{ animationDelay: '0.4s' }} />
                        <div className={`candle-smoke ${!areCandlesLit ? 'rise' : ''}`} style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>

                    {/* Top Cake Layer */}
                    <div className="cake-layer cake-layer-top">
                      <div className="cream-drip">
                        <div className="drip-drop" />
                        <div className="drip-drop" />
                        <div className="drip-drop" />
                        <div className="drip-drop" />
                        <div className="drip-drop" />
                        <div className="drip-drop" />
                      </div>
                      <div className="cake-decorations">
                        <div className="cherry" />
                        <div className="cherry" />
                        <div className="cherry" />
                        <div className="cherry" />
                      </div>
                    </div>

                    {/* Bottom Cake Layer */}
                    <div className="cake-layer cake-layer-bottom">
                      <div className="cream-drip">
                        <div className="drip-drop" />
                        <div className="drip-drop" />
                        <div className="drip-drop" />
                        <div className="drip-drop" />
                        <div className="drip-drop" />
                        <div className="drip-drop" />
                        <div className="drip-drop" />
                        <div className="drip-drop" />
                      </div>
                    </div>

                    {/* Cake Plate */}
                    <div className="cake-plate" />
                  </div>

                  {/* Interaction Control */}
                  {areCandlesLit ? (
                    <button 
                      onClick={handleBlowCandles}
                      className="blow-button"
                    >
                      <Sparkles className="w-5 h-5" />
                      <span>呼气/点击吹灭蜡烛 🕯️</span>
                    </button>
                  ) : (
                    <div className="w-full flex flex-col items-center">
                      
                      {/* Wish Input Panel */}
                      {showWishPanel && !wishSubmitted && (
                        <form onSubmit={handleSubmitWish} className="wish-input-panel w-full max-w-sm px-4">
                          <div className="text-pink-600 font-semibold mb-3 text-center text-sm tracking-wide">
                            ✨ 蜡烛吹灭啦！写下你的心愿吧 ✨
                          </div>
                          <textarea
                            value={typedWish}
                            onChange={(e) => setTypedWish(e.target.value)}
                            placeholder="在这里写下你的愿望，它会随孔明灯飞向夜空..."
                            maxLength={100}
                            className="wish-textarea"
                            required
                          />
                          <button
                            type="submit"
                            className="w-full py-3 bg-gradient-to-r from-amber-500 to-pink-500 rounded-full font-bold text-white text-sm shadow-lg active:scale-95 transition-transform"
                          >
                            发射心愿天灯 🏮
                          </button>
                        </form>
                      )}

                      {/* Wish Submitted Success View */}
                      {wishSubmitted && (
                        <div className="text-center p-4 bg-white/85 border border-pink-100 rounded-2xl w-full max-w-sm shadow-lg shadow-pink-100/50 animate-shine">
                          <Heart className="w-8 h-8 text-pink-500 mx-auto mb-2 animate-pulse" fill="currentColor" />
                          <div className="text-pink-600 font-bold mb-1 text-base">愿望天灯已发射！</div>
                          <p className="text-xs text-purple-950 leading-relaxed px-2">
                            “萍，你的愿望已经飞入浩瀚星空。愿新的一岁，你所有的梦想都成真，岁岁常欢愉，万事皆顺意 ❤️”
                          </p>
                          <button
                            onClick={handleReWish}
                            className="mt-4 text-xs text-pink-600 font-semibold underline underline-offset-4 flex items-center justify-center gap-1 mx-auto"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>重新许个愿</span>
                          </button>
                        </div>
                      )}

                      {/* Back to Love Letter button */}
                      <button
                        onClick={() => {
                          setCurrentStep('letter');
                          setAreCandlesLit(true);
                          setWishSubmitted(false);
                          setTypedWish('');
                        }}
                        className="reset-btn max-w-xs flex items-center justify-center gap-1 mt-6"
                      >
                        <span>返回重读信件 💌</span>
                      </button>
                    </div>
                  )}

                </div>
              )}

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
