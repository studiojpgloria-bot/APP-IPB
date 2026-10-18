import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  Calendar,
  CalendarHeart,
  Check,
  CheckCircle2,
  Church,
  ClipboardList,
  Clock,
  Copy,
  BookOpen,
  Download,
  Edit2,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Key,
  Layers,
  Link as LinkIcon,
  Lock,
  LogOut,
  Mail,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X
} from 'lucide-react';
import { useChurch } from '../../context/ChurchContext';
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
  ScheduleItem
} from '../../types';
import { CATEGORY_META } from './DeaconScheduleView';

type ManagerTab = 'info' | 'bulletins' | 'deacons' | 'birthdays' | 'banners' | 'settings';

export const ManagerView: React.FC = () => {
  const {
    isManagerAuthenticated,
    managerLogin,
    managerLogout,
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
    updateSettings,
    askConfirmation,
    showToast
  } = useChurch();

  // Active Tab
  const [activeTab, setActiveTab] = useState<ManagerTab>('info');

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('gestor@igreja.com.br');
  const [loginPassword, setLoginPassword] = useState('admin123');

  // --- Church Info Form State ---
  const [infoForm, setInfoForm] = useState<ChurchInfo>(churchInfo);
  const [newSchedule, setNewSchedule] = useState<Partial<ScheduleItem>>({
    day: 'Domingo',
    time: '19h00',
    title: '',
    description: '',
    location: 'Templo Principal'
  });
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
  const [bulletinForm, setBulletinForm] = useState<Partial<Bulletin>>({
    title: '',
    editionDate: new Date().toISOString().split('T')[0],
    summary: '',
    isCurrent: false,
    type: 'text',
    themeVerse: '',
    pastoralWord: '',
    orderOfService: ['Prelúdio e Invocação', 'Leitura Bíblica', 'Cânticos', 'Mensagem Pastoral'],
    announcements: ['Reuniões regulares nesta semana.'],
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
  const [deaconCategoryFilter, setDeaconCategoryFilter] = useState<'ALL' | DeaconScheduleCategory>('ALL');
  const [deaconForm, setDeaconForm] = useState<Partial<DeaconScheduleItem>>({
    category: 'domingo_manha',
    date: new Date().toISOString().split('T')[0],
    serviceName: 'Domingo pela Manhã — Culto Matutino & EBD',
    time: '09h00',
    coordinator: '',
    coordinatorPhone: '',
    notes: ''
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
    isActive: true
  });

  // --- Settings Form State ---
  const [settingsForm, setSettingsForm] = useState(settings);

  useEffect(() => {
    setInfoForm(churchInfo);
  }, [churchInfo]);

  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  // Quick fill demo login
  const handleQuickDemoLogin = () => {
    setLoginEmail('gestor@igreja.com.br');
    setLoginPassword('admin123');
    managerLogin('gestor@igreja.com.br', 'admin123');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    managerLogin(loginEmail, loginPassword);
  };

  // Image Upload with Canvas Compression
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onCompressed: (base64: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showToast('Comprimindo e processando imagem...', 'info');
      const base64 = await ChurchStorageService.compressImageFile(file, 1200, 0.82);
      onCompressed(base64);
      showToast('Imagem carregada com sucesso!');
    } catch {
      showToast('Erro ao processar imagem.', 'error');
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

  // 1. Church Info Handlers
  const handleSaveChurchInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateChurchInfo(infoForm);
  };

  const handleAddSchedule = () => {
    if (!newSchedule.title || !newSchedule.time) {
      showToast('Preencha título e horário do culto.', 'error');
      return;
    }
    const item: ScheduleItem = {
      id: `sch-${Date.now()}`,
      day: newSchedule.day || 'Domingo',
      time: newSchedule.time || '19h00',
      title: newSchedule.title,
      description: newSchedule.description || '',
      location: newSchedule.location || 'Templo Principal'
    };
    setInfoForm((prev) => ({
      ...prev,
      schedules: [...prev.schedules, item]
    }));
    setNewSchedule({ day: 'Domingo', time: '19h00', title: '', description: '', location: 'Templo' });
  };

  const handleRemoveSchedule = (id: string) => {
    setInfoForm((prev) => ({
      ...prev,
      schedules: prev.schedules.filter((s) => s.id !== id)
    }));
  };

  const handleAddLeader = () => {
    if (!newLeader.name || !newLeader.role) {
      showToast('Preencha o nome e o cargo do líder.', 'error');
      return;
    }
    const leader: LeaderMember = {
      id: `lead-${Date.now()}`,
      name: newLeader.name,
      role: newLeader.role,
      bio: newLeader.bio || '',
      photoUrl:
        newLeader.photoUrl ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      phone: newLeader.phone || '',
      email: newLeader.email || ''
    };
    setInfoForm((prev) => ({
      ...prev,
      leadership: [...prev.leadership, leader]
    }));
    setNewLeader({ name: '', role: '', bio: '', photoUrl: '', phone: '', email: '' });
  };

  const handleRemoveLeader = (id: string) => {
    setInfoForm((prev) => ({
      ...prev,
      leadership: prev.leadership.filter((l) => l.id !== id)
    }));
  };

  // 2. Bulletin Handlers
  const handleOpenBulletinModal = (b?: Bulletin) => {
    if (b) {
      setEditingBulletinId(b.id);
      setBulletinForm({ ...b });
      setLiturgyInputText(b.orderOfService ? b.orderOfService.join('\n') : '');
      setAnnouncementsInputText(b.announcements ? b.announcements.join('\n') : '');
    } else {
      setEditingBulletinId(null);
      setBulletinForm({
        title: '',
        editionDate: new Date().toISOString().split('T')[0],
        summary: '',
        isCurrent: bulletins.length === 0,
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

  const handleSaveBulletin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulletinForm.title || !bulletinForm.editionDate) {
      showToast('Título e data são obrigatórios.', 'error');
      return;
    }

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
      isCurrent: Boolean(bulletinForm.isCurrent),
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

    setBulletinModalOpen(false);
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

  // 3B. Deacon Schedule Handlers
  const getCategoryDefaultValues = (category: DeaconScheduleCategory) => {
    switch (category) {
      case 'semana_oracao':
        return {
          serviceName: '1ª Semana do Mês — Semana de Oração',
          time: '19h30',
          notes: 'Plantão especial da 1ª Semana do Mês (Semana de Oração).'
        };
      case 'quinta_estudo':
        return {
          serviceName: 'Quinta-feira — Culto de Estudo e Oração',
          time: '19h30',
          notes: 'Plantão de quinta-feira para o Culto de Estudo e Oração.'
        };
      case 'domingo_manha':
        return {
          serviceName: 'Domingo pela Manhã — Culto Matutino & EBD',
          time: '09h00',
          notes: 'Culto dominical pela manhã e recepção da Escola Bíblica.'
        };
      case 'domingo_noite':
        return {
          serviceName: 'Domingo à Noite — Culto Vespertino',
          time: '19h00',
          notes: 'Culto dominical à noite.'
        };
      case 'evento_especial':
        return {
          serviceName: 'Evento Especial — Programação Extraordinária',
          time: '19h30',
          notes: 'Espaço reservado para evento especial da igreja.'
        };
    }
  };

  const handleOpenDeaconModal = (
    item?: DeaconScheduleItem,
    duplicate = false,
    presetCategory: DeaconScheduleCategory = 'domingo_manha'
  ) => {
    if (item) {
      setEditingDeaconId(duplicate ? null : item.id);
      setDeaconForm({
        category: item.category || 'domingo_noite',
        date: item.date,
        serviceName: item.serviceName,
        time: item.time,
        coordinator: item.coordinator,
        coordinatorPhone: item.coordinatorPhone || '',
        notes: item.notes || ''
      });
      setReceptionInput(item.receptionTeam.join(', '));
      setOfferingInput(item.offeringAndCommunionTeam.join(', '));
      setParkingInput(item.parkingAndOrderTeam.join(', '));
    } else {
      const defaults = getCategoryDefaultValues(presetCategory);
      setEditingDeaconId(null);
      setDeaconForm({
        category: presetCategory,
        date: new Date().toISOString().split('T')[0],
        serviceName: defaults.serviceName,
        time: defaults.time,
        coordinator: '',
        coordinatorPhone: '',
        notes: defaults.notes
      });
      setReceptionInput('');
      setOfferingInput('');
      setParkingInput('');
    }
    setDeaconModalOpen(true);
  };

  const handleSelectDeaconCategoryInModal = (cat: DeaconScheduleCategory) => {
    const defaults = getCategoryDefaultValues(cat);
    setDeaconForm((prev) => ({
      ...prev,
      category: cat,
      serviceName: !editingDeaconId ? defaults.serviceName : prev.serviceName,
      time: !editingDeaconId ? defaults.time : prev.time
    }));
  };

  const handleSaveDeaconSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deaconForm.date || !deaconForm.serviceName || !deaconForm.coordinator) {
      showToast('Preencha data, nome do culto e diácono coordenador.', 'error');
      return;
    }

    const parseTeam = (str: string) =>
      str
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean);

    const payload: Omit<DeaconScheduleItem, 'id'> = {
      category: (deaconForm.category as DeaconScheduleCategory) || 'domingo_noite',
      date: deaconForm.date,
      serviceName: deaconForm.serviceName,
      time: deaconForm.time || '19h00',
      coordinator: deaconForm.coordinator,
      coordinatorPhone: deaconForm.coordinatorPhone || undefined,
      receptionTeam: parseTeam(receptionInput),
      offeringAndCommunionTeam: parseTeam(offeringInput),
      parkingAndOrderTeam: parseTeam(parkingInput),
      notes: deaconForm.notes || undefined
    };

    if (editingDeaconId) {
      updateDeaconSchedule(editingDeaconId, payload);
    } else {
      addDeaconSchedule(payload);
    }

    setDeaconModalOpen(false);
  };

  // 4. Banner Handlers
  const handleOpenBannerModal = (banner?: Banner) => {
    if (banner) {
      setEditingBannerId(banner.id);
      setBannerForm({ ...banner });
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
        isActive: true
      });
    }
    setBannerModalOpen(true);
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
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
      isActive: bannerForm.isActive !== false
    };

    if (editingBannerId) {
      updateBanner(editingBannerId, payload);
    } else {
      addBanner(payload);
    }

    setBannerModalOpen(false);
  };

  // 5. Settings & Backup Export/Import
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(settingsForm);
  };

  const handleExportBackup = () => {
    const data = {
      churchInfo,
      bulletins,
      birthdays,
      banners,
      settings,
      exportedAt: new Date().toISOString()
    };
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonStr);
    downloadAnchor.setAttribute('download', `backup_igreja_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Backup exportado com sucesso!');
  };

  // IF NOT AUTHENTICATED: Show login card
  if (!isManagerAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-8 p-6 sm:p-8 bg-white rounded-3xl border border-stone-200/90 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#EAF0EC] text-[#344E41] flex items-center justify-center mx-auto mb-2">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">Área do Gestor</h1>
          <p className="text-xs text-stone-500">
            Acesso administrativo para gerenciar conteúdos, cultos, boletins, aniversariantes e banners.
          </p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-4">
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
                placeholder="gestor@igreja.com.br"
                className="w-full min-h-[46px] pl-10 pr-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#344E41]"
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
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full min-h-[46px] pl-10 pr-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#344E41]"
              />
              <Key className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full min-h-[46px] rounded-xl bg-[#344E41] hover:bg-[#284136] text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Entrar no Painel</span>
          </button>
        </form>

        {/* Demo Fast Login Helper */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
            <Shield className="w-4 h-4 text-amber-700" />
            <span>Acesso de Demonstração (Testes):</span>
          </div>
          <p className="text-[11px] text-amber-800">
            E-mail: <code className="font-mono font-bold">gestor@igreja.com.br</code> | Senha:{' '}
            <code className="font-mono font-bold">admin123</code>
          </p>
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            className="w-full min-h-[38px] text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 rounded-lg transition-colors py-1.5"
          >
            Preencher e Entrar Automaticamente
          </button>
        </div>
      </div>
    );
  }

  // AUTHENTICATED MANAGER DASHBOARD
  return (
    <div className="space-y-6 pb-16">
      {/* 1. Dashboard Top Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#EAF0EC] text-[#344E41] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                Painel de Gestão
              </h1>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                Sessão Ativa
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Controle total de conteúdos, cultos, boletins, aniversariantes e banners.
            </p>
          </div>
        </div>

        <button
          onClick={managerLogout}
          className="min-h-[42px] px-4 py-2 rounded-xl border border-stone-200 hover:bg-rose-50 hover:text-rose-600 text-stone-600 text-xs font-semibold flex items-center gap-1.5 self-start md:self-auto transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair da Gestão</span>
        </button>
      </div>

      {/* 2. Management Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'info', label: 'Informações da Igreja', icon: <Church className="w-4 h-4" /> },
          { id: 'bulletins', label: 'Boletins', count: bulletins.length, icon: <FileText className="w-4 h-4" /> },
          { id: 'deacons', label: 'Escala de Diáconos', count: deaconSchedules.length, icon: <ClipboardList className="w-4 h-4" /> },
          { id: 'birthdays', label: 'Aniversariantes', count: birthdays.length, icon: <CalendarHeart className="w-4 h-4" /> },
          { id: 'banners', label: 'Banners', count: banners.length, icon: <ImageIcon className="w-4 h-4" /> },
          { id: 'settings', label: 'Configurações & API', icon: <Settings className="w-4 h-4" /> }
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

      {/* 3. TAB 1: INFORMAÇÕES DA IGREJA */}
      {activeTab === 'info' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveChurchInfo} className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div>
                <h3 className="font-bold text-stone-900 text-lg">Dados Principais da Igreja</h3>
                <p className="text-xs text-stone-500">Alterações são refletidas automaticamente para os usuários.</p>
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
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-[#344E41] border-2 border-stone-200 shadow-xs flex items-center justify-center text-white shrink-0">
                    {infoForm.logoUrl ? (
                      <img src={infoForm.logoUrl} alt="Logo da Igreja" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-serif font-bold text-2xl">IPC</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-stone-900 text-sm">Logotipo da Igreja</h4>
                    <p className="text-xs text-stone-500">
                      Exibido no cabeçalho do aplicativo, rodapé e nos documentos oficiais.
                    </p>
                    {infoForm.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setInfoForm({ ...infoForm, logoUrl: '' })}
                        className="text-[11px] text-rose-600 hover:underline font-semibold"
                      >
                        Remover logotipo atual
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 self-start sm:self-auto">
                  <label className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#344E41] hover:bg-[#284136] text-white font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-xs transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Fazer Upload da Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleFileUpload(e, (b64) => setInfoForm({ ...infoForm, logoUrl: b64 }))
                      }
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* URL alternativa */}
              <div className="pt-2 border-t border-stone-200/60">
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  Ou insira o link direto (URL) da imagem da logo:
                </label>
                <input
                  type="text"
                  value={infoForm.logoUrl}
                  onChange={(e) => setInfoForm({ ...infoForm, logoUrl: e.target.value })}
                  placeholder="https://exemplo.com/minha-logo.png"
                  className="w-full p-2 text-xs rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-[#344E41] focus:outline-none"
                />
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
                  className="w-full p-2.5 text-sm rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#344E41] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Frase de Boas-Vindas / Slogan</label>
                <input
                  type="text"
                  value={infoForm.tagline}
                  onChange={(e) => setInfoForm({ ...infoForm, tagline: e.target.value })}
                  className="w-full p-2.5 text-sm rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#344E41] focus:outline-none"
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
                  className="w-full p-2.5 text-sm rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#344E41] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Missão & Declaração de Fé</label>
                <textarea
                  rows={4}
                  value={infoForm.missionVision}
                  onChange={(e) => setInfoForm({ ...infoForm, missionVision: e.target.value })}
                  className="w-full p-2.5 text-sm rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#344E41] focus:outline-none"
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
                  className="w-full p-2.5 text-sm rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#344E41] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Cidade, Estado e CEP</label>
                <input
                  type="text"
                  value={infoForm.cityStateZip}
                  onChange={(e) => setInfoForm({ ...infoForm, cityStateZip: e.target.value })}
                  className="w-full p-2.5 text-sm rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#344E41] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Link do Google Maps</label>
                <input
                  type="text"
                  value={infoForm.googleMapsUrl}
                  onChange={(e) => setInfoForm({ ...infoForm, googleMapsUrl: e.target.value })}
                  className="w-full p-2.5 text-sm rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#344E41] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">WhatsApp (apenas números com DDD)</label>
                <input
                  type="text"
                  value={infoForm.whatsappNumber}
                  onChange={(e) => setInfoForm({ ...infoForm, whatsappNumber: e.target.value })}
                  placeholder="5511999887766"
                  className="w-full p-2.5 text-sm rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#344E41] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Telefone Principal</label>
                <input
                  type="text"
                  value={infoForm.primaryPhone}
                  onChange={(e) => setInfoForm({ ...infoForm, primaryPhone: e.target.value })}
                  className="w-full p-2.5 text-sm rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#344E41] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">E-mail Oficial</label>
                <input
                  type="email"
                  value={infoForm.email}
                  onChange={(e) => setInfoForm({ ...infoForm, email: e.target.value })}
                  className="w-full p-2.5 text-sm rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#344E41] focus:outline-none"
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
                  className="w-full p-2.5 text-sm rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#344E41] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">YouTube URL</label>
                <input
                  type="text"
                  value={infoForm.youtubeUrl}
                  onChange={(e) => setInfoForm({ ...infoForm, youtubeUrl: e.target.value })}
                  className="w-full p-2.5 text-sm rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#344E41] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Facebook URL</label>
                <input
                  type="text"
                  value={infoForm.facebookUrl}
                  onChange={(e) => setInfoForm({ ...infoForm, facebookUrl: e.target.value })}
                  className="w-full p-2.5 text-sm rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#344E41] focus:outline-none"
                />
              </div>
            </div>
          </form>

          {/* Gerenciar Horários de Cultos */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-4">
            <h3 className="font-bold text-stone-900 text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#344E41]" />
              <span>Gerenciar Horários de Cultos e Programações</span>
            </h3>

            {/* Existing schedules */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {infoForm.schedules.map((sch) => (
                <div key={sch.id} className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 flex items-start justify-between gap-3">
                  <div>
                    <span className="font-bold text-xs text-[#344E41]">
                      {sch.day} às {sch.time}
                    </span>
                    <h4 className="font-bold text-sm text-stone-900 mt-0.5">{sch.title}</h4>
                    <p className="text-xs text-stone-500">{sch.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSchedule(sch.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-200"
                    title="Excluir horário"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add schedule sub-form */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
              <span className="text-xs font-bold text-stone-700 block">Adicionar Novo Horário de Culto</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Dia (ex: Domingo)"
                  value={newSchedule.day}
                  onChange={(e) => setNewSchedule({ ...newSchedule, day: e.target.value })}
                  className="p-2 text-xs rounded-lg border border-stone-300 bg-white"
                />
                <input
                  type="text"
                  placeholder="Horário (ex: 19h30)"
                  value={newSchedule.time}
                  onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                  className="p-2 text-xs rounded-lg border border-stone-300 bg-white"
                />
                <input
                  type="text"
                  placeholder="Título (ex: Culto de Oração)"
                  value={newSchedule.title}
                  onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                  className="p-2 text-xs rounded-lg border border-stone-300 bg-white"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Descrição breve..."
                  value={newSchedule.description}
                  onChange={(e) => setNewSchedule({ ...newSchedule, description: e.target.value })}
                  className="p-2 text-xs rounded-lg border border-stone-300 bg-white"
                />
                <input
                  type="text"
                  placeholder="Local (ex: Templo Principal)"
                  value={newSchedule.location}
                  onChange={(e) => setNewSchedule({ ...newSchedule, location: e.target.value })}
                  className="p-2 text-xs rounded-lg border border-stone-300 bg-white"
                />
              </div>
              <button
                type="button"
                onClick={handleAddSchedule}
                className="px-4 py-2 rounded-xl bg-[#344E41] text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[#284136]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar à Lista de Cultos</span>
              </button>
            </div>
          </div>

          {/* Gerenciar Pastores e Liderança */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-4">
            <h3 className="font-bold text-stone-900 text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-[#344E41]" />
              <span>Gerenciar Pastores e Liderança</span>
            </h3>

            {/* Existing leaders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {infoForm.leadership.map((l) => (
                <div key={l.id} className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={l.photoUrl} alt={l.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-stone-900 truncate">{l.name}</h4>
                      <p className="text-[11px] text-stone-500 truncate">{l.role}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveLeader(l.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-200 shrink-0"
                    title="Excluir líder"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add leader subform */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
              <span className="text-xs font-bold text-stone-700 block">Cadastrar Novo Líder</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Nome completo (ex: Rev. Paulo Silveira)"
                  value={newLeader.name}
                  onChange={(e) => setNewLeader({ ...newLeader, name: e.target.value })}
                  className="p-2 text-xs rounded-lg border border-stone-300 bg-white"
                />
                <input
                  type="text"
                  placeholder="Cargo / Função (ex: Pastor Titular)"
                  value={newLeader.role}
                  onChange={(e) => setNewLeader({ ...newLeader, role: e.target.value })}
                  className="p-2 text-xs rounded-lg border border-stone-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  Foto do Líder (Upload com compressão automática)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, (b64) => setNewLeader({ ...newLeader, photoUrl: b64 }))}
                  className="text-xs text-stone-500"
                />
              </div>

              <textarea
                rows={2}
                placeholder="Breve biografia pastoral..."
                value={newLeader.bio}
                onChange={(e) => setNewLeader({ ...newLeader, bio: e.target.value })}
                className="w-full p-2 text-xs rounded-lg border border-stone-300 bg-white"
              />

              <button
                type="button"
                onClick={handleAddLeader}
                className="px-4 py-2 rounded-xl bg-[#344E41] text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[#284136]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Líder</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 2: BOLETINS */}
      {activeTab === 'bulletins' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
            <div>
              <h3 className="font-bold text-stone-900 text-lg">Gerenciar Boletins Informativos</h3>
              <p className="text-xs text-stone-500">
                Publique boletins em PDF ou escreva diretamente com o editor de liturgia e palavra pastoral.
              </p>
            </div>
            <button
              onClick={() => handleOpenBulletinModal()}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#344E41] hover:bg-[#284136] text-white font-bold text-xs flex items-center gap-2 self-start sm:self-auto transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Boletim</span>
            </button>
          </div>

          <div className="space-y-3">
            {bulletins.map((b) => (
              <div
                key={b.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  b.isCurrent ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-200' : 'bg-stone-50 border-stone-200'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#344E41] bg-white px-2 py-0.5 rounded border border-stone-200">
                      {b.type === 'pdf' ? 'PDF' : 'Digital'}
                    </span>
                    {b.isCurrent && (
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
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!b.isCurrent && (
                    <button
                      onClick={() => setCurrentBulletin(b.id)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 transition-colors"
                      title="Definir esta edição como o destaque atual"
                    >
                      Tornar Atual
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedBulletinForReader(b)}
                    className="p-2 text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-200"
                    title="Pré-visualizar boletim"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenBulletinModal(b)}
                    className="p-2 text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-200"
                    title="Editar boletim"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      askConfirmation({
                        title: 'Excluir Boletim?',
                        message: `Tem certeza que deseja remover o boletim "${b.title}"? Esta ação não pode ser desfeita.`,
                        isDestructive: true,
                        onConfirm: () => deleteBulletin(b.id)
                      })
                    }
                    className="p-2 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-200"
                    title="Excluir boletim"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. TAB 3: ANIVERSARIANTES */}
      {activeTab === 'birthdays' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            <div>
              <h3 className="font-bold text-stone-900 text-lg">Gerenciar Aniversariantes</h3>
              <p className="text-xs text-stone-500">
                Cadastre membros individualmente ou importe a lista completa via planilha CSV.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCsvModalOpen(true)}
                className="min-h-[42px] px-3.5 py-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>Importar CSV</span>
              </button>
              <button
                onClick={() => handleOpenBirthdayModal()}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-[#344E41] hover:bg-[#284136] text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Pessoa</span>
              </button>
            </div>
          </div>

          {/* Birthdays Table */}
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
                {birthdays.map((person) => (
                  <tr key={person.id} className="hover:bg-stone-50/60">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={
                            person.photoUrl ||
                            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80'
                          }
                          alt={person.name}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                        <span className="font-bold text-stone-900">{person.name}</span>
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-stone-800">
                      {person.birthDay.toString().padStart(2, '0')}/
                      {person.birthMonth.toString().padStart(2, '0')}
                      {person.birthYear ? `/${person.birthYear}` : ''}
                    </td>
                    <td className="p-3 text-stone-500">{person.ministry || '—'}</td>
                    <td className="p-3 text-stone-500 font-mono">{person.phone || '—'}</td>
                    <td className="p-3 text-right space-x-1">
                      <button
                        onClick={() => handleOpenBirthdayModal(person)}
                        className="p-1.5 text-stone-500 hover:text-stone-900 rounded-lg hover:bg-stone-200"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          askConfirmation({
                            title: 'Excluir Aniversariante?',
                            message: `Deseja remover ${person.name} da lista de aniversariantes?`,
                            isDestructive: true,
                            onConfirm: () => deleteBirthday(person.id)
                          })
                        }
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-200"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. TAB 4: BANNERS */}
      {activeTab === 'banners' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            <div>
              <h3 className="font-bold text-stone-900 text-lg">Banners de Divulgação</h3>
              <p className="text-xs text-stone-500">
                Configure banners para as 3 posições fixas: TOPO (acima do header), MEIO e RODAPÉ.
              </p>
            </div>
            <button
              onClick={() => handleOpenBannerModal()}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#344E41] hover:bg-[#284136] text-white font-bold text-xs flex items-center gap-2 self-start sm:self-auto transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Banner</span>
            </button>
          </div>

          {/* Banners grouped by position */}
          {(['topo', 'meio', 'rodape'] as BannerPosition[]).map((pos) => {
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
                    {posLabels[pos]} ({list.length} banner{list.length !== 1 ? 's' : ''})
                  </h4>
                  <span className="text-[11px] text-stone-400">
                    {list.length > 1 ? 'Rotação automática ativa' : 'Exibição estática'}
                  </span>
                </div>

                {list.length === 0 ? (
                  <p className="text-xs text-stone-400 italic py-2">
                    Nenhum banner cadastrado nesta posição (o espaço fica oculto para o usuário).
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {list.map((ban) => (
                      <div
                        key={ban.id}
                        className={`p-3.5 bg-white rounded-xl border flex gap-3 items-center justify-between ${
                          ban.isActive ? 'border-stone-200' : 'border-stone-200 opacity-60 bg-stone-100/50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={ban.imageUrl}
                            alt={ban.title}
                            className="w-16 h-11 object-cover rounded-lg border border-stone-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="text-[10px] font-mono text-stone-400 block">
                              Ordem: {ban.order} · {ban.isActive ? 'Ativo' : 'Inativo'}
                            </span>
                            <h5 className="font-bold text-xs text-stone-900 truncate">{ban.title}</h5>
                            {ban.linkUrl && (
                              <p className="text-[10px] text-emerald-700 truncate">{ban.linkUrl}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleBannerActive(ban.id)}
                            className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                              ban.isActive
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-stone-200 text-stone-600'
                            }`}
                            title="Alternar Ativo/Inativo"
                          >
                            {ban.isActive ? 'Ligado' : 'Desligado'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenBannerModal(ban)}
                            className="p-1.5 text-stone-500 hover:text-stone-900 rounded-lg hover:bg-stone-100"
                            title="Editar banner"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
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
                            className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-100"
                            title="Excluir banner"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 7. TAB 5: CONFIGURAÇÕES & API DA BÍBLIA */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div>
                <h3 className="font-bold text-stone-900 text-lg">Configurações Gerais & API da Bíblia</h3>
                <p className="text-xs text-stone-500">
                  Gerencie chaves, versões bíblicas e credenciais do gestor.
                </p>
              </div>
              <button
                type="submit"
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#344E41] hover:bg-[#284136] text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Configurações</span>
              </button>
            </div>

            {/* Bible API Section */}
            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#344E41]" />
                <h4 className="font-bold text-sm text-stone-900">Integração com a API da Bíblia</h4>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Você pode apontar para qualquer endpoint REST de Bíblia (por exemplo: <code>https://bible-api.com</code>, <code>https://www.abibliadigital.com.br/api</code>, ou sua API privada). Caso a API esteja indisponível ou sem chave, o aplicativo ativa automaticamente o acervo local em português.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">URL Base da API</label>
                  <input
                    type="text"
                    value={settingsForm.bibleConfig.apiBaseUrl}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        bibleConfig: { ...settingsForm.bibleConfig, apiBaseUrl: e.target.value }
                      })
                    }
                    placeholder="https://bible-api.com"
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-[#344E41]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Chave de API (Bearer Token / Se houver)</label>
                  <input
                    type="password"
                    value={settingsForm.bibleConfig.apiKey}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        bibleConfig: { ...settingsForm.bibleConfig, apiKey: e.target.value }
                      })
                    }
                    placeholder="Opcional se a API for pública"
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-[#344E41]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Versão / Tradução da Bíblia</label>
                  <input
                    type="text"
                    value={settingsForm.bibleConfig.versionName}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        bibleConfig: { ...settingsForm.bibleConfig, versionName: e.target.value }
                      })
                    }
                    placeholder="ex: almeida, nvi, ra, arc"
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-[#344E41]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Tempo Limite de Requisição (ms)</label>
                  <input
                    type="number"
                    value={settingsForm.bibleConfig.requestTimeoutMs}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        bibleConfig: { ...settingsForm.bibleConfig, requestTimeoutMs: Number(e.target.value) }
                      })
                    }
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-[#344E41]"
                  />
                </div>
              </div>
            </div>

            {/* Manager Credentials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">E-mail do Gestor</label>
                <input
                  type="email"
                  value={settingsForm.managerEmail}
                  onChange={(e) => setSettingsForm({ ...settingsForm, managerEmail: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-[#344E41]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Nome do Aplicativo</label>
                <input
                  type="text"
                  value={settingsForm.appName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, appName: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-[#344E41]"
                />
              </div>
            </div>
          </form>

          {/* Backup & Export Area */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-sm text-stone-900">Backup e Exportação de Dados</h4>
              <p className="text-xs text-stone-500">
                Baixe uma cópia JSON de todos os dados cadastrados (boletins, membros, cultos e banners).
              </p>
            </div>
            <button
              onClick={handleExportBackup}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center gap-2 transition-colors self-start sm:self-auto"
            >
              <Download className="w-4 h-4 text-[#344E41]" />
              <span>Exportar Backup (JSON)</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB: ESCALA DE DIÁCONOS */}
      {activeTab === 'deacons' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-stone-900 text-lg">Gerenciar Escala da Junta Diaconal</h3>
                <p className="text-xs text-stone-500">
                  Padrão oficial: <strong>1ª Semana (Semana de Oração)</strong>,{' '}
                  <strong>Quintas-feiras (Culto de Estudo e Oração)</strong>,{' '}
                  <strong>Domingos (Manhã e Noite)</strong> e{' '}
                  <strong>Espaço Reservado para Eventos</strong>.
                </p>
              </div>

              <button
                onClick={() => handleOpenDeaconModal(undefined, false, 'domingo_manha')}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#344E41] hover:bg-[#284136] text-white font-semibold text-xs flex items-center gap-2 self-start sm:self-auto shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Escala Diaconal</span>
              </button>
            </div>

            {/* Botões Rápidos por Modalidade da Escala */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
                Atalhos Rápidos para Criar Escala por Modalidade:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenDeaconModal(undefined, false, 'semana_oracao')}
                  className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-bold transition-colors"
                >
                  + 1ª Semana (Semana de Oração)
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenDeaconModal(undefined, false, 'quinta_estudo')}
                  className="px-3 py-1.5 rounded-xl bg-[#EAF0EC] hover:bg-[#d8e5dd] text-[#284136] text-xs font-bold transition-colors"
                >
                  + Quinta-feira (Estudo e Oração)
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenDeaconModal(undefined, false, 'domingo_manha')}
                  className="px-3 py-1.5 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-950 text-xs font-bold transition-colors"
                >
                  + Domingo pela Manhã (Culto)
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenDeaconModal(undefined, false, 'domingo_noite')}
                  className="px-3 py-1.5 rounded-xl bg-indigo-100 hover:bg-indigo-200 text-indigo-950 text-xs font-bold transition-colors"
                >
                  + Domingo à Noite (Culto)
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenDeaconModal(undefined, false, 'evento_especial')}
                  className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-950 text-xs font-bold transition-colors"
                >
                  + Espaço Reservado (Evento Especial)
                </button>
              </div>
            </div>

            {/* Filtro por Categoria no Gestor */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'ALL', label: 'Todas as Escalas' },
                { id: 'semana_oracao', label: '1ª Semana (Oração)' },
                { id: 'quinta_estudo', label: 'Quintas (Estudo/Oração)' },
                { id: 'domingo_manha', label: 'Domingos (Manhã)' },
                { id: 'domingo_noite', label: 'Domingos (Noite)' },
                { id: 'evento_especial', label: 'Eventos Especiais' }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setDeaconCategoryFilter(t.id as 'ALL' | DeaconScheduleCategory)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    deaconCategoryFilter === t.id
                      ? 'bg-[#344E41] text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...deaconSchedules]
              .filter((item) =>
                deaconCategoryFilter === 'ALL' ? true : (item.category || 'domingo_noite') === deaconCategoryFilter
              )
              .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
              .map((item) => {
                const catMeta = CATEGORY_META[item.category || 'domingo_noite'] || CATEGORY_META.domingo_noite;
                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl p-5 border border-stone-200 border-l-4 ${catMeta.borderAccent} flex flex-col justify-between gap-4`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-100 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${catMeta.badgeBg} ${catMeta.badgeText}`}
                          >
                            {catMeta.shortLabel}
                          </span>
                          <span className="text-xs font-bold text-[#344E41] bg-[#EAF0EC] px-2.5 py-0.5 rounded-lg">
                            {new Date(item.date + 'T12:00:00').toLocaleDateString('pt-BR')} · {item.time}
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
                        {item.notes && (
                          <p className="text-[11px] italic text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200/70">
                            Obs: {item.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenDeaconModal(item, true)}
                        className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium flex items-center gap-1"
                        title="Duplicar escala para outra data"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Duplicar</span>
                      </button>
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
                            message: `Deseja excluir a escala de "${item.serviceName}" do dia ${new Date(
                              item.date + 'T12:00:00'
                            ).toLocaleDateString('pt-BR')}?`,
                            isDestructive: true,
                            onConfirm: () => deleteDeaconSchedule(item.id)
                          })
                        }
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Excluir escala"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
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
              <h3 className="font-bold text-stone-900 text-base">
                {editingBulletinId ? 'Editar Boletim Semanal' : 'Novo Boletim Semanal'}
              </h3>
              <button onClick={() => setBulletinModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-700">
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
                    placeholder="Ex: Boletim Semanal - A Esperança que Não Falha"
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

              {/* Type Switcher: PDF vs Text */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Formato do Boletim</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBulletinForm({ ...bulletinForm, type: 'text' })}
                    className={`p-2.5 text-xs font-semibold rounded-xl border transition-colors ${
                      bulletinForm.type === 'text'
                        ? 'bg-[#344E41] text-white border-[#344E41]'
                        : 'bg-stone-50 text-stone-700 border-stone-200'
                    }`}
                  >
                    Editor de Texto (Liturgia & Palavra)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulletinForm({ ...bulletinForm, type: 'pdf' })}
                    className={`p-2.5 text-xs font-semibold rounded-xl border transition-colors ${
                      bulletinForm.type === 'pdf'
                        ? 'bg-[#344E41] text-white border-[#344E41]'
                        : 'bg-stone-50 text-stone-700 border-stone-200'
                    }`}
                  >
                    Upload de Arquivo PDF
                  </button>
                </div>
              </div>

              {/* IF PDF: Upload field */}
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
                      placeholder="https://exemplo.com/boletim.pdf"
                      className="w-full p-2 text-xs rounded-xl border border-stone-300 bg-white"
                    />
                  </div>
                </div>
              ) : (
                /* IF TEXT: Liturgy, theme verse, announcements */
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Versículo Tema da Semana</label>
                    <input
                      type="text"
                      value={bulletinForm.themeVerse}
                      onChange={(e) => setBulletinForm({ ...bulletinForm, themeVerse: e.target.value })}
                      placeholder="Ex: “O Senhor é o meu pastor; nada me faltará.” — Salmos 23:1"
                      className="w-full p-2 text-xs rounded-xl border border-stone-300"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Palavra Pastoral / Editorial</label>
                    <textarea
                      rows={4}
                      value={bulletinForm.pastoralWord}
                      onChange={(e) => setBulletinForm({ ...bulletinForm, pastoralWord: e.target.value })}
                      placeholder="Mensagem do pastor para a congregação..."
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
                      placeholder="Prelúdio Instrumental&#10;Hino Congregacional&#10;Leitura Bíblica&#10;Mensagem Pastoral"
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
                      placeholder="Escola Bíblica Dominical às 10h15&#10;Reunião de Jovens no Sábado"
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
                  className="rounded text-[#344E41] focus:ring-[#344E41]"
                />
                <label htmlFor="chkCurrent" className="text-xs font-bold text-stone-700">
                  Definir este boletim como a edição atual em destaque
                </label>
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBulletinModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#344E41] hover:bg-[#284136] rounded-xl shadow-xs"
                >
                  Salvar Boletim
                </button>
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
              <h3 className="font-bold text-stone-900 text-base">
                {editingBirthdayId ? 'Editar Aniversariante' : 'Cadastrar Aniversariante'}
              </h3>
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
                    placeholder="1990"
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
                    placeholder="(11) 99999-8888"
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Ministério / Grupo</label>
                  <input
                    type="text"
                    value={birthdayForm.ministry || ''}
                    onChange={(e) => setBirthdayForm({ ...birthdayForm, ministry: e.target.value })}
                    placeholder="Ex: Louvor, EBD, Diaconia"
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Foto (Opcional com compressão)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, (b64) => setBirthdayForm({ ...birthdayForm, photoUrl: b64 }))}
                  className="text-xs text-stone-500 w-full"
                />
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
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#344E41] hover:bg-[#284136] rounded-xl shadow-xs"
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
              <div>
                <h3 className="font-bold text-stone-900 text-base">Importar Aniversariantes via CSV</h3>
                <p className="text-xs text-stone-500">Cole o conteúdo da planilha ou faça upload do arquivo .csv</p>
              </div>
              <button onClick={() => setCsvModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 space-y-1">
                <p className="font-bold text-stone-800">Formato esperado do cabeçalho:</p>
                <p className="font-mono text-[11px] bg-white p-2 rounded border border-stone-200">
                  Nome,Data,Telefone,Ministerio
                  <br />
                  Carlos Silva,15/04/1985,(11) 98888-7777,Diaconia
                  <br />
                  Mariana Costa,22/10,(11) 97777-6666,Coral
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Upload de Arquivo .CSV ou cole abaixo:
                </label>
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
                  className="w-full p-2.5 text-xs font-mono rounded-xl border border-stone-300 focus:outline-none"
                />
              </div>

              {/* Preview table */}
              {csvParsedPreview.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-emerald-800 block">
                    Pré-visualização: {csvParsedPreview.length} registros identificados
                  </span>
                  <div className="max-h-48 overflow-y-auto border border-stone-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-100 text-[10px] uppercase font-bold text-stone-600">
                        <tr>
                          <th className="p-2">Nome</th>
                          <th className="p-2">Data</th>
                          <th className="p-2">Telefone</th>
                          <th className="p-2">Ministério</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {csvParsedPreview.map((p, idx) => (
                          <tr key={idx}>
                            <td className="p-2 font-semibold text-stone-900">{p.name}</td>
                            <td className="p-2">
                              {p.birthDay}/{p.birthMonth}
                            </td>
                            <td className="p-2">{p.phone || '—'}</td>
                            <td className="p-2">{p.ministry || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

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
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#344E41] hover:bg-[#284136] disabled:opacity-50 rounded-xl shadow-xs"
                >
                  Confirmar e Importar
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
              <h3 className="font-bold text-stone-900 text-base">
                {editingBannerId ? 'Editar Banner' : 'Novo Banner de Divulgação'}
              </h3>
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
                  placeholder="Ex: Retiro de Casais 2026"
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

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Imagem do Banner (Upload ou URL)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, (b64) => setBannerForm({ ...bannerForm, imageUrl: b64 }))}
                  className="text-xs text-stone-500 mb-2 w-full"
                />
                <input
                  type="text"
                  value={bannerForm.imageUrl}
                  onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
                  placeholder="Ou cole a URL da imagem..."
                  className="w-full p-2 text-xs rounded-xl border border-stone-300"
                />
              </div>

              {/* Preview image */}
              {bannerForm.imageUrl && (
                <div className="p-2 border border-stone-200 rounded-xl bg-stone-50">
                  <span className="text-[10px] font-bold text-stone-500 block mb-1">Pré-visualização:</span>
                  <img
                    src={bannerForm.imageUrl}
                    alt="Preview"
                    className="w-full h-24 object-cover rounded-lg"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Link de Destino ao Clicar (Opcional)</label>
                <input
                  type="text"
                  value={bannerForm.linkUrl || ''}
                  onChange={(e) => setBannerForm({ ...bannerForm, linkUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full p-2.5 text-xs rounded-xl border border-stone-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Data Início (Opcional)</label>
                  <input
                    type="date"
                    value={bannerForm.startDate || ''}
                    onChange={(e) => setBannerForm({ ...bannerForm, startDate: e.target.value })}
                    className="w-full p-2 text-xs rounded-xl border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Data Término (Opcional)</label>
                  <input
                    type="date"
                    value={bannerForm.endDate || ''}
                    onChange={(e) => setBannerForm({ ...bannerForm, endDate: e.target.value })}
                    className="w-full p-2 text-xs rounded-xl border border-stone-300"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chkBannerActive"
                  checked={bannerForm.isActive}
                  onChange={(e) => setBannerForm({ ...bannerForm, isActive: e.target.checked })}
                  className="rounded text-[#344E41] focus:ring-[#344E41]"
                />
                <label htmlFor="chkBannerActive" className="text-xs font-bold text-stone-700">
                  Banner ativo para exibição
                </label>
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBannerModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#344E41] hover:bg-[#284136] rounded-xl shadow-xs"
                >
                  Salvar Banner
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
              <h3 className="font-bold text-stone-900 text-base">
                {editingDeaconId ? 'Editar Escala de Diáconos' : 'Nova Escala de Diáconos'}
              </h3>
              <button onClick={() => setDeaconModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDeaconSchedule} className="p-5 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Modalidade da Escala da Igreja
                </label>
                <select
                  value={deaconForm.category || 'domingo_manha'}
                  onChange={(e) => handleSelectDeaconCategoryInModal(e.target.value as DeaconScheduleCategory)}
                  className="w-full p-2.5 text-xs rounded-xl border border-stone-300 bg-white font-semibold text-stone-800"
                >
                  <option value="semana_oracao">1ª Semana do Mês — Semana de Oração</option>
                  <option value="quinta_estudo">Quinta-feira — Culto de Estudo e Oração</option>
                  <option value="domingo_manha">Domingo pela Manhã — Culto Matutino</option>
                  <option value="domingo_noite">Domingo à Noite — Culto Noturno</option>
                  <option value="evento_especial">Espaço Reservado — Evento Especial (caso haja)</option>
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
                  <label className="block text-xs font-bold text-stone-700 mb-1">Horário</label>
                  <input
                    type="text"
                    required
                    value={deaconForm.time}
                    onChange={(e) => setDeaconForm({ ...deaconForm, time: e.target.value })}
                    placeholder="Ex: 09h00 ou 19h30"
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Culto, Reunião ou Evento</label>
                <input
                  type="text"
                  required
                  value={deaconForm.serviceName}
                  onChange={(e) => setDeaconForm({ ...deaconForm, serviceName: e.target.value })}
                  placeholder="Ex: 1ª Semana de Oração / Culto de Estudo e Oração"
                  className="w-full p-2.5 text-xs rounded-xl border border-stone-300"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Diácono Coordenador do Dia</label>
                  <input
                    type="text"
                    required
                    value={deaconForm.coordinator}
                    onChange={(e) => setDeaconForm({ ...deaconForm, coordinator: e.target.value })}
                    placeholder="Ex: Diác. Carlos Eduardo"
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">WhatsApp do Coordenador (Opcional)</label>
                  <input
                    type="text"
                    value={deaconForm.coordinatorPhone || ''}
                    onChange={(e) => setDeaconForm({ ...deaconForm, coordinatorPhone: e.target.value })}
                    placeholder="5511999887766"
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
                  placeholder="Ex: Diác. Lucas Magalhães, Diác. Mariana Costa"
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
                  placeholder="Ex: Diác. Helena Drummond, Diác. Marcos Azevedo"
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
                  placeholder="Ex: Diác. André Viana, Diác. Felipe Tavares"
                  className="w-full p-2.5 text-xs rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Observações do Plantão (Opcional)</label>
                <textarea
                  rows={2}
                  value={deaconForm.notes || ''}
                  onChange={(e) => setDeaconForm({ ...deaconForm, notes: e.target.value })}
                  placeholder="Ex: Chegar 30 minutos antes para preparação da Santa Ceia."
                  className="w-full p-2.5 text-xs rounded-xl border border-stone-300"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeaconModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#344E41] hover:bg-[#284136] rounded-xl shadow-xs"
                >
                  Salvar Escala
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
