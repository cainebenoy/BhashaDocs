"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileText, ArrowRight, Loader2, Languages } from "lucide-react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [targetLang, setTargetLang] = useState("mal_Mlym");
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") setFile(droppedFile);
      else setError("Please upload a PDF file.");
    }
  };

// API Call to FastAPI Backend
  const handleTranslate = async () => {
    if (!file) return;
    
    setIsLoading(true);
    setError(null);
    setTranslatedText(""); // Start with empty string, not null

    const formData = new FormData();
    formData.append("file", file);
    formData.append("target_language", targetLang);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/translate-doc", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Translation failed");
      }

      // STREAMING LOGIC
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          // Decode the binary stream into text and append it to the UI
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
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-50">
      <div className="w-full max-w-3xl space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-light tracking-tight text-zinc-900">
            Bhasha<span className="font-semibold">Docs</span>
          </h1>
          <p className="text-zinc-500">
            Secure, high-speed PDF translation to Indic languages.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-100 space-y-6">
          
          {/* Controls */}
          <div className="flex items-center gap-4">
            <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg">
              <Languages className="w-5 h-5 text-zinc-400" />
              <select 
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full bg-transparent text-sm outline-none text-zinc-700 font-medium"
              >
                <option value="mal_Mlym">Malayalam (മലയാളം)</option>
                <option value="hin_Deva">Hindi (हिन्दी)</option>
                <option value="tam_Taml">Tamil (தமிழ்)</option>
                <option value="tel_Telu">Telugu (తెలుగు)</option>
              </select>
            </div>
            
            <button
              onClick={handleTranslate}
              disabled={!file || isLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Translate"}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>

          {/* Drag & Drop Zone */}
          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${
                isDragging ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50"
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="application/pdf"
                onChange={(e) => e.target.files && setFile(e.target.files[0])}
              />
              <UploadCloud className="w-10 h-10 text-zinc-400 mx-auto mb-4" />
              <p className="text-sm font-medium text-zinc-700">Click to upload or drag and drop</p>
              <p className="text-xs text-zinc-500 mt-1">PDF documents only</p>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 border border-zinc-200 rounded-xl bg-zinc-50">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-zinc-700" />
                <div className="text-left">
                  <p className="text-sm font-medium text-zinc-900 truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
                  <p className="text-xs text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button 
                onClick={() => { setFile(null); setTranslatedText(null); }}
                className="text-xs font-medium text-red-600 hover:text-red-700 px-3 py-1 bg-red-50 rounded-md"
              >
                Remove
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
              {error}
            </div>
          )}

          {/* Result Output */}
          {translatedText && (
            <div className="space-y-2 pt-4 border-t border-zinc-100">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Translation Result</h3>
              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 text-sm text-zinc-800 leading-relaxed max-h-64 overflow-y-auto">
                {translatedText}
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}