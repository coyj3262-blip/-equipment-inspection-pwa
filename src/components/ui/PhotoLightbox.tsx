import { useState, useEffect } from "react";

type PhotoLightboxProps = {
  photos: string[];
  initialIndex?: number;
  onClose: () => void;
};

export default function PhotoLightbox({
  photos,
  initialIndex = 0,
  onClose
}: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
    setIsZoomed(false);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
    setIsZoomed(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goToPrevious();
      if (e.key === "ArrowRight") goToNext();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [currentIndex, goToNext, goToPrevious, onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-2xl font-bold transition-colors"
        aria-label="Close"
      >
        ×
      </button>

      {/* Counter */}
      {photos.length > 1 && (
        <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium">
          {currentIndex + 1} / {photos.length}
        </div>
      )}

      {/* Main image */}
      <div
        className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={photos[currentIndex]}
          alt={`Photo ${currentIndex + 1}`}
          className={`max-w-full max-h-full object-contain transition-transform duration-200 cursor-zoom-${isZoomed ? 'out' : 'in'}`}
          style={{
            transform: isZoomed ? "scale(2)" : "scale(1)",
          }}
          onClick={() => setIsZoomed(!isZoomed)}
        />
      </div>

      {/* Navigation arrows */}
      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-2xl font-bold transition-colors"
            aria-label="Previous photo"
          >
            ‹
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-2xl font-bold transition-colors"
            aria-label="Next photo"
          >
            ›
          </button>
        </>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-xs font-medium">
        {photos.length > 1 && "← → to navigate • "}
        Click image to zoom • ESC to close
      </div>
    </div>
  );
}
