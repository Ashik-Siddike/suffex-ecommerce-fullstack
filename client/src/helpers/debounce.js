
export function debounce(fn, delay = 400) {
  let timeoutId = null;

  return function debounced(...args) {
    const context = this;

    // Clear previous pending execution
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Schedule new execution
    timeoutId = setTimeout(() => {
      fn.apply(context, args);
      timeoutId = null;
    }, delay);
  };
}

export default debounce;
