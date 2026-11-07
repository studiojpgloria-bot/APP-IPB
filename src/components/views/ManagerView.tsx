import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import {
  AlertCircle,
  ArrowLeft,
  CalendarHeart,
  Check,
  Church,
  ClipboardList,
  Clock,
  Copy,
  Download,
  Edit2,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Key,
  Layers,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Palette,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  Save,
  Settings,
  Share2,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X
} from 'lucide-react';
import { activeFirebaseConfig } from '../../config/firebase';
import { useChurch } from '../../context/ChurchContext';
import {
  DAYS_OF_WEEK,
  formatTimeStandard,
  slugifyChurchName,
  standardTimeToHtmlTime
} from '../../services/cloudDatabase';
import { ChurchStorageService } from '../../services/storage';
import {
  Banner,
  BannerPosition,
  BirthdayPerson,
  Bulletin,
  ChurchInfo,
  DeaconScheduleCategory,
  DeaconScheduleItem,
  LeaderMember,
  PublicationStatus,
  ScheduleItem
} from '../../types';
import { buildDeaconCategories, getDeaconCategoryMeta } from './DeaconScheduleView';

type ManagerTab = 'info' | 'bulletins' | 'deacons' | 'birthdays' | 'banners' | 'team' | 'settings';

const PRESET_THEME_COLORS = [
  { name: 'Verde Presbiteriano', hex: '#344E41' },
  { name: 'Azul Marinho Clássico', hex: '#1E3A8A' },
  { name: 'Vinho Reforma', hex: '#7F1D1D' },
  { name: 'Esmeralda Profundo', hex: '#065F46' },
  { name: 'Âmbar Dourado', hex: '#78350F' },
  { name: 'Grafite Sóbrio', hex: '#1F2937' }
];

function formatLastEditedLabel(item?: {
  updatedByName?: string;
  createdByName?: string;
  updatedByEmail?: string;
  createdByEmail?: string;
  updatedAt?: string;
  createdAt?: string;
}): string | null {
  if (!item) return null;
  const author =
    item.updatedByName || item.createdByName || item.updatedByEmail || item.createdByEmail;
  const rawDate = item.updatedAt || item.createdAt;
  if (!author && !rawDate) return null;
  const formattedDate = rawDate
    ? new Date(rawDate).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '';
  if (author && formattedDate) {
    return `Última edição por ${author} em ${formattedDate}`;
  }
  if (author) {
    return `Última edição por ${author}`;
  }
  return `Última edição em ${formattedDate}`;
}

export const ManagerView: React.FC = () => {
  const {
    isManagerAuthenticated,
    isEmailVerified,
    firebaseUser,
    platformUser,
    activeChurch,
    managedChurches,
    isChurchAdmin,
    isCreatingAdditionalChurch,
    setIsCreatingAdditionalChurch,
    selectChurchBySlug,
    needsChurchOnboarding,
    createNewChurchInCloud,
    updateChurchSlugAndMeta,
    inviteTeamMemberByEmail,
    updateTeamMemberRoleByEmail,
    removeCoManagerEmail,
    isPlatformOwner,
    isCloudSynced,
    loginWithGoogleCloud,
    registerManagerWithEmailCloud,
    loginManagerWithEmailCloud,
    resendEmailVerification,
    checkEmailVerificationNow,
    syncLocalDataToCloud,
    pullLatestFromCloud,
    resetAllChurchContentToBlank,
    importFullChurchBackup,
    managerLogout,
    switchChurch,
    setCurrentView,
    churchInfo,
    updateChurchInfo,
    bulletins,
    addBulletin,
    updateBulletin,
    deleteBulletin,
    setCurrentBulletin,
    setSelectedBulletinForReader,
    birthdays,
    addBirthday,
    updateBirthday,
    deleteBirthday,
    importBirthdaysCSV,
    deaconSchedules,
    addDeaconSchedule,
    updateDeaconSchedule,
    deleteDeaconSchedule,
    banners,
    addBanner,
    updateBanner,
    deleteBanner,
    toggleBannerActive,
    settings,
    askConfirmation,
    showToast
  } = useChurch();

  const [activeTab, setActiveTab] = useState<ManagerTab>('info');

  // Login / Register Form State
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authName, setAuthName] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authErrorMsg, setAuthErrorMsg] = useState<string | null>(null);
  const [showVercelGuideOnLogin, setShowVercelGuideOnLogin] = useState(false);
  const [copiedEnvVars, setCopiedEnvVars] = useState(false);

  // Onboarding Wizard State (for newly registered managers creating their church)
  const [wizName, setWizName] = useState('');
  const [wizSlug, setWizSlug] = useState('');
  const [wizSlugManuallyEdited, setWizSlugManuallyEdited] = useState(false);
  const [wizLogoUrl, setWizLogoUrl] = useState('');
  const [wizThemeColor, setWizThemeColor] = useState('#344E41');
  const [wizCity, setWizCity] = useState('');
  const [wizState, setWizState] = useState('');
  const [wizAddress, setWizAddress] = useState('');
  const [wizLat, setWizLat] = useState<number | undefined>(undefined);
  const [wizLng, setWizLng] = useState<number | undefined>(undefined);
  const [wizPhone, setWizPhone] = useState('');
  const [wizWhatsapp, setWizWhatsapp] = useState('');
  const [wizInstagram, setWizInstagram] = useState('');
  const [wizYoutube, setWizYoutube] = useState('');
  const [wizFacebook, setWizFacebook] = useState('');
  const [wizTagline, setWizTagline] = useState('');
  const [wizSchedules, setWizSchedules] = useState<ScheduleItem[]>([]);
  const [wizSchDay, setWizSchDay] = useState('Domingo');
  const [wizSchTime, setWizSchTime] = useState('19h30');
  const [wizSchTitle, setWizSchTitle] = useState('');
  const [wizSubmitting, setWizSubmitting] = useState(false);

  // QR Code & Share Link State
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  // Church Slug / City / Theme Edit State inside Info Tab
  const [slugInput, setSlugInput] = useState(activeChurch?.slug || '');
  const [cityInput, setCityInput] = useState(activeChurch?.city || '');
  const [stateInput, setStateInput] = useState(activeChurch?.state || '');
  const [themeColorInput, setThemeColorInput] = useState(activeChurch?.themeColor || '#344E41');
  const [latInput, setLatInput] = useState<number | undefined>(activeChurch?.latitude);
  const [lngInput, setLngInput] = useState<number | undefined>(activeChurch?.longitude);

  // Team Member Invite Email & Role State
  const [inviteEmailInput, setInviteEmailInput] = useState('');
  const [inviteRoleInput, setInviteRoleInput] = useState<'admin' | 'editor'>('editor');
  const [invitingManager, setInvitingManager] = useState(false);
  const [lastInvitedMember, setLastInvitedMember] = useState<{
    email: string;
    role: 'admin' | 'editor';
  } | null>(null);

  // --- Church Info Form State ---
  const [infoForm, setInfoForm] = useState<ChurchInfo>(churchInfo);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [newSchedule, setNewSchedule] = useState<Partial<ScheduleItem>>({
    day: 'Domingo',
    time: '19h30',
    title: '',
    description: '',
    location: 'Templo Principal'
  });
  const [editingLeaderId, setEditingLeaderId] = useState<string | null>(null);
  const [newLeader, setNewLeader] = useState<Partial<LeaderMember>>({
    name: '',
    role: '',
    bio: '',
    photoUrl: '',
    phone: '',
    email: ''
  });

  // --- Bulletins State ---
  const [bulletinModalOpen, setBulletinModalOpen] = useState(false);
  const [editingBulletinId, setEditingBulletinId] = useState<string | null>(null);
  const [isDuplicatingBulletin, setIsDuplicatingBulletin] = useState(false);
  const [bulletinForm, setBulletinForm] = useState<Partial<Bulletin>>({
    title: '',
    editionDate: new Date().toISOString().split('T')[0],
    summary: '',
    isCurrent: false,
    status: 'published',
    type: 'text',
    themeVerse: '',
    pastoralWord: '',
    orderOfService: [],
    announcements: [],
    pdfUrl: '',
    pdfFileName: ''
  });
  const [liturgyInputText, setLiturgyInputText] = useState('');
  const [announcementsInputText, setAnnouncementsInputText] = useState('');

  // --- Birthdays State ---
  const [birthdayModalOpen, setBirthdayModalOpen] = useState(false);
  const [editingBirthdayId, setEditingBirthdayId] = useState<string | null>(null);
  const [birthdayForm, setBirthdayForm] = useState<Partial<BirthdayPerson>>({
    name: '',
    birthDay: 1,
    birthMonth: 1,
    birthYear: undefined,
    phone: '',
    photoUrl: '',
    ministry: ''
  });
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvTextInput, setCsvTextInput] = useState('');
  const [csvParsedPreview, setCsvParsedPreview] = useState<BirthdayPerson[]>([]);

  // --- Deacon Schedules State ---
  const [deaconModalOpen, setDeaconModalOpen] = useState(false);
  const [editingDeaconId, setEditingDeaconId] = useState<string | null>(null);
  const [isDuplicatingDeacon, setIsDuplicatingDeacon] = useState(false);
  const [deaconCategoryFilter, setDeaconCategoryFilter] = useState<'ALL' | DeaconScheduleCategory>('ALL');
  const [deaconForm, setDeaconForm] = useState<Partial<DeaconScheduleItem>>({
    category: 'evento_especial',
    date: new Date().toISOString().split('T')[0],
    serviceName: '',
    time: '19h30',
    coordinator: '',
    coordinatorPhone: '',
    notes: '',
    status: 'published'
  });
  const [receptionInput, setReceptionInput] = useState('');
  const [offeringInput, setOfferingInput] = useState('');
  const [parkingInput, setParkingInput] = useState('');

  // --- Banners State ---
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [bannerForm, setBannerForm] = useState<Partial<Banner>>({
    title: '',
    position: 'topo',
    imageUrl: '',
    linkUrl: '',
    openInNewTab: true,
    startDate: '',
    endDate: '',
    order: 1,
    isActive: true,
    status: 'published'
  });

  const dynamicDeaconCategories = buildDeaconCategories(infoForm.schedules);

  useEffect(() => {
    setInfoForm(churchInfo);
  }, [churchInfo]);

  useEffect(() => {
    if (activeChurch) {
      setSlugInput(activeChurch.slug || '');
      setCityInput(activeChurch.city || '');
      setStateInput(activeChurch.state || '');
      setThemeColorInput(activeChurch.themeColor || '#344E41');
      setLatInput(activeChurch.latitude);
      setLngInput(activeChurch.longitude);
    }
  }, [activeChurch]);

  // Ensure Editors are redirected to 'bulletins' if activeTab is an Admin-only tab
  useEffect(() => {
    if (!isChurchAdmin && (activeTab === 'info' || activeTab === 'team' || activeTab === 'settings')) {
      setActiveTab('bulletins');
    }
  }, [isChurchAdmin, activeTab]);

  // Auto-generate slug in Onboarding Wizard unless manually edited
  useEffect(() => {
    if (!wizSlugManuallyEdited) {
      const auto = slugifyChurchName(wizCity ? `${wizName}-${wizCity}` : wizName);
      setWizSlug(auto);
    }
  }, [wizName, wizCity, wizSlugManuallyEdited]);

  // Generate QR Code whenever activeChurch.slug changes
  const churchShareUrl =
    typeof window !== 'undefined' && activeChurch?.slug
      ? `${window.location.origin}/${activeChurch.slug}`
      : '';

  useEffect(() => {
    if (!churchShareUrl) {
      setQrCodeDataUrl('');
      return;
    }
    QRCode.toDataURL(churchShareUrl, {
      width: 512,
      margin: 2,
      color: {
        dark: '#1E2E27',
        light: '#FFFFFF'
      }
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch(() => setQrCodeDataUrl(''));
  }, [churchShareUrl]);

  const handleCopyShareLink = () => {
    if (!churchShareUrl) return;
    navigator.clipboard.writeText(churchShareUrl);
    setCopiedShareLink(true);
    showToast('Link direto da igreja copiado!');
    setTimeout(() => setCopiedShareLink(false), 3000);
  };

  const handleShareOnWhatsApp = () => {
    if (!churchShareUrl) return;
    const text = `Acesse o aplicativo oficial da ${activeChurch?.name || 'nossa igreja'}: ${churchShareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const handlePrintQrCode = () => {
    if (!qrCodeDataUrl || !activeChurch) return;
    const w = window.open('', '_blank');
    if (!w) {
      showToast('Baixe a imagem do QR Code para imprimir.', 'info');
      return;
    }
    w.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <title>QR Code — ${activeChurch.name}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 48px 24px; color: #1c1917; }
            .card { max-width: 480px; margin: 0 auto; border: 2px solid #e7e5e4; border-radius: 24px; padding: 36px; }
            h1 { font-size: 26px; margin-bottom: 8px; color: #284136; }
            p { font-size: 15px; color: #57534e; margin-bottom: 24px; }
            img { width: 280px; height: 280px; display: block; margin: 0 auto 20px; }
            .url { font-family: monospace; font-size: 16px; font-weight: bold; background: #f5f5f4; padding: 10px 16px; border-radius: 12px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>${activeChurch.name}</h1>
            <p>Aponte a câmera do seu celular para acessar nosso Boletim, Bíblia, Horários de Cultos e Escalas:</p>
            <img src="${qrCodeDataUrl}" alt="QR Code" />
            <div class="url">${churchShareUrl}</div>
          </div>
          <script>window.onload = () => { window.print(); };</script>
        </body>
      </html>
    `);
    w.document.close();
  };

  // Cloud Google Auth Handler
  const handleGoogleAuth = async () => {
    setAuthErrorMsg(null);
    setAuthLoading(true);
    try {
      await loginWithGoogleCloud();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('popup-closed')) {
        setAuthErrorMsg('Janela de login fechada antes de concluir.');
      } else if (msg.includes('unauthorized-domain')) {
        setShowVercelGuideOnLogin(true);
        setAuthErrorMsg(
          `Domínio atual (${window.location.hostname}) ainda não foi adicionado em "Authorized domains" no Firebase.`
        );
      } else {
        setAuthErrorMsg(`Não foi possível autenticar com o Google: ${msg}`);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Cloud Email/Password Submit (Login or Register)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthErrorMsg(null);
    setAuthLoading(true);
    try {
      if (authMode === 'register') {
        if (!authName.trim()) {
          setAuthErrorMsg('Informe seu nome completo para criar a conta de gestor.');
          setAuthLoading(false);
          return;
        }
        await registerManagerWithEmailCloud(authName, loginEmail, loginPassword);
      } else {
        await loginManagerWithEmailCloud(loginEmail, loginPassword);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('operation-not-allowed')) {
        setAuthErrorMsg(
          'O provedor de E-mail/Senha ainda não foi ativado no console do Firebase. Use o botão "Continuar com Conta Google" acima, ou ative E-mail/Senha em Authentication > Sign-in method no Firebase.'
        );
      } else if (msg.includes('email-already-in-use')) {
        setAuthErrorMsg('Este e-mail já possui cadastro. Mude para a aba "Entrar na Conta".');
      } else if (
        msg.includes('invalid-credential') ||
        msg.includes('wrong-password') ||
        msg.includes('user-not-found')
      ) {
        setAuthErrorMsg('E-mail ou senha incorretos.');
      } else if (msg.includes('weak-password')) {
        setAuthErrorMsg('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setAuthErrorMsg(`Erro na autenticação: ${msg}`);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Image Upload with Canvas Compression
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onCompressed: (base64: string) => void,
    maxWidth = 650
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showToast('Processando e otimizando imagem...', 'info');
      const base64 = await ChurchStorageService.compressImageFile(file, maxWidth, 0.8);
      onCompressed(base64);
      showToast('Imagem carregada com sucesso!');
    } catch {
      showToast('Erro ao processar imagem.', 'error');
    } finally {
      e.target.value = '';
    }
  };

  // PDF File Upload for Bulletins
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      showToast('Selecione um arquivo PDF válido.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const base64 = loadEvent.target?.result as string;
      setBulletinForm((prev) => ({
        ...prev,
        type: 'pdf',
        pdfUrl: base64,
        pdfFileName: file.name
      }));
      showToast(`Arquivo "${file.name}" carregado com sucesso!`);
    };
    reader.readAsDataURL(file);
  };

  // Onboarding Wizard Submit
  const handleCompleteOnboardingWizard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wizName.trim() || !wizCity.trim() || !wizState.trim()) {
      showToast('Informe o nome da igreja, cidade e UF.', 'error');
      return;
    }
    setWizSubmitting(true);
    try {
      await createNewChurchInCloud({
        name: wizName.trim(),
        slug: wizSlug.trim() || slugifyChurchName(`${wizName}-${wizCity}`),
        logoUrl: wizLogoUrl,
        themeColor: wizThemeColor,
        city: wizCity.trim(),
        state: wizState.trim().toUpperCase(),
        address: wizAddress.trim(),
        latitude: wizLat,
        longitude: wizLng,
        primaryPhone: wizPhone.trim(),
        whatsappNumber: wizWhatsapp.trim(),
        instagramUrl: wizInstagram.trim(),
        youtubeUrl: wizYoutube.trim(),
        facebookUrl: wizFacebook.trim(),
        tagline: wizTagline.trim(),
        schedules: wizSchedules
      });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao criar igreja.', 'error');
    } finally {
      setWizSubmitting(false);
    }
  };

  // 1. Church Info Handlers
  const handleSaveChurchInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedCityState =
      cityInput && stateInput ? `${cityInput} - ${stateInput.toUpperCase()}` : infoForm.cityStateZip;
    const nextInfo = {
      ...infoForm,
      cityStateZip: updatedCityState
    };
    updateChurchInfo(nextInfo);
    await updateChurchSlugAndMeta({
      slug: slugInput,
      city: cityInput,
      state: stateInput.toUpperCase(),
      themeColor: themeColorInput,
      latitude: latInput,
      longitude: lngInput
    });
  };

  const handleCaptureGpsForChurch = (isWizard: boolean) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      showToast('Geolocalização não disponível neste navegador.', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        if (isWizard) {
          setWizLat(lat);
          setWizLng(lng);
        } else {
          setLatInput(lat);
          setLngInput(lng);
        }
        showToast('Coordenadas GPS capturadas com sucesso!');
      },
      () => {
        showToast('Não foi possível obter a localização atual.', 'error');
      }
    );
  };

  const handleAddSchedule = () => {
    if (!newSchedule.title?.trim() || !newSchedule.time?.trim()) {
      showToast('Preencha título e horário do culto.', 'error');
      return;
    }

    const standardizedTime = formatTimeStandard(newSchedule.time.trim() || '19h30');

    if (editingScheduleId) {
      const updatedSchedules = infoForm.schedules.map((s) =>
        s.id === editingScheduleId
          ? {
              ...s,
              day: newSchedule.day?.trim() || 'Domingo',
              time: standardizedTime,
              title: newSchedule.title!.trim(),
              description: newSchedule.description?.trim() || '',
              location: newSchedule.location?.trim() || 'Templo Principal'
            }
          : s
      );
      const nextInfo: ChurchInfo = { ...infoForm, schedules: updatedSchedules };
      setInfoForm(nextInfo);
      updateChurchInfo(nextInfo);
      setEditingScheduleId(null);
    } else {
      const item: ScheduleItem = {
        id: `sch-${Date.now()}`,
        day: newSchedule.day?.trim() || 'Domingo',
        time: standardizedTime,
        title: newSchedule.title.trim(),
        description: newSchedule.description?.trim() || '',
        location: newSchedule.location?.trim() || 'Templo Principal'
      };
      const nextInfo: ChurchInfo = {
        ...infoForm,
        schedules: [...infoForm.schedules, item]
      };
      setInfoForm(nextInfo);
      updateChurchInfo(nextInfo);
    }

    setNewSchedule({ day: 'Domingo', time: '19h30', title: '', description: '', location: 'Templo Principal' });
  };

  const handleEditSchedule = (sch: ScheduleItem) => {
    setEditingScheduleId(sch.id);
    setNewSchedule({
      day: sch.day,
      time: formatTimeStandard(sch.time),
      title: sch.title,
      description: sch.description,
      location: sch.location || 'Templo Principal'
    });
  };

  const handleDuplicateSchedule = (sch: ScheduleItem) => {
    setEditingScheduleId(null);
    setNewSchedule({
      day: sch.day,
      time: formatTimeStandard(sch.time),
      title: sch.title,
      description: sch.description,
      location: sch.location || 'Templo Principal'
    });
    showToast('Horário copiado para o formulário! Ajuste o dia ou horário e clique em Salvar.');
  };

  const handleRemoveSchedule = (id: string) => {
    const nextInfo: ChurchInfo = {
      ...infoForm,
      schedules: infoForm.schedules.filter((s) => s.id !== id)
    };
    setInfoForm(nextInfo);
    updateChurchInfo(nextInfo);
    if (editingScheduleId === id) {
      setEditingScheduleId(null);
      setNewSchedule({ day: 'Domingo', time: '19h30', title: '', description: '', location: 'Templo Principal' });
    }
  };

  const handleAddLeader = () => {
    if (!newLeader.name?.trim() || !newLeader.role?.trim()) {
      showToast('Preencha o nome e o cargo do líder.', 'error');
      return;
    }

    if (editingLeaderId) {
      const updatedLeadership = infoForm.leadership.map((l) =>
        l.id === editingLeaderId
          ? {
              ...l,
              name: newLeader.name!.trim(),
              role: newLeader.role!.trim(),
              bio: newLeader.bio?.trim() || '',
              photoUrl: newLeader.photoUrl || l.photoUrl || '',
              phone: newLeader.phone?.trim() || '',
              email: newLeader.email?.trim() || ''
            }
          : l
      );
      const nextInfo: ChurchInfo = {
        ...infoForm,
        leadership: updatedLeadership
      };
      setInfoForm(nextInfo);
      updateChurchInfo(nextInfo);
      setEditingLeaderId(null);
    } else {
      const leader: LeaderMember = {
        id: `lead-${Date.now()}`,
        name: newLeader.name.trim(),
        role: newLeader.role.trim(),
        bio: newLeader.bio?.trim() || '',
        photoUrl: newLeader.photoUrl || '',
        phone: newLeader.phone?.trim() || '',
        email: newLeader.email?.trim() || ''
      };
      const nextInfo: ChurchInfo = {
        ...infoForm,
        leadership: [...infoForm.leadership, leader]
      };
      setInfoForm(nextInfo);
      updateChurchInfo(nextInfo);
    }

    setNewLeader({ name: '', role: '', bio: '', photoUrl: '', phone: '', email: '' });
  };

  const handleEditLeader = (leader: LeaderMember) => {
    setEditingLeaderId(leader.id);
    setNewLeader({
      name: leader.name,
      role: leader.role,
      bio: leader.bio || '',
      photoUrl: leader.photoUrl || '',
      phone: leader.phone || '',
      email: leader.email || ''
    });
  };

  const handleQuickLeaderPhotoUpload = (leaderId: string, base64: string) => {
    const updatedLeadership = infoForm.leadership.map((l) =>
      l.id === leaderId ? { ...l, photoUrl: base64 } : l
    );
    const nextInfo: ChurchInfo = {
      ...infoForm,
      leadership: updatedLeadership
    };
    setInfoForm(nextInfo);
    updateChurchInfo(nextInfo);
  };

  const handleRemoveLeader = (id: string) => {
    const nextInfo: ChurchInfo = {
      ...infoForm,
      leadership: infoForm.leadership.filter((l) => l.id !== id)
    };
    setInfoForm(nextInfo);
    updateChurchInfo(nextInfo);
    if (editingLeaderId === id) {
      setEditingLeaderId(null);
      setNewLeader({ name: '', role: '', bio: '', photoUrl: '', phone: '', email: '' });
    }
  };

  // 2. Bulletin Handlers
  const handleOpenBulletinModal = (b?: Bulletin, duplicate = false) => {
    setIsDuplicatingBulletin(Boolean(b && duplicate));
    if (b) {
      const cleanBaseTitle = (b.title || '').replace(/\s*\(cópia\)$/i, '').trim();
      setEditingBulletinId(duplicate ? null : b.id);
      setBulletinForm({
        ...b,
        title: duplicate ? `${cleanBaseTitle} (cópia)` : b.title,
        editionDate: duplicate ? new Date().toISOString().split('T')[0] : b.editionDate,
        isCurrent: duplicate ? false : b.isCurrent,
        status: duplicate ? 'draft' : b.status || 'published'
      });
      setLiturgyInputText(b.orderOfService ? b.orderOfService.join('\n') : '');
      setAnnouncementsInputText(b.announcements ? b.announcements.join('\n') : '');
    } else {
      setEditingBulletinId(null);
      setBulletinForm({
        title: '',
        editionDate: new Date().toISOString().split('T')[0],
        summary: '',
        isCurrent: bulletins.filter((x) => x.status !== 'draft').length === 0,
        status: 'published',
        type: 'text',
        themeVerse: '',
        pastoralWord: '',
        orderOfService: [],
        announcements: [],
        pdfUrl: '',
        pdfFileName: ''
      });
      setLiturgyInputText('');
      setAnnouncementsInputText('');
    }
    setBulletinModalOpen(true);
  };

  const handleSaveBulletinWithStatus = (status: PublicationStatus) => {
    if (!bulletinForm.title || !bulletinForm.editionDate) {
      showToast('Título e data são obrigatórios.', 'error');
      return;
    }

    const finalStatus: PublicationStatus = isDuplicatingBulletin ? 'draft' : status;

    const orderOfService = liturgyInputText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const announcements = announcementsInputText
      .split('\n')
      .map((a) => a.trim())
      .filter(Boolean);

    const payload = {
      title: bulletinForm.title,
      editionDate: bulletinForm.editionDate,
      summary: bulletinForm.summary || '',
      isCurrent: finalStatus === 'draft' ? false : Boolean(bulletinForm.isCurrent),
      status: finalStatus,
      type: bulletinForm.type || 'text',
      themeVerse: bulletinForm.themeVerse || '',
      pastoralWord: bulletinForm.pastoralWord || '',
      orderOfService,
      announcements,
      pdfUrl: bulletinForm.pdfUrl || '',
      pdfFileName: bulletinForm.pdfFileName || ''
    };

    if (editingBulletinId) {
      updateBulletin(editingBulletinId, payload);
    } else {
      addBulletin(payload);
    }

    setIsDuplicatingBulletin(false);
    setBulletinModalOpen(false);
  };

  const handleSaveBulletin = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveBulletinWithStatus(isDuplicatingBulletin ? 'draft' : bulletinForm.status || 'published');
  };

  // 3. Birthday Handlers
  const handleOpenBirthdayModal = (person?: BirthdayPerson) => {
    if (person) {
      setEditingBirthdayId(person.id);
      setBirthdayForm({ ...person });
    } else {
      setEditingBirthdayId(null);
      setBirthdayForm({
        name: '',
        birthDay: new Date().getDate(),
        birthMonth: new Date().getMonth() + 1,
        birthYear: undefined,
        phone: '',
        photoUrl: '',
        ministry: ''
      });
    }
    setBirthdayModalOpen(true);
  };

  const handleSaveBirthday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthdayForm.name || !birthdayForm.birthDay || !birthdayForm.birthMonth) {
      showToast('Preencha nome, dia e mês do aniversariante.', 'error');
      return;
    }

    const payload = {
      name: birthdayForm.name,
      birthDay: Number(birthdayForm.birthDay),
      birthMonth: Number(birthdayForm.birthMonth),
      birthYear: birthdayForm.birthYear ? Number(birthdayForm.birthYear) : undefined,
      phone: birthdayForm.phone || undefined,
      photoUrl: birthdayForm.photoUrl || undefined,
      ministry: birthdayForm.ministry || undefined
    };

    if (editingBirthdayId) {
      updateBirthday(editingBirthdayId, payload);
    } else {
      addBirthday(payload);
    }

    setBirthdayModalOpen(false);
  };

  // CSV Import preview & apply
  const handleCsvTextChange = (text: string) => {
    setCsvTextInput(text);
    const parsed = ChurchStorageService.parseBirthdayCSV(text);
    setCsvParsedPreview(parsed);
  };

  const handleApplyCsvImport = () => {
    if (csvParsedPreview.length === 0) {
      showToast('Nenhum aniversariante válido para importar.', 'error');
      return;
    }
    importBirthdaysCSV(csvTextInput);
    setCsvModalOpen(false);
    setCsvTextInput('');
    setCsvParsedPreview([]);
  };

  // 3B. Deacon Schedule Handlers (Dynamic Categories from Church Schedules + Evento especial)
  const getCategoryDefaultValues = (categoryId: DeaconScheduleCategory) => {
    const matched = dynamicDeaconCategories.find((c) => c.id === categoryId) || dynamicDeaconCategories[0];
    if (matched) {
      return {
        category: matched.id,
        serviceName: matched.defaultServiceName,
        time: formatTimeStandard(matched.defaultTime || '19h30'),
        notes: ''
      };
    }
    return {
      category: 'evento_especial',
      serviceName: 'Evento Especial',
      time: '19h30',
      notes: ''
    };
  };

  const handleOpenDeaconModal = (
    item?: DeaconScheduleItem,
    duplicate = false,
    presetCategory?: DeaconScheduleCategory
  ) => {
    setIsDuplicatingDeacon(Boolean(item && duplicate));
    const fallbackCategory = presetCategory || dynamicDeaconCategories[0]?.id || 'evento_especial';
    if (item) {
      const resolvedMeta = getDeaconCategoryMeta(item, infoForm.schedules);
      const cleanBaseService = (item.serviceName || '').replace(/\s*\(cópia\)$/i, '').trim();
      setEditingDeaconId(duplicate ? null : item.id);
      setDeaconForm({
        category: resolvedMeta.id,
        date: duplicate ? new Date().toISOString().split('T')[0] : item.date,
        serviceName: duplicate ? `${cleanBaseService} (cópia)` : item.serviceName,
        time: formatTimeStandard(item.time),
        coordinator: item.coordinator,
        coordinatorPhone: item.coordinatorPhone || '',
        notes: item.notes || '',
        status: duplicate ? 'draft' : item.status || 'published',
        updatedByName: item.updatedByName,
        createdByName: item.createdByName,
        updatedByEmail: item.updatedByEmail,
        createdByEmail: item.createdByEmail,
        updatedAt: item.updatedAt,
        createdAt: item.createdAt
      });
      setReceptionInput(item.receptionTeam.join(', '));
      setOfferingInput(item.offeringAndCommunionTeam.join(', '));
      setParkingInput(item.parkingAndOrderTeam.join(', '));
    } else {
      const defaults = getCategoryDefaultValues(fallbackCategory);
      setEditingDeaconId(null);
      setDeaconForm({
        category: defaults.category,
        date: new Date().toISOString().split('T')[0],
        serviceName: defaults.serviceName,
        time: defaults.time,
        coordinator: '',
        coordinatorPhone: '',
        notes: defaults.notes,
        status: 'published'
      });
      setReceptionInput('');
      setOfferingInput('');
      setParkingInput('');
    }
    setDeaconModalOpen(true);
  };

  const handleSelectDeaconCategoryInModal = (cat: DeaconScheduleCategory) => {
    const defaults = getCategoryDefaultValues(cat);
    const cleanDefaultName = (defaults.serviceName || '').replace(/\s*\(cópia\)$/i, '').trim();
    setDeaconForm((prev) => ({
      ...prev,
      category: cat,
      serviceName: isDuplicatingDeacon ? `${cleanDefaultName} (cópia)` : defaults.serviceName,
      time: defaults.time
    }));
  };

  const handleSaveDeaconScheduleWithStatus = (status: PublicationStatus) => {
    if (!deaconForm.date || !deaconForm.serviceName || !deaconForm.coordinator) {
      showToast('Preencha data, nome do culto e diácono coordenador.', 'error');
      return;
    }

    const finalStatus: PublicationStatus = isDuplicatingDeacon ? 'draft' : status;

    const parseTeam = (str: string) =>
      str
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean);

    const payload: Omit<DeaconScheduleItem, 'id'> = {
      category: (deaconForm.category as DeaconScheduleCategory) || 'evento_especial',
      date: deaconForm.date,
      serviceName: deaconForm.serviceName,
      time: formatTimeStandard(deaconForm.time || '19h30'),
      coordinator: deaconForm.coordinator,
      coordinatorPhone: deaconForm.coordinatorPhone || undefined,
      receptionTeam: parseTeam(receptionInput),
      offeringAndCommunionTeam: parseTeam(offeringInput),
      parkingAndOrderTeam: parseTeam(parkingInput),
      notes: deaconForm.notes || undefined,
      status: finalStatus
    };

    if (editingDeaconId) {
      updateDeaconSchedule(editingDeaconId, payload);
    } else {
      addDeaconSchedule(payload);
    }

    setIsDuplicatingDeacon(false);
    setDeaconModalOpen(false);
  };

  const handleSaveDeaconSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveDeaconScheduleWithStatus(isDuplicatingDeacon ? 'draft' : deaconForm.status || 'published');
  };

  // 4. Banner Handlers
  const handleOpenBannerModal = (banner?: Banner) => {
    if (banner) {
      setEditingBannerId(banner.id);
      setBannerForm({ ...banner, status: banner.status || 'published' });
    } else {
      setEditingBannerId(null);
      setBannerForm({
        title: '',
        position: 'topo',
        imageUrl: '',
        linkUrl: '',
        openInNewTab: true,
        startDate: '',
        endDate: '',
        order: banners.length + 1,
        isActive: true,
        status: 'published'
      });
    }
    setBannerModalOpen(true);
  };

  const handleSaveBannerWithStatus = (status: PublicationStatus) => {
    if (!bannerForm.title || !bannerForm.imageUrl) {
      showToast('Título e imagem do banner são obrigatórios.', 'error');
      return;
    }

    const payload = {
      title: bannerForm.title,
      position: (bannerForm.position as BannerPosition) || 'topo',
      imageUrl: bannerForm.imageUrl,
      linkUrl: bannerForm.linkUrl || '',
      openInNewTab: Boolean(bannerForm.openInNewTab),
      startDate: bannerForm.startDate || undefined,
      endDate: bannerForm.endDate || undefined,
      order: Number(bannerForm.order || 1),
      isActive: status === 'draft' ? false : bannerForm.isActive !== false,
      status
    };

    if (editingBannerId) {
      updateBanner(editingBannerId, payload);
    } else {
      addBanner(payload);
    }

    setBannerModalOpen(false);
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveBannerWithStatus(bannerForm.status || 'published');
  };

  // 5. Backup Export/Import
  const handleExportBackup = () => {
    const data = {
      churchInfo,
      bulletins,
      birthdays,
      deaconSchedules,
      banners,
      settings,
      exportedAt: new Date().toISOString()
    };
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonStr);
    downloadAnchor.setAttribute(
      'download',
      `backup_${activeChurch?.slug || 'igreja'}_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Backup exportado com sucesso!');
  };

  const handleImportBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        void importFullChurchBackup(text);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const vercelEnvBlock = `VITE_FIREBASE_PROJECT_ID="${activeFirebaseConfig.projectId}"
VITE_FIREBASE_APP_ID="${activeFirebaseConfig.appId}"
VITE_FIREBASE_API_KEY="${activeFirebaseConfig.apiKey}"
VITE_FIREBASE_AUTH_DOMAIN="${activeFirebaseConfig.authDomain}"
VITE_FIREBASE_DATABASE_ID="${activeFirebaseConfig.firestoreDatabaseId}"
VITE_FIREBASE_STORAGE_BUCKET="${activeFirebaseConfig.storageBucket}"
VITE_FIREBASE_MESSAGING_SENDER_ID="${activeFirebaseConfig.messagingSenderId}"`;

  const handleCopyVercelEnvVars = () => {
    navigator.clipboard.writeText(vercelEnvBlock);
    setCopiedEnvVars(true);
    showToast('Variáveis de ambiente do Firebase copiadas!');
    setTimeout(() => setCopiedEnvVars(false), 3000);
  };

  const buildTeamInviteMessage = (email: string, role: 'admin' | 'editor') => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const roleLabel = role === 'admin' ? 'Administrador(a)' : 'Editor(a)';
    return `Olá! Você foi convidado(a) para fazer parte da equipe da igreja *${activeChurch?.name || 'nossa igreja'}* como *${roleLabel}*.\n\nPara acessar o painel:\n1. Acesse o link: ${origin}/gestor\n2. Entre com sua Conta Google ou crie sua conta usando exatamente o e-mail convidado: ${email}`;
  };

  const handleCopyInviteMessage = (email: string, role: 'admin' | 'editor') => {
    navigator.clipboard.writeText(buildTeamInviteMessage(email, role));
    showToast('Mensagem de convite copiada para a área de transferência!');
  };

  const handleSendInviteWhatsApp = (email: string, role: 'admin' | 'editor') => {
    const msg = buildTeamInviteMessage(email, role);
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = inviteEmailInput.trim().toLowerCase();
    if (!cleanEmail) return;
    setInvitingManager(true);
    try {
      await inviteTeamMemberByEmail(cleanEmail, inviteRoleInput);
      setLastInvitedMember({ email: cleanEmail, role: inviteRoleInput });
      setInviteEmailInput('');
    } finally {
      setInvitingManager(false);
    }
  };

  // ============================================================================
  // CASE 1: NOT AUTHENTICATED -> SHOW LOGIN / REGISTRATION PORTAL
  // ============================================================================
  if (!firebaseUser) {
    return (
      <div className="max-w-md mx-auto my-6 sm:my-8 p-6 sm:p-8 bg-white rounded-3xl border border-stone-200/90 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#EAF0EC] text-[#344E41] flex items-center justify-center mx-auto mb-2">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">
            Portal do Gestor
          </h1>
          <p className="text-xs text-stone-500 leading-relaxed">
            Entre na sua conta para administrar sua igreja ou crie uma conta gratuita para cadastrar uma nova igreja na plataforma.
          </p>
        </div>

        <button
          type="button"
          disabled={authLoading}
          onClick={handleGoogleAuth}
          className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#344E41] hover:bg-[#284136] disabled:opacity-60 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2.5 shadow-xs"
        >
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>
            {authLoading ? 'Conectando ao Firebase...' : 'Continuar com Conta Google'}
          </span>
        </button>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-stone-200" />
          <span className="shrink mx-3 text-[11px] uppercase tracking-wider text-stone-400 font-semibold">
            ou com e-mail e senha
          </span>
          <div className="flex-grow border-t border-stone-200" />
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setAuthErrorMsg(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-colors ${
              authMode === 'login' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Entrar na Conta
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setAuthErrorMsg(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-colors ${
              authMode === 'register' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Cadastrar Minha Igreja
          </button>
        </div>

        {authErrorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{authErrorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-3.5">
          {authMode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Seu Nome Completo
              </label>
              <input
                type="text"
                required
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                placeholder="Nome do Pastor ou Gestor"
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#344E41]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              E-mail do Gestor
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full min-h-[44px] pl-10 pr-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#344E41]"
              />
              <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Senha de Acesso
            </label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={6}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full min-h-[44px] pl-10 pr-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#344E41]"
              />
              <Key className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={authLoading}
            className="w-full min-h-[46px] rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>
              {authMode === 'register'
                ? 'Criar Conta e Configurar Igreja'
                : 'Entrar com E-mail e Senha'}
            </span>
          </button>
        </form>

        <div className="pt-3 border-t border-stone-200/80 space-y-2">
          <button
            type="button"
            onClick={switchChurch}
            className="w-full py-2 text-xs font-semibold text-stone-500 hover:text-stone-800 flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para a busca de igrejas</span>
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // CASE 1B: AUTHENTICATED WITH EMAIL/PASSWORD BUT EMAIL NOT VERIFIED YET
  // ============================================================================
  if (!isEmailVerified) {
    return (
      <div className="max-w-lg mx-auto my-8 p-6 sm:p-8 bg-white rounded-3xl border border-amber-200 shadow-sm space-y-5 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 mx-auto flex items-center justify-center">
          <Mail className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-3 py-1 rounded-full">
            Verificação de Segurança Obrigatória
          </span>
          <h1 className="text-2xl font-serif font-bold text-stone-900">
            Confirme seu e-mail
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Enviamos um link de confirmação para <strong>{firebaseUser.email}</strong>.
            Por segurança, confirme seu endereço de e-mail para liberar o painel de gestão, aceitar convites de equipe ou acessar permissões administrativas.
          </p>
          <p className="text-[11px] text-stone-500">
            Dica: Se você entrar com sua <strong>Conta Google</strong>, o e-mail já vem verificado automaticamente.
          </p>
        </div>

        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={() => void checkEmailVerificationNow()}
            className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-[#344E41] hover:bg-[#284136] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>Já confirmei meu e-mail — Liberar Acesso</span>
          </button>

          <button
            type="button"
            onClick={() => void resendEmailVerification()}
            className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reenviar e-mail de verificação</span>
          </button>

          <button
            type="button"
            onClick={handleGoogleAuth}
            className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Entrar com Conta Google (Verificação Imediata)</span>
          </button>
        </div>

        <div className="pt-3 border-t border-stone-200/80 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={switchChurch}
            className="py-2 text-xs font-semibold text-stone-500 hover:text-stone-800 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao início</span>
          </button>
          <button
            type="button"
            onClick={managerLogout}
            className="py-2 text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair desta conta</span>
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // CASE 2: AUTHENTICATED USER NEEDS CHURCH ONBOARDING WIZARD (Requirement 3)
  // ============================================================================
  if (needsChurchOnboarding || !activeChurch) {
    return (
      <div className="max-w-3xl mx-auto my-6 sm:my-8 bg-white rounded-3xl p-6 sm:p-10 border border-stone-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-100">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#344E41] bg-[#EAF0EC] px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Assistente de Configuração da Igreja</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
              Cadastre sua Igreja na Plataforma
            </h1>
            <p className="text-xs sm:text-sm text-stone-500">
              Sua igreja nascerá 100% limpa (sem dados de exemplo) e já terá um link exclusivo e QR Code para seus membros.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start">
            {isCreatingAdditionalChurch && managedChurches.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setIsCreatingAdditionalChurch(false);
                  if (!activeChurch && managedChurches[0]) {
                    selectChurchBySlug(managedChurches[0].slug, 'manager');
                  }
                }}
                className="min-h-[40px] px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-100 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar ao Painel</span>
              </button>
            )}
            <button
              type="button"
              onClick={managerLogout}
              className="min-h-[40px] px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-100 flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleCompleteOnboardingWizard} className="space-y-6">
          {/* 1. Nome, Link (Slug) e Logo */}
          <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-4">
            <h3 className="font-bold text-stone-900 text-sm uppercase tracking-wider">
              1. Identidade Visual &amp; Link Exclusivo
            </h3>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-stone-200/70">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center text-white shrink-0 border-2 border-white shadow-xs"
                  style={{ backgroundColor: wizThemeColor }}
                >
                  {wizLogoUrl ? (
                    <img src={wizLogoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Church className="w-7 h-7" />
                  )}
                </div>
                <div>
                  <span className="font-bold text-stone-900 text-sm block">Logotipo da Igreja</span>
                  <span className="text-xs text-stone-500">Opcional — você pode enviar do celular ou computador</span>
                </div>
              </div>

              <label className="min-h-[40px] px-4 py-2 rounded-xl bg-[#344E41] hover:bg-[#284136] text-white text-xs font-bold flex items-center gap-2 cursor-pointer self-start sm:self-auto">
                <Upload className="w-4 h-4" />
                <span>Enviar Logo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, (b64) => setWizLogoUrl(b64), 500)}
                  className="hidden"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Nome da Igreja *
                </label>
                <input
                  type="text"
                  required
                  value={wizName}
                  onChange={(e) => setWizName(e.target.value)}
                  placeholder="Ex: Igreja Presbiteriana de Aracaju"
                  className="w-full p-2.5 text-sm rounded-xl border border-stone-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Link Direto (Slug Único Editável) *
                </label>
                <div className="flex items-center rounded-xl border border-stone-300 bg-white overflow-hidden">
                  <span className="px-2.5 text-xs text-stone-400 font-mono bg-stone-100 py-2.5 border-r border-stone-200">
                    /
                  </span>
                  <input
                    type="text"
                    required
                    value={wizSlug}
                    onChange={(e) => {
                      setWizSlugManuallyEdited(true);
                      setWizSlug(slugifyChurchName(e.target.value));
                    }}
                    placeholder="ip-aracaju-se"
                    className="w-full p-2.5 text-sm font-mono focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Theme Color Picker */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-700">
                Cor do Tema da Igreja
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {PRESET_THEME_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setWizThemeColor(c.hex)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
                      wizThemeColor === c.hex
                        ? 'border-stone-900 ring-2 ring-stone-900/20 bg-white text-stone-900'
                        : 'border-stone-200 bg-white text-stone-600'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: c.hex }} />
                    <span>{c.name}</span>
                  </button>
                ))}
                <input
                  type="color"
                  value={wizThemeColor}
                  onChange={(e) => setWizThemeColor(e.target.value)}
                  className="w-9 h-9 rounded-xl border border-stone-300 cursor-pointer bg-white p-0.5"
                  title="Escolher cor personalizada"
                />
              </div>
            </div>
          </div>

          {/* 2. Localização & Contatos */}
          <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="font-bold text-stone-900 text-sm uppercase tracking-wider">
                2. Endereço, Cidade/UF &amp; Contatos
              </h3>
              <button
                type="button"
                onClick={() => handleCaptureGpsForChurch(true)}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-xs font-semibold text-[#344E41] flex items-center gap-1.5"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>
                  {wizLat !== undefined ? 'GPS Capturado ✓' : 'Usar minha localização GPS para o mapa'}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700 mb-1">Cidade *</label>
                <input
                  type="text"
                  required
                  value={wizCity}
                  onChange={(e) => setWizCity(e.target.value)}
                  placeholder="Ex: Nossa Senhora da Glória"
                  className="w-full p-2.5 text-sm rounded-xl border border-stone-300 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">UF (Estado) *</label>
                <input
                  type="text"
                  required
                  maxLength={2}
                  value={wizState}
                  onChange={(e) => setWizState(e.target.value.toUpperCase())}
                  placeholder="SE"
                  className="w-full p-2.5 text-sm uppercase rounded-xl border border-stone-300 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Endereço (Rua, Número, Bairro)
              </label>
              <input
                type="text"
                value={wizAddress}
                onChange={(e) => setWizAddress(e.target.value)}
                placeholder="Informe o endereço do templo"
                className="w-full p-2.5 text-sm rounded-xl border border-stone-300 bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Telefone (Opcional)
                </label>
                <input
                  type="text"
                  value={wizPhone}
                  onChange={(e) => setWizPhone(e.target.value)}
                  placeholder="Com DDD"
                  className="w-full p-2.5 text-sm rounded-xl border border-stone-300 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  WhatsApp (Opcional — apenas números com DDD)
                </label>
                <input
                  type="text"
                  value={wizWhatsapp}
                  onChange={(e) => setWizWhatsapp(e.target.value)}
                  placeholder="Ex: 5579999999999"
                  className="w-full p-2.5 text-sm rounded-xl border border-stone-300 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Instagram (URL)</label>
                <input
                  type="text"
                  value={wizInstagram}
                  onChange={(e) => setWizInstagram(e.target.value)}
                  placeholder="https://instagram.com/..."
                  className="w-full p-2.5 text-xs rounded-xl border border-stone-300 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">YouTube (URL)</label>
                <input
                  type="text"
                  value={wizYoutube}
                  onChange={(e) => setWizYoutube(e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="w-full p-2.5 text-xs rounded-xl border border-stone-300 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Facebook (URL)</label>
                <input
                  type="text"
                  value={wizFacebook}
                  onChange={(e) => setWizFacebook(e.target.value)}
                  placeholder="https://facebook.com/..."
                  className="w-full p-2.5 text-xs rounded-xl border border-stone-300 bg-white"
                />
              </div>
            </div>
          </div>

          {/* 3. Horários de Culto Iniciais */}
          <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-3">
            <h3 className="font-bold text-stone-900 text-sm uppercase tracking-wider">
              3. Horários de Cultos (Opcional — pode adicionar depois)
            </h3>

            {wizSchedules.length > 0 && (
              <div className="space-y-2">
                {wizSchedules.map((s) => (
                  <div
                    key={s.id}
                    className="p-2.5 rounded-xl bg-white border border-stone-200 flex items-center justify-between text-xs"
                  >
                    <span>
                      <strong>{s.day} às {formatTimeStandard(s.time)}:</strong> {s.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => setWizSchedules(wizSchedules.filter((x) => x.id !== s.id))}
                      className="text-rose-600 hover:underline font-semibold"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <select
                value={wizSchDay}
                onChange={(e) => setWizSchDay(e.target.value)}
                className="p-2 text-xs rounded-xl border border-stone-300 bg-white font-medium"
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-2">
                <input
                  type="time"
                  value={standardTimeToHtmlTime(wizSchTime)}
                  onChange={(e) => setWizSchTime(formatTimeStandard(e.target.value))}
                  className="w-full py-2 text-xs bg-transparent focus:outline-none"
                />
                <span className="text-[10px] font-mono font-bold text-[#344E41] bg-[#EAF0EC] px-1.5 py-0.5 rounded shrink-0">
                  {formatTimeStandard(wizSchTime)}
                </span>
              </div>
              <input
                type="text"
                value={wizSchTitle}
                onChange={(e) => setWizSchTitle(e.target.value)}
                placeholder="Ex: Culto de Adoração"
                className="p-2 text-xs rounded-xl border border-stone-300 bg-white"
              />
              <button
                type="button"
                onClick={() => {
                  if (!wizSchTitle.trim()) return;
                  setWizSchedules([
                    ...wizSchedules,
                    {
                      id: `sch-${Date.now()}`,
                      day: wizSchDay || 'Domingo',
                      time: formatTimeStandard(wizSchTime || '19h30'),
                      title: wizSchTitle.trim(),
                      description: '',
                      location: 'Templo Principal'
                    }
                  ]);
                  setWizSchTitle('');
                }}
                className="px-3 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold"
              >
                + Incluir Horário
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={wizSubmitting}
            className="w-full min-h-[50px] rounded-2xl bg-[#344E41] hover:bg-[#284136] text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            <span>
              {wizSubmitting
                ? 'Criando igreja no banco de dados...'
                : 'Concluir Cadastro e Abrir Painel da Minha Igreja'}
            </span>
          </button>
        </form>
      </div>
    );
  }

  // ============================================================================
  // CASE 3: AUTHENTICATED USER IS NOT A MANAGER OF THIS SPECIFIC CHURCH
  // ============================================================================
  if (!isManagerAuthenticated) {
    return (
      <div className="max-w-lg mx-auto my-8 p-6 sm:p-8 bg-white rounded-3xl border border-stone-200/90 shadow-sm space-y-5 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 mx-auto flex items-center justify-center">
          <Shield className="w-7 h-7" />
        </div>
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
          Acesso Restrito aos Gestores desta Igreja
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Sua conta (<strong>{firebaseUser.email}</strong>) não está listada como gestora da{' '}
          <strong>{activeChurch.name}</strong>. Solicite ao gestor titular ({activeChurch.ownerEmail}) que convide seu e-mail na aba &ldquo;Gestores &amp; Acessos&rdquo;.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setCurrentView('home')}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-[#344E41] text-white text-xs font-bold"
          >
            Voltar ao App da Igreja
          </button>
          <button
            type="button"
            onClick={managerLogout}
            className="min-h-[42px] px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700"
          >
            Trocar de Conta
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // CASE 4: AUTHENTICATED MANAGER DASHBOARD (/{slug}/gestor)
  // ============================================================================
  return (
    <div className="space-y-6 pb-16">
      {/* 1. Dashboard Top Header + Multi-Church Selector */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl text-white flex items-center justify-center shrink-0 overflow-hidden"
              style={{ backgroundColor: activeChurch.themeColor || '#344E41' }}
            >
              {activeChurch.logoUrl ? (
                <img src={activeChurch.logoUrl} alt={activeChurch.name} className="w-full h-full object-cover" />
              ) : (
                <ShieldCheck className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                  Gestão — {activeChurch.name}
                </h1>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full font-mono">
                  /{activeChurch.slug}/gestor
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    isChurchAdmin
                      ? 'bg-[#EAF0EC] text-[#344E41] border border-[#344E41]/20'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  Nível: {isChurchAdmin ? 'Administrador' : 'Editor'}
                </span>
                {isCloudSynced && (
                  <span className="text-[10px] bg-sky-100 text-sky-900 font-bold px-2.5 py-0.5 rounded-full">
                    Firestore Ativo
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500">
                Conectado como <strong>{platformUser?.name || firebaseUser.email}</strong> ({firebaseUser.email})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => setCurrentView('home')}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir App da Igreja</span>
            </button>

            {isPlatformOwner && (
              <button
                type="button"
                onClick={() => setCurrentView('admin')}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-bold flex items-center gap-1.5 border border-amber-300"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Painel Owner (/admin)</span>
              </button>
            )}

            <button
              type="button"
              onClick={pullLatestFromCloud}
              className="min-h-[40px] px-3.5 py-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#344E41]" />
              <span>Atualizar</span>
            </button>

            {isChurchAdmin && (
              <button
                type="button"
                onClick={syncLocalDataToCloud}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#EAF0EC] hover:bg-[#dbe6df] text-[#344E41] text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sincronizar</span>
              </button>
            )}

            <button
              onClick={managerLogout}
              className="min-h-[40px] px-3.5 py-2 rounded-xl border border-stone-200 hover:bg-rose-50 hover:text-rose-600 text-stone-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>

        {/* Seletor de Igreja (Permite alternar entre igrejas que o usuário ajuda ou cadastrar uma nova igreja) */}
        <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1">
            <span className="text-xs font-bold text-stone-600 flex items-center gap-1.5 shrink-0">
              <Church className="w-4 h-4 text-[#344E41]" />
              <span>Alternar Igreja Administrada ({managedChurches.length}):</span>
            </span>
            <select
              value={activeChurch.slug}
              onChange={(e) => selectChurchBySlug(e.target.value, 'manager')}
              className="min-h-[38px] px-3 py-1.5 rounded-xl border border-stone-300 bg-stone-50 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#344E41] max-w-md"
            >
              {managedChurches.map((ch) => (
                <option key={ch.id} value={ch.slug}>
                  {ch.name} ({ch.city}/{ch.state}) — /{ch.slug}
                </option>
              ))}
              {!managedChurches.some((ch) => ch.id === activeChurch.id) && (
                <option value={activeChurch.slug}>
                  {activeChurch.name} ({activeChurch.city}/{activeChurch.state}) — /{activeChurch.slug}
                </option>
              )}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsCreatingAdditionalChurch(true)}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5 text-[#344E41]" />
            <span>Cadastrar Nova Igreja</span>
          </button>
        </div>
      </div>

      {/* 2. Card de Divulgação Rápida: Link Direto (/{slug}), WhatsApp e QR Code (Requirement 5) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-200/90 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="space-y-3 flex-1 w-full">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#EAF0EC] text-[#344E41] px-2.5 py-1 rounded-full">
              Link Direto &amp; QR Code da Igreja
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-stone-900">
            Divulgue o aplicativo da sua igreja no boletim, telão e WhatsApp
          </h2>
          <p className="text-xs text-stone-600 leading-relaxed">
            Qualquer membro que abrir o link abaixo ou ler o QR Code entra <strong>diretamente na {activeChurch.name}</strong> em modo leitura, sem precisar de login.
          </p>

          <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <code className="text-xs sm:text-sm font-mono font-bold text-[#284136] break-all">
              {churchShareUrl}
            </code>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#344E41] hover:bg-[#284136] text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                {copiedShareLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedShareLink ? 'Link Copiado!' : 'Copiar link de divulgação'}</span>
              </button>

              <button
                type="button"
                onClick={handleShareOnWhatsApp}
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Compartilhar no WhatsApp</span>
              </button>
            </div>
          </div>
        </div>

        {/* QR Code Preview & Print/Download */}
        {qrCodeDataUrl && (
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col items-center gap-2.5 shrink-0">
            <img
              src={qrCodeDataUrl}
              alt={`QR Code ${activeChurch.name}`}
              className="w-28 h-28 rounded-xl border border-stone-200 bg-white p-1"
            />
            <div className="flex items-center gap-1.5">
              <a
                href={qrCodeDataUrl}
                download={`qrcode-${activeChurch.slug}.png`}
                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 text-[11px] font-bold text-stone-700 flex items-center gap-1"
              >
                <QrCode className="w-3.5 h-3.5 text-[#344E41]" />
                <span>Baixar PNG</span>
              </a>
              <button
                type="button"
                onClick={handlePrintQrCode}
                className="px-2.5 py-1.5 rounded-lg bg-[#EAF0EC] hover:bg-[#dbe6df] text-[11px] font-bold text-[#344E41] flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir p/ Telão</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Management Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          ...(isChurchAdmin
            ? [{ id: 'info', label: 'Informações da Igreja', icon: <Church className="w-4 h-4" /> }]
            : []),
          { id: 'bulletins', label: 'Boletins', count: bulletins.length, icon: <FileText className="w-4 h-4" /> },
          { id: 'deacons', label: 'Escala de Diáconos', count: deaconSchedules.length, icon: <ClipboardList className="w-4 h-4" /> },
          { id: 'birthdays', label: 'Aniversariantes', count: birthdays.length, icon: <CalendarHeart className="w-4 h-4" /> },
          { id: 'banners', label: 'Banners', count: banners.length, icon: <ImageIcon className="w-4 h-4" /> },
          ...(isChurchAdmin
            ? [
                {
                  id: 'team',
                  label: 'Equipe',
                  count: activeChurch.teamMembers?.length || activeChurch.managerEmails?.length || 1,
                  icon: <Users className="w-4 h-4" />
                },
                { id: 'settings', label: 'Backup & Vercel', icon: <Settings className="w-4 h-4" /> }
              ]
            : [])
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ManagerTab)}
              className={`min-h-[46px] px-4 py-2.5 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2 shrink-0 transition-all ${
                isActive
                  ? 'bg-[#344E41] text-white shadow-xs'
                  : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: INFORMAÇÕES DA IGREJA */}
      {activeTab === 'info' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveChurchInfo} className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div>
                <h3 className="font-bold text-stone-900 text-lg">Dados Principais da Igreja</h3>
                <p className="text-xs text-stone-500">Alterações sincronizam em tempo real com os membros da igreja.</p>
              </div>
              <button
                type="submit"
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#344E41] hover:bg-[#284136] text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Tudo</span>
              </button>
            </div>

            {/* Upload e Pré-visualização da Logo da Igreja */}
            <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-stone-200 shadow-xs flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: themeColorInput || '#344E41' }}
                  >
                    {infoForm.logoUrl ? (
                      <img src={infoForm.logoUrl} alt="Logo da Igreja" className="w-full h-full object-cover" />
                    ) : (
                      <Church className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-stone-900 text-sm">Logotipo da Igreja</h4>
                    <p className="text-xs text-stone-500">
                      Exibido na lista de igrejas, no topo do app e no rodapé.
                    </p>
                    {infoForm.logoUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          const next = { ...infoForm, logoUrl: '' };
                          setInfoForm(next);
                          updateChurchInfo(next);
                        }}
                        className="text-[11px] text-rose-600 hover:underline font-semibold"
                      >
                        Remover logotipo atual
                      </button>
                    )}
                  </div>
                </div>

                <label className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#344E41] hover:bg-[#284136] text-white font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-xs transition-colors self-start sm:self-auto">
                  <Upload className="w-4 h-4" />
                  <span>Fazer Upload da Logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleFileUpload(
                        e,
                        (b64) => {
                          const next = { ...infoForm, logoUrl: b64 };
                          setInfoForm(next);
                          updateChurchInfo(next);
                        },
                        500
                      )
                    }
                    className="hidden"
                  />
                </label>
              </div>

              <div className="pt-2 border-t border-stone-200/60">
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  Ou insira o link direto (URL) da imagem da logo:
                </label>
                <input
                  type="text"
                  value={infoForm.logoUrl}
                  onChange={(e) => setInfoForm({ ...infoForm, logoUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full p-2 text-xs rounded-xl border border-stone-300 bg-white"
                />
              </div>
            </div>

            {/* Slug, Cor do Tema e Cidade/UF */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Slug (Link Direto da Igreja)
                </label>
                <div className="flex items-center rounded-xl border border-stone-300 bg-white overflow-hidden">
                  <span className="px-2.5 text-xs text-stone-400 font-mono bg-stone-100 py-2.5 border-r border-stone-200">
                    /
                  </span>
                  <input
                    type="text"
                    value={slugInput}
                    onChange={(e) => setSlugInput(slugifyChurchName(e.target.value))}
                    className="w-full p-2 text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Cidade *</label>
                <input
                  type="text"
                  required
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  placeholder="Cidade da igreja"
                  className="w-full p-2 text-xs rounded-xl border border-stone-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">UF (Estado) *</label>
                <input
                  type="text"
                  required
                  maxLength={2}
                  value={stateInput}
                  onChange={(e) => setStateInput(e.target.value.toUpperCase())}
                  placeholder="SE"
                  className="w-full p-2 text-xs uppercase rounded-xl border border-stone-300 bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-[#344E41]" />
                  <span>Cor do Tema da Igreja</span>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {PRESET_THEME_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setThemeColorInput(c.hex)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 border ${
                        themeColorInput === c.hex
                          ? 'border-stone-900 bg-white text-stone-900'
                          : 'border-stone-200 bg-white text-stone-600'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: c.hex }} />
                      <span>{c.name}</span>
                    </button>
                  ))}
                  <input
                    type="color"
                    value={themeColorInput}
                    onChange={(e) => setThemeColorInput(e.target.value)}
                    className="w-8 h-8 rounded-lg border border-stone-300 cursor-pointer bg-white p-0.5"
                  />
                </div>
              </div>

              <div className="flex flex-col justify-end">
                <button
                  type="button"
                  onClick={() => handleCaptureGpsForChurch(false)}
                  className="min-h-[38px] px-3 py-2 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-xs font-semibold text-[#344E41] flex items-center justify-center gap-1.5"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>
                    {latInput !== undefined ? 'Atualizar GPS' : 'Salvar GPS p/ Proximidade'}
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Nome da Igreja</label>
                <input
                  type="text"
                  required
                  value={infoForm.name}
                  onChange={(e) => setInfoForm({ ...infoForm, name: e.target.value })}
                  className="w-full p-2.5 text-sm rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Frase de Boas-Vindas / Slogan</label>
                <input
                  type="text"
                  value={infoForm.tagline}
                  onChange={(e) => setInfoForm({ ...infoForm, tagline: e.target.value })}
                  className="w-full p-2.5 text-sm rounded-xl border border-stone-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">História / Sobre</label>
                <textarea
                  rows={4}
                  value={infoForm.aboutHistory}
                  onChange={(e) => setInfoForm({ ...infoForm, aboutHistory: e.target.value })}
                  className="w-full p-2.5 text-sm rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Missão &amp; Declaração de Fé</label>
                <textarea
                  rows={4}
                  value={infoForm.missionVision}
                  onChange={(e) => setInfoForm({ ...infoForm, missionVision: e.target.value })}
                  className="w-full p-2.5 text-sm rounded-xl border border-stone-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Endereço Completo</label>
                <input
                  type="text"
                  value={infoForm.address}
                  onChange={(e) => setInfoForm({ ...infoForm, address: e.target.value })}
                  className="w-full p-2.5 text-sm rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Link do Google Maps (Opcional)</label>
                <input
                  type="text"
                  value={infoForm.googleMapsUrl}
                  onChange={(e) => setInfoForm({ ...infoForm, googleMapsUrl: e.target.value })}
                  className="w-full p-2.5 text-sm rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">WhatsApp (apenas números com DDD)</label>
                <input
                  type="text"
                  value={infoForm.whatsappNumber}
                  onChange={(e) => setInfoForm({ ...infoForm, whatsappNumber: e.target.value })}
                  placeholder="Ex: 5579999999999"
                  className="w-full p-2.5 text-sm rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Telefone Principal (O botão Ligar só aparece se preenchido)
                </label>
                <input
                  type="text"
                  value={infoForm.primaryPhone}
                  onChange={(e) => setInfoForm({ ...infoForm, primaryPhone: e.target.value })}
                  className="w-full p-2.5 text-sm rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">E-mail Oficial</label>
                <input
                  type="email"
                  value={infoForm.email}
                  onChange={(e) => setInfoForm({ ...infoForm, email: e.target.value })}
                  className="w-full p-2.5 text-sm rounded-xl border border-stone-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-stone-100">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Instagram URL</label>
                <input
                  type="text"
                  value={infoForm.instagramUrl}
                  onChange={(e) => setInfoForm({ ...infoForm, instagramUrl: e.target.value })}
                  className="w-full p-2.5 text-sm rounded-xl border border-stone-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">YouTube URL</label>
                <input
                  type="text"
                  value={infoForm.youtubeUrl}
                  onChange={(e) => setInfoForm({ ...infoForm, youtubeUrl: e.target.value })}
                  className="w-full p-2.5 text-sm rounded-xl border border-stone-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Facebook URL</label>
                <input
                  type="text"
                  value={infoForm.facebookUrl}
                  onChange={(e) => setInfoForm({ ...infoForm, facebookUrl: e.target.value })}
                  className="w-full p-2.5 text-sm rounded-xl border border-stone-300"
                />
              </div>
            </div>
          </form>

          {/* Gerenciar Horários de Cultos */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-bold text-stone-900 text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#344E41]" />
                <span>Horários de Cultos e Programações ({infoForm.schedules.length})</span>
              </h3>
              <span className="text-[11px] font-semibold text-emerald-800 bg-[#EAF0EC] px-2.5 py-1 rounded-full">
                Subcoleção cultos sincronizada
              </span>
            </div>

            {infoForm.schedules.length === 0 ? (
              <div className="p-8 rounded-2xl bg-stone-50 border border-stone-200/80 text-center space-y-3">
                <Clock className="w-7 h-7 text-stone-300 mx-auto" />
                <p className="text-sm font-bold text-stone-700">Nenhum item cadastrado ainda</p>
                <p className="text-xs text-stone-500">
                  Cadastre os horários de cultos da igreja no formulário abaixo. Eles também geram automaticamente as categorias da Escala Diaconal.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('schedule-title-input');
                    el?.focus();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#344E41] hover:bg-[#284136] text-white text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Horário de Culto</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {infoForm.schedules.map((sch) => (
                  <div
                    key={sch.id}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 transition-colors ${
                      editingScheduleId === sch.id
                        ? 'bg-[#EAF0EC]/60 border-[#344E41]'
                        : 'bg-stone-50 border-stone-200'
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-[#344E41]">
                        {sch.day} às {formatTimeStandard(sch.time)}
                      </span>
                      <h4 className="font-bold text-sm text-stone-900 mt-0.5">{sch.title}</h4>
                      {sch.description && <p className="text-xs text-stone-500">{sch.description}</p>}
                      {sch.location && (
                        <p className="text-[11px] text-stone-400 mt-0.5">Local: {sch.location}</p>
                      )}
                    </div>
                    <div className="pt-2 border-t border-stone-200/70 flex items-center justify-end gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleDuplicateSchedule(sch)}
                        className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 text-[11px] font-semibold flex items-center gap-1"
                        title="Duplicar este horário para ajustar dia ou hora"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Duplicar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditSchedule(sch)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#EAF0EC] hover:bg-[#dbe6df] text-[#344E41] text-[11px] font-bold flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveSchedule(sch.id)}
                        className="px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-[11px] font-semibold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Excluir</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700 block">
                  {editingScheduleId ? 'Editando Horário de Culto' : 'Adicionar Novo Horário de Culto'}
                </span>
                {editingScheduleId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingScheduleId(null);
                      setNewSchedule({
                        day: 'Domingo',
                        time: '19h30',
                        title: '',
                        description: '',
                        location: 'Templo Principal'
                      });
                    }}
                    className="text-xs text-rose-600 hover:underline font-semibold"
                  >
                    Cancelar edição
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">Dia da Semana *</label>
                  <select
                    value={newSchedule.day || 'Domingo'}
                    onChange={(e) => setNewSchedule({ ...newSchedule, day: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300 bg-white font-medium"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    Horário Padronizado ({formatTimeStandard(newSchedule.time || '19h30')}) *
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-2.5">
                    <input
                      type="time"
                      value={standardTimeToHtmlTime(newSchedule.time || '19h30')}
                      onChange={(e) =>
                        setNewSchedule({ ...newSchedule, time: formatTimeStandard(e.target.value) })
                      }
                      className="w-full py-2 text-xs bg-transparent focus:outline-none"
                    />
                    <span className="text-[11px] font-mono font-bold text-[#344E41] bg-[#EAF0EC] px-2 py-0.5 rounded shrink-0">
                      {formatTimeStandard(newSchedule.time || '19h30')}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">Nome do Culto / Programação *</label>
                  <input
                    id="schedule-title-input"
                    type="text"
                    placeholder="Ex: Culto Dominical / EBD"
                    value={newSchedule.title}
                    onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300 bg-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Descrição breve..."
                  value={newSchedule.description}
                  onChange={(e) => setNewSchedule({ ...newSchedule, description: e.target.value })}
                  className="p-2.5 text-xs rounded-xl border border-stone-300 bg-white"
                />
                <input
                  type="text"
                  placeholder="Local (ex: Templo Principal)"
                  value={newSchedule.location}
                  onChange={(e) => setNewSchedule({ ...newSchedule, location: e.target.value })}
                  className="p-2.5 text-xs rounded-xl border border-stone-300 bg-white"
                />
              </div>
              <button
                type="button"
                onClick={handleAddSchedule}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-[#344E41] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#284136] transition-colors"
              >
                {editingScheduleId ? <Save className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>
                  {editingScheduleId ? 'Salvar Alterações do Horário' : 'Adicionar e Salvar Horário'}
                </span>
              </button>
            </div>
          </div>

          {/* Gerenciar Pastores e Liderança */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-stone-900 text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#344E41]" />
                  <span>Pastores e Liderança ({infoForm.leadership.length})</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Subcoleção <code>lideranca</code> sincronizada com o banco de dados.
                </p>
              </div>
            </div>

            {infoForm.leadership.length === 0 ? (
              <div className="p-8 rounded-2xl bg-stone-50 border border-stone-200/80 text-center space-y-3">
                <Users className="w-7 h-7 text-stone-300 mx-auto" />
                <p className="text-sm font-bold text-stone-700">Nenhum item cadastrado ainda</p>
                <p className="text-xs text-stone-500">
                  Utilize o formulário abaixo para adicionar pastores, presbíteros ou líderes da sua igreja.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('leader-name-input');
                    el?.focus();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#344E41] hover:bg-[#284136] text-white text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar Líder</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {infoForm.leadership.map((l) => (
                  <div
                    key={l.id}
                    className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
                      editingLeaderId === l.id
                        ? 'bg-[#EAF0EC]/60 border-[#344E41] ring-1 ring-[#344E41]/30'
                        : 'bg-stone-50 border-stone-200'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="relative shrink-0">
                        {l.photoUrl ? (
                          <img
                            src={l.photoUrl}
                            alt={l.name}
                            className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-2xs"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-[#EAF0EC] text-[#344E41] flex items-center justify-center font-bold text-lg">
                            {l.name.charAt(0)}
                          </div>
                        )}
                        <label
                          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#344E41] hover:bg-[#284136] text-white flex items-center justify-center cursor-pointer shadow-xs"
                          title="Fazer upload de nova foto"
                        >
                          <Upload className="w-3 h-3" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleFileUpload(e, (b64) => handleQuickLeaderPhotoUpload(l.id, b64), 500)
                            }
                            className="hidden"
                          />
                        </label>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs sm:text-sm text-stone-900 truncate">{l.name}</h4>
                        <p className="text-[11px] font-semibold text-[#344E41] truncate">{l.role}</p>
                        {l.phone && <p className="text-[11px] text-stone-500 truncate mt-0.5">{l.phone}</p>}
                        {l.bio && <p className="text-[11px] text-stone-500 line-clamp-2 mt-1">{l.bio}</p>}
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-stone-200/70 flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleEditLeader(l)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#EAF0EC] hover:bg-[#dbe6df] text-[#344E41] text-[11px] font-bold flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveLeader(l.id)}
                        className="px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-[11px] font-semibold flex items-center gap-1 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Excluir</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add / Edit leader subform */}
            <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-stone-800 block">
                  {editingLeaderId ? 'Editar Dados do Líder' : 'Cadastrar Novo Líder'}
                </span>
                {editingLeaderId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingLeaderId(null);
                      setNewLeader({ name: '', role: '', bio: '', photoUrl: '', phone: '', email: '' });
                    }}
                    className="text-xs font-bold text-rose-600 hover:underline"
                  >
                    Cancelar edição
                  </button>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-white border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#EAF0EC] border-2 border-stone-200 flex items-center justify-center shrink-0">
                    {newLeader.photoUrl ? (
                      <img src={newLeader.photoUrl} alt="Líder" className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-6 h-6 text-[#344E41]" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-stone-900 block">Foto do Pastor / Líder</span>
                    <p className="text-[11px] text-stone-500">Envie do seu dispositivo ou cole uma URL.</p>
                  </div>
                </div>

                <label className="min-h-[40px] px-4 py-2 rounded-xl bg-[#344E41] hover:bg-[#284136] text-white text-xs font-bold flex items-center gap-2 cursor-pointer self-start sm:self-auto">
                  <Upload className="w-4 h-4" />
                  <span>Fazer Upload da Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleFileUpload(e, (b64) => setNewLeader((prev) => ({ ...prev, photoUrl: b64 })), 500)
                    }
                    className="hidden"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">Nome Completo *</label>
                  <input
                    id="leader-name-input"
                    type="text"
                    placeholder="Nome do Pastor, Presbítero ou Diácono"
                    value={newLeader.name || ''}
                    onChange={(e) => setNewLeader({ ...newLeader, name: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">Cargo / Função *</label>
                  <input
                    type="text"
                    placeholder="Ex: Pastor Titular / Presbítero / Diácono"
                    value={newLeader.role || ''}
                    onChange={(e) => setNewLeader({ ...newLeader, role: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Telefone / WhatsApp (Opcional)
                  </label>
                  <input
                    type="text"
                    value={newLeader.phone || ''}
                    onChange={(e) => setNewLeader({ ...newLeader, phone: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">E-mail (Opcional)</label>
                  <input
                    type="email"
                    value={newLeader.email || ''}
                    onChange={(e) => setNewLeader({ ...newLeader, email: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Biografia / Ministério (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={newLeader.bio || ''}
                  onChange={(e) => setNewLeader({ ...newLeader, bio: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl border border-stone-300 bg-white"
                />
              </div>

              <button
                type="button"
                onClick={handleAddLeader}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#344E41] text-white text-xs font-bold flex items-center gap-2 hover:bg-[#284136]"
              >
                {editingLeaderId ? <Save className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                <span>{editingLeaderId ? 'Salvar Alterações do Líder' : 'Adicionar Líder e Salvar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BOLETINS */}
      {activeTab === 'bulletins' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
            <div>
              <h3 className="font-bold text-stone-900 text-lg">Gerenciar Boletins Informativos</h3>
              <p className="text-xs text-stone-500">
                Subcoleção <code>boletins</code> da igreja. Rascunhos ficam visíveis apenas aqui no painel até serem publicados.
              </p>
            </div>
            <button
              onClick={() => handleOpenBulletinModal()}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#344E41] hover:bg-[#284136] text-white font-bold text-xs flex items-center gap-2 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Boletim</span>
            </button>
          </div>

          {bulletins.length === 0 ? (
            <div className="p-10 rounded-2xl bg-stone-50 border border-stone-200/80 text-center space-y-3">
              <FileText className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="text-sm font-bold text-stone-700">Nenhum item cadastrado ainda</p>
              <p className="text-xs text-stone-500">
                Crie o primeiro boletim semanal da igreja (em texto ou PDF) ou salve como rascunho para revisar depois.
              </p>
              <button
                type="button"
                onClick={() => handleOpenBulletinModal()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#344E41] hover:bg-[#284136] text-white text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Criar Primeiro Boletim</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {bulletins.map((b) => {
                const isDraft = b.status === 'draft';
                const lastEditText = formatLastEditedLabel(b);
                return (
                  <div
                    key={b.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isDraft
                        ? 'bg-amber-50/40 border-amber-200'
                        : b.isCurrent
                        ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-200'
                        : 'bg-stone-50 border-stone-200'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#344E41] bg-white px-2 py-0.5 rounded border border-stone-200">
                          {b.type === 'pdf' ? 'PDF' : 'Digital'}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            isDraft
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isDraft ? 'Rascunho' : 'Publicado'}
                        </span>
                        {b.isCurrent && !isDraft && (
                          <span className="text-[10px] font-bold bg-[#344E41] text-white px-2 py-0.5 rounded-full">
                            Edição Atual
                          </span>
                        )}
                        <span className="text-xs text-stone-500">
                          Data: {new Date(b.editionDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <h4 className="font-bold text-stone-900 text-base leading-snug">{b.title}</h4>
                      <p className="text-xs text-stone-600 line-clamp-1">{b.summary || b.pastoralWord}</p>
                      {lastEditText && (
                        <p className="text-[11px] text-stone-400 pt-0.5">{lastEditText}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                      {isDraft && (
                        <button
                          type="button"
                          onClick={() => updateBulletin(b.id, { status: 'published' })}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Publicar</span>
                        </button>
                      )}
                      {!b.isCurrent && !isDraft && (
                        <button
                          type="button"
                          onClick={() => setCurrentBulletin(b.id)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800"
                        >
                          Tornar Atual
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedBulletinForReader(b)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenBulletinModal(b, true)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 flex items-center gap-1"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Duplicar</span>
                      </button>
                      {!isDraft && (
                        <button
                          type="button"
                          onClick={() => updateBulletin(b.id, { status: 'draft', isCurrent: false })}
                          className="px-2.5 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg flex items-center gap-1"
                          title="Despublicar e voltar para rascunho"
                        >
                          <span>Voltar para rascunho</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenBulletinModal(b)}
                        className="px-2.5 py-1.5 text-xs font-bold text-[#344E41] rounded-lg bg-[#EAF0EC] hover:bg-[#dbe6df] flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          askConfirmation({
                            title: 'Excluir Boletim?',
                            message: `Tem certeza que deseja remover o boletim "${b.title}"?`,
                            isDestructive: true,
                            onConfirm: () => deleteBulletin(b.id)
                          })
                        }
                        className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Excluir</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ANIVERSARIANTES */}
      {activeTab === 'birthdays' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            <div>
              <h3 className="font-bold text-stone-900 text-lg">Gerenciar Aniversariantes</h3>
              <p className="text-xs text-stone-500">
                Subcoleção <code>aniversariantes</code> da igreja.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCsvModalOpen(true)}
                className="min-h-[42px] px-3.5 py-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 font-bold text-xs flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>Importar CSV</span>
              </button>
              <button
                onClick={() => handleOpenBirthdayModal()}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-[#344E41] hover:bg-[#284136] text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Pessoa</span>
              </button>
            </div>
          </div>

          {birthdays.length === 0 ? (
            <div className="p-10 rounded-2xl bg-stone-50 border border-stone-200/80 text-center space-y-3">
              <CalendarHeart className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="text-sm font-bold text-stone-700">Nenhum item cadastrado ainda</p>
              <p className="text-xs text-stone-500">
                Cadastre os aniversariantes da congregação manualmente ou importe uma planilha CSV.
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenBirthdayModal()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#344E41] hover:bg-[#284136] text-white text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar Pessoa</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-700">
                <thead className="bg-stone-50 text-stone-500 font-bold uppercase text-[10px] tracking-wider border-b border-stone-200">
                  <tr>
                    <th className="p-3">Nome do Membro</th>
                    <th className="p-3">Data</th>
                    <th className="p-3">Ministério</th>
                    <th className="p-3">WhatsApp / Telefone</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {birthdays.map((person) => {
                    const lastEditText = formatLastEditedLabel(person);
                    return (
                      <tr key={person.id} className="hover:bg-stone-50/60">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="relative shrink-0">
                              {person.photoUrl ? (
                                <img
                                  src={person.photoUrl}
                                  alt={person.name}
                                  className="w-9 h-9 rounded-full object-cover border border-stone-200"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-[#EAF0EC] text-[#344E41] font-bold flex items-center justify-center">
                                  {person.name.charAt(0)}
                                </div>
                              )}
                              <label
                                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#344E41] text-white flex items-center justify-center cursor-pointer"
                                title="Enviar foto"
                              >
                                <Upload className="w-2.5 h-2.5" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) =>
                                    handleFileUpload(e, (b64) => updateBirthday(person.id, { photoUrl: b64 }), 450)
                                  }
                                  className="hidden"
                                />
                              </label>
                            </div>
                            <div>
                              <span className="font-bold text-stone-900 block">{person.name}</span>
                              {lastEditText && (
                                <span className="text-[10px] text-stone-400 block">{lastEditText}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-semibold text-stone-800">
                          {person.birthDay.toString().padStart(2, '0')}/
                          {person.birthMonth.toString().padStart(2, '0')}
                          {person.birthYear ? `/${person.birthYear}` : ''}
                        </td>
                        <td className="p-3 text-stone-500">{person.ministry || '—'}</td>
                        <td className="p-3 text-stone-500 font-mono">{person.phone || '—'}</td>
                        <td className="p-3 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenBirthdayModal(person)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#EAF0EC] hover:bg-[#dbe6df] text-[#344E41] text-xs font-bold inline-flex items-center gap-1"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                askConfirmation({
                                  title: 'Excluir Aniversariante?',
                                  message: `Deseja remover ${person.name} da lista de aniversariantes?`,
                                  isDestructive: true,
                                  onConfirm: () => deleteBirthday(person.id)
                                })
                              }
                              className="px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold inline-flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Excluir</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: BANNERS */}
      {activeTab === 'banners' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            <div>
              <h3 className="font-bold text-stone-900 text-lg">Banners de Divulgação</h3>
              <p className="text-xs text-stone-500">
                Subcoleção <code>banners</code> da igreja (TOPO, MEIO e RODAPÉ). Rascunhos não aparecem para os visitantes até serem publicados.
              </p>
            </div>
            <button
              onClick={() => handleOpenBannerModal()}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#344E41] hover:bg-[#284136] text-white font-bold text-xs flex items-center gap-2 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Banner</span>
            </button>
          </div>

          {banners.length === 0 ? (
            <div className="p-10 rounded-2xl bg-stone-50 border border-stone-200/80 text-center space-y-3">
              <ImageIcon className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="text-sm font-bold text-stone-700">Nenhum item cadastrado ainda</p>
              <p className="text-xs text-stone-500">
                Adicione banners de eventos, avisos ou campanhas para o topo, meio ou rodapé do aplicativo.
              </p>
              <button
                type="button"
                onClick={() => handleOpenBannerModal()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#344E41] hover:bg-[#284136] text-white text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Primeiro Banner</span>
              </button>
            </div>
          ) : (
            (['topo', 'meio', 'rodape'] as BannerPosition[]).map((pos) => {
              const list = banners.filter((b) => b.position === pos).sort((a, b) => a.order - b.order);
              const posLabels = {
                topo: 'Posição 1: TOPO (Acima do Header da Página)',
                meio: 'Posição 2: MEIO (Entre Atalhos e Destaques)',
                rodape: 'Posição 3: RODAPÉ (Fim da Página)'
              };

              return (
                <div key={pos} className="p-5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700">
                      {posLabels[pos]} ({list.length})
                    </h4>
                  </div>

                  {list.length === 0 ? (
                    <p className="text-xs text-stone-400 italic py-2">
                      Nenhum banner cadastrado nesta posição.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {list.map((ban) => {
                        const isDraft = ban.status === 'draft';
                        const lastEditText = formatLastEditedLabel(ban);
                        return (
                          <div
                            key={ban.id}
                            className={`p-3.5 bg-white rounded-xl border flex flex-col justify-between gap-3 ${
                              isDraft
                                ? 'border-amber-200 bg-amber-50/30'
                                : ban.isActive
                                ? 'border-stone-200'
                                : 'border-stone-200 opacity-60 bg-stone-100/50'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={ban.imageUrl}
                                alt={ban.title}
                                className="w-16 h-11 object-cover rounded-lg border border-stone-200 shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span
                                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                      isDraft
                                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                        : 'bg-emerald-100 text-emerald-800'
                                    }`}
                                  >
                                    {isDraft ? 'Rascunho' : 'Publicado'}
                                  </span>
                                  <span className="text-[10px] font-mono text-stone-400">
                                    Ordem: {ban.order} · {ban.isActive && !isDraft ? 'Ativo' : 'Inativo'}
                                  </span>
                                </div>
                                <h5 className="font-bold text-xs text-stone-900 truncate mt-0.5">{ban.title}</h5>
                                {lastEditText && (
                                  <span className="text-[10px] text-stone-400 block truncate">
                                    {lastEditText}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="pt-2 border-t border-stone-100 flex items-center justify-end gap-1.5 flex-wrap">
                              {isDraft ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateBanner(ban.id, { status: 'published', isActive: true })
                                  }
                                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Publicar</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => toggleBannerActive(ban.id)}
                                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg ${
                                    ban.isActive
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-stone-200 text-stone-600'
                                  }`}
                                >
                                  {ban.isActive ? 'Ligado' : 'Desligado'}
                                </button>
                              )}
                              {!isDraft && (
                                <button
                                  type="button"
                                  onClick={() => updateBanner(ban.id, { status: 'draft', isActive: false })}
                                  className="px-2.5 py-1 text-[11px] font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg flex items-center gap-1"
                                  title="Despublicar e voltar para rascunho"
                                >
                                  <span>Voltar para rascunho</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleOpenBannerModal(ban)}
                                className="px-2.5 py-1 text-[11px] font-bold text-[#344E41] rounded-lg bg-[#EAF0EC] hover:bg-[#dbe6df] flex items-center gap-1"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Editar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  askConfirmation({
                                    title: 'Excluir Banner?',
                                    message: `Deseja excluir o banner "${ban.title}"?`,
                                    isDestructive: true,
                                    onConfirm: () => deleteBanner(ban.id)
                                  })
                                }
                                className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Excluir</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 5: EQUIPE DO GESTOR (ADMINISTRADORES E EDITORES) */}
      {activeTab === 'team' && isChurchAdmin && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-6">
          <div className="space-y-1 pb-4 border-b border-stone-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#344E41] bg-[#EAF0EC] px-2.5 py-0.5 rounded-full inline-block">
              Equipe da Igreja
            </span>
            <h3 className="font-bold text-stone-900 text-lg">
              Equipe &amp; Permissões de Publicação ({activeChurch.name})
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Adicione outras pessoas por e-mail para ajudar na publicação da igreja. Quando o convidado criar a conta com o mesmo e-mail (ou entrar com Google), ele ganha acesso automaticamente a esta igreja.
            </p>
          </div>

          {/* Explicação dos Níveis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-[#EAF0EC]/60 border border-[#344E41]/20 space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#344E41]" />
                <span className="font-bold text-xs text-[#284136] uppercase tracking-wider">
                  Nível 1: Administrador
                </span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Acesso total à igreja: pode gerenciar a equipe, editar dados institucionais, horários de culto, liderança, backup e também publicar conteúdos.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-800" />
                <span className="font-bold text-xs text-amber-900 uppercase tracking-wider">
                  Nível 2: Editor
                </span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Pode criar, editar e publicar <strong>boletins, escalas de diáconos, aniversariantes e banners</strong>, mas não altera os dados da igreja nem a equipe.
              </p>
            </div>
          </div>

          {/* Invite by Email Form */}
          <form onSubmit={handleInviteSubmit} className="p-4 sm:p-5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-3">
            <label className="block text-xs font-bold text-stone-800">
              Convidar Membro para a Equipe por E-mail
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="relative sm:col-span-6">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={inviteEmailInput}
                  onChange={(e) => setInviteEmailInput(e.target.value)}
                  placeholder="email-do-colaborador@exemplo.com"
                  className="w-full min-h-[44px] pl-10 pr-3 rounded-xl border border-stone-300 bg-white text-sm"
                />
              </div>
              <div className="sm:col-span-3">
                <select
                  value={inviteRoleInput}
                  onChange={(e) => setInviteRoleInput(e.target.value as 'admin' | 'editor')}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-800"
                >
                  <option value="editor">Nível: Editor</option>
                  <option value="admin">Nível: Administrador</option>
                </select>
              </div>
              <div className="sm:col-span-3">
                <button
                  type="submit"
                  disabled={invitingManager}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#344E41] hover:bg-[#284136] text-white text-xs font-bold flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4 shrink-0" />
                  <span>{invitingManager ? 'Adicionando...' : 'Convidar p/ Equipe'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Box de Convite Pronto (Requirement 7: Copiar mensagem de convite & Enviar pelo WhatsApp) */}
          {lastInvitedMember && (
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/90 border border-emerald-200 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-200 text-emerald-950 px-2.5 py-0.5 rounded-full inline-block">
                    Convite Registrado com Sucesso
                  </span>
                  <h4 className="font-bold text-stone-900 text-sm">
                    Envie o convite para <span className="font-mono text-[#344E41]">{lastInvitedMember.email}</span>
                  </h4>
                  <p className="text-xs text-stone-600">
                    Compartilhe a mensagem pronta abaixo com o link de acesso e as instruções para entrar na equipe:
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLastInvitedMember(null)}
                  className="p-1 text-stone-400 hover:text-stone-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyInviteMessage(lastInvitedMember.email, lastInvitedMember.role)}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-[#344E41] hover:bg-[#284136] text-white text-xs font-bold flex items-center gap-2 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar mensagem de convite</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSendInviteWhatsApp(lastInvitedMember.email, lastInvitedMember.role)}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Enviar pelo WhatsApp</span>
                </button>
              </div>
            </div>
          )}

          {/* List of Team Members & Pending Invites */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500">
              Membros da Equipe &amp; Convites ({activeChurch.teamMembers?.length || activeChurch.managerEmails?.length || 1})
            </h4>

            <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden">
              {(activeChurch.teamMembers && activeChurch.teamMembers.length > 0
                ? activeChurch.teamMembers
                : (activeChurch.managerEmails || [activeChurch.ownerEmail]).map((em) => ({
                    email: em,
                    name: undefined as string | undefined,
                    role: 'admin' as const,
                    status: em.toLowerCase() === activeChurch.ownerEmail?.toLowerCase() ? ('active' as const) : ('pending' as const),
                    invitedAt: activeChurch.createdAt
                  }))
              ).map((member) => {
                const isTitular = member.email.toLowerCase() === activeChurch.ownerEmail?.toLowerCase();
                const isPending = member.status === 'pending' && !isTitular;
                return (
                  <div
                    key={member.email}
                    className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white hover:bg-stone-50/70"
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          member.role === 'admin' || isTitular
                            ? 'bg-[#EAF0EC] text-[#344E41]'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {member.role === 'admin' || isTitular ? (
                          <ShieldCheck className="w-5 h-5" />
                        ) : (
                          <Edit2 className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {member.name && (
                            <span className="font-bold text-xs sm:text-sm text-stone-900">
                              {member.name}
                            </span>
                          )}
                          <span className="font-mono font-semibold text-xs text-stone-700 truncate">
                            {member.email}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              isPending
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isPending ? 'Convite Pendente' : 'Ativo'}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500">
                          {isTitular
                            ? 'Criador / Administrador Titular da Igreja'
                            : isPending
                            ? 'Aguardando criar conta ou entrar com este e-mail para liberar automaticamente'
                            : member.role === 'admin'
                            ? 'Administrador (acesso total aos dados e equipe)'
                            : 'Editor (publica boletins, escalas, aniversariantes e banners)'}
                        </p>
                      </div>
                    </div>

                    {!isTitular && (
                      <div className="flex flex-wrap items-center gap-2 self-end lg:self-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyInviteMessage(member.email, member.role)}
                          className="min-h-[36px] px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1"
                          title="Copiar mensagem de convite"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar mensagem de convite</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendInviteWhatsApp(member.email, member.role)}
                          className="min-h-[36px] px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1"
                          title="Enviar convite pelo WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Enviar pelo WhatsApp</span>
                        </button>

                        <select
                          value={member.role}
                          onChange={(e) =>
                            void updateTeamMemberRoleByEmail(
                              member.email,
                              e.target.value as 'admin' | 'editor'
                            )
                          }
                          className="min-h-[36px] px-2.5 py-1 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-800"
                        >
                          <option value="admin">Administrador</option>
                          <option value="editor">Editor</option>
                        </select>

                        <button
                          type="button"
                          onClick={() =>
                            askConfirmation({
                              title: 'Remover da Equipe?',
                              message: `Deseja remover o acesso de "${member.email}" nesta igreja?`,
                              confirmLabel: 'Sim, Remover',
                              isDestructive: true,
                              onConfirm: () => {
                                void removeCoManagerEmail(member.email);
                              }
                            })
                          }
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remover</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: ESCALA DE DIÁCONOS */}
      {activeTab === 'deacons' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#344E41] bg-[#EAF0EC] px-2.5 py-0.5 rounded-full inline-block mb-1">
                  Junta Diaconal — {infoForm.name || activeChurch.name}
                </span>
                <h3 className="font-bold text-stone-900 text-lg">Gerenciar Escala da Junta Diaconal</h3>
                <p className="text-xs text-stone-500">
                  As categorias e atalhos abaixo são gerados automaticamente a partir dos Horários de Cultos cadastrados pela igreja (+ Evento especial).
                </p>
              </div>

              <button
                onClick={() => handleOpenDeaconModal(undefined, false, dynamicDeaconCategories[0]?.id)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#344E41] hover:bg-[#284136] text-white font-semibold text-xs flex items-center gap-2 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Escala Diaconal</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
                Atalhos Rápidos (a partir dos Horários de Cultos da Igreja):
              </span>
              <div className="flex flex-wrap gap-2">
                {dynamicDeaconCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleOpenDeaconModal(undefined, false, cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${cat.badgeBg} ${cat.badgeText} hover:opacity-90`}
                  >
                    + {cat.shortLabel}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setDeaconCategoryFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap ${
                  deaconCategoryFilter === 'ALL'
                    ? 'bg-[#344E41] text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Todas as Escalas
              </button>
              {dynamicDeaconCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setDeaconCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap ${
                    deaconCategoryFilter === cat.id
                      ? 'bg-[#344E41] text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {cat.shortLabel}
                </button>
              ))}
            </div>
          </div>

          {deaconSchedules.length === 0 ? (
            <div className="bg-white p-10 rounded-3xl border border-stone-200 text-center space-y-3">
              <ClipboardList className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="text-sm font-bold text-stone-700">Nenhum item cadastrado ainda</p>
              <p className="text-xs text-stone-500">
                Clique no botão abaixo ou use um dos atalhos de culto acima para criar a primeira escala diaconal.
              </p>
              <button
                type="button"
                onClick={() => handleOpenDeaconModal(undefined, false, dynamicDeaconCategories[0]?.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#344E41] hover:bg-[#284136] text-white text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Criar Primeira Escala</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...deaconSchedules]
                .filter((item) => {
                  if (deaconCategoryFilter === 'ALL') return true;
                  const resolved = getDeaconCategoryMeta(item, infoForm.schedules);
                  return resolved.id === deaconCategoryFilter;
                })
                .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
                .map((item) => {
                  const catMeta = getDeaconCategoryMeta(item, infoForm.schedules);
                  const isDraft = item.status === 'draft';
                  const lastEditText = formatLastEditedLabel(item);
                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-2xl p-5 border border-l-4 ${catMeta.borderAccent} flex flex-col justify-between gap-4 ${
                        isDraft ? 'border-amber-300 bg-amber-50/20' : 'border-stone-200'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-100 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${catMeta.badgeBg} ${catMeta.badgeText}`}
                            >
                              {catMeta.shortLabel}
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                isDraft
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isDraft ? 'Rascunho' : 'Publicado'}
                            </span>
                            <span className="text-xs font-bold text-[#344E41] bg-[#EAF0EC] px-2.5 py-0.5 rounded-lg">
                              {new Date(item.date + 'T12:00:00').toLocaleDateString('pt-BR')} ·{' '}
                              {formatTimeStandard(item.time)}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-stone-600">
                            Coord.: <strong>{item.coordinator}</strong>
                          </span>
                        </div>

                        <h4 className="font-bold text-stone-900 text-base">{item.serviceName}</h4>

                        <div className="space-y-1.5 text-xs text-stone-600">
                          <p>
                            <strong className="text-stone-800">Recepção/Porta:</strong>{' '}
                            {item.receptionTeam.join(', ') || '—'}
                          </p>
                          <p>
                            <strong className="text-stone-800">Ofertas/Santa Ceia:</strong>{' '}
                            {item.offeringAndCommunionTeam.join(', ') || '—'}
                          </p>
                          <p>
                            <strong className="text-stone-800">Pátio/Ordem:</strong>{' '}
                            {item.parkingAndOrderTeam.join(', ') || '—'}
                          </p>
                          {lastEditText && (
                            <p className="text-[11px] text-stone-400 pt-1">{lastEditText}</p>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-1.5 flex-wrap">
                        {isDraft && (
                          <button
                            type="button"
                            onClick={() => updateDeaconSchedule(item.id, { status: 'published' })}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Publicar</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenDeaconModal(item, true)}
                          className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium flex items-center gap-1"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Duplicar</span>
                        </button>
                        {!isDraft && (
                          <button
                            type="button"
                            onClick={() => updateDeaconSchedule(item.id, { status: 'draft' })}
                            className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-semibold flex items-center gap-1"
                            title="Despublicar e voltar para rascunho"
                          >
                            <span>Voltar para rascunho</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenDeaconModal(item)}
                          className="px-3 py-1.5 rounded-lg bg-[#EAF0EC] hover:bg-[#dbe6df] text-[#344E41] text-xs font-semibold flex items-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            askConfirmation({
                              title: 'Excluir Escala Diaconal?',
                              message: `Deseja excluir a escala de "${item.serviceName}"?`,
                              isDestructive: true,
                              onConfirm: () => deleteDeaconSchedule(item.id)
                            })
                          }
                          className="px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Excluir</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: BACKUP, VERCEL & RESET */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Backup & Export Area */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-sm text-stone-900">Backup, Exportação e Migração de Dados</h4>
              <p className="text-xs text-stone-500">
                Exporte ou importe uma cópia JSON completa desta igreja direto para o Firebase.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
              <label className="min-h-[44px] px-4 py-2 rounded-xl bg-[#EAF0EC] hover:bg-[#dce6df] text-[#344E41] font-bold text-xs flex items-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Importar Backup (JSON)</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportBackupFile}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={handleExportBackup}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center gap-2"
              >
                <Download className="w-4 h-4 text-[#344E41]" />
                <span>Exportar Backup (JSON)</span>
              </button>
            </div>
          </div>

          {/* Vercel & Cloud Database Guide */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#EAF0EC] text-[#344E41] flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-stone-900">
                    Variáveis de Ambiente para Vercel / Produção
                  </h4>
                  <p className="text-xs text-stone-500">
                    Projeto Firebase ativo: <strong className="text-stone-800">{activeFirebaseConfig.projectId}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyVercelEnvVars}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-[#344E41] hover:bg-[#284136] text-white font-bold text-xs flex items-center gap-2 self-start sm:self-auto"
              >
                {copiedEnvVars ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedEnvVars ? 'Copiado!' : 'Copiar Variáveis .env'}</span>
              </button>
            </div>

            <pre className="p-3.5 rounded-2xl bg-stone-900 text-stone-100 font-mono text-[11px] overflow-x-auto leading-relaxed">
              {vercelEnvBlock}
            </pre>
          </div>

          {/* Reset All Content Area */}
          <div className="bg-amber-50/70 rounded-3xl p-6 border border-amber-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-sm text-amber-950">Zerar Conteúdo desta Igreja</h4>
              <p className="text-xs text-amber-800">
                Limpa cultos, líderes, boletins, escalas, aniversariantes e banners desta igreja mantendo o cadastro e gestores ativos.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                askConfirmation({
                  title: 'Zerar Conteúdo desta Igreja?',
                  message:
                    'Isso deixará os módulos desta igreja em branco (no aparelho e no Firebase). Sua conta de Gestor permanecerá ativa.',
                  confirmLabel: 'Sim, Zerar Tudo',
                  isDestructive: true,
                  onConfirm: () => {
                    void resetAllChurchContentToBlank();
                  }
                })
              }
              className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-900 hover:bg-amber-950 text-white font-bold text-xs flex items-center gap-2 shrink-0 self-start sm:self-auto"
            >
              <Trash2 className="w-4 h-4" />
              <span>Zerar Conteúdo Agora</span>
            </button>
          </div>
        </div>
      )}

      {/* --- MODAIS DE CADASTRO/EDIÇÃO --- */}

      {/* 1. MODAL: BOLETIM */}
      {bulletinModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-stone-900/65 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl border border-stone-200 flex flex-col overflow-hidden my-auto">
              <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-stone-900 text-base">
                    {isDuplicatingBulletin
                      ? 'Duplicar Boletim'
                      : editingBulletinId
                      ? 'Editar Boletim Semanal'
                      : 'Novo Boletim Semanal'}
                  </h3>
                  {editingBulletinId && formatLastEditedLabel(bulletinForm) && (
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {formatLastEditedLabel(bulletinForm)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setIsDuplicatingBulletin(false);
                    setBulletinModalOpen(false);
                  }}
                  className="p-1 text-stone-400 hover:text-stone-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveBulletin} className="p-5 overflow-y-auto space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-stone-700 mb-1">Título da Edição</label>
                    <input
                      type="text"
                      required
                      value={bulletinForm.title}
                      onChange={(e) => setBulletinForm({ ...bulletinForm, title: e.target.value })}
                      placeholder="Ex: Boletim Dominical"
                      className="w-full p-2.5 text-xs rounded-xl border border-stone-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Data da Edição</label>
                    <input
                      type="date"
                      required
                      value={bulletinForm.editionDate}
                      onChange={(e) => setBulletinForm({ ...bulletinForm, editionDate: e.target.value })}
                      className="w-full p-2.5 text-xs rounded-xl border border-stone-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Formato do Boletim</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBulletinForm({ ...bulletinForm, type: 'text' })}
                      className={`p-2.5 text-xs font-semibold rounded-xl border ${
                        bulletinForm.type === 'text'
                          ? 'bg-[#344E41] text-white border-[#344E41]'
                          : 'bg-stone-50 text-stone-700 border-stone-200'
                      }`}
                    >
                      Editor de Texto (Liturgia &amp; Palavra)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulletinForm({ ...bulletinForm, type: 'pdf' })}
                      className={`p-2.5 text-xs font-semibold rounded-xl border ${
                        bulletinForm.type === 'pdf'
                          ? 'bg-[#344E41] text-white border-[#344E41]'
                          : 'bg-stone-50 text-stone-700 border-stone-200'
                      }`}
                    >
                      Upload de Arquivo PDF
                    </button>
                  </div>
                </div>

                {bulletinForm.type === 'pdf' ? (
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                    <span className="text-xs font-bold text-stone-800 block">Arquivo PDF do Boletim</span>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handlePdfUpload}
                      className="text-xs text-stone-600 w-full"
                    />
                    {bulletinForm.pdfFileName && (
                      <p className="text-xs text-emerald-700 font-semibold">
                        Arquivo selecionado: {bulletinForm.pdfFileName}
                      </p>
                    )}
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">Ou informe a URL direta do PDF</label>
                      <input
                        type="text"
                        value={bulletinForm.pdfUrl}
                        onChange={(e) => setBulletinForm({ ...bulletinForm, pdfUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full p-2 text-xs rounded-xl border border-stone-300 bg-white"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Versículo Tema da Semana</label>
                      <input
                        type="text"
                        value={bulletinForm.themeVerse}
                        onChange={(e) => setBulletinForm({ ...bulletinForm, themeVerse: e.target.value })}
                        className="w-full p-2 text-xs rounded-xl border border-stone-300"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Palavra Pastoral / Editorial</label>
                      <textarea
                        rows={4}
                        value={bulletinForm.pastoralWord}
                        onChange={(e) => setBulletinForm({ ...bulletinForm, pastoralWord: e.target.value })}
                        className="w-full p-2 text-xs rounded-xl border border-stone-300"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Liturgia / Ordem do Culto (Uma linha por etapa)
                      </label>
                      <textarea
                        rows={3}
                        value={liturgyInputText}
                        onChange={(e) => setLiturgyInputText(e.target.value)}
                        className="w-full p-2 text-xs rounded-xl border border-stone-300 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Avisos da Semana (Uma linha por aviso)
                      </label>
                      <textarea
                        rows={3}
                        value={announcementsInputText}
                        onChange={(e) => setAnnouncementsInputText(e.target.value)}
                        className="w-full p-2 text-xs rounded-xl border border-stone-300"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="chkCurrent"
                    checked={bulletinForm.isCurrent}
                    onChange={(e) => setBulletinForm({ ...bulletinForm, isCurrent: e.target.checked })}
                    className="rounded text-[#344E41]"
                  />
                  <label htmlFor="chkCurrent" className="text-xs font-bold text-stone-700">
                    Definir este boletim como a edição atual em destaque (ao publicar)
                  </label>
                </div>

                <div className="pt-3 border-t border-stone-200 flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDuplicatingBulletin(false);
                      setBulletinModalOpen(false);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveBulletinWithStatus('draft')}
                    className={`px-4 py-2 text-xs font-bold rounded-xl ${
                      isDuplicatingBulletin
                        ? 'text-white bg-[#344E41] hover:bg-[#284136] px-5'
                        : 'text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300'
                    }`}
                  >
                    {isDuplicatingBulletin ? 'Salvar cópia como rascunho' : 'Salvar rascunho'}
                  </button>
                  {!isDuplicatingBulletin && (
                    <button
                      type="button"
                      onClick={() => handleSaveBulletinWithStatus('published')}
                      className="px-5 py-2 text-xs font-bold text-white bg-[#344E41] hover:bg-[#284136] rounded-xl"
                    >
                      Publicar
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* 2. MODAL: ANIVERSARIANTE */}
      {birthdayModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-stone-900/65 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] shadow-2xl border border-stone-200 flex flex-col overflow-hidden my-auto">
              <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-stone-900 text-base">
                    {editingBirthdayId ? 'Editar Aniversariante' : 'Cadastrar Aniversariante'}
                  </h3>
                  {editingBirthdayId && formatLastEditedLabel(birthdayForm) && (
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {formatLastEditedLabel(birthdayForm)}
                    </p>
                  )}
                </div>
                <button onClick={() => setBirthdayModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveBirthday} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={birthdayForm.name}
                    onChange={(e) => setBirthdayForm({ ...birthdayForm, name: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Dia</label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      required
                      value={birthdayForm.birthDay}
                      onChange={(e) => setBirthdayForm({ ...birthdayForm, birthDay: Number(e.target.value) })}
                      className="w-full p-2.5 text-xs rounded-xl border border-stone-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Mês</label>
                    <select
                      value={birthdayForm.birthMonth}
                      onChange={(e) => setBirthdayForm({ ...birthdayForm, birthMonth: Number(e.target.value) })}
                      className="w-full p-2.5 text-xs rounded-xl border border-stone-300 bg-white"
                    >
                      {[
                        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
                      ].map((m, idx) => (
                        <option key={idx + 1} value={idx + 1}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Ano (Opcional)</label>
                    <input
                      type="number"
                      min={1920}
                      max={new Date().getFullYear()}
                      value={birthdayForm.birthYear || ''}
                      onChange={(e) =>
                        setBirthdayForm({
                          ...birthdayForm,
                          birthYear: e.target.value ? Number(e.target.value) : undefined
                        })
                      }
                      className="w-full p-2.5 text-xs rounded-xl border border-stone-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      value={birthdayForm.phone || ''}
                      onChange={(e) => setBirthdayForm({ ...birthdayForm, phone: e.target.value })}
                      className="w-full p-2.5 text-xs rounded-xl border border-stone-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Ministério / Grupo</label>
                    <input
                      type="text"
                      value={birthdayForm.ministry || ''}
                      onChange={(e) => setBirthdayForm({ ...birthdayForm, ministry: e.target.value })}
                      className="w-full p-2.5 text-xs rounded-xl border border-stone-300"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-stone-800">Foto do Aniversariante (Opcional)</span>
                    <label className="min-h-[38px] px-3.5 py-2 rounded-xl bg-[#344E41] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload da Foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleFileUpload(
                            e,
                            (b64) => setBirthdayForm((prev) => ({ ...prev, photoUrl: b64 })),
                            450
                          )
                        }
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setBirthdayModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-[#344E41] hover:bg-[#284136] rounded-xl"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* 3. MODAL: IMPORTAR CSV */}
      {csvModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-stone-900/65 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl border border-stone-200 flex flex-col overflow-hidden my-auto">
              <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between">
                <h3 className="font-bold text-stone-900 text-base">Importar Aniversariantes via CSV</h3>
                <button onClick={() => setCsvModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const r = new FileReader();
                    r.onload = (re) => handleCsvTextChange(re.target?.result as string);
                    r.readAsText(f);
                  }}
                  className="text-xs text-stone-500 mb-2 w-full"
                />
                <textarea
                  rows={5}
                  value={csvTextInput}
                  onChange={(e) => handleCsvTextChange(e.target.value)}
                  placeholder="Nome,Data,Telefone,Ministerio..."
                  className="w-full p-2.5 text-xs font-mono rounded-xl border border-stone-300"
                />

                <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCsvModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyCsvImport}
                    disabled={csvParsedPreview.length === 0}
                    className="px-5 py-2 text-xs font-semibold text-white bg-[#344E41] disabled:opacity-50 rounded-xl"
                  >
                    Confirmar e Importar ({csvParsedPreview.length})
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 4. MODAL: BANNER */}
      {bannerModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-stone-900/65 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] shadow-2xl border border-stone-200 flex flex-col overflow-hidden my-auto">
              <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-stone-900 text-base">
                    {editingBannerId ? 'Editar Banner' : 'Novo Banner de Divulgação'}
                  </h3>
                  {editingBannerId && formatLastEditedLabel(bannerForm) && (
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {formatLastEditedLabel(bannerForm)}
                    </p>
                  )}
                </div>
                <button onClick={() => setBannerModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveBanner} className="p-5 overflow-y-auto space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Título do Banner</label>
                  <input
                    type="text"
                    required
                    value={bannerForm.title}
                    onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Posição na Página</label>
                    <select
                      value={bannerForm.position}
                      onChange={(e) => setBannerForm({ ...bannerForm, position: e.target.value as BannerPosition })}
                      className="w-full p-2.5 text-xs rounded-xl border border-stone-300 bg-white"
                    >
                      <option value="topo">Topo (Acima do Header)</option>
                      <option value="meio">Meio da Página</option>
                      <option value="rodape">Rodapé da Página</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Ordem de Rotação</label>
                    <input
                      type="number"
                      min={1}
                      value={bannerForm.order}
                      onChange={(e) => setBannerForm({ ...bannerForm, order: Number(e.target.value) })}
                      className="w-full p-2.5 text-xs rounded-xl border border-stone-300"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-stone-800">Imagem do Banner *</span>
                    <label className="min-h-[38px] px-3.5 py-2 rounded-xl bg-[#344E41] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload da Imagem</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleFileUpload(
                            e,
                            (b64) => setBannerForm((prev) => ({ ...prev, imageUrl: b64 })),
                            1000
                          )
                        }
                        className="hidden"
                      />
                    </label>
                  </div>

                  <input
                    type="text"
                    value={bannerForm.imageUrl || ''}
                    onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
                    placeholder="Ou cole a URL direta da imagem..."
                    className="w-full p-2 text-xs rounded-xl border border-stone-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Link de Destino (Opcional)</label>
                  <input
                    type="text"
                    value={bannerForm.linkUrl || ''}
                    onChange={(e) => setBannerForm({ ...bannerForm, linkUrl: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300"
                  />
                </div>

                <div className="pt-3 border-t border-stone-200 flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setBannerModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveBannerWithStatus('draft')}
                    className="px-4 py-2 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl"
                  >
                    Salvar rascunho
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveBannerWithStatus('published')}
                    className="px-5 py-2 text-xs font-bold text-white bg-[#344E41] hover:bg-[#284136] rounded-xl"
                  >
                    Publicar
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* 5. MODAL: ESCALA DE DIÁCONOS */}
      {deaconModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-stone-900/65 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] shadow-2xl border border-stone-200 flex flex-col overflow-hidden my-auto">
              <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-stone-900 text-base">
                    {isDuplicatingDeacon
                      ? 'Duplicar Escala'
                      : editingDeaconId
                      ? 'Editar Escala de Diáconos'
                      : 'Nova Escala de Diáconos'}
                  </h3>
                  {editingDeaconId && formatLastEditedLabel(deaconForm) && (
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {formatLastEditedLabel(deaconForm)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setIsDuplicatingDeacon(false);
                    setDeaconModalOpen(false);
                  }}
                  className="p-1 text-stone-400 hover:text-stone-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveDeaconSchedule} className="p-5 overflow-y-auto space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Culto / Modalidade (baseado nos Horários de Cultos da Igreja)
                  </label>
                  <select
                    value={deaconForm.category || dynamicDeaconCategories[0]?.id || 'evento_especial'}
                    onChange={(e) => handleSelectDeaconCategoryInModal(e.target.value as DeaconScheduleCategory)}
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300 bg-white font-semibold"
                  >
                    {dynamicDeaconCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Data do Plantão</label>
                    <input
                      type="date"
                      required
                      value={deaconForm.date}
                      onChange={(e) => setDeaconForm({ ...deaconForm, date: e.target.value })}
                      className="w-full p-2.5 text-xs rounded-xl border border-stone-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Horário Padronizado ({formatTimeStandard(deaconForm.time || '19h30')})
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-2.5">
                      <input
                        type="time"
                        required
                        value={standardTimeToHtmlTime(deaconForm.time || '19h30')}
                        onChange={(e) =>
                          setDeaconForm({ ...deaconForm, time: formatTimeStandard(e.target.value) })
                        }
                        className="w-full py-2 text-xs bg-transparent focus:outline-none"
                      />
                      <span className="text-[11px] font-mono font-bold text-[#344E41] bg-[#EAF0EC] px-2 py-0.5 rounded shrink-0">
                        {formatTimeStandard(deaconForm.time || '19h30')}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Culto, Reunião ou Evento</label>
                  <input
                    type="text"
                    required
                    value={deaconForm.serviceName}
                    onChange={(e) => setDeaconForm({ ...deaconForm, serviceName: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Diácono Coordenador</label>
                    <input
                      type="text"
                      required
                      value={deaconForm.coordinator}
                      onChange={(e) => setDeaconForm({ ...deaconForm, coordinator: e.target.value })}
                      className="w-full p-2.5 text-xs rounded-xl border border-stone-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">WhatsApp do Coordenador (Opcional)</label>
                    <input
                      type="text"
                      value={deaconForm.coordinatorPhone || ''}
                      onChange={(e) => setDeaconForm({ ...deaconForm, coordinatorPhone: e.target.value })}
                      className="w-full p-2.5 text-xs rounded-xl border border-stone-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Equipe de Recepção e Porta (separe por vírgula)
                  </label>
                  <input
                    type="text"
                    value={receptionInput}
                    onChange={(e) => setReceptionInput(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Equipe de Dízimos, Ofertas e Santa Ceia (separe por vírgula)
                  </label>
                  <input
                    type="text"
                    value={offeringInput}
                    onChange={(e) => setOfferingInput(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Equipe de Pátio, Estacionamento e Ordem (separe por vírgula)
                  </label>
                  <input
                    type="text"
                    value={parkingInput}
                    onChange={(e) => setParkingInput(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Observações (Opcional)
                  </label>
                  <input
                    type="text"
                    value={deaconForm.notes || ''}
                    onChange={(e) => setDeaconForm({ ...deaconForm, notes: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300"
                  />
                </div>

                <div className="pt-3 border-t border-stone-200 flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDuplicatingDeacon(false);
                      setDeaconModalOpen(false);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveDeaconScheduleWithStatus('draft')}
                    className={`px-4 py-2 text-xs font-bold rounded-xl ${
                      isDuplicatingDeacon
                        ? 'text-white bg-[#344E41] hover:bg-[#284136] px-5'
                        : 'text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300'
                    }`}
                  >
                    {isDuplicatingDeacon ? 'Salvar cópia como rascunho' : 'Salvar rascunho'}
                  </button>
                  {!isDuplicatingDeacon && (
                    <button
                      type="button"
                      onClick={() => handleSaveDeaconScheduleWithStatus('published')}
                      className="px-5 py-2 text-xs font-bold text-white bg-[#344E41] hover:bg-[#284136] rounded-xl"
                    >
                      Publicar
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
