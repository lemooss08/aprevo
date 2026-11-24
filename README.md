# APREVO — Plataforma de Gestão de Estudos

**Desenvolvido por Antigravity.**

O APREVO é uma aplicação web (PWA) para organizar, acompanhar e evoluir nos estudos. Ele reúne cronômetro de sessões, registro de estudos, calendário, metas e estatísticas em uma interface responsiva, com tema claro e escuro e sincronização entre dispositivos sem necessidade de conta.

## Funcionalidades

- **Dashboard** — tempo estudado hoje, na semana e no total, barra da meta diária, gráfico dos últimos 7 dias e atividades recentes.
- **Cronômetro** — inicia, pausa, retoma, finaliza ou descarta sessões de estudo vinculadas a uma matéria, com tópico e observações.
- **Meus estudos** — histórico de sessões manuais e cronometradas, com filtros e exportação em CSV.
- **Calendário** — visualização dos dias com atividade.
- **Matérias** — cadastro de disciplinas com cor, descrição e gestão.
- **Estatísticas** — gráficos de pizza e barras com Recharts para distribuição de tempo e evolução.
- **Metas** — metas diárias e semanais de minutos de estudo, sequência de dias (streak) e conquistas.
- **Configurações** — nome, tema, metas, backup completo em JSON, exportação CSV e limpeza de dados.
- **Conta** — cadastro e login por nome de usuário e senha. Sessões, matérias e preferências acompanham a conta no computador e no celular.
- **PWA** — manifest, service worker, ícone e instalação no celular; funciona offline para os dados já carregados.
- **Feedback sonoro** — avisos sintetizados com a Web Audio API ao iniciar e concluir sessões.

## Firebase

Sem as variáveis do Firebase, o Aprevo abre em modo local e continua usando os estudos deste navegador.

1. No console do Firebase, crie ou selecione um projeto e registre um aplicativo Web.
2. Em Authentication, habilite o provedor E-mail/senha. O Aprevo usa internamente um endereço sintético derivado do nome de usuário. O cadastro pede apenas usuário e senha, sem recuperação por e-mail.
3. Crie um Realtime Database em modo bloqueado e publique `database.rules.json` em um banco dedicado ao Aprevo. Com o Firebase CLI autenticado, execute `firebase deploy --only database --project ID_DO_PROJETO`. Em um banco compartilhado, incorpore as regras sem substituir as de outros aplicativos. As regras vinculam cada conjunto de dados ao UID autenticado.
4. Copie `.env.example` para `.env.local` e preencha com os valores da configuração do aplicativo Web. Inclua a URL da instância de Realtime Database, sem o sufixo `.json`. Na Vercel, configure as mesmas variáveis antes de gerar o build de produção. Use somente os valores públicos do aplicativo Web, sem chaves de conta de serviço.
5. Usuários da versão anterior podem entrar na conta e importar matérias e sessões do navegador em **Configurações > Minha conta**. Cada navegador pode ter registros antigos diferentes. Os registros são mesclados pelos IDs originais.

Execute os testes automatizados com `npm test`.

Para verificar o cadastro e as regras localmente, inicie `firebase emulators:start --only auth,database --project demo-aprevo` e execute `npm test` com `APREVO_TEST_FIREBASE=1`.

## Tecnologias

| Camada | Tecnologia |
| --- | --- |
| Interface | React 19, TypeScript, Vite 6 |
| Estilização | Tailwind CSS 3, PostCSS, Autoprefixer |
| Gráficos | Recharts |
| Ícones | lucide-react |
| Utilitários | clsx, tailwind-merge |
| Armazenamento local | Web Storage API (`localStorage`) |
| Conta e dados | Firebase Authentication e Realtime Database |
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

A autenticação e a persistência em nuvem usam o Firebase. O navegador mantém um cache separado por conta.

## Estrutura

```
src/
├── components/   # Header, Sidebar, MobileNav, modais, toast
├── context/      # AppContext — estado global e ações
├── services/     # storage (localStorage) e integração com Firebase
├── types/        # interfaces Subject, StudySession e UserSettings
├── utils/        # formatação de datas/tempo e áudio
├── views/        # Dashboard, Timer, Estudos, Calendário,
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
