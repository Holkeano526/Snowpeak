import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import { generateImage } from './services/geminiService';
import { GenerationState, AppSettings } from './types';

// Declaring global window interface for AI Studio helpers
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    // Fix: Remove readonly to avoid "identical modifiers" error if already declared elsewhere in the environment
    aistudio: AIStudio;
  }
}

const DEFAULT_PROMPT = "Una foto nocturna hiperrealista estilo flash de iPhone en la cima de una montaña nevada, basada en la persona de la imagen adjunta. El sujeto está de pie en cuerpo entero en primer plano, sosteniendo una tabla de snowboard, usando un casco de nieve Red Bull y gafas de esquí (pero con la cara totalmente visible y descubierta para mantener el parecido facial). Lleva chaqueta técnica blanca y pantalones coloridos. Un flash directo y duro golpea al personaje y la nieve cercana — luces quemadas, sombras duras, contraste crudo. Detrás del sujeto, un helicóptero negro está despegando: patines justo encima del suelo, rotores con mucho desenfoque de movimiento, nieve disparada violentamente hacia afuera. Partículas de nieve congeladas en el aire por el flash, exposición desigual, encuadre imperfecto — inconfundible foto accidental de iPhone. Grano natural, sin gradación cinematográfica.";

const App: React.FC = () => {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [refImage, setRefImage] = useState<string | null>(null);
  const [state, setState] = useState<GenerationState>({
    isGenerating: false,
    error: null,
    resultUrl: null,
    status: 'Ready to generate'
  });
  const [settings, setSettings] = useState<AppSettings>({
    model: 'gemini-2.5-flash-image',
    aspectRatio: '1:1',
    imageSize: '1K'
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRefImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const checkAndPromptApiKey = async () => {
    if (settings.model === 'gemini-3-pro-image-preview') {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        // Assume key selection is successful and proceed to avoid race condition delays
        await window.aistudio.openSelectKey();
      }
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setState(prev => ({ ...prev, isGenerating: true, error: null, status: 'Initializing...' }));
    
    try {
      await checkAndPromptApiKey();
      
      setState(prev => ({ ...prev, status: 'Processing scene geometry...' }));
      const result = await generateImage(prompt, refImage, settings);
      
      setState(prev => ({ 
        ...prev, 
        isGenerating: false, 
        resultUrl: result, 
        status: 'Generated successfully!' 
      }));
    } catch (err: any) {
      let errorMsg = err.message || 'An unexpected error occurred';
      
      // If the request fails with 404, the user likely needs to select a valid key
      if (errorMsg.includes("Requested entity was not found")) {
        setState(prev => ({ ...prev, isGenerating: false, error: 'API Key invalid or not found. Please select a valid key.', status: 'Error' }));
        await window.aistudio.openSelectKey();
      } else {
        setState(prev => ({ ...prev, isGenerating: false, error: errorMsg, status: 'Error' }));
      }
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-black text-white font-sans">
      <Header />
      
      <main className="max-w-5xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Controls Column */}
          <div className="space-y-8">
            <section className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 shadow-xl shadow-black/20">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                Subject Reference
              </h2>
              <div className="relative group">
                <label className="block w-full cursor-pointer">
                  <div className="aspect-square rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-950 flex flex-col items-center justify-center overflow-hidden hover:border-zinc-500 transition-all">
                    {refImage ? (
                      <img src={refImage} alt="Reference" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center px-4">
                        <svg className="w-10 h-10 text-zinc-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                        </svg>
                        <p className="text-zinc-500 text-sm">Upload photo of person</p>
                      </div>
                    )}
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
                {refImage && (
                  <button 
                    onClick={(e) => { e.preventDefault(); setRefImage(null); }}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-red-900 p-2 rounded-full backdrop-blur-sm transition-colors"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <p className="mt-4 text-xs text-zinc-500 leading-relaxed italic">
                The image will be used to maintain facial characteristics in the final generation.
              </p>
            </section>

            {/* Scene Composition (Settings and button kept visible) */}
            <section className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 shadow-xl shadow-black/20">
              <div className="hidden">
                <h2 className="text-lg font-semibold mb-4">Scene Composition</h2>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  readOnly
                  className="w-full h-48 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 outline-none resize-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wider">Engine</label>
                  <select 
                    value={settings.model}
                    onChange={(e) => setSettings({...settings, model: e.target.value as any})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-400 focus:outline-none hover:border-zinc-700 transition-colors"
                  >
                    <option value="gemini-2.5-flash-image">Gemini Flash (Fast)</option>
                    <option value="gemini-3-pro-image-preview">Gemini Pro (Ultra-HD)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wider">Format</label>
                  <select 
                    value={settings.aspectRatio}
                    onChange={(e) => setSettings({...settings, aspectRatio: e.target.value as any})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-400 focus:outline-none hover:border-zinc-700 transition-colors"
                  >
                    <option value="1:1">Square (1:1)</option>
                    <option value="9:16">Reels (9:16)</option>
                    <option value="16:9">Widescreen (16:9)</option>
                    <option value="3:4">Portrait (3:4)</option>
                  </select>
                </div>
              </div>

              {settings.model === 'gemini-3-pro-image-preview' && (
                <div className="mt-4">
                  <label className="block text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wider">Resolution</label>
                  <div className="flex gap-2">
                    {['1K', '2K', '4K'].map((size) => (
                      <button
                        key={size}
                        onClick={() => setSettings({...settings, imageSize: size as any})}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                          settings.imageSize === size 
                          ? 'bg-blue-600 border-blue-500 text-white' 
                          : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                disabled={state.isGenerating}
                onClick={handleGenerate}
                className={`w-full mt-6 py-4 rounded-xl font-bold text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-3 ${
                  state.isGenerating 
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                  : 'bg-white text-black hover:bg-zinc-200 active:scale-[0.98] shadow-lg shadow-white/5'
                }`}
              >
                {state.isGenerating ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-zinc-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {state.status}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Ignite Flash
                  </>
                )}
              </button>
            </section>
          </div>

          {/* Result Column */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="aspect-[3/4] relative bg-black group">
                {!state.resultUrl && !state.isGenerating && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-700 p-10 text-center">
                    <div className="w-16 h-16 border-2 border-zinc-800 rounded-2xl flex items-center justify-center mb-6">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-zinc-500 font-medium tracking-tight">System Idle</h3>
                    <p className="text-xs mt-2 text-zinc-600 max-w-[200px]">Waiting for reference input and flash ignition.</p>
                  </div>
                )}

                {state.isGenerating && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10 p-8">
                    <div className="w-full max-w-[200px] h-1 bg-zinc-800 rounded-full overflow-hidden mb-4">
                      <div className="h-full bg-blue-500 animate-[loading_2s_infinite]"></div>
                    </div>
                    <p className="text-sm font-bold text-zinc-400 animate-pulse tracking-widest uppercase">{state.status}</p>
                    <p className="text-[10px] text-zinc-600 mt-4 text-center leading-relaxed">Synthesizing hyper-realistic snow particles and rotor blur...</p>
                  </div>
                )}

                {state.resultUrl && (
                  <img src={state.resultUrl} alt="Generated result" className="w-full h-full object-cover transition-all duration-700" />
                )}

                {state.error && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/20 backdrop-blur-sm p-8 text-center">
                    <svg className="w-12 h-12 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h3 className="text-red-400 font-bold mb-2">Generation Failed</h3>
                    <p className="text-xs text-red-300/70">{state.error}</p>
                    <button 
                      onClick={() => setState(prev => ({ ...prev, error: null }))}
                      className="mt-6 px-4 py-2 bg-red-900/40 hover:bg-red-900/60 rounded-lg text-xs font-bold transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {state.resultUrl && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a 
                      href={state.resultUrl} 
                      download="snowpeak-generation.png"
                      className="bg-white text-black p-3 rounded-full hover:scale-110 transition-transform shadow-xl"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-500 font-mono tracking-tighter uppercase">
                <span>Ref: {refImage ? 'Active' : 'N/A'}</span>
                <span>Model: {settings.model.split('-')[1]}</span>
                <span>Format: {settings.aspectRatio}</span>
              </div>
            </div>

            <p className="mt-4 text-[10px] text-zinc-600 italic leading-relaxed text-center px-4">
              "SnowPeak Flash Studio uses multi-layer semantic synthesis to replicate high-contrast iPhone photography."
            </p>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      {/* Persistent CTA Bar for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-lg border-t border-zinc-800 z-50">
        <button
          disabled={state.isGenerating}
          onClick={handleGenerate}
          className="w-full py-4 bg-white text-black rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-white/5 active:scale-95 transition-all"
        >
          {state.isGenerating ? state.status : 'Ignite Flash'}
        </button>
      </div>
    </div>
  );
};

export default App;