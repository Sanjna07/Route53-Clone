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
      // Ignore if modifier keys (Ctrl, Cmd, Alt) are held down
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === "Escape") {
        if (onEscape) {
          onEscape();
        }
        return;
      }

      // Handle '/' for search focus
      if (e.key === "/") {
        const target = e.target as HTMLElement;
        const isInput =
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable;

        if (!isInput) {
          e.preventDefault();
          if (onSearchFocus) {
            onSearchFocus();
          } else {
            const searchInput = document.querySelector<HTMLInputElement>(
              'input[type="search"], input[placeholder*="Find"], input[placeholder*="search"]'
            );
            if (searchInput) {
              searchInput.focus();
              searchInput.select();
            }
          }
        }
        return;
      }

      // Don't trigger single-letter hotkeys (C, R) if user is actively typing in an input/textarea
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isInput) return;

      if (e.key.toLowerCase() === "c" && onCreate) {
        e.preventDefault();
        onCreate();
      } else if (e.key.toLowerCase() === "r" && onRefresh) {
        e.preventDefault();
        onRefresh();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [onCreate, onRefresh, onSearchFocus, onEscape]);

  return null;
}
