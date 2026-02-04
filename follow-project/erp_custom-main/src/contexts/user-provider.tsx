/* eslint-disable @typescript-eslint/no-explicit-any */

import { createContext, useContext, useState, type ReactNode } from "react";
import useDialogState from "../hooks/use-dialog-state";

// Define the types for context state
interface UsersContextType {
  open: string| boolean | null;
  setOpen: (value: boolean | null) => void;
  currentRow: any | null; // Replace `any` with your row type if known
  setCurrentRow: (row: any | null) => void;
}

// Define props for the provider
interface UsersProviderProps {
  children: ReactNode;
}

// Create the context with default value as null
const UsersContext = createContext<UsersContextType | null>(null);

export function UsersProvider({ children }: UsersProviderProps) {
  const [open, setOpen] = useDialogState(null);
  const [currentRow, setCurrentRow] = useState<any | null>(null);

  return (
    <UsersContext.Provider value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </UsersContext.Provider>
  );
}

// Custom hook to use the context
// eslint-disable-next-line react-refresh/only-export-components
export const useUsers = (): UsersContextType => {
  const usersContext = useContext(UsersContext);

  if (!usersContext) {
    throw new Error("useUsers must be used within a <UsersProvider>");
  }

  return usersContext;
};
