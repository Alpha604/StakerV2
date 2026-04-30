import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Monkey patch removeChild and insertBefore to prevent crash from extensions/framer-motion
const origRemoveChild = Node.prototype.removeChild;
Node.prototype.removeChild = function(child) {
  if (!this.contains(child)) {
    console.warn('removeChild: nœud orphelin détecté', child, this);
    return child;
  }
  return origRemoveChild.call(this, child);
};

const origInsertBefore = Node.prototype.insertBefore;
Node.prototype.insertBefore = function(newNode, referenceNode) {
  if (referenceNode && !this.contains(referenceNode)) {
    console.warn('insertBefore: référence orpheline détectée', referenceNode, this);
    referenceNode = null;
  }
  return origInsertBefore.call(this, newNode, referenceNode);
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
