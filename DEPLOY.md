# Guia de Publicação na Vercel (DEPLOY.md)

Este guia em português explica passo a passo como publicar e configurar a plataforma **Minha Igreja** na **Vercel**, garantindo que o banco de dados **Firebase Firestore**, o login (**Firebase Authentication**) e os links diretos de cada igreja (`/{slug}`, `/{slug}/gestor` e `/admin`) funcionem perfeitamente.

---

## 1. Configurar as Variáveis de Ambiente na Vercel

Para que o site publicado na Vercel se conecte ao mesmo banco de dados Firebase do Google AI Studio, adicione as variáveis de ambiente abaixo no painel da Vercel:

1. Acesse o projeto na [Vercel](https://vercel.com/dashboard).
2. Vá em **Settings** > **Environment Variables**.
3. Adicione cada uma das chaves abaixo (marque os ambientes **Production**, **Preview** e **Development**):

```env
VITE_FIREBASE_PROJECT_ID="canvas-bond-lw2pc"
VITE_FIREBASE_APP_ID="1:297867672903:web:56b71a838bbabc4c646062"
VITE_FIREBASE_API_KEY="AIzaSyAasLQikCrSM-DI6aFa-6fbfC2Rz7rvgGo"
VITE_FIREBASE_AUTH_DOMAIN="canvas-bond-lw2pc.firebaseapp.com"
VITE_FIREBASE_DATABASE_ID="ai-studio-igrejapresbiteri-8718d383-eb17-4ffa-8449-e0164abf2773"
VITE_FIREBASE_STORAGE_BUCKET="canvas-bond-lw2pc.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="297867672903"
```

> **Dica:** Você também pode copiar esse bloco diretamente dentro do app em **Portal do Gestor > aba "Backup & Vercel" > botão "Copiar Variáveis .env"**.
> Após salvar as variáveis na Vercel, vá na aba **Deployments** e clique em **Redeploy** no último deploy para aplicar as variáveis.

---

## 2. Adicionar o Domínio da Vercel no Firebase Auth (Domínios Autorizados)

Para que o login com **Google** e **E-mail/Senha** funcione no endereço da Vercel sem erro de domínio não autorizado (`auth/unauthorized-domain`):

1. Abra o [Firebase Console](https://console.firebase.google.com/) e selecione o projeto **`canvas-bond-lw2pc`**.
2. No menu lateral, clique em **Authentication** > aba **Sign-in method**:
   - Certifique-se de que os provedores **Google** e **E-mail/senha** estejam **Ativados**.
3. Ainda em **Authentication**, clique na aba **Settings** (Configurações) > **Authorized domains** (Domínios autorizados).
4. Clique em **Add domain** (Adicionar domínio) e insira o domínio gerado pela Vercel (ex.: `seu-projeto.vercel.app`) e, se tiver domínio próprio, adicione-o também (ex.: `minhaigreja.com.br`).

---

## 3. Como Publicar as Regras de Segurança (`firestore.rules`)

O arquivo [`firestore.rules`](./firestore.rules) na raiz do projeto garante:
- **Leitura pública (`allow read`)**: apenas para igrejas com `status == 'ativa'`.
- **Nível Administrador (`isChurchAdmin`)**: pode editar dados institucionais da igreja, horários de culto (`cultos`), liderança (`lideranca`), gerenciar a aba **Equipe** (convidar/alterar nível/remover colaboradores) e publicar conteúdos.
- **Nível Editor (`isChurchEditor`)**: pode criar, editar e publicar **boletins**, **escalas de diáconos**, **aniversariantes** e **banners**, mas não pode alterar dados institucionais da igreja nem a equipe.
- **Owner da Plataforma (`studiojpgloria@gmail.com`)**: acesso administrativo total em `/admin`, incluindo aprovar, bloquear, excluir igrejas ou zerar todos os dados da plataforma.

### Opção A — Publicar pelo Console do Firebase (Mais rápido)
1. Acesse o [Firebase Console](https://console.firebase.google.com/) > projeto **`canvas-bond-lw2pc`**.
2. Vá em **Firestore Database** > selecione o banco de dados **`ai-studio-igrejapresbiteri-8718d383-eb17-4ffa-8449-e0164abf2773`**.
3. Clique na aba **Rules** (Regras).
4. Copie todo o conteúdo do arquivo [`firestore.rules`](./firestore.rules) deste repositório, cole no editor e clique em **Publish** (Publicar).

### Opção B — Publicar via Firebase CLI (Terminal)
Se você utiliza a CLI do Firebase instalada na sua máquina:
```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules --project canvas-bond-lw2pc
```

---

## 4. Configuração de Rotas SPA na Vercel (`vercel.json`)

Para que os links diretos de cada igreja (como `https://seu-dominio.vercel.app/ip-aracaju-se`, `https://seu-dominio.vercel.app/ip-aracaju-se/gestor` e `https://seu-dominio.vercel.app/admin`) funcionem ao abrir direto pelo link, pelo QR Code ou ao recarregar a página (F5) sem retornar erro `404 Not Found`, o projeto já inclui o arquivo [`vercel.json`](./vercel.json) configurado na raiz:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Mantenha este arquivo `vercel.json` na raiz do repositório ao enviar para o GitHub/Vercel.

---

## 5. Checklist Rápido Pós-Publicação

1. **Tela Inicial (`/`)**: Deve abrir com o título **"Minha Igreja"** e a lista **"Igrejas Cadastradas"** vazia (pronta para o primeiro cadastro).
2. **Painel do Owner (`/admin`)**: Entre com `studiojpgloria@gmail.com` para configurar o nome da plataforma, gerenciar igrejas ou utilizar o botão **"Apagar todos os dados da plataforma"** (digitando `APAGAR`) sempre que quiser reiniciar o banco do zero.
3. **Cadastro da Igreja e Equipe (`/{slug}/gestor`)**: Cadastre a igreja, copie o link direto ou imprima o QR Code, e use a aba **Equipe** para convidar **Administradores** e **Editores** por e-mail.
