import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Modal } from './Modal';
import QRCode from 'qrcode';
import {
  Smartphone,
  Laptop,
  QrCode,
  Copy,
  Check,
  RefreshCw,
  Unlink,
  ShieldCheck,
  Wifi,
  WifiOff,
  Cloud,
  ArrowRight,
} from 'lucide-react';
import { formatTimeBR } from '../utils/formatters';

export const SyncModal: React.FC = () => {
  const {
    isSyncModalOpen,
    setIsSyncModalOpen,
    syncKey,
    syncStatus,
    lastSyncTime,
    setupDeviceSyncKey,
    connectExistingSyncKey,
    disconnectDeviceSync,
    forceSyncNow,
    addToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'share' | 'connect'>('share');
  const [inputKey, setInputKey] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate QR Code on canvas
  useEffect(() => {
    if (syncKey && canvasRef.current && isSyncModalOpen && activeTab === 'share') {
      const pairUrl = `${window.location.origin}/?sync=${syncKey}`;
      QRCode.toCanvas(
        canvasRef.current,
        pairUrl,
        {
          width: 180,
          margin: 1.5,
          color: {
            dark: '#8b5cf6',
            light: '#0c0e14',
          },
        },
        (error) => {
          if (error) console.error('QR Code error:', error);
        }
      );
    }
  }, [syncKey, isSyncModalOpen, activeTab]);

  const handleCopy = () => {
    if (!syncKey) return;
    navigator.clipboard.writeText(syncKey);
    setIsCopied(true);
    addToast('Código copiado!', 'Cole no seu celular ou outro dispositivo.');
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleCopyUrl = () => {
    if (!syncKey) return;
    const url = `${window.location.origin}/?sync=${syncKey}`;
    navigator.clipboard.writeText(url);
    addToast('Link de pareamento copiado!', 'Abra esse link direto no outro dispositivo.');
  };

  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) return;

    setIsConnecting(true);
    const success = await connectExistingSyncKey(inputKey.trim());
    setIsConnecting(false);

    if (success) {
      setInputKey('');
      setIsSyncModalOpen(false);
    }
  };

  return (
    <Modal
      isOpen={isSyncModalOpen}
      onClose={() => setIsSyncModalOpen(false)}
      title="Sincronizar Dispositivos"
      description="Utilize o APREVO no celular e no computador simultaneamente sem precisar criar conta."
      maxWidth="max-w-md"
    >
      {/* Tabs */}
      <div className="flex rounded-xl bg-[#161922] p-1 border border-[#282f42] mb-5">
        <button
          onClick={() => setActiveTab('share')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'share'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Meu Dispositivo</span>
        </button>

        <button
          onClick={() => setActiveTab('connect')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'connect'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Conectar Outro</span>
        </button>
      </div>

      {/* Tab 1: Share / Pair Code */}
      {activeTab === 'share' && (
        <div className="space-y-4">
          {!syncKey ? (
            <div className="text-center py-6 px-4 rounded-2xl bg-[#161922] border border-[#242b3b]">
              <Cloud className="w-10 h-10 text-brand-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-white">Sincronização em Nuvem</h4>
              <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">
                Gere um código exclusivo para parear seu celular com o computador e manter seus estudos em tempo real.
              </p>
              <button
                onClick={setupDeviceSyncKey}
                className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-glow-sm transition-all"
              >
                Ativar Sincronização e Gerar Código
              </button>
            </div>
          ) : (
            <>
              {/* Pairing Code Display */}
              <div className="p-4 rounded-2xl bg-[#161922] border border-brand-500/30 text-center">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Código de Pareamento Exclusivo
                </span>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="text-2xl font-mono font-black text-white tracking-widest bg-[#0e1017] px-4 py-1.5 rounded-xl border border-[#2b3346]">
                    {syncKey}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="p-2.5 rounded-xl bg-[#202534] hover:bg-brand-600 text-slate-200 hover:text-white transition-colors"
                    title="Copiar código"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* QR Code */}
              <div className="p-4 rounded-2xl bg-[#161922] border border-[#232836] flex flex-col items-center justify-center">
                <p className="text-xs text-slate-300 font-medium mb-3">
                  Aponte a câmera do celular para conectar direto:
                </p>
                <div className="p-2.5 rounded-2xl bg-[#0c0e14] border border-[#2a3042] shadow-inner">
                  <canvas ref={canvasRef} className="rounded-lg" />
                </div>
                <button
                  onClick={handleCopyUrl}
                  className="mt-3 text-xs text-brand-400 hover:text-brand-300 font-medium"
                >
                  Copiar link direto de pareamento
                </button>
              </div>

              {/* Status and Actions */}
              <div className="p-3 rounded-xl bg-[#141722] border border-[#232836] flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      syncStatus === 'synced'
                        ? 'bg-emerald-400 animate-pulse'
                        : syncStatus === 'syncing'
                        ? 'bg-brand-400 animate-ping'
                        : syncStatus === 'offline'
                        ? 'bg-amber-400'
                        : 'bg-slate-500'
                    }`}
                  />
                  <span>
                    {syncStatus === 'synced' && 'Nuvem sincronizada'}
                    {syncStatus === 'syncing' && 'Sincronizando...'}
                    {syncStatus === 'offline' && 'Offline (Salvo localmente)'}
                    {syncStatus === 'idle' && 'Pronto'}
                    {syncStatus === 'error' && 'Aguardando rede'}
                  </span>
                </div>

                <button
                  onClick={forceSyncNow}
                  className="flex items-center gap-1 text-slate-300 hover:text-white font-medium"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Sincronizar</span>
                </button>
              </div>

              {/* Disconnect Button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={disconnectDeviceSync}
                  className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 p-1"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  <span>Desconectar este dispositivo</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab 2: Connect another device */}
      {activeTab === 'connect' && (
        <form onSubmit={handleConnectSubmit} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-[#161922] border border-[#232836] text-xs text-slate-300 leading-relaxed">
            Informe o código exibido na tela do seu outro aparelho (computador ou celular) para unir seus dados instantaneamente.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Código de Pareamento
            </label>
            <input
              type="text"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value.toUpperCase())}
              placeholder="Ex: APRV-9K3F-X2"
              required
              className="w-full px-3.5 py-3 rounded-xl bg-[#161922] border border-[#282f42] text-center font-mono text-base font-bold tracking-widest text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 uppercase"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsSyncModalOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-[#1c202c] hover:bg-[#252b3b] text-slate-300 text-xs font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isConnecting || !inputKey.trim()}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-bold shadow-sm"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Conectando...</span>
                </>
              ) : (
                <>
                  <span>Conectar e Sincronizar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
