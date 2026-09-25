import React, { useState } from 'react';
import { Compass, ShieldCheck, Check, Smartphone, X } from 'lucide-react';
import { useSpoof } from '../../context/SpoofContext';

interface SetupFlowModalProps {
  isOpen: boolean;
  onFinish: () => void;
}

export const SetupFlowModal: React.FC<SetupFlowModalProps> = ({
  isOpen,
  onFinish,
}) => {
  const { hasPairingFile, importPairing, setSetupComplete } = useSpoof();
  const [step, setStep] = useState<number>(1); // 1: Welcome, 2: Pairing, 3: VPN

  if (!isOpen) return null;

  const handleSkipOrClose = () => {
    setSetupComplete(true);
    onFinish();
  };

  const handlePair = () => {
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
    setStep(3);
  };

  const handleComplete = () => {
    setSetupComplete(true);
    onFinish();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="relative w-full max-w-sm rounded-[32px] locus-glass p-6 border border-white/10 shadow-2xl flex flex-col items-center text-center space-y-6">
        {/* Close / Skip button */}
        <button
          onClick={handleSkipOrClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          title="Skip setup and open Map"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Progress capsules */}
        <div className="w-full flex items-center gap-1.5 px-4 pt-1">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                s <= step ? 'bg-locus-accent' : 'bg-white/15'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="space-y-6 py-2 w-full">
            <div className="w-20 h-20 mx-auto rounded-full bg-locus-accent/15 flex items-center justify-center border border-locus-accent/30 shadow-[0_0_24px_rgba(89,199,184,0.3)]">
              <Compass className="w-10 h-10 text-locus-accent animate-pulse" />
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                Locus
              </h2>
              <p className="text-sm text-white/70 leading-relaxed">
                Teleport your location.
                <br />
                Works on any Chromebook, Mac, or PC.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-white/60 leading-normal">
              No physical GPS hardware required. All spoofing and movement simulation runs inside your browser.
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setStep(2)}
                className="w-full py-3.5 rounded-full bg-locus-accent text-black font-bold text-sm shadow-[0_0_16px_rgba(89,199,184,0.4)] hover:brightness-110 transition-all"
              >
                Get started
              </button>
              <button
                onClick={handleSkipOrClose}
                className="w-full py-2.5 text-xs text-white/50 hover:text-white transition-colors"
              >
                Skip setup and open Map
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Pairing */}
        {step === 2 && (
          <div className="space-y-5 py-2 w-full">
            <div className="w-16 h-16 mx-auto rounded-full bg-locus-accent/15 flex items-center justify-center border border-locus-accent/30">
              <Smartphone className="w-8 h-8 text-locus-accent" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-white">
                Connect this device
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Locus uses developer location simulation to set coordinates securely. Authorize this device below.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-left space-y-2 text-xs">
              <div className="flex items-start gap-2 text-white/80">
                <span className="w-4 h-4 rounded-full bg-locus-accent text-black text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span>Configures local tunnel communication</span>
              </div>
              <div className="flex items-start gap-2 text-white/80">
                <span className="w-4 h-4 rounded-full bg-locus-accent text-black text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span>Stores simulation certificate in secure storage</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handlePair}
                className="w-full py-3.5 rounded-full bg-locus-accent text-black font-bold text-sm shadow-[0_0_16px_rgba(89,199,184,0.4)] hover:brightness-110 transition-all"
              >
                {hasPairingFile ? 'Pairing Active — Continue' : 'Authorize & Continue'}
              </button>
              <button
                onClick={handleSkipOrClose}
                className="w-full py-2 text-xs text-white/50 hover:text-white transition-colors"
              >
                Skip to Map
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Tunnel VPN */}
        {step === 3 && (
          <div className="space-y-5 py-2 w-full">
            <div className="w-16 h-16 mx-auto rounded-full bg-locus-good/15 flex items-center justify-center border border-locus-good/30">
              <ShieldCheck className="w-8 h-8 text-locus-good" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-white">
                LocalDevVPN Tunnel
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                The loopback tunnel connects Locus directly to the location simulation subsystem.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-white/80">Tunnel Status</span>
                <span className="text-locus-good font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Connected (10.7.0.1)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">Simulation Engine</span>
                <span className="text-white/60 font-mono text-[11px]">Ready</span>
              </div>
            </div>

            <button
              onClick={handleComplete}
              className="w-full py-3.5 rounded-full bg-locus-accent text-black font-bold text-sm shadow-[0_0_16px_rgba(89,199,184,0.4)] hover:brightness-110 transition-all"
            >
              Start Teleporting
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
