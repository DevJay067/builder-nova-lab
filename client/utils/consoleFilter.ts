// Filter out specific recharts defaultProps warnings
const originalWarn = console.warn;

console.warn = (...args: any[]) => {
  const message = args[0];

  // Filter out recharts defaultProps warnings for XAxis and YAxis
  if (
    typeof message === 'string' &&
    message.includes('Support for defaultProps will be removed from function components') &&
    (message.includes('XAxis') || message.includes('YAxis') || message.includes('recharts'))
  ) {
    return; // Suppress this specific warning
  }

  // Allow all other warnings through
  originalWarn.apply(console, args);
};

// Also suppress the template literal warning format
const originalError = console.error;
console.error = (...args: any[]) => {
  const message = args[0];

  if (
    typeof message === 'string' &&
    message.includes('defaultProps') &&
    (message.includes('XAxis') || message.includes('YAxis'))
  ) {
    return;
  }

  originalError.apply(console, args);
};

export {};
