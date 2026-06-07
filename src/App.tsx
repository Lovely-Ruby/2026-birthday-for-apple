import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  Cake as CakeIcon, 
  Image as ImageIcon, 
  MessageCircle, 
  Settings, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Copy, 
  RotateCcw, 
  Upload, 
  X, 
  Gift,
  Volume2,
  VolumeX
} from 'lucide-react';
import confetti from 'canvas-confetti';

// ==========================================
// 1. MUSIC & SOUND SYNTHESIS (Web Audio API)
// ==========================================

class MusicBox {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private timeoutId: any = null;

  // Happy Birthday melody in C/G Major
  private melody = [
    { note: "G4", dur: 0.5 }, { note: "G4", dur: 0.5 }, { note: "A4", dur: 1.0 }, { note: "G4", dur: 1.0 }, { note: "C5", dur: 1.0 }, { note: "B4", dur: 2.0 },
    { note: "G4", dur: 0.5 }, { note: "G4", dur: 0.5 }, { note: "A4", dur: 1.0 }, { note: "G4", dur: 1.0 }, { note: "D5", dur: 1.0 }, { note: "C5", dur: 2.0 },
    { note: "G4", dur: 0.5 }, { note: "G4", dur: 0.5 }, { note: "G5", dur: 1.0 }, { note: "E5", dur: 1.0 }, { note: "C5", dur: 1.0 }, { note: "B4", dur: 1.0 }, { note: "A4", dur: 2.0 },
    { note: "F5", dur: 0.5 }, { note: "F5", dur: 0.5 }, { note: "E5", dur: 1.0 }, { note: "C5", dur: 1.0 }, { note: "D5", dur: 1.0 }, { note: "C5", dur: 2.0 }
  ];

  private noteFreqs: { [key: string]: number } = {
    "G4": 392.00, "A4": 440.00, "B4": 493.88, "C5": 523.25, "D5": 587.33, "E5": 659.25, "F5": 698.46, "G5": 783.99
  };

  private playNote(frequency: number, startTime: number, duration: number) {
    if (!this.ctx) return;
    
    // Create oscillator and gain node for a music box sound (chime-like)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, startTime);
    
    // Music box envelope: fast attack, slow decay/release
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02); // attack
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // decay
    
    // Subtle lowpass filter to make the synth sound more cozy/magical
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1500, startTime);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  public start() {
    if (this.isPlaying) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.isPlaying = true;
      
      let time = this.ctx.currentTime + 0.1;
      let cursor = 0;
      
      const scheduleMelody = () => {
        if (!this.isPlaying || !this.ctx) return;
        
        // Schedule next batch of notes
        while (cursor < this.melody.length && time < this.ctx.currentTime + 1.5) {
          const item = this.melody[cursor];
          const freq = this.noteFreqs[item.note];
          const dur = item.dur * 0.7; // tempo speed multiplier
          
          this.playNote(freq, time, dur);
          time += item.dur * 0.75; // note interval spacing
          cursor++;
        }
        
        if (cursor >= this.melody.length) {
          cursor = 0;
          time += 1.2; // brief pause before looping melody again
        }
        
        this.timeoutId = setTimeout(scheduleMelody, 300);
      };
      
      scheduleMelody();
    } catch (e) {
      console.error("Music box initialization failed:", e);
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.timeoutId) clearTimeout(this.timeoutId);
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

// Synthesize a puff of wind noise for candle blowing
const playBlowSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
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
    setTimeout(() => ctx.close(), 600);
  } catch (e) {
    console.error("Blow sound synthesis failed:", e);
  }
};


// ==========================================
// 2. CONFIGURATION TYPES & CONSTANTS
// ==========================================

interface BirthdayConfig {
  name: string;
  title: string;
  blessings: string;
  photoCaptions: string[];
}

const DEFAULT_CONFIG: BirthdayConfig = {
  name: "小可爱",
  title: "祝你生日快乐！",
  blessings: "祝你生日快乐呀！✨\n\n愿你每一天都充满阳光和欢笑，\n眼里有星辰，身边有温暖。\n在未来的日子里，\n愿你所有的梦想都如约而至，\n所有的努力都有美好的回报。\n\n你要一直开心，永远做最快乐的自己！🎂🎈",
  photoCaptions: [
    "那年今日，繁星为你闪烁 ✨",
    "愿你生活如繁花般灿烂 🌸",
    "开启新一岁的奇妙旅程 🚀"
  ]
};

// Initial sticky notes data
interface StickyNoteItem {
  id: string;
  text: string;
  author: string;
  styleIndex: number;
}

const DEFAULT_NOTES: StickyNoteItem[] = [
  { id: '1', text: "祝你每天都有吃不完的甜品，喝不完的奶茶！重点是不长胖！🎂", author: "闺蜜", styleIndex: 1 },
  { id: '2', text: "新的一岁，愿你被温柔包围，万事皆甜！🎈", author: "死党", styleIndex: 2 },
  { id: '3', text: "愿你的眼里永远闪烁着光芒，做自己最爱的英雄。💫", author: "朋友", styleIndex: 3 },
  { id: '4', text: "祝我的宝贝生日快乐，愿你天天开心，心想事成！❤️", author: "妈妈", styleIndex: 4 },
  { id: '5', text: "岁岁常欢愉，年年皆胜意。祝最可爱的你生日快乐！✨", author: "老铁", styleIndex: 5 },
  { id: '6', text: "愿你平安喜乐，所得皆所愿，所行皆坦途。🍀", author: "知己", styleIndex: 6 }
];


// ==========================================
// 3. ILLUSTRATION COMPONENTS (SVG)
// ==========================================

const IllustrationNightSky = () => (
  <div className="w-full h-full bg-gradient-to-b from-[#0e0a29] to-[#251b4b] relative overflow-hidden flex items-center justify-center">
    {/* Twinkling Stars */}
    <div className="absolute w-1 h-1 bg-white rounded-full top-6 left-12 animate-ping" />
    <div className="absolute w-1.5 h-1.5 bg-yellow-100 rounded-full top-16 right-16 animate-ping" style={{ animationDelay: '0.5s' }} />
    <div className="absolute w-1 h-1 bg-white rounded-full bottom-20 left-24 animate-pulse" />
    <div className="absolute w-1 h-1 bg-yellow-200 rounded-full top-32 left-8 animate-pulse" />
    
    {/* Moon */}
    <div className="absolute top-8 right-8 w-10 h-10 bg-yellow-200 rounded-full shadow-[0_0_20px_rgba(253,224,71,0.5)] flex items-center justify-center">
      <div className="w-8 h-8 bg-[#0e0a29] rounded-full translate-x-2 -translate-y-1" />
    </div>

    {/* Glowing Birthday Cake Graphic inside Illustration */}
    <div className="flex flex-col items-center mt-8 z-10">
      <div className="w-20 h-12 bg-pink-400 rounded-t-lg border-b-4 border-pink-500 relative flex justify-around items-end pb-1">
        {/* Candle inside Illustration */}
        <div className="w-2 h-6 bg-cyan-300 rounded-sm absolute -top-5 left-[38px] flex justify-center">
          <div className="w-3 h-3 bg-amber-400 rounded-full -top-3 absolute animate-pulse" />
        </div>
        <div className="w-3 h-3 bg-red-400 rounded-full" />
        <div className="w-3 h-3 bg-yellow-400 rounded-full" />
        <div className="w-3 h-3 bg-cyan-400 rounded-full" />
      </div>
      <div className="w-24 h-2 bg-gray-200 rounded-full" />
    </div>
  </div>
);

const IllustrationFlowers = () => (
  <div className="w-full h-full bg-gradient-to-br from-[#30163a] to-[#5a2468] relative overflow-hidden flex flex-col items-center justify-center p-4">
    {/* Twinkling particles */}
    <div className="absolute w-1 h-1 bg-pink-300 rounded-full top-10 left-10 animate-pulse" />
    <div className="absolute w-1.5 h-1.5 bg-purple-300 rounded-full bottom-12 right-12 animate-ping" style={{ animationDelay: '0.8s' }} />

    {/* Bouquet SVG */}
    <svg className="w-32 h-32 text-pink-400 drop-shadow-[0_0_8px_rgba(244,143,177,0.6)]" viewBox="0 0 100 100" fill="currentColor">
      {/* Bouquet wrapping */}
      <path d="M50 55 L35 90 L65 90 Z" fill="#ebc3f5" opacity="0.8" />
      <path d="M50 55 L42 90 L58 90 Z" fill="#d397e3" />
      {/* Ribbon */}
      <path d="M43 72 Q50 75 57 72 L50 82 Z" fill="#ff4d79" />
      <circle cx="50" cy="73" r="3" fill="#ffd700" />
      
      {/* Flowers */}
      {/* Rose Center */}
      <circle cx="50" cy="38" r="12" fill="#ff5e84" />
      <circle cx="50" cy="38" r="8" fill="#ff3b6b" />
      <circle cx="50" cy="38" r="4" fill="#d62246" />
      {/* Flower Left */}
      <circle cx="36" cy="46" r="10" fill="#a855f7" />
      <circle cx="36" cy="46" r="6" fill="#c084fc" />
      <circle cx="36" cy="46" r="3" fill="#fff" />
      {/* Flower Right */}
      <circle cx="64" cy="46" r="10" fill="#ffd700" />
      <circle cx="64" cy="46" r="6" fill="#ffb703" />
      <circle cx="64" cy="46" r="3" fill="#fff" />
      {/* Flower Top Left */}
      <circle cx="38" cy="26" r="9" fill="#f472b6" />
      <circle cx="38" cy="26" r="5" fill="#fbcfe8" />
      {/* Flower Top Right */}
      <circle cx="62" cy="26" r="9" fill="#38bdf8" />
      <circle cx="62" cy="26" r="5" fill="#bae6fd" />
    </svg>
    <span className="text-[10px] text-pink-200 mt-2 tracking-wide font-sans opacity-80">点击照片可更换</span>
  </div>
);

const IllustrationGiftBalloons = () => (
  <div className="w-full h-full bg-gradient-to-tr from-[#0b1a26] to-[#1e3d54] relative overflow-hidden flex flex-col items-center justify-end pb-8">
    {/* Floating Balloons */}
    <div className="absolute top-6 left-8 animate-bounce" style={{ animationDuration: '4s' }}>
      <div className="w-10 h-12 bg-pink-500 rounded-full relative shadow-[0_0_12px_rgba(236,72,153,0.4)]">
        <div className="w-0.5 h-12 bg-pink-300 absolute top-12 left-5 opacity-50" />
      </div>
    </div>
    <div className="absolute top-10 right-10 animate-bounce" style={{ animationDuration: '3.2s', animationDelay: '0.5s' }}>
      <div className="w-9 h-11 bg-yellow-500 rounded-full relative shadow-[0_0_12px_rgba(234,179,8,0.4)]">
        <div className="w-0.5 h-12 bg-yellow-300 absolute top-11 left-[18px] opacity-50" />
      </div>
    </div>
    <div className="absolute top-4 left-[110px] animate-bounce" style={{ animationDuration: '4.8s', animationDelay: '1.2s' }}>
      <div className="w-8 h-10 bg-cyan-500 rounded-full relative shadow-[0_0_12px_rgba(6,182,212,0.4)]">
        <div className="w-0.5 h-12 bg-cyan-300 absolute top-10 left-4 opacity-50" />
      </div>
    </div>

    {/* Gift Box */}
    <div className="relative z-10 flex flex-col items-center animate-bounce" style={{ animationDuration: '6s' }}>
      {/* Lid */}
      <div className="w-20 h-5 bg-purple-500 rounded-t border-b-2 border-purple-700 relative flex justify-center">
        <div className="w-4 h-5 bg-yellow-400 absolute -top-1" />
        {/* Bow */}
        <div className="w-3 h-3 border-2 border-yellow-400 rounded-full absolute -top-3 left-[18px]" />
        <div className="w-3 h-3 border-2 border-yellow-400 rounded-full absolute -top-3 right-[18px]" />
      </div>
      {/* Box base */}
      <div className="w-16 h-14 bg-purple-600 rounded-b relative flex justify-center shadow-[0_8px_16px_rgba(0,0,0,0.3)]">
        {/* Ribbon line */}
        <div className="w-4 h-full bg-yellow-400" />
      </div>
    </div>
  </div>
);


export default function App() {
  // ==========================================
  // 4. STATES SETUP
  // ==========================================
  
  const [config, setConfig] = useState<BirthdayConfig>(DEFAULT_CONFIG);
  const [customPhotos, setCustomPhotos] = useState<(string | null)[]>([null, null, null]);
  const [activeTab, setActiveTab] = useState<'blessing' | 'cake' | 'gallery' | 'wishes' | 'custom'>('blessing');
  
  const [isOpened, setIsOpened] = useState(false); // Has envelope been opened?
  const [envelopeClass, setEnvelopeClass] = useState(''); // Envelope open anim states
  
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [areCandlesLit, setAreCandlesLit] = useState(true);
  const [showWishPanel, setShowWishPanel] = useState(false);
  const [typedWish, setTypedWish] = useState('');
  const [lanterns, setLanterns] = useState<{ id: number; drift: number }[]>([]);
  
  // Custom wishes database
  const [stickyNotes, setStickyNotes] = useState<StickyNoteItem[]>(DEFAULT_NOTES);
  const [showAddWishModal, setShowAddWishModal] = useState(false);
  const [newWishAuthor, setNewWishAuthor] = useState('');
  const [newWishText, setNewWishText] = useState('');
  
  // Customization fields
  const [editName, setEditName] = useState(DEFAULT_CONFIG.name);
  const [editTitle, setEditTitle] = useState(DEFAULT_CONFIG.title);
  const [editBlessings, setEditBlessings] = useState(DEFAULT_CONFIG.blessings);
  const [editCaption0, setEditCaption0] = useState(DEFAULT_CONFIG.photoCaptions[0]);
  const [editCaption1, setEditCaption1] = useState(DEFAULT_CONFIG.photoCaptions[1]);
  const [editCaption2, setEditCaption2] = useState(DEFAULT_CONFIG.photoCaptions[2]);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Polaroid Gallery stack current index
  const [galleryIndex, setGalleryIndex] = useState(0);

  // Music Instance Ref
  const musicRef = useRef<MusicBox>(new MusicBox());

  // Generate 20 floating background particles with random delays and paths
  const [particles] = useState(() => 
    Array.from({ length: 20 }, (_, idx) => ({
      id: idx,
      type: idx % 3 === 0 ? 'heart' : idx % 3 === 1 ? 'star' : 'bubble',
      size: Math.random() * 16 + 10,
      left: Math.random() * 95,
      delay: Math.random() * 10,
      duration: Math.random() * 8 + 8,
      drift: Math.random() * 120 - 60
    }))
  );


  // ==========================================
  // 5. PARSE URL SEARCH/HASH PARAMETERS
  // ==========================================

  useEffect(() => {
    // Check if configuration exists in URL hash
    const handleUrlConfig = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#c=')) {
        try {
          const encodedData = hash.substring(3);
          const decodedUtf8 = atob(encodedData);
          const decodedJson = decodeURIComponent(decodedUtf8);
          const parsedConfig = JSON.parse(decodedJson) as BirthdayConfig;
          
          if (parsedConfig && parsedConfig.name && parsedConfig.blessings) {
            setConfig(parsedConfig);
            setEditName(parsedConfig.name);
            setEditTitle(parsedConfig.title);
            setEditBlessings(parsedConfig.blessings);
            setEditCaption0(parsedConfig.photoCaptions[0] || "");
            setEditCaption1(parsedConfig.photoCaptions[1] || "");
            setEditCaption2(parsedConfig.photoCaptions[2] || "");
          }
        } catch (e) {
          console.error("Failed to parse config from URL:", e);
        }
      }
    };

    handleUrlConfig();
    
    // Load local storage custom photos
    try {
      const storedPhotos = localStorage.getItem('birthday_custom_photos');
      if (storedPhotos) {
        setCustomPhotos(JSON.parse(storedPhotos));
      }
      const storedNotes = localStorage.getItem('birthday_custom_notes');
      if (storedNotes) {
        setStickyNotes(JSON.parse(storedNotes));
      }
    } catch(e) {
      console.error("Local storage read error:", e);
    }
  }, []);


  // ==========================================
  // 6. ANIMATIONS & CONTROLLERS
  // ==========================================

  const toggleMusic = () => {
    if (isMusicPlaying) {
      musicRef.current.stop();
      setIsMusicPlaying(false);
    } else {
      musicRef.current.start();
      setIsMusicPlaying(true);
    }
  };

  // Open the envelope
  const handleOpenEnvelope = () => {
    if (envelopeClass.includes('open')) return;
    
    // Step 1: Fold flap up
    setEnvelopeClass('open');
    
    // Step 2: Trigger confetti and slide card
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

      // Start music automatically
      musicRef.current.start();
      setIsMusicPlaying(true);
    }, 700);
  };

  // Transition to main dashboard screen
  const handleEnterDashboard = (e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering envelope tap
    setIsOpened(true);
  };

  // Blow candles out
  const handleBlowCandles = () => {
    playBlowSound();
    setAreCandlesLit(false);
    
    // Massive confetti rain
    const end = Date.now() + 3 * 1000; // 3 seconds confetti duration

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
    const drift = Math.random() * 120 - 60; // drift offset
    setLanterns(prev => [...prev, { id: newId, drift }]);
    
    // Add wish to sticky notes board dynamically
    const newNote: StickyNoteItem = {
      id: newId.toString(),
      text: typedWish,
      author: "寿星的愿望 🌟",
      styleIndex: Math.floor(Math.random() * 6) + 1
    };
    const updatedNotes = [newNote, ...stickyNotes];
    setStickyNotes(updatedNotes);
    localStorage.setItem('birthday_custom_notes', JSON.stringify(updatedNotes));

    setTypedWish('');
    setShowWishPanel(false);

    // Clear lantern element after animation completes
    setTimeout(() => {
      setLanterns(prev => prev.filter(l => l.id !== newId));
    }, 18000);
  };

  // Add guest note to board
  const handleAddStickyNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWishText.trim() || !newWishAuthor.trim()) return;

    const newNote: StickyNoteItem = {
      id: Date.now().toString(),
      text: newWishText,
      author: newWishAuthor,
      styleIndex: Math.floor(Math.random() * 6) + 1
    };

    const updatedNotes = [newNote, ...stickyNotes];
    setStickyNotes(updatedNotes);
    localStorage.setItem('birthday_custom_notes', JSON.stringify(updatedNotes));

    setNewWishAuthor('');
    setNewWishText('');
    setShowAddWishModal(false);

    // Confetti burst for added note
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 }
    });
  };

  // Custom photo upload handler
  const handlePhotoUpload = (index: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event: any) => {
        const base64 = event.target.result;
        const newPhotos = [...customPhotos];
        newPhotos[index] = base64;
        setCustomPhotos(newPhotos);
        localStorage.setItem('birthday_custom_photos', JSON.stringify(newPhotos));
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  // Clear a custom photo slot
  const handleClearPhoto = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const newPhotos = [...customPhotos];
    newPhotos[index] = null;
    setCustomPhotos(newPhotos);
    localStorage.setItem('birthday_custom_photos', JSON.stringify(newPhotos));
  };

  // Save text customizations and generate shareable link
  const handleGenerateShareLink = () => {
    const customizedConfig: BirthdayConfig = {
      name: editName,
      title: editTitle,
      blessings: editBlessings,
      photoCaptions: [editCaption0, editCaption1, editCaption2]
    };

    setConfig(customizedConfig);

    // Compress to Base64
    try {
      const json = JSON.stringify(customizedConfig);
      const utf8 = encodeURIComponent(json);
      const base64 = btoa(utf8);
      const shareUrl = `${window.location.origin}${window.location.pathname}#c=${base64}`;
      
      // Copy to clipboard
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopiedSuccess(true);
        setTimeout(() => setCopiedSuccess(false), 4000);
      });
    } catch(e) {
      alert("生成链接失败，配置可能过长！");
    }
  };

  // Reset to default settings
  const handleResetToDefault = () => {
    if (window.confirm("确定要恢复默认设置吗？这会清除您的所有定制和上传照片。")) {
      setConfig(DEFAULT_CONFIG);
      setCustomPhotos([null, null, null]);
      setStickyNotes(DEFAULT_NOTES);
      setEditName(DEFAULT_CONFIG.name);
      setEditTitle(DEFAULT_CONFIG.title);
      setEditBlessings(DEFAULT_CONFIG.blessings);
      setEditCaption0(DEFAULT_CONFIG.photoCaptions[0]);
      setEditCaption1(DEFAULT_CONFIG.photoCaptions[1]);
      setEditCaption2(DEFAULT_CONFIG.photoCaptions[2]);
      
      localStorage.removeItem('birthday_custom_photos');
      localStorage.removeItem('birthday_custom_notes');
      
      // Reset URL hash
      window.location.hash = '';
    }
  };


  // ==========================================
  // 7. COMPONENT SUB-VIEWS
  // ==========================================

  // POLAROID DECK VIEW
  const renderPolaroidDeck = () => {
    const cards = [
      {
        illustration: <IllustrationNightSky />,
        caption: config.photoCaptions[0] || DEFAULT_CONFIG.photoCaptions[0],
        customImg: customPhotos[0]
      },
      {
        illustration: <IllustrationFlowers />,
        caption: config.photoCaptions[1] || DEFAULT_CONFIG.photoCaptions[1],
        customImg: customPhotos[1]
      },
      {
        illustration: <IllustrationGiftBalloons />,
        caption: config.photoCaptions[2] || DEFAULT_CONFIG.photoCaptions[2],
        customImg: customPhotos[2]
      }
    ];

    return (
      <div className="polaroid-deck">
        {cards.map((card, idx) => {
          // Calculate stack rendering styles relative to galleryIndex
          const offset = (idx - galleryIndex + cards.length) % cards.length;
          const isTop = offset === 0;

          // Animations and offsets based on stack order
          let transform = '';
          let zIndex = 0;
          let opacity = 0;

          if (offset === 0) {
            transform = 'scale(1) translateY(0) rotate(0deg)';
            zIndex = 10;
            opacity = 1;
          } else if (offset === 1) {
            transform = 'scale(0.94) translateY(-22px) rotate(4deg)';
            zIndex = 5;
            opacity = 0.8;
          } else {
            transform = 'scale(0.88) translateY(-44px) rotate(-4deg)';
            zIndex = 1;
            opacity = 0.5;
          }

          return (
            <div
              key={idx}
              className="polaroid-card absolute border border-gray-200"
              style={{
                transform,
                zIndex,
                opacity,
                pointerEvents: isTop ? 'auto' : 'none'
              }}
              onClick={() => handlePhotoUpload(idx)}
            >
              <div className="polaroid-photo-frame w-full h-[210px] bg-slate-900 overflow-hidden relative group">
                {card.customImg ? (
                  <img src={card.customImg} alt={card.caption} className="polaroid-img" />
                ) : (
                  card.illustration
                )}
                {/* Upload Hover overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <div className="bg-white/90 text-purple-900 rounded-full p-2 shadow-lg flex items-center gap-1 text-xs font-semibold px-3">
                    <Upload className="w-4 h-4" />
                    <span>上传照片</span>
                  </div>
                </div>
              </div>
              <div className="polaroid-caption">{card.caption}</div>
            </div>
          );
        })}
      </div>
    );
  };


  // ==========================================
  // 8. RENDER SCREEN
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
            A. ENVELOPE INTRO SCREEN
            ========================================== */}
        {!isOpened && (
          <div className="envelope-screen bg-[#0b081a] relative">
            <h2 className="font-cursive text-4xl text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-yellow-200 to-cyan-300 font-bold mb-8 tracking-wider">
              {config.name} 亲启
            </h2>

            {/* Simulated Envelope Graphics */}
            <div 
              className={`envelope-wrapper ${envelopeClass}`}
              onClick={handleOpenEnvelope}
            >
              {/* Seal Sticker */}
              <div className="heart-seal animate-heartbeat">
                <Heart className="w-5 h-5 fill-current" />
              </div>

              {/* Envelope flap */}
              <div className="envelope-flap" />

              {/* Letter Card that slides up */}
              <div className="letter-card">
                <Gift className="w-8 h-8 text-pink-500 mb-2 animate-bounce" />
                <h3 className="text-xl font-bold text-slate-800 mb-1">{config.title}</h3>
                <p className="text-xs text-slate-500 text-center px-4 line-clamp-3 mb-3">
                  点击查看来自好友的专属生日祝福与惊喜好礼...
                </p>
                <button
                  onClick={handleEnterDashboard}
                  className="bg-pink-500 hover:bg-pink-600 active:scale-95 text-white font-bold text-xs py-2 px-5 rounded-full shadow-md transition-all flex items-center gap-1"
                >
                  <span>开启祝福卡</span>
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>

              {/* Front pocket */}
              <div className="envelope-pocket" />
            </div>

            <p className="envelope-tip">
              {!envelopeClass.includes('open') ? '💌 点击信封解封惊喜' : '💖 点击信中的按钮开启大屏'}
            </p>
          </div>
        )}

        {/* ==========================================
            B. MAIN DASHBOARD CONTENT
            ========================================== */}
        {isOpened && (
          <div className="dashboard-screen">
            
            {/* Scrollable Container with safe spacing for nav menu */}
            <div className="screen-content no-scrollbar">
              
              {/* Tab 1: Blessing Card Text */}
              {activeTab === 'blessing' && (
                <div className="blessing-tab">
                  <div className="glass-card animate-shine">
                    <div className="flex justify-center">
                      <Gift className="w-12 h-12 cake-icon-glow" />
                    </div>
                    
                    <h1 className="blessing-title mt-2">Happy Birthday</h1>
                    <div className="blessing-subtitle">{config.name}</div>
                    
                    <div className="blessing-text-wrapper">
                      <p className="blessing-text">
                        {config.blessings}
                      </p>
                    </div>

                    <div className="blessing-signature">
                      —— 送给你最真挚的祝福 ✨
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Interactive Cake & Wish */}
              {activeTab === 'cake' && (
                <div className="cake-tab relative">
                  
                  {/* Floating Lanterns Night Sky */}
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

                  <h2 className="font-cursive text-3xl text-yellow-300 font-bold mb-8 text-center drop-shadow-md">
                    吹灭蜡烛许个愿
                  </h2>

                  {/* 3D-ish Birthday Cake Wrapper */}
                  <div className="cake-container scale-95 origin-bottom">
                    
                    {/* Cake candles */}
                    <div className="candles-group">
                      {/* Candle 1 */}
                      <div className="candle">
                        <div className="candle-wick" />
                        <div className={`candle-flame animate-flicker ${!areCandlesLit ? 'blown-out' : ''}`} />
                        <div className={`candle-smoke ${!areCandlesLit ? 'rise' : ''}`} />
                      </div>
                      
                      {/* Candle 2 (Middle, taller) */}
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

                    {/* Top Layer */}
                    <div className="cake-layer cake-layer-top">
                      {/* Whipped cream drips */}
                      <div className="cream-drip">
                        <div className="drip-drop" />
                        <div className="drip-drop" />
                        <div className="drip-drop" />
                        <div className="drip-drop" />
                        <div className="drip-drop" />
                        <div className="drip-drop" />
                      </div>
                      {/* Cherries decor */}
                      <div className="cake-decorations">
                        <div className="cherry" />
                        <div className="cherry" />
                        <div className="cherry" />
                        <div className="cherry" />
                      </div>
                    </div>

                    {/* Bottom Layer */}
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
                      <div className="text-yellow-400 font-semibold mb-4 text-center text-sm tracking-wide">
                        ✨ 蜡烛已吹灭，赶紧写下你的心愿吧 ✨
                      </div>
                      
                      {showWishPanel && (
                        <form onSubmit={handleSubmitWish} className="wish-input-panel w-full max-w-sm px-4">
                          <textarea
                            value={typedWish}
                            onChange={(e) => setTypedWish(e.target.value)}
                            placeholder="在这里写下你的愿望，它会随孔明灯飞向星空..."
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
                      
                      {!showWishPanel && (
                        <button
                          onClick={() => setAreCandlesLit(true)}
                          className="reset-btn max-w-xs flex items-center justify-center gap-1"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>重燃蜡烛再许愿</span>
                        </button>
                      )}
                    </div>
                  )}

                </div>
              )}

              {/* Tab 3: Polaroid Photo Album */}
              {activeTab === 'gallery' && (
                <div className="album-tab">
                  <h2 className="album-title">回忆与相册</h2>
                  
                  {renderPolaroidDeck()}

                  {/* Album Navigation slider */}
                  <div className="album-nav-buttons">
                    <button 
                      onClick={() => setGalleryIndex(prev => (prev - 1 + 3) % 3)}
                      className="album-btn"
                      aria-label="Previous Photo"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <span className="text-sm font-semibold tracking-widest text-pink-300">
                      {galleryIndex + 1} / 3
                    </span>
                    <button 
                      onClick={() => setGalleryIndex(prev => (prev + 1) % 3)}
                      className="album-btn"
                      aria-label="Next Photo"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <p className="text-xs text-purple-300/60 mt-6 text-center max-w-xs">
                    💡 点击照片框，即可为您心爱的寿星上传本地照片定制这份回忆！
                  </p>
                </div>
              )}

              {/* Tab 4: Sticky Note wishes wall */}
              {activeTab === 'wishes' && (
                <div className="wishes-tab">
                  
                  <div className="wall-header">
                    <div className="wall-title">
                      <MessageCircle className="w-5 h-5 text-pink-400" />
                      <span>祝福留言板</span>
                    </div>
                    <button 
                      onClick={() => setShowAddWishModal(true)}
                      className="add-wish-btn"
                    >
                      <Plus className="w-4 h-4" />
                      <span>送祝福</span>
                    </button>
                  </div>

                  {/* Sticky Notes Grid */}
                  <div className="wishes-grid">
                    {stickyNotes.map((note) => (
                      <div 
                        key={note.id}
                        className={`sticky-note sticky-note-${note.styleIndex}`}
                      >
                        <div className="sticky-pin" />
                        <p className="sticky-text">{note.text}</p>
                        <span className="sticky-author">—— {note.author}</span>
                      </div>
                    ))}
                  </div>

                  {/* Add Wish Form Overlay Modal */}
                  {showAddWishModal && (
                    <div className="add-wish-modal-overlay">
                      <form 
                        onSubmit={handleAddStickyNote} 
                        className="add-wish-modal"
                      >
                        <h3 className="modal-title">写下生日寄语</h3>
                        
                        <input
                          type="text"
                          value={newWishAuthor}
                          onChange={(e) => setNewWishAuthor(e.target.value)}
                          placeholder="您的署名/身份 (如: 闺蜜、小明)"
                          maxLength={10}
                          className="modal-input"
                          required
                        />

                        <textarea
                          value={newWishText}
                          onChange={(e) => setNewWishText(e.target.value)}
                          placeholder="写下最诚挚的祝福寄语吧..."
                          maxLength={60}
                          className="modal-input h-20 resize-none"
                          required
                        />

                        <div className="modal-actions">
                          <button
                            type="button"
                            onClick={() => setShowAddWishModal(false)}
                            className="modal-btn modal-btn-cancel"
                          >
                            取消
                          </button>
                          <button
                            type="submit"
                            className="modal-btn modal-btn-submit font-bold"
                          >
                            贴在墙上 📌
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                </div>
              )}

              {/* Tab 5: Share Page customizer */}
              {activeTab === 'custom' && (
                <div className="customizer-tab">
                  <h2 className="customizer-title font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
                    定制专属祝福网页
                  </h2>
                  <p className="customizer-desc">
                    在此修改寿星名字、贺卡正文和拍立得配文，生成一个专属的链接分享给 TA 吧！
                  </p>

                  <div className="form-group">
                    <label className="form-label">🎈 寿星姓名 (最多6字)</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={6}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">✍️ 祝福标题 (最多12字)</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      maxLength={12}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">💌 祝福正文 (显示于首页贺卡)</label>
                    <textarea
                      value={editBlessings}
                      onChange={(e) => setEditBlessings(e.target.value)}
                      maxLength={300}
                      className="form-textarea"
                    />
                  </div>

                  {/* Photo descriptions customizer */}
                  <div className="form-group">
                    <label className="form-label">📸 拍立得照片描述 (3张)</label>
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        value={editCaption0}
                        onChange={(e) => setEditCaption0(e.target.value)}
                        placeholder="第一张照片描述"
                        maxLength={16}
                        className="form-input py-2 text-xs"
                      />
                      <input
                        type="text"
                        value={editCaption1}
                        onChange={(e) => setEditCaption1(e.target.value)}
                        placeholder="第二张照片描述"
                        maxLength={16}
                        className="form-input py-2 text-xs"
                      />
                      <input
                        type="text"
                        value={editCaption2}
                        onChange={(e) => setEditCaption2(e.target.value)}
                        placeholder="第三张照片描述"
                        maxLength={16}
                        className="form-input py-2 text-xs"
                      />
                    </div>
                  </div>

                  {/* Photo Customizer Grid slots */}
                  <div className="form-group">
                    <label className="form-label">🖼️ 更换拍立得相册 (本地预览)</label>
                    <div className="photo-custom-grid">
                      {[0, 1, 2].map((idx) => (
                        <button
                          key={idx}
                          onClick={() => handlePhotoUpload(idx)}
                          className="photo-slot-btn"
                        >
                          {customPhotos[idx] ? (
                            <div className="w-full h-full relative">
                              <img src={customPhotos[idx]!} className="photo-slot-preview" alt="Preview" />
                              <div 
                                onClick={(e) => handleClearPhoto(e, idx)}
                                className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 rounded-full p-0.5 text-white"
                              >
                                <X className="w-4 h-4" />
                              </div>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              <span className="photo-slot-text">图 {idx+1}</span>
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-400/60 leading-normal">
                      ⚠️ 提示：上传的本地照片由于大小限制，无法打包存入分享链接中。分享链接将加载上面定制的文字和拍立得精美插图模板。
                    </p>
                  </div>

                  <button
                    onClick={handleGenerateShareLink}
                    className="generate-link-btn"
                  >
                    <Copy className="w-5 h-5" />
                    <span>生成专属祝福分享链接</span>
                  </button>

                  {copiedSuccess && (
                    <div className="success-alert">
                      🎉 专属祝福链接已复制到剪贴板！快去微信/QQ发给 TA 吧！
                    </div>
                  )}

                  <button
                    onClick={handleResetToDefault}
                    className="reset-btn"
                  >
                    <RotateCcw className="w-4 h-4 inline mr-1" />
                    恢复系统默认设置
                  </button>

                </div>
              )}

            </div>

            {/* Bottom App Navigation Menu */}
            <nav className="bottom-nav">
              <button 
                onClick={() => setActiveTab('blessing')} 
                className={`nav-item ${activeTab === 'blessing' ? 'active' : ''}`}
              >
                <div className="nav-icon-wrapper">
                  <Heart className="w-6 h-6" fill={activeTab === 'blessing' ? 'currentColor' : 'none'} />
                </div>
                <span>祝福</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('cake')} 
                className={`nav-item ${activeTab === 'cake' ? 'active' : ''}`}
              >
                <div className="nav-icon-wrapper">
                  <CakeIcon className="w-6 h-6" />
                </div>
                <span>吹蜡烛</span>
              </button>

              <button 
                onClick={() => setActiveTab('gallery')} 
                className={`nav-item ${activeTab === 'gallery' ? 'active' : ''}`}
              >
                <div className="nav-icon-wrapper">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <span>相册</span>
              </button>

              <button 
                onClick={() => setActiveTab('wishes')} 
                className={`nav-item ${activeTab === 'wishes' ? 'active' : ''}`}
              >
                <div className="nav-icon-wrapper">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <span>留言板</span>
              </button>

              <button 
                onClick={() => setActiveTab('custom')} 
                className={`nav-item ${activeTab === 'custom' ? 'active' : ''}`}
              >
                <div className="nav-icon-wrapper">
                  <Settings className="w-6 h-6" />
                </div>
                <span>定制</span>
              </button>
            </nav>

          </div>
        )}

      </div>
    </div>
  );
}
