"use client";

import { usePathname } from "next/navigation";
import AuthProvider from "@/components/AuthProvider";
import ThemeProvider from "@/components/ThemeProvider";
import ModalProvider from "@/components/ModalProvider";
import { SocketProvider } from "./SocketProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Don't run AuthProvider on root, login, or other auth pages
  const shouldSkipAuth =
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/funder-selection");

  return (
    <ThemeProvider>
      <SocketProvider>
        {shouldSkipAuth ? (
          <ModalProvider>{children}</ModalProvider>
        ) : (
          <AuthProvider>
            <ModalProvider>{children}</ModalProvider>
          </AuthProvider>
        )}
      </SocketProvider>
    </ThemeProvider>
  );
}
