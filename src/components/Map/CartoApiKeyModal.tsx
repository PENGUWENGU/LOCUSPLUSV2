import React, { useState } from 'react';
import { Key, X, Check, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
import { useSpoof } from '../../context/SpoofContext';

interface CartoApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartoApiKeyModal: React.FC<CartoApiKeyModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { cartoApiKey, setCartoApiKey } = useSpoof();
  const [keyValue, setKeyValue] = useState(cartoApiKey);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanKey = keyValue.trim();
    setCartoApiKey(cleanKey);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setKeyValue(text.trim());
      }
    } catch {
      // clipboard read denied or unsupported
    }
  };

  const handleUseFreeTiles = () => {
    setCartoApiKey('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-[28px] locus-glass p-6 border border-locus-accent/40 shadow-2xl space-y-5 text-center relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-white/60 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 mx-auto rounded-full bg-locus-accent/15 border border-locus-accent/30 flex items-center justify-center text-locus-accent shadow-[0_0_20px_rgba(89,199,184,0.3)]">
          <Key className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-xl font-bold text-white tracking-tight">
            Enter CARTO API Key
          </h3>
          <p className="text-xs text-white/70 leading-relaxed">
            Paste the API key you generated from CARTO to remove the diagonal watermark from the dark map.
          </p>
        </div>

        {savedSuccess && (
          <div className="p-2.5 rounded-xl bg-locus-good/20 border border-locus-good/40 text-locus-good text-xs font-bold flex items-center justify-center gap-2 animate-in zoom-in-95">
            <Check className="w-4 h-4" />
            <span>Key saved! Loading clean CARTO tiles…</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-3">
          <div className="space-y-1 text-left">
            <div className="flex items-center justify-between text-[11px]">
              <label className="text-white/60 font-medium">CARTO API Key</label>
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="text-locus-accent hover:underline font-semibold"
              >
                Paste from Clipboard
              </button>
            </div>
            <input
              type="text"
              value={keyValue}
              onChange={(e) => setKeyValue(e.target.value)}
              placeholder="Paste your key here (e.g. carto_...)"
              className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/30 font-mono focus:outline-none focus:border-locus-accent"
              autoFocus
            />
          </div>

          <div className="space-y-2 pt-1">
            <button
              type="submit"
              disabled={!keyValue.trim()}
              className="w-full py-3 rounded-xl bg-locus-accent text-black font-extrabold text-xs shadow-[0_0_16px_rgba(89,199,184,0.4)] hover:brightness-110 active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Save & Remove Watermarks</span>
            </button>

            <button
              type="button"
              onClick={handleUseFreeTiles}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-locus-accent" />
              <span>Or use Free Dark Map (No Key Required)</span>
            </button>
          </div>
        </form>

        <div className="pt-2 border-t border-white/10 text-[11px] text-white/50 text-center">
          <span>Need a free key? Get one instantly at </span>
          <a
            href="https://carto.com/basemaps/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-locus-accent underline hover:brightness-110 inline-flex items-center gap-0.5 font-semibold"
          >
            carto.com/basemaps/apikey <ExternalLink className="w-2.5 h-2.5 inline" />
          </a>
        </div>
      </div>
    </div>
  );
};
