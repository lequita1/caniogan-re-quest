import { createContext, useContext } from "react";

export const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth requires AuthProvider");
  return context;
}

export function homeFor(account) {
  if (account?.role === "staff") return "/staff";
  if (account?.role === "captain") return "/captain";
  return "/resident";
}
