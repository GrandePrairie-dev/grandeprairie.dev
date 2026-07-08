/// <reference types="vite/client" />

import type { DetailedHTMLProps, HTMLAttributes } from "react";

type NeuralNetElementProps = DetailedHTMLProps<
  HTMLAttributes<HTMLElement>,
  HTMLElement
> & {
  color?: string;
  density?: string;
  opacity?: string;
  speed?: string;
  link?: string;
};

declare module "react/jsx-runtime" {
  namespace JSX {
    interface IntrinsicElements {
      "neural-net": NeuralNetElementProps;
    }
  }
}
