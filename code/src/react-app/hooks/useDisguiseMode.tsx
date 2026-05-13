import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface DisguiseModeContextType {
  isDisguised: boolean;
  unlock: () => void;
  lock: () => void;
}

const DisguiseModeContext = createContext<DisguiseModeContextType | undefined>(undefined);

/**
 * Controla o “modo calculadora” (UI disfarçada): estado persistido em `localStorage`.
 *
 * @param props.children - Árvore React a envolver.
 */
export function DisguiseModeProvider({ children }: { children: ReactNode }) {
  const [isDisguised, setIsDisguised] = useState(() => {
    try {
      const saved = localStorage.getItem("guardianAlertDisguised");
      return saved === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("guardianAlertDisguised", isDisguised.toString());
    } catch {
      // localStorage indisponível (ex.: modo privado restrito)
    }
  }, [isDisguised]);

  const unlock = () => setIsDisguised(false);
  const lock = () => setIsDisguised(true);

  return (
    <DisguiseModeContext.Provider value={{ isDisguised, unlock, lock }}>
      {children}
    </DisguiseModeContext.Provider>
  );
}

/**
 * Estado do modo disfarce: `isDisguised`, `unlock` e `lock`.
 *
 * @throws Se usado fora de `DisguiseModeProvider`.
 */
export function useDisguiseMode() {
  const context = useContext(DisguiseModeContext);
  if (!context) {
    throw new Error("useDisguiseMode must be used within DisguiseModeProvider");
  }
  return context;
}
