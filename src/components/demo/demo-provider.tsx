"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface DemoModeContextValue {
  isDemo: boolean;
  gateOpen: boolean;
  gateMessage: string;
  openGate: (message?: string) => void;
  closeGate: () => void;
}

const DemoModeContext = createContext<DemoModeContextValue>({
  isDemo: false,
  gateOpen: false,
  gateMessage: "",
  openGate: () => {},
  closeGate: () => {},
});

const DEFAULT_GATE =
  "Create your GemMint account to start building your own collection.";

export function DemoModeProvider({
  children,
  enabled = true,
}: {
  children: ReactNode;
  enabled?: boolean;
}) {
  const [gateOpen, setGateOpen] = useState(false);
  const [gateMessage, setGateMessage] = useState(DEFAULT_GATE);

  const openGate = useCallback((message?: string) => {
    setGateMessage(message?.trim() || DEFAULT_GATE);
    setGateOpen(true);
  }, []);

  const closeGate = useCallback(() => setGateOpen(false), []);

  const value = useMemo(
    () => ({
      isDemo: enabled,
      gateOpen,
      gateMessage,
      openGate,
      closeGate,
    }),
    [enabled, gateOpen, gateMessage, openGate, closeGate]
  );

  return (
    <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  return useContext(DemoModeContext);
}
