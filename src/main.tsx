import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Monkey patch removeChild to prevent crash from extensions/framer-motion
const origRemoveChild = Node.prototype.removeChild;
Node.prototype.removeChild = function(child) {
  if (!this.contains(child)) {
    console.warn('removeChild: nœud orphelin détecté', child, this);
    return child;
  }
  return origRemoveChild.call(this, child);
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
