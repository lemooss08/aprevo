import { Subject, StudySession, UserSettings, ActiveTimerState, ReviewItem, SyncPayload } from '../types';

const STORAGE_KEYS = {
  SUBJECTS: 'aprevo_subjects_v1',
  SESSIONS: 'aprevo_sessions_v1',
  REVIEWS: 'aprevo_reviews_v1',
  SETTINGS: 'aprevo_settings_v1',
  TIMER: 'aprevo_timer_v1',
  SYNC_KEY: 'aprevo_synckey_v1',
  CUSTOM_SYNC_ENDPOINT: 'aprevo_sync_endpoint_v1',
};

export const DEFAULT_SUBJECT_COLORS = [
  '#8b5cf6', // Violeta APREVO
  '#3b82f6', // Azul
  '#06b6d4', // Ciano
  '#10b981', // Esmeralda
  '#f59e0b', // Âmbar
  '#ef4444', // Vermelho
  '#ec4899', // Rosa
  '#6366f1', // Índigo
];

const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'subj-1',
    name: 'Engenharia de Software',
    color: '#8b5cf6',
    description: 'Arquitetura limpa, microsserviços, Design Patterns e boas práticas',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'subj-2',
    name: 'Algoritmos & Estruturas de Dados',
    color: '#3b82f6',
    description: 'Árvores, grafos, complexidade Big-O e programação dinâmica',
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'subj-3',
    name: 'Banco de Dados & SQL',
    color: '#06b6d4',
    description: 'Modelagem relacional, PostgreSQL, índices e otimização de queries',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'subj-4',
    name: 'Inteligência Artificial & LLMs',
    color: '#10b981',
    description: 'Redes neurais, RAG, prompt engineering e agentes autônomos',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'subj-5',
    name: 'Matemática Discreta & Estatística',
    color: '#f59e0b',
    description: 'Probabilidade, grafos, lógica proposicional e combinatória',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

function generateSeedSessions(): StudySession[] {
  const sessions: StudySession[] = [];
  const now = new Date();

  const presets = [
    { subId: 'subj-1', topic: 'Arquitetura Hexagonal & DDD', min: 90, notes: 'Ports & adapters e separação limpa de camadas.' },
    { subId: 'subj-2', topic: 'Grafos: Dijkstra & Busca em Largura', min: 75, notes: 'Implementação de algoritmo em TypeScript.' },
    { subId: 'subj-4', topic: 'Arquitetura de Transformers & Atenção', min: 110, notes: 'Estudo do mecanismo Multi-Head Attention.' },
    { subId: 'subj-3', topic: 'Tuning de Índices B-Tree no Postgres', min: 60, notes: 'Análise de planos de execução com EXPLAIN ANALYZE.' },
    { subId: 'subj-1', topic: 'Clean Code & SOLID na Prática', min: 50, notes: 'Refatoração com SRP e injeção de dependência.' },
    { subId: 'subj-5', topic: 'Distribuições Contínuas & Bayes', min: 80, notes: 'Resolução de problemas de probabilidade condicional.' },
    { subId: 'subj-4', topic: 'Avaliação de RAG & Métricas Ragas', min: 95, notes: 'Pipeline de validação com ground truth.' },
    { subId: 'subj-2', topic: 'Árvores Rubro-Negras & AVL', min: 65, notes: 'Balanceamento e rotações esquerda/direita.' },
    { subId: 'subj-3', topic: 'Transações ACID & Níveis de Isolamento', min: 70, notes: 'Simulação de concorrência e dirty reads.' },
    { subId: 'subj-1', topic: 'Microsserviços: Saga Pattern & Event-Driven', min: 85, notes: 'Comunicação assíncrona entre serviços.' },
    { subId: 'subj-4', topic: 'Fine-Tuning com LoRA / QLoRA', min: 120, notes: 'Preparação de dataset e treinamento quantizado.' },
    { subId: 'subj-2', topic: 'Dynamic Programming: Knapsack & LCS', min: 90, notes: 'Exercícios clássicos resolvidos com memoization.' },
  ];

  for (let i = 0; i < presets.length; i++) {
    const p = presets[i];
    const daysAgo = Math.floor(i / 1.3);
    const sessionDate = new Date(now.getTime() - daysAgo * 86400000 - 3600000 * (i % 5));
    const durationSec = p.min * 60;
    const endDate = new Date(sessionDate.getTime() + durationSec * 1000);

    sessions.push({
      id: `seed-session-${i + 1}`,
      subjectId: p.subId,
      topic: p.topic,
      notes: p.notes,
      durationSeconds: durationSec,
      startedAt: sessionDate.toISOString(),
      endedAt: endDate.toISOString(),
      type: i % 3 === 0 ? 'manual' : 'timer',
      updatedAt: endDate.toISOString(),
    });
  }

  return sessions;
}

function generateSeedReviews(): ReviewItem[] {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const in3Days = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);

  return [
    {
      id: 'rev-1',
      subjectId: 'subj-4',
      topic: 'Arquitetura de Transformers & Atenção',
      stage: 1, // 3 dias
      intervals: [1, 3, 7, 15, 30],
      nextReviewDate: today,
      notes: 'Relembrar a fórmula de Softmax((QK^T) / sqrt(d_k)) e multi-head.',
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      status: 'pending',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'rev-2',
      subjectId: 'subj-1',
      topic: 'Clean Code: Princípio Open/Closed (OCP)',
      stage: 2, // 7 dias
      intervals: [1, 3, 7, 15, 30],
      nextReviewDate: tomorrow,
      notes: 'Extensibilidade sem modificação de código estável.',
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      status: 'pending',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'rev-3',
      subjectId: 'subj-2',
      topic: 'Grafos: Diferença entre Dijkstra e Bellman-Ford',
      stage: 0, // 1 dia
      intervals: [1, 3, 7, 15, 30],
      nextReviewDate: in3Days,
      notes: 'Pesos negativos requerem Bellman-Ford.',
      createdAt: new Date().toISOString(),
      status: 'pending',
      updatedAt: new Date().toISOString(),
    },
  ];
}

export const DEFAULT_SETTINGS: UserSettings = {
  userName: 'Estudante APREVO',
  theme: 'dark',
  dailyGoalMinutes: 120, // 2 horas
  weeklyGoalMinutes: 720, // 12 horas
};

export const storageService = {
  getSubjects(): Subject[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(INITIAL_SUBJECTS));
      return INITIAL_SUBJECTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_SUBJECTS;
    }
  },

  saveSubjects(subjects: Subject[]): void {
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
  },

  getSessions(): StudySession[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (!raw) {
      const initial = generateSeedSessions();
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(initial));
      return initial;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveSessions(sessions: StudySession[]): void {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  },

  getReviews(): ReviewItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    if (!raw) {
      const initial = generateSeedReviews();
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(initial));
      return initial;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveReviews(reviews: ReviewItem[]): void {
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
  },

  getSettings(): UserSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: UserSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  getActiveTimer(): ActiveTimerState | null {
    const raw = localStorage.getItem(STORAGE_KEYS.TIMER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  saveActiveTimer(timer: ActiveTimerState | null): void {
    if (!timer) {
      localStorage.removeItem(STORAGE_KEYS.TIMER);
    } else {
      localStorage.setItem(STORAGE_KEYS.TIMER, JSON.stringify(timer));
    }
  },

  getSyncKey(): string | null {
    return localStorage.getItem(STORAGE_KEYS.SYNC_KEY);
  },

  saveSyncKey(key: string | null): void {
    if (!key) {
      localStorage.removeItem(STORAGE_KEYS.SYNC_KEY);
    } else {
      localStorage.setItem(STORAGE_KEYS.SYNC_KEY, key);
    }
  },

  getCustomSyncEndpoint(): string | null {
    return localStorage.getItem(STORAGE_KEYS.CUSTOM_SYNC_ENDPOINT);
  },

  saveCustomSyncEndpoint(url: string | null): void {
    if (!url) {
      localStorage.removeItem(STORAGE_KEYS.CUSTOM_SYNC_ENDPOINT);
    } else {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_SYNC_ENDPOINT, url);
    }
  },

  getFullBackupData() {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      subjects: this.getSubjects(),
      sessions: this.getSessions(),
      reviews: this.getReviews(),
      settings: this.getSettings(),
    };
  },

  exportToCSV(sessions: StudySession[], subjects: Subject[]): void {
    const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));
    const headers = ['ID', 'Matéria', 'Conteúdo / Tópico', 'Duração (Min)', 'Data Início', 'Data Fim', 'Tipo', 'Observações'];

    const rows = sessions.map((s) => [
      s.id,
      `"${(subjectMap.get(s.subjectId) || 'Outros').replace(/"/g, '""')}"`,
      `"${s.topic.replace(/"/g, '""')}"`,
      Math.round(s.durationSeconds / 60),
      s.startedAt,
      s.endedAt,
      s.type,
      `"${(s.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `aprevo_estudos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.SUBJECTS);
    localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.REVIEWS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.TIMER);
    localStorage.removeItem(STORAGE_KEYS.SYNC_KEY);
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_SYNC_ENDPOINT);
  },
};
