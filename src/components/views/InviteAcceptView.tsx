import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Church,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User as UserIcon
} from 'lucide-react';
import { auth } from '../../config/firebase';
import { useChurch } from '../../context/ChurchContext';
import {
  CloudChurchService,
  EMAIL_FOR_SIGN_IN_STORAGE_KEY
} from '../../services/cloudDatabase';
import { ChurchTenant, TeamRole } from '../../types';

export function translateFirebaseAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  const message = (err as { message?: string })?.message || String(err || '');

  if (
    code === 'auth/invalid-action-code' ||
    message.includes('auth/invalid-action-code') ||
    message.includes('invalid-action-code')
  ) {
    return 'Este link já foi usado ou expirou. Peça um novo convite ao gestor ou entre abaixo.';
  }
  if (
    code === 'auth/expired-action-code' ||
    message.includes('auth/expired-action-code') ||
    message.includes('expired-action-code')
  ) {
    return 'Este link expirou. Peça um novo convite ao gestor ou entre abaixo.';
  }
  if (code === 'auth/invalid-email' || message.includes('auth/invalid-email')) {
    return 'Endereço de e-mail inválido. Verifique o e-mail digitado.';
  }
  if (code === 'auth/user-disabled' || message.includes('auth/user-disabled')) {
    return 'Esta conta de usuário foi desativada pelo administrador.';
  }
  if (code === 'auth/user-not-found' || message.includes('auth/user-not-found')) {
    return 'Nenhuma conta encontrada com este e-mail. Crie uma senha abaixo para ativar seu acesso.';
  }
  if (code === 'auth/wrong-password' || message.includes('auth/wrong-password')) {
    return 'Senha incorreta. Verifique sua senha ou entre com Google.';
  }
  if (
    code === 'auth/invalid-credential' ||
    message.includes('auth/invalid-credential')
  ) {
    return 'Credenciais inválidas. Verifique seu e-mail e senha e tente novamente.';
  }
  if (
    code === 'auth/email-already-in-use' ||
    message.includes('auth/email-already-in-use')
  ) {
    return 'Este e-mail já possui uma conta cadastrada. Digite sua senha existente para entrar.';
  }
  if (code === 'auth/weak-password' || message.includes('auth/weak-password')) {
    return 'A senha deve ter pelo menos 6 caracteres.';
  }
  if (
    code === 'auth/too-many-requests' ||
    message.includes('auth/too-many-requests')
  ) {
    return 'Muitas tentativas sem sucesso. Por segurança, aguarde alguns instantes e tente novamente.';
  }
  if (
    code === 'auth/popup-closed-by-user' ||
    message.includes('auth/popup-closed-by-user')
  ) {
    return 'O pop-up de login foi fechado antes de concluir a autorização.';
  }
  if (
    code === 'auth/cancelled-popup-request' ||
    message.includes('auth/cancelled-popup-request')
  ) {
    return 'Operação de login cancelada.';
  }
  if (
    code === 'auth/network-request-failed' ||
    message.includes('auth/network-request-failed')
  ) {
    return 'Erro de conexão com o Firebase. Verifique sua internet e tente novamente.';
  }

  if (message && !message.startsWith('Firebase:') && !message.includes('auth/')) {
    return message;
  }
  return 'Ocorreu um erro ao validar o acesso. Tente novamente ou entre com sua Conta Google.';
}

const getOobCodeFromUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get('oobCode') || null;
  } catch {
    return null;
  }
};

export const InviteAcceptView: React.FC = () => {
  const {
    firebaseUser,
    isEmailVerified,
    selectChurchBySlug,
    loginWithGoogleCloud,
    showToast
  } = useChurch();

  const searchParams =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const targetSlug = (searchParams?.get('igreja') || '').trim().toLowerCase();
  const queryEmail = (searchParams?.get('email') || '').trim().toLowerCase();

  const [isEmailLink, setIsEmailLink] = useState<boolean>(() =>
    typeof window !== 'undefined'
      ? CloudChurchService.isEmailSignInLink(window.location.href)
      : false
  );

  const [emailInput, setEmailInput] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return (
      window.localStorage.getItem(EMAIL_FOR_SIGN_IN_STORAGE_KEY) ||
      queryEmail ||
      ''
    )
      .trim()
      .toLowerCase();
  });

  const [passwordInput, setPasswordInput] = useState<string>('');
  const [nameInput, setNameInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'link' | 'password_login' | 'password_register'>('link');

  const [targetChurch, setTargetChurch] = useState<ChurchTenant | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [needsManualEmail, setNeedsManualEmail] = useState<boolean>(false);
  const [isInvalidOrExpired, setIsInvalidOrExpired] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [linkSentSuccess, setLinkSentSuccess] = useState<boolean>(false);

  // Guards against multiple invocations of signInWithEmailLink during React re-renders or auth state changes
  const hasProcessedRef = useRef<boolean>(false);

  // Load church details for context
  useEffect(() => {
    if (!targetSlug) return;
    void CloudChurchService.getChurchBySlug(targetSlug).then((ch) => {
      if (ch) setTargetChurch(ch);
    });
  }, [targetSlug]);

  const finishAndRedirect = async (slugToOpen?: string, roleLabel?: string) => {
    const finalSlug = slugToOpen || targetSlug;
    showToast(
      `Convite aceito com sucesso! Acesso liberado${roleLabel ? ` como ${roleLabel}` : ''}.`
    );
    if (finalSlug) {
      await selectChurchBySlug(finalSlug, 'manager');
    } else if (typeof window !== 'undefined') {
      window.location.href = '/gestor';
    }
  };

  // Automatic handling when arriving from Firebase Auth signInWithEmailLink
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const href = window.location.href;
    const validEmailLink = CloudChurchService.isEmailSignInLink(href);
    setIsEmailLink(validEmailLink);

    if (!validEmailLink) return;

    const oobCode = getOobCodeFromUrl(href);
    const isCodeProcessedInSession = oobCode
      ? Boolean(sessionStorage.getItem(`convite_processed_${oobCode}`))
      : false;

    // Requirement 2: If auth.currentUser already exists with matching invite email, skip link sign-in and immediately accept invite
    const curEmail = auth.currentUser?.email?.toLowerCase().trim();
    const savedEmail = (
      window.localStorage.getItem(EMAIL_FOR_SIGN_IN_STORAGE_KEY) ||
      queryEmail ||
      ''
    )
      .trim()
      .toLowerCase();

    if (curEmail && targetSlug && (!savedEmail || curEmail === savedEmail)) {
      if (!hasProcessedRef.current) {
        hasProcessedRef.current = true;
        if (oobCode) sessionStorage.setItem(`convite_processed_${oobCode}`, '1');
        setProcessing(true);
        void CloudChurchService.acceptTeamInviteForChurch(auth.currentUser!, targetSlug)
          .then(async (res) => {
            const roleLabel = res.role === 'admin' ? 'Administrador' : 'Editor';
            await finishAndRedirect(res.churchSlug || targetSlug, roleLabel);
          })
          .catch((err) => {
            setProcessing(false);
            setErrorMessage(translateFirebaseAuthError(err));
          });
      }
      return;
    }

    // Requirement 1: DO NOT auto-execute if email is missing from localStorage
    const strictlyFromStorage = (
      window.localStorage.getItem(EMAIL_FOR_SIGN_IN_STORAGE_KEY) || ''
    )
      .trim()
      .toLowerCase();

    if (!strictlyFromStorage) {
      setNeedsManualEmail(true);
      if (queryEmail) {
        setEmailInput(queryEmail);
      }
      return;
    }

    // Prevent duplicate execution if already in progress or already processed in session
    if (hasProcessedRef.current || isCodeProcessedInSession) {
      setNeedsManualEmail(true);
      return;
    }

    hasProcessedRef.current = true;
    if (oobCode) {
      sessionStorage.setItem(`convite_processed_${oobCode}`, '1');
    }

    setProcessing(true);
    setErrorMessage(null);

    void CloudChurchService.completeEmailLinkSignIn(strictlyFromStorage, href, targetSlug)
      .then(async (res) => {
        const roleLabel =
          res.role === 'admin'
            ? 'Administrador'
            : res.role === 'editor'
            ? 'Editor'
            : undefined;
        await finishAndRedirect(res.targetSlug || targetSlug, roleLabel);
      })
      .catch(async (err) => {
        setProcessing(false);
        const isCodeError =
          (err as { code?: string })?.code === 'auth/invalid-action-code' ||
          (err as { code?: string })?.code === 'auth/expired-action-code' ||
          String((err as { message?: string })?.message || '').includes('invalid-action-code') ||
          String((err as { message?: string })?.message || '').includes('expired-action-code');

        // Requirement 3: If already logged in with that email, accept invite normally
        if (
          auth.currentUser &&
          auth.currentUser.email?.toLowerCase().trim() === strictlyFromStorage
        ) {
          try {
            const res = await CloudChurchService.acceptTeamInviteForChurch(
              auth.currentUser,
              targetSlug
            );
            const roleLabel = res.role === 'admin' ? 'Administrador' : 'Editor';
            await finishAndRedirect(res.churchSlug || targetSlug, roleLabel);
            return;
          } catch {
            // fall through to friendly error
          }
        }

        setNeedsManualEmail(true);
        if (isCodeError) {
          setIsInvalidOrExpired(true);
          setErrorMessage(
            'Este link já foi usado ou expirou. Peça um novo convite ao gestor ou entre abaixo.'
          );
        } else {
          setErrorMessage(translateFirebaseAuthError(err));
        }
      });
  }, [targetSlug, queryEmail]);

  // Handler for manual submit on email link confirmation
  const handleConfirmEmailLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = emailInput.trim().toLowerCase();
    if (!clean) return;

    // Requirement 2: If auth.currentUser already matches email, accept invite immediately
    if (auth.currentUser && auth.currentUser.email?.toLowerCase().trim() === clean) {
      setProcessing(true);
      setErrorMessage(null);
      try {
        const res = await CloudChurchService.acceptTeamInviteForChurch(
          auth.currentUser,
          targetSlug
        );
        const roleLabel = res.role === 'admin' ? 'Administrador' : 'Editor';
        await finishAndRedirect(res.churchSlug || targetSlug, roleLabel);
        return;
      } catch (err) {
        setProcessing(false);
        setErrorMessage(translateFirebaseAuthError(err));
        return;
      }
    }

    const oobCode = getOobCodeFromUrl(window.location.href);
    const isCodeProcessedInSession = oobCode
      ? Boolean(sessionStorage.getItem(`convite_processed_${oobCode}`))
      : false;

    if (isCodeProcessedInSession) {
      setIsInvalidOrExpired(true);
      setErrorMessage(
        'Este link já foi usado ou expirou. Peça um novo convite ao gestor ou entre abaixo.'
      );
      return;
    }

    setProcessing(true);
    setErrorMessage(null);
    hasProcessedRef.current = true;
    if (oobCode) {
      sessionStorage.setItem(`convite_processed_${oobCode}`, '1');
    }

    try {
      const res = await CloudChurchService.completeEmailLinkSignIn(
        clean,
        window.location.href,
        targetSlug
      );
      const roleLabel =
        res.role === 'admin'
          ? 'Administrador'
          : res.role === 'editor'
          ? 'Editor'
          : undefined;
      await finishAndRedirect(res.targetSlug || targetSlug, roleLabel);
    } catch (err) {
      setProcessing(false);
      const isCodeError =
        (err as { code?: string })?.code === 'auth/invalid-action-code' ||
        (err as { code?: string })?.code === 'auth/expired-action-code' ||
        String((err as { message?: string })?.message || '').includes('invalid-action-code') ||
        String((err as { message?: string })?.message || '').includes('expired-action-code');

      // Check if user is now signed in despite error
      if (auth.currentUser && auth.currentUser.email?.toLowerCase().trim() === clean) {
        try {
          const res = await CloudChurchService.acceptTeamInviteForChurch(
            auth.currentUser,
            targetSlug
          );
          const roleLabel = res.role === 'admin' ? 'Administrador' : 'Editor';
          await finishAndRedirect(res.churchSlug || targetSlug, roleLabel);
          return;
        } catch {
          // ignore
        }
      }

      if (isCodeError) {
        setIsInvalidOrExpired(true);
        setErrorMessage(
          'Este link já foi usado ou expirou. Peça um novo convite ao gestor ou entre abaixo.'
        );
      } else {
        setErrorMessage(translateFirebaseAuthError(err));
      }
    }
  };

  const handleAcceptWithLoggedUser = async () => {
    if (!auth.currentUser || !targetSlug) return;
    setProcessing(true);
    setErrorMessage(null);
    try {
      const res = await CloudChurchService.acceptTeamInviteForChurch(
        auth.currentUser,
        targetSlug
      );
      const roleLabel = res.role === 'admin' ? 'Administrador' : 'Editor';
      await finishAndRedirect(res.churchSlug, roleLabel);
    } catch (err) {
      setProcessing(false);
      setErrorMessage(translateFirebaseAuthError(err));
      showToast(translateFirebaseAuthError(err), 'error');
    }
  };

  const handleAcceptWithGoogle = async () => {
    setProcessing(true);
    setErrorMessage(null);
    try {
      await loginWithGoogleCloud();
      if (auth.currentUser && targetSlug) {
        const res = await CloudChurchService.acceptTeamInviteForChurch(
          auth.currentUser,
          targetSlug
        );
        const roleLabel = res.role === 'admin' ? 'Administrador' : 'Editor';
        await finishAndRedirect(res.churchSlug, roleLabel);
      } else if (targetSlug) {
        await selectChurchBySlug(targetSlug, 'manager');
      }
    } catch (err) {
      setProcessing(false);
      const msg = translateFirebaseAuthError(err);
      setErrorMessage(msg);
      showToast(msg, 'error');
    }
  };

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail || !passwordInput) return;
    setProcessing(true);
    setErrorMessage(null);
    try {
      const loginRes = await CloudChurchService.loginWithEmail(cleanEmail, passwordInput);
      if (auth.currentUser && targetSlug) {
        const res = await CloudChurchService.acceptTeamInviteForChurch(
          auth.currentUser,
          targetSlug
        );
        const roleLabel = res.role === 'admin' ? 'Administrador' : 'Editor';
        await finishAndRedirect(res.churchSlug, roleLabel);
      } else {
        await finishAndRedirect(loginRes.user.churchSlug || targetSlug);
      }
    } catch (err) {
      setProcessing(false);
      setErrorMessage(translateFirebaseAuthError(err));
    }
  };

  const handlePasswordRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail || !passwordInput) return;
    if (passwordInput.length < 6) {
      setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setProcessing(true);
    setErrorMessage(null);
    try {
      const regRes = await CloudChurchService.registerWithEmail(
        nameInput.trim() || cleanEmail.split('@')[0],
        cleanEmail,
        passwordInput,
        targetChurch?.name
      );
      if (auth.currentUser && targetSlug) {
        const res = await CloudChurchService.acceptTeamInviteForChurch(
          auth.currentUser,
          targetSlug
        );
        const roleLabel = res.role === 'admin' ? 'Administrador' : 'Editor';
        await finishAndRedirect(res.churchSlug, roleLabel);
      } else {
        await finishAndRedirect(regRes.user.churchSlug || targetSlug);
      }
    } catch (err) {
      setProcessing(false);
      setErrorMessage(translateFirebaseAuthError(err));
    }
  };

  const handleSendMagicLinkToEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = emailInput.trim().toLowerCase();
    if (!clean || !targetSlug) return;
    setProcessing(true);
    setErrorMessage(null);
    try {
      const { emailSent, emailError } =
        await CloudChurchService.sendSignInInviteEmailLink(
          targetChurch?.id || targetSlug,
          targetSlug,
          clean
        );
      setProcessing(false);
      if (emailSent) {
        setLinkSentSuccess(true);
        showToast(`Novo link de login gerado e enviado para ${clean}!`);
      } else {
        setErrorMessage(
          `Não foi possível enviar o link por e-mail (${
            emailError || 'verifique se "Link do e-mail" está ativo no Firebase Console'
          }). Você pode entrar com Google ou com senha abaixo.`
        );
      }
    } catch (err) {
      setProcessing(false);
      setErrorMessage(translateFirebaseAuthError(err));
    }
  };

  return (
    <div className="max-w-md mx-auto my-6 sm:my-10 p-6 sm:p-8 bg-white rounded-3xl border border-stone-200/90 shadow-sm space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-[#EAF0EC] text-[#344E41] flex items-center justify-center mx-auto mb-2 overflow-hidden">
          {targetChurch?.logoUrl ? (
            <img
              src={targetChurch.logoUrl}
              alt={targetChurch.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Church className="w-7 h-7" />
          )}
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF0EC] text-[#284136] text-[11px] font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          Convite para Equipe da Igreja
        </span>
        <h1 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">
          {targetChurch ? targetChurch.name : 'Aceitar Convite da Equipe'}
        </h1>
        <p className="text-xs text-stone-500 leading-relaxed">
          {isEmailLink && !isInvalidOrExpired
            ? 'Validando seu link de acesso seguro para liberar seu painel na igreja.'
            : isInvalidOrExpired
            ? 'Este link foi utilizado ou expirou. Você pode entrar diretamente abaixo para liberar seu acesso.'
            : 'Confirme seu e-mail para aceitar o convite e acessar o Painel do Gestor.'}
        </p>
      </div>

      {processing && (
        <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-col items-center justify-center gap-3 text-center">
          <Loader2 className="w-7 h-7 text-[#344E41] animate-spin" />
          <p className="text-xs font-semibold text-stone-700">
            Autenticando e vinculando seu acesso à equipe da igreja...
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium leading-relaxed flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Case 1: Active session matches invitation */}
      {firebaseUser && isEmailVerified && (
        <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-3">
          <p className="text-xs text-stone-700">
            Você está conectado como{' '}
            <strong className="font-mono text-stone-900">{firebaseUser.email}</strong>.
          </p>
          <button
            type="button"
            disabled={processing}
            onClick={handleAcceptWithLoggedUser}
            className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-[#344E41] hover:bg-[#284136] text-white font-bold text-xs flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmar e Entrar na Equipe</span>
          </button>
        </div>
      )}

      {/* Case 2: Email link is active and valid, but needs manual email confirmation */}
      {isEmailLink && !isInvalidOrExpired && needsManualEmail && !firebaseUser && (
        <form onSubmit={handleConfirmEmailLinkSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              Confirme o seu e-mail convidado
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="seu-email@exemplo.com"
                className="w-full min-h-[46px] pl-10 pr-3 rounded-xl border border-stone-300 bg-white text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={processing}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#344E41] hover:bg-[#284136] disabled:opacity-60 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2"
          >
            {processing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Confirmar e Entrar na Equipe</span>
          </button>
        </form>
      )}

      {/* Case 3: Link expired/invalid OR Direct /convite visit without active link */}
      {(!isEmailLink || isInvalidOrExpired) && !firebaseUser && (
        <div className="space-y-4">
          {/* Option A: Google Login */}
          <button
            type="button"
            disabled={processing}
            onClick={handleAcceptWithGoogle}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#344E41] hover:bg-[#284136] disabled:opacity-60 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2.5 shadow-xs"
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Entrar com Conta Google</span>
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-stone-200" />
            <span className="shrink mx-3 text-[11px] uppercase tracking-wider text-stone-400 font-semibold">
              ou com e-mail e senha
            </span>
            <div className="flex-grow border-t border-stone-200" />
          </div>

          {/* Inline Email + Password Form */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('password_login');
                setErrorMessage(null);
              }}
              className={`py-1.5 rounded-lg transition-colors ${
                authMode === 'password_login' || authMode === 'link'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              Já tenho senha
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('password_register');
                setErrorMessage(null);
              }}
              className={`py-1.5 rounded-lg transition-colors ${
                authMode === 'password_register'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              Criar senha
            </button>
          </div>

          {authMode === 'password_register' ? (
            <form onSubmit={handlePasswordRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Seu nome completo
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full min-h-[44px] pl-10 pr-3 rounded-xl border border-stone-300 bg-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  E-mail convidado
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="email-convidado@exemplo.com"
                    className="w-full min-h-[44px] pl-10 pr-3 rounded-xl border border-stone-300 bg-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Criar uma senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full min-h-[44px] pl-10 pr-10 rounded-xl border border-stone-300 bg-white text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-[#344E41] hover:bg-[#284136] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                <span>Criar Senha e Entrar na Equipe</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordSignIn} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  E-mail convidado
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="email-convidado@exemplo.com"
                    className="w-full min-h-[44px] pl-10 pr-3 rounded-xl border border-stone-300 bg-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Sua senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Sua senha cadastrada"
                    className="w-full min-h-[44px] pl-10 pr-10 rounded-xl border border-stone-300 bg-white text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>Entrar e Acessar Painel</span>
              </button>
            </form>
          )}

          {/* Option C: Send a fresh magic link to email */}
          <div className="pt-2 border-t border-stone-100">
            {linkSentSuccess ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  Novo link enviado para {emailInput}!
                </p>
                <p className="text-stone-600">
                  Verifique sua caixa de entrada e spam para entrar direto.
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSendMagicLinkToEmail}
                disabled={processing || !emailInput}
                className="w-full py-2 text-xs font-semibold text-[#344E41] hover:underline flex items-center justify-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Pedir novo link de acesso por e-mail</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
