"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Optional third-party libraries
export default function PrelineScript() {
  const path = usePathname();

  useEffect(() => {
    // Only run in browser
    if (typeof window !== "undefined") {
      import("jquery").then(($) => {
        (window as any).$ = $;
        (window as any).jQuery = $;
        import("datatables.net").then(() => {
          (window as any).DataTable = ($.fn as any).dataTable;
        });
      });
      import("lodash").then((_mod) => {
        (window as any)._ = _mod;
      });
      import("nouislider").then((noUiSlider) => {
        (window as any).noUiSlider = noUiSlider;
      });
      import("dropzone/dist/dropzone-min.js");
      import("vanilla-calendar-pro").then((VanillaCalendarPro) => {
        (window as any).VanillaCalendarPro = VanillaCalendarPro;
      });
    }
    // Preline UI
    const initPreline = async () => {
      await import("preline/dist/index.js");
    };
    initPreline();
  }, []);

  useEffect(() => {
    setTimeout(() => {
      if (
        typeof window !== "undefined" &&
        window.HSStaticMethods &&
        typeof window.HSStaticMethods.autoInit === "function"
      ) {
        window.HSStaticMethods.autoInit();
      }
    }, 100);
  }, [path]);

  return null;
}

