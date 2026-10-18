import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { useChurch } from '../../context/ChurchContext';
import { BannerPosition } from '../../types';

interface BannerCarouselProps {
  position: BannerPosition;
  className?: string;
}

export const BannerCarousel: React.FC<BannerCarouselProps> = ({ position, className = '' }) => {
  const { getBannersByPosition } = useChurch();
  const activeBanners = getBannersByPosition(position);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-rotation every 5 seconds if > 1 banner and not paused
  useEffect(() => {
    if (activeBanners.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [activeBanners.length, isPaused]);

  // Reset index if banners change
  useEffect(() => {
    if (currentIndex >= activeBanners.length) {
      setCurrentIndex(0);
    }
  }, [activeBanners.length, currentIndex]);

  // If no active banners in this position, don't occupy any space
  if (!activeBanners || activeBanners.length === 0) {
    return null;
  }

  const currentBanner = activeBanners[currentIndex];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const handleClickBanner = () => {
    if (currentBanner.linkUrl) {
      window.open(currentBanner.linkUrl, currentBanner.openInNewTab ? '_blank' : '_self');
    }
  };

  // Height and aspect ratio adaptations depending on position
  const positionStyles = {
    topo: 'h-14 sm:h-16 md:h-20 bg-stone-900 border-b border-stone-800 text-white',
    meio: 'rounded-2xl overflow-hidden shadow-sm border border-stone-200/80 my-4 sm:my-6',
    rodape: 'rounded-2xl overflow-hidden shadow-sm border border-stone-200/80 mt-6 sm:mt-8'
  };

  if (position === 'topo') {
    return (
      <div
        className={`w-full relative overflow-hidden select-none transition-all ${positionStyles.topo} ${className}`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          onClick={handleClickBanner}
          className={`w-full h-full flex items-center justify-between px-3 sm:px-6 relative ${
            currentBanner.linkUrl ? 'cursor-pointer hover:opacity-95' : ''
          }`}
          style={{
            backgroundImage: currentBanner.imageUrl ? `linear-gradient(rgba(17, 24, 39, 0.78), rgba(17, 24, 39, 0.78)), url(${currentBanner.imageUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* Top Banner Content */}
          <div className="flex items-center gap-2 max-w-4xl mx-auto text-center justify-center flex-1 pr-2">
            <span className="text-xs sm:text-sm font-medium tracking-wide line-clamp-1">
              {currentBanner.title}
            </span>
            {currentBanner.linkUrl && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 hover:underline shrink-0 ml-1">
                Saiba mais <ExternalLink className="w-3 h-3" />
              </span>
            )}
          </div>

          {/* Multiple Banners Controls */}
          {activeBanners.length > 1 && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handlePrev}
                className="w-6 h-6 rounded-full flex items-center justify-center bg-black/30 hover:bg-black/50 text-white transition-colors"
                aria-label="Banner anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-1 px-1">
                {activeBanners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(idx);
                    }}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40'
                    }`}
                    aria-label={`Ir para banner ${idx + 1}`}
                  />
                ))}
              </div>
              <button
                onClick={handleNext}
                className="w-6 h-6 rounded-full flex items-center justify-center bg-black/30 hover:bg-black/50 text-white transition-colors"
                aria-label="Próximo banner"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Meio e Rodapé styles: rich card banner
  return (
    <div
      className={`w-full relative overflow-hidden group select-none ${positionStyles[position]} ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        onClick={handleClickBanner}
        className={`relative w-full aspect-21/9 sm:aspect-24/9 min-h-[140px] max-h-[260px] bg-stone-800 ${
          currentBanner.linkUrl ? 'cursor-pointer' : ''
        }`}
      >
        {/* Banner image with graceful cover */}
        <img
          src={currentBanner.imageUrl}
          alt={currentBanner.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.01]"
        />

        {/* Gradient overlay for clear text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-900/35 to-transparent flex flex-col justify-end p-4 sm:p-6">
          <div className="max-w-2xl">
            <h3 className="text-white text-base sm:text-xl font-bold tracking-tight drop-shadow-sm line-clamp-2">
              {currentBanner.title}
            </h3>
            {currentBanner.linkUrl && (
              <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-amber-300 hover:text-amber-200">
                Toque para ver detalhes
                <ExternalLink className="w-3.5 h-3.5" />
              </p>
            )}
          </div>
        </div>

        {/* Carousel Prev/Next Buttons */}
        {activeBanners.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-xs text-white flex items-center justify-center opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Banner anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-xs text-white flex items-center justify-center opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Próximo banner"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Bottom dots */}
            <div className="absolute bottom-2.5 right-4 flex items-center gap-1.5 z-10">
              {activeBanners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentIndex ? 'w-5 bg-white' : 'w-2 bg-white/50'
                  }`}
                  aria-label={`Ir para banner ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
