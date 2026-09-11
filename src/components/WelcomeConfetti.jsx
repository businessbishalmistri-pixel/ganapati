import { useEffect } from 'react';
import confetti from 'canvas-confetti';

/**
 * WelcomeConfetti Component
 * Fires a gentle, elegant confetti shower when a customer visits the website.
 */
export function WelcomeConfetti() {
  useEffect(() => {
    // Gentle confetti colors matching store aesthetics (emerald, gold, teal, coral, pearl)
    const colors = ['#10b981', '#059669', '#f59e0b', '#fbbf24', '#06b6d4', '#f43f5e', '#ffffff'];

    // 1. Gentle top-left & top-right gentle arcs
    const end = Date.now() + 2500;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.15 },
        colors: colors,
        gravity: 0.7,
        scalar: 0.9,
        ticks: 200,
        shapes: ['circle', 'square'],
        disableForReducedMotion: true,
      });

      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.15 },
        colors: colors,
        gravity: 0.7,
        scalar: 0.9,
        ticks: 200,
        shapes: ['circle', 'square'],
        disableForReducedMotion: true,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    // Initial soft center burst
    confetti({
      particleCount: 40,
      spread: 70,
      origin: { y: 0.25 },
      colors: colors,
      gravity: 0.6,
      scalar: 0.85,
      ticks: 250,
      disableForReducedMotion: true,
    });

    frame();
  }, []);

  return null;
}
