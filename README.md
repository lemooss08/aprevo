# APREVO — Plataforma de Gestão de Estudos

**Desenvolvido por Antigravity.**

O APREVO é uma aplicação web (PWA) para organizar, acompanhar e evoluir nos estudos. Ele reúne cronômetro de sessões, registro de estudos, revisões espaçadas, calendário, metas e estatísticas em uma interface responsiva, com tema claro e escuro e sincronização entre dispositivos sem necessidade de conta.

## Funcionalidades

- **Dashboard** — tempo estudado hoje, na semana e no total, barra da meta diária, gráfico dos últimos 7 dias e atividades recentes.
- **Cronômetro** — inicia, pausa, retoma, finaliza ou descarta sessões de estudo vinculadas a uma matéria, com tópico e observações.
- **Meus estudos** — histórico de sessões manuais e cronometradas, com filtros e exportação em CSV.
- **Revisões** — sistema de repetição espaçada com intervalos de 1, 3, 7, 15 e 30 dias e indicador de revisões pendentes.
- **Calendário** — visualização dos dias com atividade.
- **Matérias** — cadastro de disciplinas com cor, descrição e gestão.
- **Estatísticas** — gráficos de pizza e barras com Recharts para distribuição de tempo e evolução.
- **Metas** — metas diárias e semanais de minutos de estudo, sequência de dias (streak) e conquistas.
- **Configurações** — nome, tema, metas, backup completo em JSON, exportação CSV e limpeza de dados.
- **Sincronização** — pareamento entre dispositivos por código (`APRV-XXXX-XX`) usando Firebase Realtime Database, com endpoint customizável e merge dos dados por ID e data de atualização.
- **PWA** — manifest, service worker, ícone e instalação no celular; funciona offline para os dados já carregados.
- **Feedback sonoro** — avisos sintetizados com a Web Audio API ao iniciar e concluir sessões.

Os dados ficam no `localStorage` do navegador por padrão. A sincronização em nuvem é opcional.

## Tecnologias

| Camada | Tecnologia |
| --- | --- |
| Interface | React 19, TypeScript, Vite 6 |
| Estilização | Tailwind CSS 3, PostCSS, Autoprefixer |
| Gráficos | Recharts |
| Ícones | lucide-react |
| Utilitários | clsx, tailwind-merge, qrcode |
| Armazenamento local | Web Storage API (`localStorage`) |
| Sincronização | Firebase Realtime Database (REST) |
| PWA | Web App Manifest, Service Worker |
| Áudio | Web Audio API |
| Tipografia | Plus Jakarta Sans e JetBrains Mono (Google Fonts) |
| Deploy | Vercel (configurado em `vercel.json`) |

## Linguagens utilizadas

- **TypeScript** — toda a lógica da aplicação: componentes, telas, contexto, serviços, tipos e utilitários (`src/`).
- **TSX** — componentes React com JSX tipado.
- **CSS** — estilos Tailwind e estilos base/globais em `src/index.css`.
- **HTML** — `index.html`, base da aplicação e metadados da PWA.
- **JavaScript** — arquivos de configuração `tailwind.config.js` e `postcss.config.js`.
- **JSON** — `package.json`, `tsconfig.json`, `vercel.json` e `public/manifest.webmanifest`.
- **Batch** — `iniciar.bat`, atalho para subir o servidor local no Windows.

Não há backend próprio: a persistência é local e a sincronização usa o Firebase via REST.

## Estrutura

```
src/
├── components/   # Header, Sidebar, MobileNav, modais, toast
├── context/      # AppContext — estado global e ações
├── services/     # storage (localStorage) e syncService (Firebase)
├── types/        # interfaces Subject, StudySession, ReviewItem etc.
├── utils/        # formatação de datas/tempo e áudio
├── views/        # Dashboard, Timer, Estudos, Revisões, Calendário,
│                 # Matérias, Estatísticas, Metas, Configurações
├── App.tsx       # layout e troca de telas
├── index.css     # estilos globais + Tailwind
└── main.tsx      # ponto de entrada
```

## Como executar

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173/`.

No Windows, também é possível dar duplo clique em `iniciar.bat`.

Para gerar a versão de produção:

```bash
npm run build
npm run preview
```

O deploy na Vercel usa o framework Vite com rewrite de todas as rotas para `index.html`.
