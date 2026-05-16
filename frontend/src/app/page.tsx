"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloud, FileText, ArrowRight, Languages, Sparkles, X, ChevronDown, Check, Copy, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// 1. The Theme Dictionary (Explicitly defining classes for Tailwind v4)
const THEME_MAP: Record<string, { glow: string; text: string; bg: string; cursor: string; border: string }> = {
  blue: { glow: "bg-blue-500", text: "text-blue-600", bg: "bg-blue-50", cursor: "bg-blue-500", border: "border-blue-100" },
  emerald: { glow: "bg-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50", cursor: "bg-emerald-500", border: "border-emerald-100" },
  cyan: { glow: "bg-cyan-500", text: "text-cyan-600", bg: "bg-cyan-50", cursor: "bg-cyan-500", border: "border-cyan-100" },
  amber: { glow: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-50", cursor: "bg-amber-500", border: "border-amber-100" },
  orange: { glow: "bg-orange-500", text: "text-orange-600", bg: "bg-orange-50", cursor: "bg-orange-500", border: "border-orange-100" },
  purple: { glow: "bg-purple-500", text: "text-purple-600", bg: "bg-purple-50", cursor: "bg-purple-500", border: "border-purple-100" },
  sky: { glow: "bg-sky-500", text: "text-sky-600", bg: "bg-sky-50", cursor: "bg-sky-500", border: "border-sky-100" },
  teal: { glow: "bg-teal-500", text: "text-teal-600", bg: "bg-teal-50", cursor: "bg-teal-500", border: "border-teal-100" },
  pink: { glow: "bg-pink-500", text: "text-pink-600", bg: "bg-pink-50", cursor: "bg-pink-500", border: "border-pink-100" },
  indigo: { glow: "bg-indigo-500", text: "text-indigo-600", bg: "bg-indigo-50", cursor: "bg-indigo-500", border: "border-indigo-100" },
  violet: { glow: "bg-violet-500", text: "text-violet-600", bg: "bg-violet-50", cursor: "bg-violet-500", border: "border-violet-100" },
  rose: { glow: "bg-rose-500", text: "text-rose-600", bg: "bg-rose-50", cursor: "bg-rose-500", border: "border-rose-100" },
  fuchsia: { glow: "bg-fuchsia-500", text: "text-fuchsia-600", bg: "bg-fuchsia-50", cursor: "bg-fuchsia-500", border: "border-fuchsia-100" },
  lime: { glow: "bg-lime-500", text: "text-lime-600", bg: "bg-lime-50", cursor: "bg-lime-500", border: "border-lime-100" },
};

// 2. The Complete 22 Scheduled Indic Languages Roster
const LANGUAGES = [
  { code: "asm_Beng", label: "Assamese", native: "অসমীয়া", color: "blue" },
  { code: "ben_Beng", label: "Bengali", native: "বাংলা", color: "emerald" },
  { code: "brx_Deva", label: "Bodo", native: "बड़ो", color: "cyan" },
  { code: "doi_Deva", label: "Dogri", native: "डोगरी", color: "amber" },
  { code: "guj_Gujr", label: "Gujarati", native: "ગુજરાતી", color: "orange" },
  { code: "hin_Deva", label: "Hindi", native: "हिन्दी", color: "emerald" },
  { code: "kan_Knda", label: "Kannada", native: "ಕನ್ನಡ", color: "purple" },
  { code: "kas_Arab", label: "Kashmiri", native: "کٲشُر", color: "sky" },
  { code: "gom_Deva", label: "Konkani", native: "कोंकणी", color: "teal" },
  { code: "mai_Deva", label: "Maithili", native: "मैथिली", color: "pink" },
  { code: "mal_Mlym", label: "Malayalam", native: "മലയാളം", color: "indigo" },
  { code: "mni_Beng", label: "Manipuri", native: "মৈতৈলোন্", color: "violet" },
  { code: "mar_Deva", label: "Marathi", native: "मराठी", color: "rose" },
  { code: "nep_Deva", label: "Nepali", native: "नेपाली", color: "blue" },
  { code: "ory_Orya", label: "Odia", native: "ଓଡ଼ିଆ", color: "orange" },
  { code: "pan_Guru", label: "Punjabi", native: "ਪੰਜਾਬੀ", color: "fuchsia" },
  { code: "san_Deva", label: "Sanskrit", native: "संस्कृतम्", color: "amber" },
  { code: "sat_Olck", label: "Santali", native: "ᱥᱟᱱᱛᱟᱲᱤ", color: "lime" },
  { code: "snd_Arab", label: "Sindhi", native: "سنڌي", color: "cyan" },
  { code: "tam_Taml", label: "Tamil", native: "தமிழ்", color: "rose" },
  { code: "tel_Telu", label: "Telugu", native: "తెలుగు", color: "amber" },
  { code: "urd_Arab", label: "Urdu", native: "اردو", color: "teal" },
];

// 2. Fully Localized Onboarding Steps for all 22 Languages
const ONBOARDING_STEPS: Record<string, string[]> = {
  eng: ["1. Select Target Language", "2. Upload PDF Document", "3. Export Translation"],
  asm_Beng: ["১. লক্ষ্য ভাষা নিৰ্বাচন কৰক", "২. PDF আপল'ড কৰক", "৩. অনুবাদ ডাউনল'ড কৰক"],
  ben_Beng: ["১. লক্ষ্য ভাষা নির্বাচন করুন", "২. PDF আপলোড করুন", "৩. অনুবাদ এক্সপোর্ট করুন"],
  brx_Deva: ["1. थांखि राव सायख'", "2. PDF आपलड खालाम", "3. सोलायनाय डाउनलोड खालाम"],
  doi_Deva: ["1. लक्ष्य भाषा चुनो", "2. PDF अपलोड करो", "3. अनुवाद डाउनलोड करो"],
  guj_Gujr: ["૧. લક્ષ્ય ભાષા પસંદ કરો", "૨. PDF દસ્તાવેજ અપલોડ કરો", "૩. અનુવાદ ડાઉનલોડ કરો"],
  hin_Deva: ["1. लक्ष्य भाषा चुनें", "2. PDF दस्तावेज़ अपलोड करें", "3. अनुवाद डाउनलोड करें"],
  kan_Knda: ["1. ಗುರಿ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ", "2. PDF ಅಪ್‌ಲೋಡ್ ಮಾಡಿ", "3. ಅನುವಾದವನ್ನು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ"],
  kas_Arab: ["1. ہدف زبٲنۍ ژٲرِو", "2. پی ڈی ایف اَپلوڈ کٔرِو", "3. تَرجَمہٕ ڈاؤُنلوڈ کٔرِو"],
  gom_Deva: ["1. लक्ष्य भाषा वेंचून काडात", "2. PDF अपलोड करात", "3. अणकार डाउनलोड करात"],
  mai_Deva: ["1. लक्ष्य भाषा चुनू", "2. PDF अपलोड करू", "3. अनुवाद डाउनलोड करू"],
  mal_Mlym: ["1. ലക്ഷ്യ ഭാഷ തിരഞ്ഞെടുക്കുക", "2. PDF അപ്‌ലോഡ് ചെയ്യുക", "3. വിവർത്തനം ഡൗൺലോഡ് ചെയ്യുക"],
  mni_Beng: ["১. পান্দম লোন খন্বীযু", "২. PDF থাগৎপীযু", "৩. হন্দোকপা ডাউনলোড তৌবীযু"],
  mar_Deva: ["1. लक्ष्य भाषा निवडा", "2. PDF दस्तऐवज अपलोड करा", "3. अनुवाद डाउनलोड करा"],
  nep_Deva: ["1. लक्ष्य भाषा छान्नुहोस्", "2. PDF कागजात अपलोड गर्नुहोस्", "3. अनुवाद डाउनलोड गर्नुहोस्"],
  ory_Orya: ["୧. ଲକ୍ଷ୍ୟ ଭାଷା ବାଛନ୍ତୁ", "୨. PDF ଅପଲୋଡ୍ କରନ୍ତୁ", "୩. ଅନୁବାଦ ଡାଉନଲୋଡ୍ କରନ୍ତୁ"],
  pan_Guru: ["1. ਟੀਚਾ ਭਾਸ਼ਾ ਚੁਣੋ", "2. PDF ਦਸਤਾਵੇਜ਼ ਅੱਪਲੋਡ ਕਰੋ", "3. ਅਨੁਵਾਦ ਡਾਊਨਲੋਡ ਕਰੋ"],
  san_Deva: ["1. लक्ष्यभाषां चिनोतु", "2. PDF पत्रकम् आरोपयतु", "3. अनुवादम् अवारोहयतु"],
  sat_Olck: ["1. ᱴᱟᱨᱜᱮᱴ ᱯᱟᱹᱨᱥᱤ ᱵᱟᱪᱷᱟᱣ ᱢᱮ", "2. PDF ᱟᱯᱞᱳᱰ ᱢᱮ", "3. ᱛᱚᱨᱡᱚᱢᱟ ᱰᱟᱣᱩᱱᱞᱳᱰ ᱢᱮ"],
  snd_Arab: ["1. ٽارگيٽ ٻولي چونڊيو", "2. پي ڊي ايف اپلوڊ ڪريو", "3. ترجمو ڊائون لوڊ ڪريو"],
  tam_Taml: ["1. இலக்கு மொழியைத் தேர்ந்தெடுக்கவும்", "2. PDF ஐப் பதிவேற்றவும்", "3. மொழிபெயர்ப்பைப் பதிவிறக்கவும்"],
  tel_Telu: ["1. లక్ష్య భాషను ఎంచుకోండి", "2. PDF అప్‌లోడ్ చేయండి", "3. అనువాదాన్ని ఎగుమతి చేయండి"],
  urd_Arab: ["1. ہدف زبان منتخب کریں", "2. پی ڈی ایف اپ لوڈ کریں", "3. ترجمہ ڈاؤن لوڈ کریں"],
};

type TranslationChunk = { original: string; translated: string; };

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [targetLang, setTargetLang] = useState("mal_Mlym");
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [chunks, setChunks] = useState<TranslationChunk[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultEndRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  
  const selectedLang = LANGUAGES.find(l => l.code === targetLang) || LANGUAGES[0];
  const steps = ONBOARDING_STEPS[targetLang] || ONBOARDING_STEPS["eng"];

  const currentTheme = THEME_MAP[selectedLang.color];

  useEffect(() => {
    if (resultEndRef.current) resultEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chunks]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) setIsLangMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      if (e.dataTransfer.files[0].type === "application/pdf") setFile(e.dataTransfer.files[0]);
      else setError("Only PDF files are supported.");
    }
  };

  const handleExport = (type: 'copy' | 'download') => {
    const fullText = chunks.map(c => c.translated).join("\n\n");
    if (type === 'copy') navigator.clipboard.writeText(fullText);
    else {
      const blob = new Blob([fullText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `BhashaDocs_${selectedLang.label}.txt`;
      a.click(); URL.revokeObjectURL(url);
    }
  };

  const handleTranslate = async () => {
    if (!file) return;
    setIsLoading(true); setError(null); setChunks([]);

    const formData = new FormData();
    formData.append("file", file); formData.append("target_language", targetLang);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/translate-doc", { method: "POST", body: formData });
      if (!response.ok) throw new Error("Translation failed to start.");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (line.trim()) setChunks((prev) => [...prev, JSON.parse(line)]);
          }
        }
      }
    } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
  };

  return (
    <main className="min-h-screen relative flex flex-col items-center justify-center p-6 bg-zinc-50 overflow-hidden text-zinc-900 selection:bg-zinc-200">
      
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none flex justify-center items-center transition-colors duration-1000">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className={`absolute left-0 right-0 top-0 -z-10 m-auto h-[400px] w-[400px] rounded-full opacity-[0.06] blur-[100px] transition-colors duration-700 ${currentTheme.glow}`}></div>
      </div>

      <motion.div layout className="w-full max-w-5xl space-y-8 relative z-10">
        
        {/* Header */}
        <motion.div layout className="text-center space-y-3 mt-8">
          <div className="inline-flex items-center justify-center p-2 bg-white rounded-2xl shadow-sm border border-zinc-100 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-500 ${currentTheme.bg}`}>
              <Languages className={`w-5 h-5 ${currentTheme.text}`} />
            </div>
          </div>
          <h1 className="text-5xl font-extralight tracking-tight">
            Bhasha<span className="font-medium">Docs</span>
          </h1>
        </motion.div>

        {/* Localized Tutorial Stepper (Zero-State) */}
        {!file && chunks.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 px-4">
            {[
              { icon: Languages, text: steps[0] },
              { icon: UploadCloud, text: steps[1] },
              { icon: Download, text: steps[2] }
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center space-y-2 p-4 rounded-2xl bg-white/50 border border-zinc-100/50 backdrop-blur-sm">
                <step.icon className={`w-5 h-5 ${currentTheme.text} opacity-80`} />
                <p className="text-sm font-medium text-zinc-600">{step.text}</p>
              </div>
            ))}
          </motion.div>
        )}

        <motion.div layout className="bg-white/80 backdrop-blur-2xl p-2 sm:p-8 rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-white space-y-6">
          
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-2 relative z-50">
            {/* Expanded Dropdown Menu */}
            <div className="relative flex-1 w-full" ref={langMenuRef}>
              <button
                type="button" onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className={`w-full flex items-center justify-between gap-3 px-5 py-3.5 bg-zinc-50 hover:bg-zinc-100 rounded-2xl border transition-all ${isLangMenuOpen ? `ring-4 ring-zinc-100 ${currentTheme.border}` : "border-zinc-200"}`}
              >
                <div className="flex items-center gap-3">
                  <Languages className="w-5 h-5 text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-700">
                    {selectedLang.label} <span className="text-zinc-400 ml-1 hidden sm:inline">({selectedLang.native})</span>
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${isLangMenuOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {isLangMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute top-full left-0 right-0 mt-2 p-2 bg-white/95 backdrop-blur-xl border border-zinc-100 rounded-2xl shadow-xl z-50 max-h-[300px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1"
                  >
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code} onClick={() => { setTargetLang(lang.code); setIsLangMenuOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${targetLang === lang.code ? `${currentTheme.bg} ${currentTheme.text}` : "text-zinc-600 hover:bg-zinc-50"}`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{lang.label}</span><span className="opacity-60 hidden sm:inline">({lang.native})</span>
                        </div>
                        {targetLang === lang.code && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleTranslate} disabled={!file || isLoading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-zinc-900 text-white text-sm font-medium rounded-2xl shadow-lg disabled:opacity-50 transition-all z-10"
            >
              {isLoading && chunks.length === 0 ? (
                <div className="flex items-center gap-2 w-[140px] justify-center"><Sparkles className="w-4 h-4 text-zinc-300 animate-pulse" /><span>Preparing...</span></div>
              ) : (
                <div className="flex items-center gap-2 w-[140px] justify-center"><span>Translate</span><ArrowRight className="w-4 h-4 text-zinc-400" /></div>
              )}
            </motion.button>
          </div>

          {/* Upload Zone */}
          <div className="px-2 pb-2 relative z-10">
            <AnimatePresence mode="popLayout">
              {!file ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}
                  className={`relative overflow-hidden border-2 border-dashed rounded-[1.5rem] p-12 text-center cursor-pointer transition-all duration-300 ${isDragging ? "border-zinc-400 bg-zinc-100 scale-[1.02]" : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50"}`}
                >
                  <input type="file" ref={fileInputRef} className="hidden" accept="application/pdf" onChange={(e) => e.target.files && setFile(e.target.files[0])} />
                  <UploadCloud className={`w-10 h-10 mx-auto mb-4 transition-colors duration-300 ${isDragging ? "text-zinc-600" : "text-zinc-300"}`} />
                  <p className="text-sm font-semibold text-zinc-700">Drag & drop your PDF</p>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center justify-between p-4 bg-white rounded-[1.5rem] border border-zinc-200 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${currentTheme.bg} ${currentTheme.text} transition-colors duration-500`}><FileText className="w-6 h-6" /></div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-zinc-900 truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
                      <p className="text-xs text-zinc-500 font-medium mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button onClick={() => { setFile(null); setChunks([]); }} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SIDE BY SIDE OUTPUT ZONE */}
          <AnimatePresence>
            {(chunks.length > 0 || isLoading) && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pt-6 px-2 border-t border-zinc-100 relative z-10">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Translation Output</h3>
                    {isLoading && (
                       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-xs font-medium ${currentTheme.text} flex items-center gap-2`}>
                          Processing stream
                          <span className="flex h-1.5 w-1.5 relative">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${currentTheme.glow} opacity-75`}></span>
                            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${currentTheme.glow}`}></span>
                          </span>
                        </motion.div>
                    )}
                  </div>
                  {chunks.length > 0 && !isLoading && (
                    <div className="flex gap-2">
                      <button onClick={() => handleExport('copy')} className="p-2 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 rounded-lg transition-colors" title="Copy"><Copy className="w-4 h-4" /></button>
                      <button onClick={() => handleExport('download')} className="p-2 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 rounded-lg transition-colors" title="Download"><Download className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
                
                <div className="bg-zinc-50 rounded-3xl border border-zinc-100 shadow-inner overflow-hidden flex flex-col">
                  <div className="grid grid-cols-2 gap-px bg-zinc-200/50 border-b border-zinc-100">
                    <div className="p-4 bg-zinc-50/80 backdrop-blur-sm text-xs font-semibold text-zinc-500 uppercase tracking-wider">English Source</div>
                    <div className="p-4 bg-white/80 backdrop-blur-sm text-xs font-semibold text-zinc-500 uppercase tracking-wider">{selectedLang.label} Translation</div>
                  </div>

                  <div className="max-h-[500px] overflow-y-auto">
                    {isLoading && chunks.length === 0 ? (
                      <div className="p-8 grid grid-cols-2 gap-8">
                        <div className="space-y-4"><div className="h-4 bg-zinc-200/60 rounded-md w-3/4 animate-pulse"></div><div className="h-4 bg-zinc-200/60 rounded-md w-full animate-pulse"></div></div>
                        <div className="space-y-4"><div className="h-4 bg-zinc-200/60 rounded-md w-5/6 animate-pulse"></div><div className="h-4 bg-zinc-200/60 rounded-md w-3/4 animate-pulse"></div></div>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        {chunks.map((chunk, index) => (
                          <motion.div 
                            initial={{ opacity: 0, backgroundColor: "#ffffff" }} animate={{ opacity: 1, backgroundColor: hoveredIndex === index ? "#f4f4f5" : "#ffffff" }} key={index}
                            onMouseEnter={() => setHoveredIndex(index)} onMouseLeave={() => setHoveredIndex(null)}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-px border-b border-zinc-100/50 transition-colors duration-200"
                          >
                            <div className="p-4 sm:p-6 text-[14px] text-zinc-500 leading-relaxed bg-zinc-50/30">{chunk.original}</div>
                            <div className={`p-4 sm:p-6 text-[15px] leading-relaxed transition-colors duration-300 ${hoveredIndex === index ? currentTheme.text : "text-zinc-900"}`}>{chunk.translated}</div>
                          </motion.div>
                        ))}
                        {isLoading && (
                          <div className="grid grid-cols-2 gap-px p-6">
                            <div className="h-4 bg-zinc-200/50 rounded-md w-2/3 animate-pulse"></div>
                            <div className="h-4 bg-zinc-200/50 rounded-md w-3/4 animate-pulse"></div>
                          </div>
                        )}
                        <div ref={resultEndRef} />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </motion.div>
    </main>
  );
}