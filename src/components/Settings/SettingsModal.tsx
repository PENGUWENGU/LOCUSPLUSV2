import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Smartphone,
  Clipboard,
  Trash2,
  ExternalLink,
  Info,
  Key,
  Map,
  Check,
  FolderDown,
  CloudLightning,
  ChevronDown,
} from 'lucide-react';
import { useSpoof } from '../../context/SpoofContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenEasterEgg: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenEasterEgg,
}) => {
  const {
    hasPairingFile,
    importPairing,
    removePairing,
    tunnelIP,
    setTunnelIP,
    vpnConnected,
    setVpnConnected,
    cartoApiKey,
    setCartoApiKey,
    setLastError,
  } = useSpoof();

  const [inputIP, setInputIP] = useState(tunnelIP);
  const [pairingInput, setPairingInput] = useState('');
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [tempCartoKey, setTempCartoKey] = useState(cartoApiKey);
  const [cartoKeySavedMsg, setCartoKeySavedMsg] = useState(false);
  const [showIpaGuide, setShowIpaGuide] = useState(false);

  if (!isOpen) return null;

  const handleSaveIP = (e: React.FormEvent) => {
    e.preventDefault();
    setTunnelIP(inputIP.trim() || '10.7.0.1');
  };

  const handleSimulatePair = () => {
    const mockRPPairing = `<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0">
<dict>
  <key>DeviceCertificate</key>
  <data>TU9DS19QRU5HVV9MT0NVUw==</data>
  <key>HostID</key>
  <string>LOCUS-DEV-TUNNEL-${Math.floor(Math.random() * 100000)}</string>
</dict>
</plist>`;
    importPairing(mockRPPairing);
  };

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pairingInput.trim()) return;
    try {
      importPairing(pairingInput.trim());
      setShowPasteModal(false);
      setPairingInput('');
    } catch (err: any) {
      setLastError(err.message || 'Failed to import pairing data');
    }
  };

  const handleSaveCartoKey = () => {
    setCartoApiKey(tempCartoKey.trim());
    setCartoKeySavedMsg(true);
    setTimeout(() => setCartoKeySavedMsg(false), 3000);
  };

  const handleClearCartoKey = () => {
    setTempCartoKey('');
    setCartoApiKey('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md h-[85vh] sm:h-auto sm:max-h-[85vh] locus-glass rounded-t-[32px] sm:rounded-[28px] overflow-hidden flex flex-col border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
          <h3 className="text-lg font-bold text-white">Settings</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-white/70 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings List */}
        <div className="p-4 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Section 1: Basemap & CARTO API Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                <Map className="w-3.5 h-3.5 text-locus-accent" />
                <span>Map Basemap & CARTO API Key</span>
              </h4>
              {cartoApiKey ? (
                <span className="text-[10px] text-locus-good font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Key Active
                </span>
              ) : (
                <span className="text-[10px] text-white/50">Using Clean Fallback</span>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 text-xs">
              <p className="text-white/70 leading-relaxed text-xs">
                Enter your free CARTO API key to unlock official high-res CARTO Dark Matter basemap tiles without watermark messages.
              </p>

              {cartoKeySavedMsg && (
                <div className="p-2.5 rounded-xl bg-locus-good/15 border border-locus-good/30 text-locus-good flex items-center gap-2 text-xs font-semibold animate-in fade-in">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>CARTO API Key saved! Map reloaded.</span>
                </div>
              )}

              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    value={tempCartoKey}
                    onChange={(e) => setTempCartoKey(e.target.value)}
                    placeholder="Paste CARTO API key here (e.g. carto_...)"
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 pr-8 text-xs text-white placeholder-white/30 focus:outline-none focus:border-locus-accent font-mono"
                  />
                  {tempCartoKey && (
                    <button
                      type="button"
                      onClick={() => setTempCartoKey('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveCartoKey}
                    className="flex-1 py-2 px-3 rounded-xl bg-locus-accent text-black font-bold text-xs hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(89,199,184,0.3)]"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Save Key</span>
                  </button>

                  {cartoApiKey && (
                    <button
                      type="button"
                      onClick={handleClearCartoKey}
                      className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white/70 hover:text-white text-xs font-semibold transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Status Note & Link */}
              <div className="pt-2 text-[11px] text-white/50 space-y-1 border-t border-white/5">
                <div className="flex items-center gap-1.5 text-white/70 font-semibold">
                  <Info className="w-3.5 h-3.5 text-locus-accent shrink-0" />
                  <span>Don't have a key?</span>
                </div>
                <p className="leading-relaxed">
                  Locus automatically displays a clean, watermark-free dark map even without a key. You can also generate your free CARTO key in seconds at{' '}
                  <a
                    href="https://carto.com/basemaps/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-locus-accent underline hover:brightness-110 inline-flex items-center gap-0.5 font-medium"
                  >
                    carto.com/basemaps/apikey <ExternalLink className="w-2.5 h-2.5 inline" />
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Developer Pairing */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
              Developer Pairing
            </h4>
            <div className="rounded-2xl bg-white/5 border border-white/5 divide-y divide-white/5 overflow-hidden">
              <div className="p-3.5 flex items-center gap-3">
                {hasPairingFile ? (
                  <CheckCircle2 className="w-5 h-5 text-locus-good shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-locus-warn shrink-0" />
                )}
                <div className="flex-1">
                  <div className="font-semibold text-white text-xs">
                    {hasPairingFile
                      ? 'RPPairing file installed'
                      : 'No pairing file'}
                  </div>
                  <div className="text-[11px] text-white/50">
                    {hasPairingFile
                      ? 'Location simulation authorization active'
                      : 'Required to teleport or use joystick'}
                  </div>
                </div>
              </div>

              {!hasPairingFile ? (
                <>
                  <button
                    onClick={handleSimulatePair}
                    className="w-full p-3.5 text-left hover:bg-white/5 flex items-center gap-3 text-locus-accent text-xs font-semibold transition-colors"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Auto-authorize this browser</span>
                  </button>
                  <button
                    onClick={() => setShowPasteModal(true)}
                    className="w-full p-3.5 text-left hover:bg-white/5 flex items-center gap-3 text-white/70 hover:text-white text-xs transition-colors"
                  >
                    <Clipboard className="w-4 h-4" />
                    <span>Paste custom pairing XML</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={removePairing}
                  className="w-full p-3.5 text-left hover:bg-white/5 flex items-center gap-3 text-locus-danger text-xs font-semibold transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Remove pairing authorization</span>
                </button>
              )}
            </div>
          </div>

          {/* Section 3: Tunnel VPN Connection */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
              LocalDevVPN Tunnel
            </h4>
            <div className="rounded-2xl bg-white/5 border border-white/5 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-locus-accent" />
                  <span className="font-semibold text-white text-xs">Tunnel Status</span>
                </div>
                <button
                  onClick={() => setVpnConnected(!vpnConnected)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    vpnConnected
                      ? 'bg-locus-good/20 text-locus-good border border-locus-good/30'
                      : 'bg-white/10 text-white/50 hover:text-white'
                  }`}
                >
                  {vpnConnected ? 'Connected' : 'Disconnected'}
                </button>
              </div>

              <form onSubmit={handleSaveIP} className="space-y-1.5 pt-1">
                <label className="text-[11px] text-white/50 font-medium">Tunnel Target IP</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputIP}
                    onChange={(e) => setInputIP(e.target.value)}
                    placeholder="10.7.0.1"
                    className="flex-1 bg-black/40 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-locus-accent"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Section 4: Apple iOS & .IPA Target Details */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center justify-between">
              <span>Apple iOS & .IPA Architecture</span>
              <span className="text-[10px] text-locus-accent font-semibold px-2 py-0.5 rounded-full bg-locus-accent/15 border border-locus-accent/30">
                iPhone Target
              </span>
            </h4>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 space-y-2.5 text-xs text-white/70">
              <div className="flex items-start gap-2.5">
                <Smartphone className="w-4 h-4 text-locus-accent shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-white text-xs">Apple Maps & Native MapKit</div>
                  <p className="leading-relaxed text-[11px] text-white/60">
                    When built into your iOS <code className="font-mono text-locus-accent">.ipa</code>, the app links to Apple&apos;s native <code className="font-mono text-white/90">MapKit.framework</code> (<code className="font-mono text-white/90">MKMapView</code>). It uses Apple Maps vector rendering, 3D buildings, and native gesture physics.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-1.5 border-t border-white/5">
                <Shield className="w-4 h-4 text-locus-good shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-white text-xs">System-Wide GPS Spoofing</div>
                  <p className="leading-relaxed text-[11px] text-white/60">
                    Routing, teleports, and joystick movements feed into Apple&apos;s DVT developer service (<code className="font-mono text-white/90">com.apple.dt.simulatelocation</code>). The simulation overrides iOS <code className="font-mono text-white/90">locationd</code>, so Find My, Pokémon GO, Life360, and Apple Maps all read the simulated GPS.
                  </p>
                </div>
              </div>

              {/* GitHub Actions IPA builder button */}
              <div className="pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowIpaGuide((prev) => !prev)}
                  className="w-full py-2.5 px-3 rounded-xl bg-locus-accent/15 hover:bg-locus-accent/25 border border-locus-accent/40 text-locus-accent font-bold text-xs flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <CloudLightning className="w-4 h-4" />
                    <span>Build .IPA in Cloud (GitHub Actions - No Mac Needed)</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showIpaGuide ? 'rotate-180' : ''}`} />
                </button>

                {showIpaGuide && (
                  <div className="mt-2.5 p-3 rounded-xl bg-black/40 border border-white/10 space-y-2 text-[11px] text-white/80 animate-in fade-in duration-200">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <FolderDown className="w-3.5 h-3.5 text-locus-accent" />
                      <span>3 Steps to get your .IPA:</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1.5 text-white/70 pl-1 leading-relaxed">
                      <li>
                        <strong className="text-white">Push to GitHub:</strong> Upload or push this project to a new repository on your GitHub account. (The file <code className="font-mono text-locus-accent">.github/workflows/build-ipa.yml</code> is already configured).
                      </li>
                      <li>
                        <strong className="text-white">Run GitHub Action:</strong> In your GitHub repo, go to the <strong>Actions</strong> tab &rarr; click <strong>Build iOS IPA</strong> &rarr; click <strong>Run workflow</strong>.
                      </li>
                      <li>
                        <strong className="text-white">Download .IPA:</strong> After 3 minutes, click the completed run and download <code className="font-mono text-white font-bold">Locus-iOS-IPA</code> under Artifacts!
                      </li>
                    </ol>
                    <div className="pt-2 border-t border-white/10 text-[10px] text-white/50">
                      Install onto your iPhone using <strong>Sideloadly</strong> (PC), <strong>SideStore</strong>, <strong>AltStore</strong>, or <strong>TrollStore</strong>. See <code className="font-mono text-white/70">BUILDING_IPA_GUIDE.md</code> in project root for full instructions.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 5: Privacy */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
              Privacy
            </h4>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-xs text-white/60 leading-relaxed">
              Fully on-device. Favorites, recents, and tunnel settings stay in your browser local storage. No telemetry, no accounts, and no data uploaded.
            </div>
          </div>

          {/* Section 5: About */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
              About
            </h4>
            <div className="rounded-2xl bg-white/5 border border-white/5 divide-y divide-white/5 overflow-hidden text-xs">
              <div className="p-3.5 flex items-center justify-between text-white/80">
                <span>Version</span>
                <span className="font-mono text-white/50">1.0.0 (Web)</span>
              </div>
              <div className="p-3.5 flex items-center justify-between text-white/80">
                <span>Engine</span>
                <span className="text-white/50">idevice DVT location simulation</span>
              </div>
            </div>
          </div>

          {/* Section 6: Easter Egg link */}
          <div className="text-center pt-2">
            <button
              onClick={() => {
                onClose();
                onOpenEasterEgg();
              }}
              className="text-xs italic text-white/40 hover:text-white/70 transition-colors"
            >
              locus, n. — a place. From the Latin for where you are.
            </button>
          </div>
        </div>

        {/* Paste Pairing Modal */}
        {showPasteModal && (
          <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-4 z-50">
            <form
              onSubmit={handlePasteSubmit}
              className="w-full max-w-sm p-4 rounded-2xl locus-glass border border-white/15 space-y-4"
            >
              <h4 className="font-bold text-sm text-white">Paste RPPairing plist</h4>
              <textarea
                value={pairingInput}
                onChange={(e) => setPairingInput(e.target.value)}
                placeholder="Paste XML plist contents here..."
                rows={5}
                className="w-full p-2.5 bg-black/60 border border-white/20 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-locus-accent"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasteModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-locus-accent text-black font-bold text-xs"
                >
                  Import
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Done Button */}
        <div className="p-4 border-t border-white/10 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-full bg-white/10 hover:bg-white/15 text-white font-bold text-sm transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
