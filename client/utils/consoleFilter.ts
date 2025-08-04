// Filter out recharts defaultProps warnings
const originalWarn = console.warn;

console.warn = (...args: any[]) => {
  const message = args[0];
  
  // Filter out recharts defaultProps warnings
  if (
    typeof message === 'string' && 
    (
      message.includes('Support for defaultProps will be removed from function components') &&
      (message.includes('XAxis') || message.includes('YAxis'))
    )
  ) {
    return; // Suppress this warning
  }
  
  // Allow all other warnings through
  originalWarn.apply(console, args);
};

export {};
