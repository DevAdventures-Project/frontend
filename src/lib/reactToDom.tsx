import type { JSX } from "react";
import ReactDOM from "react-dom/client";

export function reactToDom(comp: JSX.Element): HTMLElement {
  const container = document.createElement("div");
  const root = ReactDOM.createRoot(container);
  root.render(comp);
  return container;
}
