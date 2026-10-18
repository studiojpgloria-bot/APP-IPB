# Aplicativo Web da Igreja Presbiteriana Central (Mobile-First)

Aplicativo web moderno, responsivo e acolhedor para membros e visitantes da igreja, com navegação fluida em smartphones e computadores, leitura bíblica com anotações privadas, boletins interativos, aniversariantes do mês, banners de avisos e painel administrativo completo para o perfil Gestor.

> [!IMPORTANT]
> **Decisões confirmadas pelo usuário:**
> - **Paleta visual:** Verde sálvia suave (`#4A6B5D`), cinza quente (`#F4F3EF`), ardósia suave (`#2D3748`) e branco off-white acolhedor (`#FAF9F6`).
> - **Nome e Congregação inicial:** Igreja Presbiteriana Central.
> - **Modo da Bíblia na fase inicial:** Conexão direta com API externa configurável (com fallback elegante e robusto para testes imediatos sem travar a interface).
> - **Persistência de Dados (Fase de Testes):** Camada de armazenamento modular em `LocalStorage` com modelos tipados, imagens/PDFs comprimidos em memória e exportação/importação, pronta para ligar ao Firebase Firestore + Firebase Storage quando o usuário solicitar a subida para nuvem.

---

## 1. Visão Geral e Conceito

O aplicativo serve como a central de comunicação e espiritualidade da igreja no bolso de cada membro e visitante:
- **Perfil Usuário (Acesso Livre):** Não necessita de cadastro ou login prévio. Acessa a página inicial com banners informativos, leitura da Bíblia, boletins da semana, aniversariantes e dados de contato/pastores.
- **Perfil Gestor (Autenticado):** Login discreto via e-mail e senha (com credenciais de demonstração pré-configuradas no primeiro carregamento). Permite criar, editar e excluir todas as informações, banners, boletins e membros aniversariantes, além de alterar configurações gerais da igreja e chaves de API.

---

## 2. Experiência do Usuário e Design Visual

### Identidade e Estilo (Design Verde Sálvia & Acolhedor)
- **Cores principais:**
  - Primária: Verde Sálvia profundo (`#3F5E52` / `bg-emerald-900/90` refinado) para botões de destaque, cabeçalhos e detalhes nobres.
  - Secundária / Acentos: Ocre suave (`#C5A059`) e verde menta sálvia suave (`#E7EFEA`).
  - Fundo & Superfícies: Off-white linho (`#F9F8F5`), cartões em branco puro com bordas sutis em cinza quente (`border-stone-200/80`).
- **Ergonomia Mobile-First:**
  - **Barra de navegação inferior fixa:** Início, Bíblia, Boletim, Aniversariantes e Igreja (hitboxes com $\ge 44\text{px}$ para o polegar).
  - **Banner Topo:** Posicionado acima do cabeçalho da marca com altura contida para não comprometer a área útil de rolagem.
  - **Sem "AI Slop":** Tipografia serena, sem pílulas decorativas estáticas soltas, espaçamento generoso e legibilidade WCAG AA.
  - **Área do Gestor:** Acesso discreto no rodapé e no menu lateral do cabeçalho.

---

## 3. Arquitetura do Sistema e Fluxo de Dados

```
┌────────────────────────────────────────────────────────────────────────┐
│                        APLICAÇÃO WEB (REACT + TS)                      │
├──────────────────────────────────┬─────────────────────────────────────┤
│        VISÃO PÚBLICA (USUÁRIO)    │        PAINEL DO GESTOR (AUTH)      │
│  - Banner Topo Rotativo          │  - Gestão de Banners (3 posições)   │
│  - Cabeçalho & Menu              │  - Gestão de Boletins (PDF / Texto) │
│  - Atalhos rápidos dos módulos   │  - Aniversariantes & Import CSV     │
│  - Banner Meio Rotativo          │  - Dados da Igreja & Liderança      │
│  - Destaques (Boletim/Níver)     │  - Configurações do App & Bíblia API│
│  - Banner Rodapé                 │  - Upload/Compressão de Imagens/PDF │
│  - Rodapé com Link Gestor        │                                     │
├──────────────────────────────────┴─────────────────────────────────────┤
│                         MÓDULOS ESPECIALIZADOS                         │
│  [1. Bíblia API]   [2. Info Igreja]   [3. Boletim]   [4. Nívers]       │
│  - Navegação Livro │  - História/Cultos│ - Leitor PDF │ - Destaque Dia  │
│  - Busca Palavra   │  - Botão WhatsApp │ - Modo Texto │ - Seletor Mês   │
│  - Anotações Locais│  - Google Maps    │ - Download   │ - Filtros       │
│  - Favoritos       │  - Pastores/Fotos │              │                 │
├────────────────────────────────────────────────────────────────────────┤
│                      CAMADA DE SERVIÇOS & DADOS                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ ChurchStorageService (Abstração Unificada)                       │  │
│  │ - Estado Inicial Pré-populado (Igreja Presbiteriana Central)     │  │
│  │ - Persistência LocalStorage isolada                              │  │
│  │ - Pronto para Firebase Firestore / Storage (sem refatoração)     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────┐ ┌──────────────────────────────┐  │
│  │ BibleApiService                 │ │ AuthService (Gestor)         │  │
│  │ - URL Base & Chave Configurável │ │ - Sessão Gestor Persistente  │  │
│  │ - Cache local e Tratamento Erro │ │ - Logout e Proteção de Rotas │  │
│  └─────────────────────────────────┘ └──────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Detalhamento dos Módulos

### 1. Bíblia Sagrada
- **Navegação estruturada:** Seletor de Livro (Antigo e Novo Testamento), Capítulo e Versículo.
- **Busca rápida:** Busca por palavra-chave ou termo em tempo real.
- **Configurações de Leitura:** Aumento/diminuição de fonte (A- / A+) e alternância de modo claro / modo leitura sépia / escuro.
- **Anotações Pessoais Privadas:** Armazenadas exclusivamente no dispositivo do membro (`localStorage`), com listagem "Minhas Anotações", busca e edição.
- **Favoritos:** Marcador de versículos com coração/estrela salvos privadamente.
- **Provedor de API:** Conector flexível preparado para a API desejada pelo usuário com chave e endpoints ajustáveis diretamente na tela de configurações do Gestor ou variáveis de ambiente.

### 2. Informações da Igreja
- História, visão e declaração de fé.
- Horários dos cultos (Domingo manhã/noite, Quarta, Escola Bíblica, Jovens).
- Endereço físico integrado com botão direto para o Google Maps / Waze.
- Telefones, botão direto para conversa de WhatsApp com mensagem pré-preenchida, e-mail e links de redes sociais (YouTube, Instagram, Facebook).
- Galeria da Liderança Pastoral com fotos, nomes e cargos.

### 3. Boletim Informativo Semanal
- Lista cronológica com o boletim mais recente em destaque no topo da página inicial e da página de boletins.
- **Visualizador integrado:** Suporte para arquivos PDF com navegação embutida (rolagem, download e zoom) OU modo texto formatado com título, data, reflexão pastoral e avisos da semana.
- Gestor com upload de arquivo ou formulário de redação rápida.

### 4. Aniversariantes do Mês
- Destaque automático para os aniversariantes do dia atual com saudação carinhosa.
- Lista ordenada por dia do mês com fotos/avatares e idade opcional.
- Navegação entre meses (Janeiro a Dezembro).
- Gestor com formulário individual e importador inteligente de planilha CSV.

### 5. Banners de Divulgação (Topo, Meio e Rodapé)
- **Topo:** Acima do cabeçalho da igreja.
- **Meio:** Entre os atalhos dos módulos e as seções de destaque.
- **Rodapé:** No final da página antes dos direitos autorais.
- **Carrossel inteligente:** Rotação automática suave com temporizador se houver mais de 1 banner ativo na mesma posição, com suporte a links externos de eventos/inscrições.
- Ocultação automática se não houver banners ativos na posição.

### 6. Painel de Gestão (Perfil Gestor)
- Autenticação por e-mail e senha (`gestor@igreja.com.br` / `admin123` por padrão para teste imediato).
- Abas de controle: **Informações Gerais**, **Boletins**, **Aniversariantes**, **Banners** e **Configurações**.
- Formulários com validação, compressão de imagens em canvas para evitar travamento de memória e confirmação modal antes de exclusões.
