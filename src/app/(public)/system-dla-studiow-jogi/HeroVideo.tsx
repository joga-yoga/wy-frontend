"use client";

import { useEffect, useRef, useState } from "react";

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const completedPlays = useRef(0);
  const [shouldAutoplay, setShouldAutoplay] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      const showFinalFrame = () => {
        if (Number.isFinite(video.duration)) video.currentTime = Math.max(0, video.duration - 0.05);
        video.pause();
      };
      video.addEventListener("loadedmetadata", showFinalFrame, { once: true });
      if (video.readyState >= HTMLMediaElement.HAVE_METADATA) showFinalFrame();
      return () => video.removeEventListener("loadedmetadata", showFinalFrame);
    }

    setShouldAutoplay(true);
    void video.play().catch(() => {
      // Autoplay can still be disabled by browser policy; the first frame remains visible.
    });
  }, []);

  const handleEnded = () => {
    const video = videoRef.current;
    if (!video) return;

    completedPlays.current += 1;
    if (completedPlays.current < 3) {
      video.currentTime = 0;
      void video.play();
    }
  };

  return (
    <video
      ref={videoRef}
      className="h-full w-full object-contain"
      src="/videos/phone-slide.mp4"
      aria-label="Podgląd mobilnego systemu joga.yoga"
      autoPlay={shouldAutoplay}
      muted
      playsInline
      preload="metadata"
      onEnded={handleEnded}
    />
  );
}
