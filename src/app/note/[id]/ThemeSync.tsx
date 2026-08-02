"use client";

import { useEffect } from "react";

export default function ThemeSync({ theme }: { theme: string }) {
  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  return null;
}
