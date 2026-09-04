/**
 * Helper to trigger native vibration haptic feedback on supported mobile browsers.
 */
export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'selection';

export const triggerHaptic = (type: HapticType | number | number[] = 'light') => {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) {
    return;
  }

  try {
    if (typeof type === 'number' || Array.isArray(type)) {
      navigator.vibrate(type);
      return;
    }

    switch (type) {
      case 'selection':
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(25);
        break;
      case 'heavy':
        navigator.vibrate(45);
        break;
      case 'success':
        navigator.vibrate([15, 60, 20]);
        break;
      case 'error':
        navigator.vibrate([40, 60, 40]);
        break;
      default:
        navigator.vibrate(15);
    }
  } catch {
    // Gracefully handle browsers blocking vibrate without user interaction gesture
  }
};
