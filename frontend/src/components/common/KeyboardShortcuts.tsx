"use client";

import React, { useEffect } from "react";

interface KeyboardShortcutsProps {
  onCreate?: () => void;
  onRefresh?: () => void;
  onSearchFocus?: () => void;
  onEscape?: () => void;
}

export default function KeyboardShortcuts({
  onCreate,
  onRefresh,
  onSearchFocus,
  onEscape,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger hotkeys if user is actively typing in an input/textarea
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if (e.key === "Escape" && onEscape) {
        onEscape();
        return;
      }

      if (isInput) return;

      if (e.key.toLowerCase() === "c" && onCreate) {
        e.preventDefault();
        onCreate();
      } else if (e.key.toLowerCase() === "r" && onRefresh) {
        e.preventDefault();
        onRefresh();
      } else if (e.key === "/" && onSearchFocus) {
        e.preventDefault();
        onSearchFocus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCreate, onRefresh, onSearchFocus, onEscape]);

  return null;
}
