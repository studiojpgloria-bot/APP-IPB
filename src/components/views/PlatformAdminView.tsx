import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Ban,
  CheckCircle2,
  Church,
  ExternalLink,
  Key,
  Lock,
  Mail,
  MapPin,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  Users,
  X
} from 'lucide-react';
import { useChurch } from '../../context/ChurchContext';
import { PLATFORM_OWNER_EMAIL } from '../../services/cloudDatabase';

export const PlatformAdminView: React.FC = () => {
  const {
    isPlatformOwner,
    isEmailVerified,
    firebaseUser,
    platformSettings,
    updatePlatformSettings,
    allChurchesForOwner,
    allPlatformUsers,
    setChurchStatusByOwner,
    deleteChurchByOwner,
    wipeAllPlatformDataByOwner,
    selectChurchBySlug,
    switchChurch,
    loginWithGoogleCloud,
    loginManagerWithEmailCloud,
    resendEmailVerification,
    checkEmailVerificationNow,
    managerLogout,
    askConfirmation
  } = useChurch();

  const [searchQuery, setSearchQuery] = useState('');
  const [appNameInput, setAppNameInput] = useState(platformSettings.appName || 'Minha Igreja');
  const [taglineInput, setTaglineInput] = useState(
    platformSettings.tagline || 'Conectando você à sua comunidade de fé'
  );

  // Wipe All Platform Data Modal State (Requirement 4: confirm by typing APAGAR)
  const [wipeModalOpen, setWipeModalOpen] = useState(false);
  const [wipeConfirmationText, setWipeConfirmationText] = useState('');
  const [wipingData, setWipingData] = useState(false);

  // Owner Login State if not signed in yet
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleOwnerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      await loginManagerWithEmailCloud(email, password);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Falha ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  const handleOwnerGoogle = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await loginWithGoogleCloud();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Falha ao autenticar com Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmWipeAllData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (wipeConfirmationText.trim().toUpperCase() !== 'APAGAR') return;
    setWipingData(true);
    try {
      await wipeAllPlatformDataByOwner();
      setWipeModalOpen(false);
      setWipeConfirmationText('');
    } finally {
      setWipingData(false);
    }
  };

  if (!isPlatformOwner) {
    return (
      <div className="max-w-md mx-auto my-10 p-6 sm:p-8 bg-white rounded-3xl border border-stone-200/90 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-stone-900">
            Administração da Plataforma (/admin)
          </h1>
          <p className="text-xs text-stone-500 leading-relaxed">
            Acesso exclusivo para o proprietário da plataforma (<strong>owner</strong>) com e-mail verificado.
          </p>
        </div>

        {firebaseUser && !isEmailVerified && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-3">
            <div className="flex items-start gap-2">
              <Mail className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
              <span>
                <strong>Confirme seu e-mail:</strong> A conta <strong>{firebaseUser.email}</strong> ainda não teve o e-mail verificado. O acesso de owner exige <code>emailVerified = true</code>.
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void checkEmailVerificationNow()}
                className="px-3 py-1.5 rounded-xl bg-[#344E41] text-white font-bold text-xs"
              >
                Já confirmei meu e-mail
              </button>
              <button
                type="button"
                onClick={() => void resendEmailVerification()}
                className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 font-bold text-xs"
              >
                Reenviar e-mail
              </button>
              <button
                type="button"
                onClick={managerLogout}
                className="px-3 py-1.5 rounded-xl text-rose-700 font-semibold text-xs hover:underline"
              >
                Sair
              </button>
            </div>
          </div>
        )}

        {firebaseUser && isEmailVerified && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>
              A conta atual (<strong>{firebaseUser.email}</strong>) não possui papel <code>owner</code> na plataforma. Conecte-se com a conta proprietária (<strong>{PLATFORM_OWNER_EMAIL}</strong>).
            </span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
            {errorMsg}
          </div>
        )}

        <button
          type="button"
          disabled={loading}
          onClick={handleOwnerGoogle}
          className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-[#344E41] hover:bg-[#284136] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Entrar com Google (Owner)</span>
        </button>

        <form onSubmit={handleOwnerLogin} className="space-y-3 pt-2 border-t border-stone-100">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">E-mail Owner</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={PLATFORM_OWNER_EMAIL}
                className="w-full min-h-[42px] pl-9 pr-3 rounded-xl border border-stone-200 text-xs sm:text-sm"
              />
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Senha</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full min-h-[42px] pl-9 pr-3 rounded-xl border border-stone-200 text-xs sm:text-sm"
              />
              <Key className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[44px] rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold"
          >
            Acessar Painel Owner
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={switchChurch}
            className="text-xs font-semibold text-stone-500 hover:text-stone-800 inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para a tela inicial</span>
          </button>
        </div>
      </div>
    );
  }

  const filteredChurches = allChurchesForOwner.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.city || '').toLowerCase().includes(q) ||
      (c.slug || '').toLowerCase().includes(q) ||
      (c.ownerEmail || '').toLowerCase().includes(q)
    );
  });

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    await updatePlatformSettings({
      appName: appNameInput,
      tagline: taglineInput
    });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Owner Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-stone-900">
                Painel do Owner da Plataforma (/admin)
              </h1>
              <span className="text-[10px] font-bold uppercase bg-amber-200 text-amber-950 px-2.5 py-0.5 rounded-full">
                Owner Total
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Conectado como <strong>{firebaseUser?.email}</strong> • Controle de todas as igrejas e gestores
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={switchChurch}
          className="min-h-[42px] px-4 py-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-xs font-bold text-stone-700 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Ir para Busca de Igrejas (/)</span>
        </button>
      </div>

      {/* 1. Marca e Nome Genérico da Plataforma */}
      <form
        onSubmit={handleSaveBranding}
        className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-xs space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#344E41]" />
            <div>
              <h2 className="font-bold text-stone-900 text-base">
                Marca Global da Plataforma (Tela Inicial &amp; Lojas)
              </h2>
              <p className="text-xs text-stone-500">
                Nome genérico exibido na porta de entrada (rota <code>/</code>), Portal do Gestor e <code>/admin</code>.
              </p>
            </div>
          </div>
          <button
            type="submit"
            className="min-h-[40px] px-4 py-2 rounded-xl bg-[#344E41] hover:bg-[#284136] text-white text-xs font-bold flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Salvar Marca</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Nome Genérico da Plataforma (Ex.: Minha Igreja)
            </label>
            <input
              type="text"
              required
              value={appNameInput}
              onChange={(e) => setAppNameInput(e.target.value)}
              placeholder="Minha Igreja"
              className="w-full p-2.5 text-sm rounded-xl border border-stone-300"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Slogan da Tela Inicial
            </label>
            <input
              type="text"
              value={taglineInput}
              onChange={(e) => setTaglineInput(e.target.value)}
              placeholder="Conectando você à sua comunidade de fé"
              className="w-full p-2.5 text-sm rounded-xl border border-stone-300"
            />
          </div>
        </div>
      </form>

      {/* 2. Todas as Igrejas Cadastradas */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Church className="w-5 h-5 text-[#344E41]" />
            <div>
              <h2 className="font-bold text-stone-900 text-lg">
                Todas as Igrejas Cadastradas ({allChurchesForOwner.length})
              </h2>
              <p className="text-xs text-stone-500">
                Aprove, bloqueie, acesse o painel de gestor ou exclua igrejas da plataforma.
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar igreja, cidade ou e-mail..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300"
            />
          </div>
        </div>

        {filteredChurches.length === 0 ? (
          <div className="p-8 rounded-2xl bg-stone-50 border border-stone-200/70 text-center space-y-2">
            <Church className="w-8 h-8 text-stone-400 mx-auto" />
            <p className="text-sm font-bold text-stone-800">
              Nenhuma igreja cadastrada no banco de dados
            </p>
            <p className="text-xs text-stone-500">
              A plataforma está limpa. Novas igrejas cadastradas pelos gestores aparecerão aqui automaticamente.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredChurches.map((ch) => {
              const isAtiva = ch.status === 'ativa';
              return (
                <div
                  key={ch.id}
                  className="p-4 rounded-2xl border border-stone-200 bg-stone-50/70 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center text-white shrink-0 border border-stone-200"
                      style={{ backgroundColor: ch.themeColor || '#344E41' }}
                    >
                      {ch.logoUrl ? (
                        <img src={ch.logoUrl} alt={ch.name} className="w-full h-full object-cover" />
                      ) : (
                        <Church className="w-5 h-5" />
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-stone-900 text-sm sm:text-base">{ch.name}</h3>
                        <span
                          className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                            isAtiva
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {ch.status}
                        </span>
                        <span className="font-mono text-xs text-[#344E41] bg-[#EAF0EC] px-2 py-0.5 rounded">
                          /{ch.slug}
                        </span>
                      </div>

                      <p className="text-xs text-stone-600 flex items-center gap-1.5 flex-wrap">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>
                          {ch.city
                            ? `${ch.city}${ch.state ? `/${ch.state}` : ''}`
                            : ch.cityStateZip || 'Sem cidade'}
                        </span>
                        <span>•</span>
                        <span>
                          Titular: <strong className="font-mono">{ch.ownerEmail || '—'}</strong>
                        </span>
                        {ch.managerEmails && ch.managerEmails.length > 1 && (
                          <>
                            <span>•</span>
                            <span>{ch.managerEmails.length} membros na equipe</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => void selectChurchBySlug(ch.slug, 'home')}
                      className="min-h-[36px] px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-xs font-semibold text-stone-700 flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir App</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => void selectChurchBySlug(ch.slug, 'manager')}
                      className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#EAF0EC] hover:bg-[#dce6df] text-[#344E41] text-xs font-bold flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Gerenciar</span>
                    </button>

                    {isAtiva ? (
                      <button
                        type="button"
                        onClick={() => void setChurchStatusByOwner(ch.id, 'bloqueada')}
                        className="min-h-[36px] px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1.5"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Bloquear</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void setChurchStatusByOwner(ch.id, 'ativa')}
                        className="min-h-[36px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Aprovar / Ativar</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        askConfirmation({
                          title: `Excluir "${ch.name}"?`,
                          message: `Tem certeza que deseja excluir permanentemente a igreja "${ch.name}" (/${ch.slug}) e todos os seus boletins, escalas, aniversariantes e banners?`,
                          confirmLabel: 'Sim, Excluir Igreja',
                          isDestructive: true,
                          onConfirm: () => {
                            void deleteChurchByOwner(ch.id);
                          }
                        })
                      }
                      className="min-h-[36px] px-2.5 py-1.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Excluir igreja"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Gestores Cadastrados na Coleção `users` */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
          <Users className="w-5 h-5 text-[#344E41]" />
          <div>
            <h2 className="font-bold text-stone-900 text-base">
              Gestores e Administradores na Plataforma ({allPlatformUsers.length})
            </h2>
            <p className="text-xs text-stone-500">
              Contas registradas na coleção <code>users</code> do Firestore com seus respectivos papéis e igrejas.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 text-stone-500 uppercase text-[10px] font-bold border-b border-stone-200">
              <tr>
                <th className="p-3">Nome</th>
                <th className="p-3">E-mail</th>
                <th className="p-3">Papel (Role)</th>
                <th className="p-3">Igreja Vinculada (churchId)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {allPlatformUsers.map((u) => (
                <tr key={u.uid} className="hover:bg-stone-50/70">
                  <td className="p-3 font-bold text-stone-900">{u.name}</td>
                  <td className="p-3 font-mono">{u.email}</td>
                  <td className="p-3">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        u.role === 'owner'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-stone-600">{u.churchSlug || u.churchId || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Zona de Perigo — Apagar todos os dados da plataforma (Requirement 4) */}
      <div className="bg-rose-50/80 rounded-3xl p-6 border border-rose-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h2 className="font-bold text-rose-950 text-base">
              Começar do Zero — Apagar Todos os Dados da Plataforma
            </h2>
            <p className="text-xs text-rose-800 leading-relaxed max-w-2xl">
              Exclui todas as igrejas cadastradas e todas as subcoleções (<code>boletins</code>, <code>escalas</code>, <code>aniversariantes</code>, <code>banners</code>, <code>lideranca</code>, <code>cultos</code>) do Firestore para deixar o sistema 100% vazio. Não exclui as contas de login do Firebase Auth.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setWipeConfirmationText('');
            setWipeModalOpen(true);
          }}
          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold flex items-center gap-2 shrink-0 self-start sm:self-auto shadow-xs transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Apagar todos os dados da plataforma</span>
        </button>
      </div>

      {/* Modal de Confirmação Digitando APAGAR */}
      {wipeModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs">
            <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-rose-200 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 text-base">
                      Apagar todos os dados da plataforma?
                    </h3>
                    <p className="text-xs text-rose-700 font-semibold">
                      Ação irreversível no Firestore
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setWipeModalOpen(false)}
                  className="p-1 text-stone-400 hover:text-stone-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                Todas as igrejas e todas as suas subcoleções (boletins, escalas, aniversariantes, banners, líderes e horários de culto) serão permanentemente excluídas do Firestore. As contas do Firebase Auth serão mantidas.
              </p>

              <form onSubmit={handleConfirmWipeAllData} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">
                    Digite <code className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-900 font-mono">APAGAR</code> abaixo para confirmar:
                  </label>
                  <input
                    type="text"
                    required
                    value={wipeConfirmationText}
                    onChange={(e) => setWipeConfirmationText(e.target.value)}
                    placeholder="APAGAR"
                    className="w-full p-2.5 text-sm font-mono uppercase rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    disabled={wipingData}
                    onClick={() => setWipeModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={
                      wipingData || wipeConfirmationText.trim().toUpperCase() !== 'APAGAR'
                    }
                    className="px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>
                      {wipingData ? 'Apagando dados...' : 'Confirmar e Apagar Tudo'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
