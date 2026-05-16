"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloud, FileText, ArrowRight, Languages, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [targetLang, setTargetLang] = useState("mal_Mlym");
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [translatedText, setTranslatedText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll as new text arrives
  useEffect(() => {
    if (resultEndRef.current) {
      resultEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [translatedText]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") setFile(droppedFile);
      else setError("Please upload a PDF file.");
    }
  };

  const handleTranslate = async () => {
    if (!file) return;
    setIsLoading(true);
    setError(null);
    setTranslatedText("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("target_language", targetLang);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/translate-doc", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Translation failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setTranslatedText((prev) => prev + chunk);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#FAFAFA] text-zinc-900 selection:bg-zinc-200">
      
      {/* Subtle Background Elements */}
      <div className="fixed inset-0 pointer-events-none flex justify-center items-center opacity-40">
        <div className="w-[600px] h-[600px] bg-gradient-to-tr from-zinc-200 to-transparent rounded-full blur-3xl" />
      </div>

      <motion.div 
        layout
        className="w-full max-w-3xl space-y-8 relative z-10"
      >
        <motion.div layout className="text-center space-y-2">
          <h1 className="text-5xl font-light tracking-tighter">
            Bhasha<span className="font-medium">Docs</span>
          </h1>
          <p className="text-zinc-500 font-medium tracking-wide text-sm uppercase">
            Neural Document Translation
          </p>
        </motion.div>

        <motion.div 
          layout
          className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 space-y-6"
        >
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full flex items-center gap-3 px-4 py-3 bg-white rounded-2xl shadow-sm border border-zinc-100 transition-all focus-within:ring-2 ring-zinc-200">
              <Languages className="w-5 h-5 text-zinc-400" />
              <select 
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full bg-transparent text-sm outline-none text-zinc-700 font-medium cursor-pointer"
              >
                <option value="mal_Mlym">Malayalam (മലയാളം)</option>
                <option value="hin_Deva">Hindi (हिन्दी)</option>
                <option value="tam_Taml">Tamil (தமிழ்)</option>
                <option value="tel_Telu">Telugu (తెలుగు)</option>
              </select>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleTranslate}
              disabled={!file || isLoading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-zinc-900 text-white text-sm font-medium rounded-2xl shadow-md disabled:opacity-40 transition-all"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span>Processing...</span>
                </div>
              ) : (
                <>
                  <span>Translate</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </div>

          {/* Upload Zone */}
          <AnimatePresence mode="popLayout">
            {!file ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`group relative overflow-hidden border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300 ${
                  isDragging ? "border-zinc-900 bg-zinc-50/50 scale-[1.01]" : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/30"
                }`}
              >
                <input type="file" ref={fileInputRef} className="hidden" accept="application/pdf" onChange={(e) => e.target.files && setFile(e.target.files[0])} />
                <motion.div 
                  className="relative z-10"
                  animate={{ y: isDragging ? -5 : 0 }}
                >
                  <UploadCloud className="w-10 h-10 text-zinc-300 group-hover:text-zinc-500 transition-colors mx-auto mb-4" />
                  <p className="text-sm font-medium text-zinc-800">Drop your PDF here</p>
                  <p className="text-xs text-zinc-400 mt-2">Maximum file size: 10MB</p>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-between p-5 bg-white rounded-2xl border border-zinc-100 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-zinc-50 rounded-xl">
                    <FileText className="w-6 h-6 text-zinc-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-zinc-800 truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
                    <p className="text-xs text-zinc-400 font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button onClick={() => { setFile(null); setTranslatedText(""); }} className="text-xs font-semibold text-zinc-400 hover:text-zinc-800 transition-colors px-3 py-2">
                  Replace
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="p-4 bg-red-50 text-red-600 text-sm font-medium rounded-2xl border border-red-100 mt-4">
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Output */}
          <AnimatePresence>
            {(translatedText || isLoading) && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="space-y-3 pt-6 border-t border-zinc-100"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Output</h3>
                  {isLoading && <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-500"></span>
                  </span>}
                </div>
                <div className="p-6 bg-white rounded-3xl border border-zinc-100 text-sm text-zinc-800 leading-loose max-h-80 overflow-y-auto shadow-inner shadow-zinc-50">
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="whitespace-pre-wrap"
                  >
                    {translatedText}
                    {isLoading && <span className="inline-block w-1.5 h-4 ml-1 bg-zinc-300 animate-pulse align-middle" />}
                  </motion.p>
                  <div ref={resultEndRef} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </motion.div>
    </main>
  );
}