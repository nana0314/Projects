'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useDrag } from '@use-gesture/react';
import { Recipe } from '@/src/types';
import SwipeCard from './SwipeCard';

const SWIPE_THRESHOLD = 100;
const SWIPE_UP_THRESHOLD = -80;

interface SwipeStackProps {
  recipe: Recipe | null;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeUp: () => void;
  onTap: () => void;
  loading: boolean;
}

export default function SwipeStack({
  recipe,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onTap,
  loading,
}: SwipeStackProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [flyClass, setFlyClass] = useState('');

  const applyTransform = useCallback((tx: number, ty: number, rot: number, s: number) => {
    if (cardRef.current) {
      cardRef.current.style.transform = `translate3d(${tx}px, ${ty}px, 0) rotate(${rot}deg) scale(${s})`;
    }
  }, []);

  const resetCard = useCallback(() => {
    setFlyClass('');
    applyTransform(0, 0, 0, 1);
  }, [applyTransform]);

  useEffect(() => {
    resetCard();
  }, [recipe, resetCard]);

  const bind = useDrag(
    ({ active, movement: [mx, my], direction: [dx, dy], velocity: [vx, vy], tap }) => {
      if (tap) {
        onTap();
        return;
      }

      if (!active) {
        if (my < SWIPE_UP_THRESHOLD || (vy > 0.5 && dy < 0)) {
          setFlyClass('animate-fly-up');
          setTimeout(() => {
            onSwipeUp();
            resetCard();
          }, 350);
        } else if (mx > SWIPE_THRESHOLD || (vx > 0.5 && dx > 0)) {
          setFlyClass('animate-fly-right');
          setTimeout(() => {
            onSwipeRight();
            resetCard();
          }, 350);
        } else if (mx < -SWIPE_THRESHOLD || (vx > 0.5 && dx < 0)) {
          setFlyClass('animate-fly-left');
          setTimeout(() => {
            onSwipeLeft();
            resetCard();
          }, 350);
        } else {
          applyTransform(0, 0, 0, 1);
          if (cardRef.current) {
            cardRef.current.style.transition = 'transform 0.3s ease';
            setTimeout(() => {
              if (cardRef.current) cardRef.current.style.transition = '';
            }, 300);
          }
        }
        return;
      }

      applyTransform(mx, my, mx / 20, 1.02);
    },
    {
      filterTaps: true,
    }
  );

  if (loading) {
    return (
      <div className="relative w-full aspect-[3/4] max-w-sm mx-auto">
        <div className="absolute inset-0 rounded-2xl skeleton-shimmer" />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="relative w-full aspect-[3/4] max-w-sm mx-auto flex items-center justify-center">
        <div className="text-center text-gray-400 p-8" data-testid="empty-state">
          <p className="text-5xl mb-4">🍽️</p>
          <p className="text-lg font-medium">No more recipes</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[3/4] max-w-sm mx-auto" data-testid="swipe-stack">
      <div
        {...bind()}
        ref={cardRef}
        style={{ touchAction: 'none' }}
        className={`absolute inset-0 will-change-transform ${flyClass}`}
      >
        <SwipeCard recipe={recipe} onTap={onTap} />
      </div>
    </div>
  );
}
