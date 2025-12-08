"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";

export default function HeaderWrapper() {
  const pathname = usePathname();

  // Si la ruta comienza con "/admin", no mostramos nada
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  // Si no es admin, mostramos el Header normal
  return <Header />;
}