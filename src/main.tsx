import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

/**
 * main.tsx — application entry point.
 *
 * Mounts the React app into the #root div defined in index.html.
 *
 * StrictMode is kept enabled intentionally — it double-invokes
 * certain lifecycle methods and effects in development to surface
 * potential issues early. It has no effect in production builds.
 *
 * The non-null assertion (!) on getElementById is safe here because
 * #root is guaranteed to exist in index.html.
 */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
