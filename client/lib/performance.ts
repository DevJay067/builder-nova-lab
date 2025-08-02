/**
 * Performance optimization utilities for smooth user experience
 */

// Debounce function for search inputs and API calls
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function for scroll events and frequent updates
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Optimized image loading with lazy loading and smooth fade-in
export function loadImageOptimized(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Smooth scroll with easing
export function smoothScrollTo(
  element: HTMLElement | string,
  options: {
    offset?: number;
    duration?: number;
    easing?: "linear" | "easeInOut" | "easeOut";
  } = {},
) {
  const target =
    typeof element === "string" ? document.getElementById(element) : element;
  if (!target) return;

  const { offset = 0, duration = 800, easing = "easeInOut" } = options;
  const start = window.pageYOffset;
  const targetPosition = target.getBoundingClientRect().top + start - offset;
  const distance = targetPosition - start;
  let startTime: number | null = null;

  const easingFunctions = {
    linear: (t: number) => t,
    easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
    easeOut: (t: number) => t * (2 - t),
  };

  function animation(currentTime: number) {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    const ease = easingFunctions[easing](progress);

    window.scrollTo(0, start + distance * ease);

    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    }
  }

  requestAnimationFrame(animation);
}

// Optimized intersection observer for animations
export function createAnimationObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {},
): IntersectionObserver {
  const defaultOptions = {
    root: null,
    rootMargin: "0px 0px -100px 0px",
    threshold: 0.1,
    ...options,
  };

  return new IntersectionObserver(callback, defaultOptions);
}

// Virtual scrolling for large lists
export class VirtualScroller {
  private container: HTMLElement;
  private itemHeight: number;
  private bufferSize: number;
  private items: any[];
  private renderItem: (item: any, index: number) => HTMLElement;

  constructor(
    container: HTMLElement,
    items: any[],
    itemHeight: number,
    renderItem: (item: any, index: number) => HTMLElement,
    bufferSize: number = 5,
  ) {
    this.container = container;
    this.items = items;
    this.itemHeight = itemHeight;
    this.renderItem = renderItem;
    this.bufferSize = bufferSize;
    this.init();
  }

  private init() {
    const containerHeight = this.container.clientHeight;
    const visibleItems = Math.ceil(containerHeight / this.itemHeight);

    this.container.style.height = `${this.items.length * this.itemHeight}px`;
    this.container.style.position = "relative";

    this.render(0, visibleItems + this.bufferSize);

    this.container.addEventListener(
      "scroll",
      throttle(() => {
        const scrollTop = this.container.scrollTop;
        const startIndex = Math.floor(scrollTop / this.itemHeight);
        const endIndex = Math.min(
          startIndex + visibleItems + this.bufferSize,
          this.items.length,
        );

        this.render(startIndex, endIndex);
      }, 16),
    );
  }

  private render(startIndex: number, endIndex: number) {
    this.container.innerHTML = "";

    for (let i = startIndex; i < endIndex; i++) {
      if (i < this.items.length) {
        const element = this.renderItem(this.items[i], i);
        element.style.position = "absolute";
        element.style.top = `${i * this.itemHeight}px`;
        element.style.height = `${this.itemHeight}px`;
        this.container.appendChild(element);
      }
    }
  }
}

// Preload critical resources
export function preloadCriticalResources(resources: string[]) {
  resources.forEach((resource) => {
    const link = document.createElement("link");
    link.rel = "preload";

    if (resource.endsWith(".js")) {
      link.as = "script";
    } else if (resource.endsWith(".css")) {
      link.as = "style";
    } else if (resource.match(/\.(jpg|jpeg|png|webp)$/)) {
      link.as = "image";
    }

    link.href = resource;
    document.head.appendChild(link);
  });
}

// Measure and optimize Core Web Vitals
export class WebVitalsMonitor {
  private static instance: WebVitalsMonitor;
  private vitals: { [key: string]: number } = {};

  static getInstance() {
    if (!WebVitalsMonitor.instance) {
      WebVitalsMonitor.instance = new WebVitalsMonitor();
    }
    return WebVitalsMonitor.instance;
  }

  measureLCP() {
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.vitals.lcp = lastEntry.startTime;
    }).observe({ entryTypes: ["largest-contentful-paint"] });
  }

  measureFID() {
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        this.vitals.fid = entry.processingStart - entry.startTime;
      }
    }).observe({ entryTypes: ["first-input"] });
  }

  measureCLS() {
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      this.vitals.cls = clsValue;
    }).observe({ entryTypes: ["layout-shift"] });
  }

  getVitals() {
    return this.vitals;
  }

  init() {
    this.measureLCP();
    this.measureFID();
    this.measureCLS();
  }
}

// Memory management for large datasets
export function createMemoizedSelector<T, R>(
  selector: (data: T) => R,
  equalityFn?: (a: R, b: R) => boolean,
) {
  let lastArgs: T | undefined;
  let lastResult: R;

  return (data: T): R => {
    if (lastArgs === undefined || !isEqual(data, lastArgs)) {
      lastResult = selector(data);
      lastArgs = data;
    }
    return lastResult;
  };
}

function isEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

// Optimize bundle splitting and code loading
export function loadModuleOnDemand<T>(
  moduleLoader: () => Promise<{ default: T }>,
): Promise<T> {
  return moduleLoader().then((module) => module.default);
}

// Performance monitoring hook for React components
export function usePerformanceMonitor(componentName: string) {
  const startTime = performance.now();

  return {
    logRenderTime: () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      if (renderTime > 16) {
        // More than one frame
        console.warn(
          `Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`,
        );
      }
    },

    measureAsyncOperation: async <T>(
      operation: () => Promise<T>,
      operationName: string,
    ): Promise<T> => {
      const opStart = performance.now();
      try {
        const result = await operation();
        const opEnd = performance.now();
        console.log(
          `${operationName} in ${componentName}: ${(opEnd - opStart).toFixed(2)}ms`,
        );
        return result;
      } catch (error) {
        const opEnd = performance.now();
        console.error(
          `${operationName} failed in ${componentName}: ${(opEnd - opStart).toFixed(2)}ms`,
          error,
        );
        throw error;
      }
    },
  };
}

// Initialize performance monitoring
export function initPerformanceOptimizations() {
  // Enable web vitals monitoring
  WebVitalsMonitor.getInstance().init();

  // Optimize images loading
  if ("loading" in HTMLImageElement.prototype) {
    const images = document.querySelectorAll("img[data-src]");
    images.forEach((img) => {
      (img as HTMLImageElement).src = img.getAttribute("data-src") || "";
    });
  } else {
    // Fallback for browsers without native lazy loading
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.getAttribute("data-src") || "";
          img.classList.remove("lazy");
          imageObserver.unobserve(img);
        }
      });
    });

    document.querySelectorAll("img[data-src]").forEach((img) => {
      imageObserver.observe(img);
    });
  }

  // Optimize font loading
  if ("fonts" in document) {
    Promise.all([
      document.fonts.load("400 1em Inter"),
      document.fonts.load("500 1em Inter"),
      document.fonts.load("600 1em Inter"),
    ]).then(() => {
      document.body.classList.add("fonts-loaded");
    });
  }
}
