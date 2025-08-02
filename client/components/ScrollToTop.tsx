import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Smooth scroll to top with a slight delay for better UX
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    };

    // Use requestAnimationFrame for smoother performance
    requestAnimationFrame(() => {
      scrollToTop();
    });

    // Clean up any existing scroll restoration from browser
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    // Clear any redirect flags stored in localStorage
    const redirectFrom = localStorage.getItem("redirectFrom");
    if (redirectFrom && pathname === "/") {
      localStorage.removeItem("redirectFrom");
    }
  }, [pathname]);

  return null;
}

// Additional utility for programmatic smooth scrolling
export const smoothScrollTo = (elementId: string, offset: number = 0) => {
  const element = document.getElementById(elementId);
  if (element) {
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  }
};

// Smooth scroll hook for components
export const useSmoothScroll = () => {
  const scrollToElement = (elementId: string, offset: number = 80) => {
    smoothScrollTo(elementId, offset);
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return { scrollToElement, scrollToTop };
};
