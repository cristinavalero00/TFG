import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/dm-serif-display/latin-400.css";
import "@fontsource/public-sans/latin-400.css";
import "@fontsource/public-sans/latin-500.css";
import "@fontsource/public-sans/latin-600.css";
import "./style.css";
import App from "./App";
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <main className="fatal-error">
        <h1>No se ha podido abrir Mise en Place</h1>
        <p>
          Recarga la página para volver a intentarlo. Los proyectos guardados no
          se han borrado.
        </p>
        <button className="button primary" onClick={() => location.reload()}>
          Recargar
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
