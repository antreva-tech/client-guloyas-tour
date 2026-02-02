/**
 * Performance utility for throttling function calls.
 * Used to optimize scroll and resize event handlers for mobile performance.
 */

/**
 * Creates a throttled version of a function that only executes
 * at most once per specified time interval.
 * @param fn - The function to throttle.
 * @param delay - Minimum time between function calls in milliseconds.
 * @returns A throttled version of the function.
 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= delay) {
      // Execute immediately if enough time has passed
      lastCall = now;
      fn(...args);
    } else if (!timeoutId) {
      // Schedule execution for the remaining time
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        fn(...args);
      }, delay - timeSinceLastCall);
    }
  };
}

/**
 * Creates a debounced version of a function that only executes
 * after the specified delay has passed since the last call.
 * @param fn - The function to debounce.
 * @param delay - Time to wait before executing in milliseconds.
 * @returns A debounced version of the function.
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}
