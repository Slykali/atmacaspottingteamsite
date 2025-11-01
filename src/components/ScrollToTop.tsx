import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plane } from "lucide-react";

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      {isVisible && (
        <Button
          onClick={scrollToTop}
          size="icon"
          className="fixed bottom-8 right-8 z-50 h-12 w-12 rounded-full shadow-lg aircraft-glow animate-fade-in"
          aria-label="Yukarı Çık"
        >
          <Plane className="h-5 w-5 rotate-[-45deg]" />
        </Button>
      )}
    </>
  );
};

export default ScrollToTop;
