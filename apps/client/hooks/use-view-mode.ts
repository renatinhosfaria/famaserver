"use client";

import { useState, useEffect } from 'react';
import { ViewMode } from '@/types/view-mode';

const STORAGE_KEY = 'fama-view-mode';
const DEFAULT_MODE: ViewMode = 'details';
const VALID_MODES: ViewMode[] = ['grid', 'list', 'details', 'blocks'];

export function useViewMode() {
  const [viewMode, setViewMode] = useState<ViewMode>(DEFAULT_MODE);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ViewMode | null;
    if (saved && VALID_MODES.includes(saved)) {
      setViewMode(saved);
    }
  }, []);

  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  };

  return { viewMode, setViewMode: changeViewMode };
}
