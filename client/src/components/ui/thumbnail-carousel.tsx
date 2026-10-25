import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface CarouselItem {
  id: number | string;
  url: string;
  title: string;
}

const defaultItems: CarouselItem[] = [
  {
    id: 1,
    url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02560?w=1200&auto=format&fit=crop&q=80',
    title: 'Flagship Titanium Smartphone',
  },
  {
    id: 2,
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&auto=format&fit=crop&q=80',
    title: 'Studio Hi-Fi Wireless Headphones',
  },
  {
    id: 3,
    url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&auto=format&fit=crop&q=80',
    title: 'Pro Workstation M-Series Laptop',
  },
  {
    id: 4,
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&auto=format&fit=crop&q=80',
    title: 'Luxury Smartwatch Edition',
  },
  {
    id: 5,
    url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200&auto=format&fit=crop&q=80',
    title: 'Mirrorless 4K Pro Camera',
  },
  {
    id: 6,
    url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=1200&auto=format&fit=crop&q=80',
    title: 'Custom Mechanical RGB Keyboard',
  },
  {
    id: 7,
    url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=1200&auto=format&fit=crop&q=80',
    title: 'High-Fidelity Bluetooth Speaker',
  },
  {
    id: 8,
    url: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=1200&auto=format&fit=crop&q=80',
    title: 'Autonomous Aerial Drone',
  },
  {
    id: 9,
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80',
    title: 'Mountain Summit Panorama',
  },
  {
    id: 10,
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80',
    title: 'Alpine Landscape Scenic Valley',
  },
  {
    id: 11,
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&auto=format&fit=crop&q=80',
    title: 'Emerald Forest Path',
  },
  {
    id: 12,
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&auto=format&fit=crop&q=80',
    title: 'Sunrise Horizon Over Mountains',
  },
];

const FULL_WIDTH_PX = 120;
const COLLAPSED_WIDTH_PX = 38;
const GAP_PX = 4;
const MARGIN_PX = 2;

interface ThumbnailsProps {
  items: CarouselItem[];
  index: number;
  setIndex: (index: number) => void;
}

function Thumbnails({ items, index, setIndex }: ThumbnailsProps) {
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (thumbnailsRef.current) {
      let scrollPosition = 0;
      for (let i = 0; i < index; i++) {
        scrollPosition += COLLAPSED_WIDTH_PX + GAP_PX;
      }

      scrollPosition += MARGIN_PX;

      const containerWidth = thumbnailsRef.current.offsetWidth;
      const centerOffset = containerWidth / 2 - FULL_WIDTH_PX / 2;
      scrollPosition -= centerOffset;

      thumbnailsRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth',
      });
    }
  }, [index]);

  return (
    <div
      ref={thumbnailsRef}
      className='overflow-x-auto no-scrollbar py-1'
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <div className='flex gap-1 h-20 pb-1' style={{ width: 'fit-content' }}>
        {items.map((item, i) => (
          <motion.button
            key={item.id}
            onClick={() => setIndex(i)}
            onMouseEnter={() => setIndex(i)}
            initial={false}
            animate={i === index ? 'active' : 'inactive'}
            variants={{
              active: {
                width: FULL_WIDTH_PX,
                marginLeft: MARGIN_PX,
                marginRight: MARGIN_PX,
              },
              inactive: {
                width: COLLAPSED_WIDTH_PX,
                marginLeft: 0,
                marginRight: 0,
              },
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`relative shrink-0 h-full overflow-hidden rounded-xl border transition-colors cursor-pointer ${
              i === index
                ? 'border-cyan-400 shadow-lg shadow-cyan-950/50 ring-2 ring-cyan-500/30'
                : 'border-white/10 opacity-70 hover:opacity-100 hover:border-white/30'
            }`}
            title={item.title}
          >
            <img
              src={item.url}
              alt={item.title}
              className='w-full h-full object-cover pointer-events-none select-none'
              draggable={false}
            />
            {i === index && (
              <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5 pointer-events-none'>
                <span className='text-[10px] text-cyan-300 font-semibold truncate leading-tight'>
                  {item.title}
                </span>
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export interface ThumbnailCarouselProps {
  items?: CarouselItem[];
  className?: string;
}

export default function ThumbnailCarousel({
  items = defaultItems,
  className = '',
}: ThumbnailCarouselProps) {
  const [index, setIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);

  useEffect(() => {
    if (!isDragging && containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth || 1;
      const targetX = -index * containerWidth;

      animate(x, targetX, {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      });
    }
  }, [index, x, isDragging]);

  return (
    <div className={`w-full max-w-4xl mx-auto p-4 ${className}`}>
      <div className='flex flex-col gap-3.5'>
        {/* Main Carousel Viewport */}
        <div
          className='relative overflow-hidden rounded-2xl bg-[#030712] border border-white/10 shadow-2xl'
          ref={containerRef}
        >
          <motion.div
            className='flex cursor-grab active:cursor-grabbing'
            drag='x'
            dragElastic={0.2}
            dragMomentum={false}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(e, info) => {
              setIsDragging(false);
              const containerWidth = containerRef.current?.offsetWidth || 1;
              const offset = info.offset.x;
              const velocity = info.velocity.x;

              let newIndex = index;

              // If fast swipe, use velocity
              if (Math.abs(velocity) > 500) {
                newIndex = velocity > 0 ? index - 1 : index + 1;
              }
              // Otherwise use offset threshold (30% of container width)
              else if (Math.abs(offset) > containerWidth * 0.3) {
                newIndex = offset > 0 ? index - 1 : index + 1;
              }

              // Clamp index
              newIndex = Math.max(0, Math.min(items.length - 1, newIndex));
              setIndex(newIndex);
            }}
            style={{ x }}
          >
            {items.map((item) => (
              <div key={item.id} className='shrink-0 w-full h-[320px] sm:h-[420px] relative'>
                <img
                  src={item.url}
                  alt={item.title}
                  className='w-full h-full object-cover select-none pointer-events-none'
                  draggable={false}
                />
                <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none flex flex-col justify-end p-6'>
                  <h3 className='text-lg sm:text-2xl font-bold text-white font-["Outfit"] drop-shadow-md'>
                    {item.title}
                  </h3>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Previous Button with Lucide icon */}
          <motion.button
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className={`absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center shadow-xl backdrop-blur-md transition-all z-10 cursor-pointer
              ${
                index === 0
                  ? 'opacity-30 cursor-not-allowed bg-black/40 text-slate-500'
                  : 'bg-black/60 hover:bg-cyan-500 hover:text-black text-white hover:scale-110 border border-white/20'
              }`}
            aria-label='Previous slide'
          >
            <ChevronLeft className='w-5 h-5' />
          </motion.button>

          {/* Next Button with Lucide icon */}
          <motion.button
            disabled={index === items.length - 1}
            onClick={() => setIndex((i) => Math.min(items.length - 1, i + 1))}
            className={`absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center shadow-xl backdrop-blur-md transition-all z-10 cursor-pointer
              ${
                index === items.length - 1
                  ? 'opacity-30 cursor-not-allowed bg-black/40 text-slate-500'
                  : 'bg-black/60 hover:bg-cyan-500 hover:text-black text-white hover:scale-110 border border-white/20'
              }`}
            aria-label='Next slide'
          >
            <ChevronRight className='w-5 h-5' />
          </motion.button>

          {/* Image Counter Badge */}
          <div className='absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md text-white border border-white/10 px-3.5 py-1 rounded-full text-xs font-mono font-bold shadow-lg'>
            {index + 1} / {items.length}
          </div>
        </div>

        {/* Thumbnail Navigation Strip with onMouseEnter hover trigger */}
        <Thumbnails items={items} index={index} setIndex={setIndex} />
      </div>
    </div>
  );
}
