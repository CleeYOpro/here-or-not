import type { IStaticMethods } from "preline/dist";

declare global {
  interface Window {
    _;
    $: typeof import("jquery");
    jQuery: typeof import("jquery");
    DataTable;
    Dropzone;
    VanillaCalendarPro;
    HSStaticMethods: IStaticMethods;
  }
}

export {};
