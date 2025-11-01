import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store";
import { DataProvider } from "./context/DataContext";
import { ToastProvider } from "./context/ToastContext";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <DataProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </DataProvider>
    </Provider>
  </StrictMode>
);
