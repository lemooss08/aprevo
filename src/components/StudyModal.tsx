import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { StudySession } from '../types';
import { Modal } from './Modal';

interface StudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingSession?: StudySession | null;
}

export const StudyModal: React.FC<StudyModalProps> = ({
  isOpen,
  onClose,
  editingSession,
}) => {
  const { subjects, addSession, updateSession, setActiveTab } = useApp();

  const [formSubjectId, setFormSubjectId] = useState<string>('');
  const [formTopic, setFormTopic] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formMinutes, setFormMinutes] = useState<number>(45);
  const [formDate, setFormDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (editingSession) {
      setFormSubjectId(editingSession.subjectId);
      setFormTopic(editingSession.topic);
      setFormNotes(editingSession.notes || '');
      setFormMinutes(Math.round(editingSession.durationSeconds / 60));
      setFormDate(new Date(editingSession.startedAt).toISOString().slice(0, 10));
    } else {
      setFormSubjectId(subjects[0]?.id || '');
      setFormTopic('');
      setFormNotes('');
      setFormMinutes(45);
      setFormDate(new Date().toISOString().slice(0, 10));
    }
  }, [editingSession, isOpen, subjects]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubjectId || !formTopic.trim() || formMinutes <= 0) return;

    const startDate = new Date(`${formDate}T12:00:00`);
    const endDate = new Date(startDate.getTime() + formMinutes * 60 * 1000);

    if (editingSession) {
      updateSession(editingSession.id, {
        subjectId: formSubjectId,
        topic: formTopic.trim(),
        notes: formNotes.trim(),
        durationSeconds: formMinutes * 60,
        startedAt: startDate.toISOString(),
        endedAt: endDate.toISOString(),
      });
    } else {
      addSession({
        subjectId: formSubjectId,
        topic: formTopic.trim(),
        notes: formNotes.trim(),
        durationSeconds: formMinutes * 60,
        startedAt: startDate.toISOString(),
        endedAt: endDate.toISOString(),
        type: 'manual',
      });
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingSession ? 'Editar Registro de Estudo' : 'Registrar Conteúdo Estudado'}
      description="Salve os detalhes do que você estudou para manter seu histórico sempre atualizado"
    >
      {subjects.length === 0 ? (
        <div className="text-center py-6 px-4 bg-[#2c2c2c] rounded-2xl border border-dashed border-[#414141]">
          <p className="text-sm font-semibold text-slate-200">Nenhuma matéria cadastrada</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Para registrar conteúdos estudados, primeiro crie sua primeira matéria ou disciplina.
          </p>
          <button
            type="button"
            onClick={() => {
              onClose();
              setActiveTab('subjects');
            }}
            className="px-4 py-2.5 rounded-xl button-primary text-xs font-semibold shadow-sm transition-all"
          >
            + Cadastrar Primeira Matéria
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
        {/* Matéria */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Matéria / Disciplina *
          </label>
          <select
            value={formSubjectId}
            onChange={(e) => setFormSubjectId(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#2c2c2c] border border-[#414141] text-sm text-white focus:outline-none focus:border-brand-500"
          >
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        {/* Assunto / Tópico */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Assunto ou Conteúdo Estudado *
          </label>
          <input
            type="text"
            value={formTopic}
            onChange={(e) => setFormTopic(e.target.value)}
            required
            placeholder="Ex: Resolução de exercícios de Álgebra Linear"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#2c2c2c] border border-[#414141] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Tempo Dedicado e Data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tempo Dedicado (minutos) *
            </label>
            <input
              type="number"
              min={1}
              max={1440}
              value={formMinutes}
              onChange={(e) => setFormMinutes(Math.max(1, parseInt(e.target.value) || 0))}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#2c2c2c] border border-[#414141] text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Data do Estudo *
            </label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#2c2c2c] border border-[#414141] text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Descrição ou Resumo */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Descrição ou Resumo dos Conceitos
          </label>
          <textarea
            rows={3}
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
            placeholder="Principais fórmulas, insights, dúvidas pendentes..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#2c2c2c] border border-[#414141] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none"
          />
        </div>

        {/* Modal Buttons */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-[#303030] hover:bg-[#3c3c3c] text-slate-300 text-xs font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl button-primary text-xs font-bold shadow-sm"
          >
            {editingSession ? 'Salvar Alterações' : 'Salvar Registro'}
          </button>
        </div>
      </form>
      )}
    </Modal>
  );
};
