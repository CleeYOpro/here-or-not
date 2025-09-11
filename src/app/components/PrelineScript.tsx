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
          (window as unknown as { $: typeof $; jQuery: typeof $ }).$ = $;
          (window as unknown as { $: typeof $; jQuery: typeof $ }).jQuery = $;
        import("datatables.net").then(() => {
            if ($.fn && ($.fn as unknown as { dataTable?: unknown }).dataTable) {
              (window as unknown as { DataTable?: unknown }).DataTable = ($.fn as unknown as { dataTable?: unknown }).dataTable;
            }
        });
      });
      import("lodash").then((_mod) => {
          (window as unknown as { _: typeof _mod })._ = _mod;
      });
      import("nouislider").then((noUiSlider) => {
          (window as unknown as { noUiSlider: typeof noUiSlider }).noUiSlider = noUiSlider;
      });
      import("dropzone/dist/dropzone-min.js");
      import("vanilla-calendar-pro").then((VanillaCalendarPro) => {
          (window as unknown as { VanillaCalendarPro: typeof VanillaCalendarPro }).VanillaCalendarPro = VanillaCalendarPro;
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

