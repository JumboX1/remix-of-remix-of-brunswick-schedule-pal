import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@fontsource-variable/dm-sans";
import "@fontsource/dm-serif-display/latin-400.css";
import { registerOffline } from "./lib/registerOffline";

const root = document.getElementById("root");

if (!root) {
  throw new Error("App root element is missing.");
}

createRoot(root).render(<App />);
void registerOffline();
