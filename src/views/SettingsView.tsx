import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { storageService } from '../services/storage';
import {
  User,
  Sun,
  Moon,
  Download,
  Trash2,
  ShieldAlert,
  Cloud,
  QrCode,
  Smartphone,
  Laptop,
  CheckCircle2,
  Database,
  Unlink,
} from 'lucide-react';
import { Modal } from '../components/Modal';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetAllData,
    exportDataCSV,
    exportDataJSON,
    sessions,
    subjects,
    syncKey,
    setIsSyncModalOpen,
    disconnectDeviceSync,
    addToast,
  } = useApp();

  const [userName, setUserName] = useState<string>(settings.userName);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(settings.dailyGoalMinutes);
  const [customEndpoint, setCustomEndpoint] = useState<string>(() => storageService.getCustomSyncEndpoint() || '');
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) return;
    updateSettings({
      userName: userName.trim(),
      dailyGoalMinutes: Math.max(1, dailyGoalMinutes),
    });
  };

  const handleSaveCustomEndpoint = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveCustomSyncEndpoint(customEndpoint.trim() || null);
    addToast('Servidor em Nuvem Atualizado', 'Endpoint de sincronização salvo.');
  };

  const handleToggleTheme = (theme: 'dark' | 'light') => {
    updateSettings({ theme });
  };

  const handleConfirmReset = () => {
    resetAllData();
    setShowClearConfirm(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Sincronização Cross-Device Sem Conta */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#17142b] via-[#12141f] to-[#10121a] border border-brand-500/30 shadow-glow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-brand-500/20 text-brand-300 flex items-center justify-center">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Sincronização Nuvem (PC & Celular)
            </h3>
            <p className="text-xs text-slate-400">
              Mantenha o APREVO atualizado em tempo real entre seus dispositivos sem criar conta.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0e1017] border border-[#232836] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-white">
              Status da Conexão:{' '}
              {syncKey ? (
                <span className="text-emerald-400 font-mono font-bold">Pareado ({syncKey})</span>
              ) : (
                <span className="text-slate-400">Apenas neste dispositivo</span>
              )}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {syncKey
                ? 'Sincronização automática ativa para sessões, matérias e revisões.'
                : 'Gere um código para conectar seu smartphone agora.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSyncModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-sm transition-all"
            >
              <QrCode className="w-4 h-4" />
              <span>{syncKey ? 'Ver Código / QR Code' : 'Conectar Celular'}</span>
            </button>
            {syncKey && (
              <button
                onClick={disconnectDeviceSync}
                className="p-2.5 rounded-xl bg-[#1c202c] hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition-colors"
                title="Desconectar"
              >
                <Unlink className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Custom Cloud Database Endpoint (Opcional para desenvolvedor / auto-hospedagem) */}
        <form onSubmit={handleSaveCustomEndpoint} className="mt-4 pt-4 border-t border-[#232836]">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              <span>Banco em Nuvem Personalizado (Opcional)</span>
            </label>
            <button type="submit" className="text-[11px] text-brand-400 hover:text-brand-300 font-medium">
              Salvar Endpoint
            </button>
          </div>
          <input
            type="text"
            value={customEndpoint}
            onChange={(e) => setCustomEndpoint(e.target.value)}
            placeholder="Padrão: Firebase RTDB público (Ou informe https://seu-projeto.firebaseio.com/rooms)"
            className="w-full px-3 py-2 rounded-xl bg-[#161922] border border-[#282f42] text-xs text-white placeholder-slate-600 font-mono focus:outline-none focus:border-brand-500"
          />
        </form>
      </div>

      {/* Profile & Name Card */}
      <div className="p-6 rounded-3xl bg-[#11131a] border border-[#232836]">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Perfil do Usuário</h3>
            <p className="text-xs text-slate-400">Identificação no dashboard e relatórios do APREVO</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nome ou Apelido
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
              placeholder="Seu nome"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#161922] border border-[#282f42] text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Meta Diária Padrão (Minutos)
            </label>
            <input
              type="number"
              min={10}
              max={1440}
              value={dailyGoalMinutes}
              onChange={(e) => setDailyGoalMinutes(parseInt(e.target.value) || 0)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#161922] border border-[#282f42] text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-sm transition-all"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>

      {/* Theme Selection */}
      <div className="p-6 rounded-3xl bg-[#11131a] border border-[#232836]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
            {settings.theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Tema & Visual</h3>
            <p className="text-xs text-slate-400">Escolha a aparência da interface</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleToggleTheme('dark')}
            className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
              settings.theme === 'dark'
                ? 'bg-brand-500/10 border-brand-500 text-white shadow-glow-sm'
                : 'bg-[#161922] border-[#282f42] text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-brand-400" />
              <div>
                <p className="text-xs font-bold text-white">Modo Escuro (Padrão)</p>
                <p className="text-[11px] text-slate-400">Minimalista escuro com destaque violeta</p>
              </div>
            </div>
            {settings.theme === 'dark' && <CheckCircle2 className="w-4 h-4 text-brand-400" />}
          </button>

          <button
            type="button"
            onClick={() => handleToggleTheme('light')}
            className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
              settings.theme === 'light'
                ? 'bg-brand-500/10 border-brand-500 text-white shadow-glow-sm'
                : 'bg-[#161922] border-[#282f42] text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Sun className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-xs font-bold text-white">Modo Claro</p>
                <p className="text-[11px] text-slate-400">Visual iluminado para ambientes abertos</p>
              </div>
            </div>
            {settings.theme === 'light' && <CheckCircle2 className="w-4 h-4 text-brand-400" />}
          </button>
        </div>
      </div>

      {/* Export & Backup */}
      <div className="p-6 rounded-3xl bg-[#11131a] border border-[#232836]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Exportação & Backup</h3>
            <p className="text-xs text-slate-400">
              Faça backup completo das suas sessões e matérias
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-[#161922] border border-[#282f42] flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-white">Planilha CSV</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Compatível com Excel, Numbers e Google Planilhas.
              </p>
            </div>
            <button
              onClick={exportDataCSV}
              className="mt-4 flex items-center justify-center gap-2 py-2 rounded-xl bg-[#202534] hover:bg-[#282f42] text-white text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar CSV</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-[#161922] border border-[#282f42] flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-white">Backup Completo JSON</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Exporta matérias, sessões, revisões e preferências.
              </p>
            </div>
            <button
              onClick={exportDataJSON}
              className="mt-4 flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone: Clear Data */}
      <div className="p-6 rounded-3xl bg-[#191114] border border-rose-500/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-rose-300 tracking-tight">Zona Crítica</h3>
            <p className="text-xs text-rose-400/80">Gerenciamento destrutivo de dados locais</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#201317] border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-white">Restaurar APREVO de Fábrica</p>
            <p className="text-[11px] text-rose-300/80 mt-0.5">
              Remove todas as sessões customizadas e reinicia com o modelo padrão.
            </p>
          </div>

          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>Limpar Dados</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Confirmar Limpeza de Dados"
        description="Esta ação apagará seus registros personalizados salvos no navegador e restaurará o estado inicial do APREVO."
        maxWidth="max-w-md"
      >
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            onClick={() => setShowClearConfirm(false)}
            className="px-4 py-2 rounded-xl bg-[#1c202c] hover:bg-[#252b3b] text-slate-300 text-xs font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmReset}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
          >
            Sim, Limpar Tudo
          </button>
        </div>
      </Modal>
    </div>
  );
};
