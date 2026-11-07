# Reset Completo das Informações Padrão do Sistema (Configuração do Zero pelo Gestor)

Este plano remove todos os dados fictícios/demonstrativos do sistema (informações da igreja, cultos, pastores/líderes, boletins, escalas diaconais, aniversariantes, banners, notas e versículos favoritos de exemplo da Bíblia), entregando o aplicativo totalmente limpo para que o Gestor configure cada seção do zero, mantendo sua conta de **1º Gestor Principal** ativa e aprovada no Firebase.

## User Review & Critical Decisions

> [!IMPORTANT]
> As decisões abaixo refletem exatamente as suas escolhas confirmadas:

- **Dados Padrão Totalmente Zerados**: Todas as listas e campos iniciais (Informações da Igreja, Horários de Cultos, Pastores/Liderança, Boletins, Escala de Diáconos, Aniversariantes e Banners) passarão a iniciar vazios (`[]` e campos em branco), atualizando a versão das chaves de armazenamento local para que o estado limpo entre em vigor imediatamente.
- **Bíblia Sagrada Sem Exemplos Pré-Carregados**: As anotações pessoais e os versículos favoritos de demonstração iniciarão vazios (`[]`), mantendo apenas o texto bíblico completo dos 66 livros para leitura e pesquisa.
- **Conta de 1º Gestor Preservada**: O registro de titularidade (`church_config/registry`) e sua conta aprovada em `church_managers` permanecem intactos no Firebase, além de incluir um botão rápido no Painel do Gestor (**"Zerar / Limpar Conteúdo no Banco"**) caso deseje limpar também dados antigos que já tenham sido gravados na nuvem anteriormente.

---

## 1. Overview & Core Concept

- **O Que Faz**: Transforma o aplicativo em uma plataforma limpa (estado zero), sem textos, fotos, telefones ou membros de demonstração pré-preenchidos, pronta para receber os dados reais da sua igreja.
- **Público-Alvo**: O Gestor Principal da igreja (que fará o preenchimento inicial de cada módulo) e os membros/visitantes (que verão avisos elegantes de *"Em atualização pela secretaria da igreja"* nas seções ainda não preenchidas).
- **Valor Principal**: Evita que informações fictícias apareçam misturadas com os dados reais da igreja ou precisem ser excluídas item por item manualmente.

---

## 2. User Experience & Visual Design

- **Fluxo do Gestor e Visitantes no Estado Vazio (Zero-State)**:
  1. **Informações da Igreja, Cultos e Liderança**: Campos de endereço, história, missão, redes sociais, WhatsApp e logotipo iniciam em branco; listas de horários de cultos e liderança iniciam com `0` itens, exibindo um estado vazio orientativo com atalho direto para o Gestor cadastrar.
  2. **Boletins, Escala de Diáconos, Aniversariantes e Banners**: Iniciam com `0` registros cadastrados. Os espaços de banners (`topo`, `meio`, `rodape`) ficam automaticamente ocultos quando vazios, e as páginas públicas exibem cartões limpos informando que ainda não há registros publicados.
  3. **Bíblia Sagrada**: O leitor bíblico continua 100% funcional com os 66 livros, mas as abas *"Minhas Notas"* e *"Favoritos"* começam com `0` itens até que o próprio usuário salve suas marcações.
- **Identidade Visual & Tema**:
  - *Direção Estética*: Editorial acolhedor e reverente (Mobile-First PWA com expansão multi-coluna até `1152px` no desktop).
  - *Paleta de Cores*: Superfície principal em marfim suave (`#FAF9F6`), cartões estruturais em branco puro (`#FFFFFF`) com bordas sutis (`border-stone-200`), cor primária institucional Verde Presbiteriano (`#344E41`) e destaque sóbrio em ocre (`#B08938`).
  - *Tipografia & Hierarquia*: Títulos em serifada clássica e interface funcional em sans-serif limpa, com controles de linha única (`whitespace-nowrap`) e áreas de toque mínimas de `44x44px`.
- **Feedback Interativo**:
  - Estados vazios claros em todas as telas públicas e no painel do Gestor, sem imagens quebradas ou links de WhatsApp/Maps inválidos quando os números/links ainda estiverem em branco.

---

## 3. Key Product Decisions & Trade-Offs

- **Decisão 1: Atualização de Versão do Cache Inicial + Sincronização com Nuvem**
  - *Abordagem Escolhida*: Definir `INITIAL_CHURCH_INFO`, `INITIAL_BULLETINS`, `INITIAL_BIRTHDAYS`, `INITIAL_DEACON_SCHEDULES`, `INITIAL_BANNERS`, `getInitialNotes()` e `getInitialFavorites()` como vazios e incrementar as chaves do `localStorage` (`v3`), além de disponibilizar a ação **"Limpar / Zerar Conteúdo da Igreja"** no Painel do Gestor para sobrescrever na nuvem qualquer dado de exemplo antigo.
  - *Por quê*: Garante que qualquer novo acesso já carregue o sistema 100% em branco e permite ao 1º Gestor limpar também o documento `church_data` no Firestore com 1 clique sem perder seu login.
- **Decisão 2: Proteção Visual para Campos de Contato Não Preenchidos**
  - *Abordagem Escolhida*: Ocultar ou desabilitar automaticamente botões de *"Falar no WhatsApp"*, *"Como Chegar (Google Maps)"* e ícones de redes sociais na tela inicial, rodapé e página da igreja enquanto o gestor ainda não tiver configurado esses links/números.
  - *Por quê*: Impede que visitantes cliquem em botões que levem a links vazios antes da configuração pelo Gestor.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ESTADO INICIAL LIMPO (ZERO-STATE)                    │
│  • ChurchInfo: campos em branco, schedules: [], leadership: []          │
│  • Bulletins: []  |  Birthdays: []  |  Deacons: []  |  Banners: []      │
│  • Bible Notes: []  |  Bible Favorites: []                              │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   CONTEXTO GLOBAL & FIREBASE FIRESTORE                  │
│  • Preserva church_config/registry & church_managers (1º Gestor ativo)  │
│  • Sincroniza cadastros feitos pelo Gestor em tempo real (church_data)  │
└───────────────┬─────────────────────────────────────────┬───────────────┘
                │                                         │
                ▼                                         ▼
┌───────────────────────────────────┐   ┌─────────────────────────────────┐
│       VISÃO PÚBLICA (PWA)         │   │        PAINEL DO GESTOR         │
│  • Exibe estados vazios elegantes │   │  • Formulários limpos prontos   │
│    quando listas estão vazias     │   │    para configuração item a item│
│  • Oculta botões WhatsApp/Maps    │   │  • Botão rápido para limpar     │
│    até serem preenchidos          │   │    dados de exemplo na nuvem    │
└───────────────────────────────────┘   └─────────────────────────────────┘
```

- **Data Model & State**:
  - `INITIAL_CHURCH_INFO`: `name: ''`, `tagline: ''`, `aboutHistory: ''`, `missionVision: ''`, `address: ''`, `cityStateZip: ''`, `googleMapsUrl: ''`, `primaryPhone: ''`, `secondaryPhone: ''`, `whatsappNumber: ''`, `email: ''`, `instagramUrl: ''`, `youtubeUrl: ''`, `facebookUrl: ''`, `logoUrl: ''`, `schedules: []`, `leadership: []`.
  - `INITIAL_BULLETINS`, `INITIAL_BIRTHDAYS`, `INITIAL_DEACON_SCHEDULES`, `INITIAL_BANNERS`: todos iniciam como `[]`.
  - `getInitialNotes()` e `getInitialFavorites()`: retornam `[]` (sem criar notas ou favoritos de demonstração quando o `localStorage` estiver vazio).
- **Interactive Component & State Mapping**:
  - **Cabeçalho (`Navbar`), Rodapé (`Footer`), Tela Inicial (`HomeView`) e Página da Igreja (`ChurchInfoView`)**: exibem um placeholder discreto (*"Nome da Igreja — Configurar no Gestor"*) caso `churchInfo.name` ainda esteja vazio e renderizam mensagens de estado vazio para Horários de Cultos e Liderança quando `schedules.length === 0` ou `leadership.length === 0`.
  - **Painel do Gestor (`ManagerView` & `ChurchContext`)**: inclui a função `resetAllChurchContentToBlank()` para que o 1º Gestor possa zerar instantaneamente também os documentos de conteúdo que já estavam salvos no Firestore, mantendo sua conta de administrador conectada.
