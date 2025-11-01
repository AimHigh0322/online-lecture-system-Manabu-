import { createContext } from "react";
import type { ToastProps } from "../components/atom/Toast";

interface ToastContextType {
  showToast: (toast: Omit<ToastProps, "id">) => void;
  hideToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(
  undefined
);
