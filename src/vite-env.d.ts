/// <reference types="vite/client" />
import type React from "react";

// Custom element typing for lottie-player without loosening all intrinsic elements
declare global {
  // Extend the existing JSX namespace (do not overwrite)
  namespace JSX {
    interface IntrinsicElements {
      "lottie-player": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        src?: string;
        background?: string;
        speed?: string | number;
        loop?: boolean;
        autoplay?: boolean;
      };
    }
  }
}

export {};

// Allow importing JSON files as URLs via Vite ?url suffix
// Use a simple declaration merging approach for JSON URL imports without export default inside augmentation
declare module "*.json?url";
