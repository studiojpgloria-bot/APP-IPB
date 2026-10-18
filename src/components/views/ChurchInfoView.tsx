import React from 'react';
import {
  Church,
  Clock,
  ExternalLink,
  Facebook,
  Heart,
  Instagram,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Sparkles,
  Users,
  Youtube
} from 'lucide-react';
import { useChurch } from '../../context/ChurchContext';

export const ChurchInfoView: React.FC = () => {
  const { churchInfo, isMobileAppPreview } = useChurch();

  return (
    <div className="space-y-6 sm:space-y-8 pb-8">
      {/* 1. Header Banner */}
      <section className="bg-white rounded-3xl p-5 sm:p-10 border border-stone-200/90 shadow-xs space-y-4">
        <div
          className={`flex gap-5 ${
            isMobileAppPreview
              ? 'flex-col'
              : 'flex-col md:flex-row md:items-center justify-between'
          }`}
        >
          <div className="flex items-start gap-4">
            {churchInfo.logoUrl ? (
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-[#344E41] border border-stone-200 shadow-xs shrink-0">
                <img src={churchInfo.logoUrl} alt={churchInfo.name} className="w-full h-full object-cover" />
              </div>
            ) : null}
            <div className="space-y-1.5 max-w-2xl min-w-0">
              <span className="text-xs font-bold uppercase tracking-wider text-[#4A6B5D] bg-[#EAF0EC] px-3 py-1 rounded-full inline-block">
                Sobre a Nossa Comunidade
              </span>
              <h1 className="text-xl sm:text-4xl font-serif font-bold text-stone-900 tracking-tight leading-snug">
                {churchInfo.name}
              </h1>
              <p className="text-stone-600 text-xs sm:text-base leading-relaxed">
                {churchInfo.tagline}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <a
              href={`https://wa.me/${churchInfo.whatsappNumber}?text=${encodeURIComponent(churchInfo.whatsappDefaultMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-colors"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>Falar no WhatsApp</span>
            </a>
            <a
              href={churchInfo.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors"
            >
              <Navigation className="w-4 h-4 text-[#344E41] shrink-0" />
              <span>Como Chegar</span>
            </a>
          </div>
        </div>
      </section>

      {/* 2. História & Missão */}
      <div className={`grid gap-6 ${isMobileAppPreview ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
        {/* História */}
        <section className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/90 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#EAF0EC] text-[#344E41] flex items-center justify-center">
            <Church className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-stone-900 tracking-tight">Nossa História & Raízes</h2>
          <p className="text-sm text-stone-700 leading-relaxed font-serif whitespace-pre-line">
            {churchInfo.aboutHistory}
          </p>
        </section>

        {/* Missão e Visão */}
        <section className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/90 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#B08938] flex items-center justify-center">
            <Heart className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-stone-900 tracking-tight">Missão & Declaração de Fé</h2>
          <p className="text-sm text-stone-700 leading-relaxed font-serif whitespace-pre-line">
            {churchInfo.missionVision}
          </p>
        </section>
      </div>

      {/* 3. Horários de Cultos e Programação Semanal */}
      <section className="bg-white rounded-2xl p-5 sm:p-8 border border-stone-200/90 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
          <Clock className="w-5 h-5 text-[#344E41] shrink-0" />
          <div>
            <h2 className="text-lg font-bold text-stone-900 tracking-tight">
              Cultos & Programação Semanal
            </h2>
            <p className="text-xs text-stone-500">Você e sua família são nossos convidados especiais</p>
          </div>
        </div>

        <div
          className={`grid gap-4 ${
            isMobileAppPreview ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {churchInfo.schedules.map((sch) => (
            <div
              key={sch.id}
              className="p-4 sm:p-5 rounded-2xl bg-stone-50/70 border border-stone-200/80 hover:border-[#344E41]/40 transition-colors space-y-2 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-[#344E41] mb-1">
                  <span>{sch.day}</span>
                  <span className="bg-[#EAF0EC] px-2 py-0.5 rounded-md font-mono">{sch.time}</span>
                </div>
                <h3 className="font-bold text-stone-900 text-sm leading-snug">{sch.title}</h3>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">{sch.description}</p>
              </div>

              {sch.location && (
                <div className="pt-2 text-[11px] text-stone-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                  <span>{sch.location}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 4. Liderança Pastoral & Conselho */}
      <section className="bg-white rounded-2xl p-5 sm:p-8 border border-stone-200/90 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
          <Users className="w-5 h-5 text-[#344E41] shrink-0" />
          <div>
            <h2 className="text-lg font-bold text-stone-900 tracking-tight">
              Liderança & Pastores
            </h2>
            <p className="text-xs text-stone-500">Homens e mulheres dedicados ao pastoreio e serviço do Reino</p>
          </div>
        </div>

        <div
          className={`grid gap-4 ${
            isMobileAppPreview ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
          }`}
        >
          {churchInfo.leadership.map((leader) => (
            <div
              key={leader.id}
              className="bg-stone-50/50 rounded-2xl p-4 border border-stone-200/70 text-center space-y-3 flex flex-col items-center"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shadow-xs border-2 border-white">
                <img
                  src={
                    leader.photoUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
                  }
                  alt={leader.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h3 className="font-bold text-stone-900 text-sm">{leader.name}</h3>
                <span className="text-xs font-semibold text-[#4A6B5D] block mt-0.5">
                  {leader.role}
                </span>
              </div>

              {leader.bio && (
                <p className="text-xs text-stone-600 leading-relaxed line-clamp-3">
                  {leader.bio}
                </p>
              )}

              {(leader.email || leader.phone) && (
                <div className="pt-2 text-[11px] text-stone-500 space-y-1">
                  {leader.phone && <p>{leader.phone}</p>}
                  {leader.email && <p className="truncate max-w-[180px]">{leader.email}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 5. Endereço, Telefones, Redes Sociais e Mapa */}
      <div className={`grid gap-6 ${isMobileAppPreview ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
        {/* Endereço & Maps */}
        <section className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/90 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-stone-900 text-sm">Localização Física</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            {churchInfo.address}
            <br />
            {churchInfo.cityStateZip}
          </p>
          <a
            href={churchInfo.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#344E41] hover:underline pt-1"
          >
            <span>Abrir no Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </section>

        {/* Telefones & WhatsApp */}
        <section className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/90 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center">
            <Phone className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-stone-900 text-sm">Canais de Contato</h3>
          <div className="space-y-1 text-xs text-stone-600">
            <p>
              <span className="font-medium">Telefone:</span> {churchInfo.primaryPhone}
            </p>
            {churchInfo.secondaryPhone && (
              <p>
                <span className="font-medium">Secretaria:</span> {churchInfo.secondaryPhone}
              </p>
            )}
            <p className="break-all">
              <span className="font-medium">E-mail:</span> {churchInfo.email}
            </p>
          </div>
          <a
            href={`https://wa.me/${churchInfo.whatsappNumber}?text=${encodeURIComponent(churchInfo.whatsappDefaultMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline pt-1"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Conversar pelo WhatsApp</span>
          </a>
        </section>

        {/* Redes Sociais */}
        <section className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/90 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#B08938] flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-stone-900 text-sm">Redes Sociais & Transmissões</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Acompanhe nossas mensagens, estudos e cultos ao vivo online:
          </p>
          <div className="flex items-center gap-2 pt-1">
            {churchInfo.instagramUrl && (
              <a
                href={churchInfo.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors"
                title="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
            )}
            {churchInfo.youtubeUrl && (
              <a
                href={churchInfo.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors"
                title="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
            )}
            {churchInfo.facebookUrl && (
              <a
                href={churchInfo.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors"
                title="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
