import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Church,
  Loader2,
  Mail,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { auth } from '../../config/firebase';
import { useChurch } from '../../context/ChurchContext';
import {
  CloudChurchService,
  EMAIL_FOR_SIGN_IN_STORAGE_KEY
} from '../../services/cloudDatabase';
import { ChurchTenant } from '../../types';

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

  const [targetChurch, setTargetChurch] = useState<ChurchTenant | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [needsManualEmail, setNeedsManualEmail] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [linkSentSuccess, setLinkSentSuccess] = useState<boolean>(false);

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

    if (validEmailLink) {
      const savedEmail = (
        window.localStorage.getItem(EMAIL_FOR_SIGN_IN_STORAGE_KEY) ||
        queryEmail ||
        ''
      )
        .trim()
        .toLowerCase();

      if (savedEmail) {
        setProcessing(true);
        setErrorMessage(null);
        void CloudChurchService.completeEmailLinkSignIn(savedEmail, href, targetSlug)
          .then(async (res) => {
            const roleLabel =
              res.role === 'admin'
                ? 'Administrador'
                : res.role === 'editor'
                ? 'Editor'
                : undefined;
            await finishAndRedirect(res.targetSlug || targetSlug, roleLabel);
          })
          .catch((err) => {
            setProcessing(false);
            setNeedsManualEmail(true);
            setErrorMessage(
              err instanceof Error
                ? err.message
                : 'Confirme seu endereço de e-mail abaixo para concluir o acesso.'
            );
          });
      } else {
        setNeedsManualEmail(true);
      }
    }
  }, [targetSlug, queryEmail]);

  const handleConfirmEmailLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = emailInput.trim().toLowerCase();
    if (!clean) return;
    setProcessing(true);
    setErrorMessage(null);
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
      const msg =
        err instanceof Error
          ? err.message
          : 'Link inválido ou expirado. Solicite um novo link ou entre com Google.';
      setErrorMessage(msg);
      showToast(msg, 'error');
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
      const msg =
        err instanceof Error ? err.message : 'Não foi possível aceitar o convite.';
      setErrorMessage(msg);
      showToast(msg, 'error');
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
      const msg =
        err instanceof Error
          ? err.message
          : 'Erro ao entrar com Google para aceitar o convite.';
      setErrorMessage(msg);
      showToast(msg, 'error');
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
        showToast(`Link de acesso enviado para ${clean}! Verifique sua caixa de entrada.`);
      } else {
        setErrorMessage(
          `Não foi possível enviar o link por e-mail (${
            emailError || 'verifique se "Link do e-mail (login sem senha)" está ativo no Firebase Console'
          }). Você pode entrar abaixo com sua Conta Google.`
        );
      }
    } catch (err) {
      setProcessing(false);
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao enviar link.');
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
          {isEmailLink
            ? 'Validando seu link de login por e-mail para liberar seu acesso ao painel da igreja.'
            : 'Confirme seu e-mail convidado para entrar na equipe e acessar o Painel do Gestor.'}
        </p>
      </div>

      {processing && !needsManualEmail && (
        <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-col items-center justify-center gap-3 text-center">
          <Loader2 className="w-7 h-7 text-[#344E41] animate-spin" />
          <p className="text-xs font-semibold text-stone-700">
            Autenticando e vinculando seu acesso à igreja...
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium leading-relaxed">
          {errorMessage}
        </div>
      )}

      {/* Case A: Opened a Firebase Sign-In Email Link and needs email confirmation */}
      {isEmailLink && needsManualEmail && (
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

      {/* Case B: Opened /convite?igreja={slug} directly (from copied link or WhatsApp) */}
      {!isEmailLink && (
        <div className="space-y-4">
          {firebaseUser && isEmailVerified ? (
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
                <span>Aceitar Convite e Abrir Painel</span>
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                disabled={processing}
                onClick={handleAcceptWithGoogle}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#344E41] hover:bg-[#284136] disabled:opacity-60 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2.5 shadow-xs"
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Aceitar Convite com Conta Google</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-stone-200" />
                <span className="shrink mx-3 text-[11px] uppercase tracking-wider text-stone-400 font-semibold">
                  ou receber link no e-mail
                </span>
                <div className="flex-grow border-t border-stone-200" />
              </div>

              {linkSentSuccess ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    Link de acesso enviado para {emailInput}!
                  </p>
                  <p className="text-stone-600 leading-relaxed">
                    Abra o seu e-mail (verifique também a caixa de Spam) e clique no link recebido para entrar direto no painel sem precisar de senha.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSendMagicLinkToEmail} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Seu e-mail convidado
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
                  <button
                    type="submit"
                    disabled={processing}
                    className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Receber Link de Acesso no E-mail</span>
                  </button>
                </form>
              )}

              <div className="pt-2 border-t border-stone-100 text-center">
                <button
                  type="button"
                  onClick={() => {
                    if (targetSlug) {
                      void selectChurchBySlug(targetSlug, 'manager');
                    } else if (typeof window !== 'undefined') {
                      window.location.href = '/gestor';
                    }
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#344E41] hover:underline"
                >
                  <span>Prefiro entrar ou criar conta com e-mail e senha</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
