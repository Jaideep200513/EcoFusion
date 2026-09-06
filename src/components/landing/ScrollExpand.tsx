import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export interface ScrollExpandProps {
  src?: string;
  alt?: string;
  title?: string;
  scrollHint?: string;
  useWindowScroll?: boolean;
  mediaZoom?: number;
  children?: React.ReactNode;
  className?: string;
}

export const ScrollExpand: React.FC<ScrollExpandProps> = ({
  src = 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1600&auto=format&fit=crop',
  alt = 'Media frame',
  title = 'Built to scale',
  scrollHint = 'Scroll to expand',
  useWindowScroll: _useWindowScroll = true,
  mediaZoom = 1.35,
  children,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 85%', 'end 35%'],
  });

  // Scale frame horizontally & vertically as user scrolls
  const scale = useTransform(scrollYProgress, [0, 0.7], [0.82, 1]);
  const borderRadius = useTransform(scrollYProgress, [0, 0.7], [32, 16]);
  const imageScale = useTransform(scrollYProgress, [0, 0.7], [mediaZoom, 1]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.7], [0.6, 0.3]);
  const textY = useTransform(scrollYProgress, [0, 0.5], [0, -20]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  return (
    <div ref={containerRef} className={`w-full py-12 ${className}`}>
      {/* Scroll expandable frame */}
      <motion.div
        style={{
          scale,
          borderRadius,
        }}
        className="relative w-full max-w-[1600px] mx-auto h-[480px] md:h-[580px] overflow-hidden shadow-2xl border border-white/10 group cursor-pointer"
      >
        {/* Expanding Background Media */}
        <motion.img
          src={src}
          alt={alt}
          style={{ scale: imageScale }}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300"
          onError={(e) => {
            // Fallback background image if local image isn't available
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1600&auto=format&fit=crop';
          }}
        />

        {/* Dynamic Dark Gradient Overlay */}
        <motion.div
          style={{ opacity: overlayOpacity }}
          className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"
        />

        {/* Center Title & Scroll Hint */}
        <motion.div
          style={{ y: textY, opacity: textOpacity }}
          className="absolute inset-0 p-8 md:p-12 flex flex-col justify-between z-10"
        >
          <div className="flex items-center justify-between">
            <span className="px-3.5 py-1 rounded-full text-xs font-mono tracking-widest uppercase bg-white/10 text-emerald-300 border border-white/20 backdrop-blur-md">
              {title}
            </span>
            {scrollHint && (
              <span className="text-xs font-mono text-slate-300 animate-bounce bg-black/50 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
                ↓ {scrollHint}
              </span>
            )}
          </div>

          <div className="max-w-2xl space-y-3">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-lg">
              {title}
            </h2>
          </div>
        </motion.div>
      </motion.div>

      {/* Children content below frame */}
      {children && (
        <div className="max-w-4xl mx-auto mt-8 px-6 text-center space-y-3">
          {children}
        </div>
      )}
    </div>
  );
};

export default ScrollExpand;
