'use client';

import { useState, useEffect } from 'react';

const PROJECT_ID_STORAGE_KEY = 'selectedProjectId';

export function useProject() {
  const [projectId, setProjectId] = useState<string | undefined>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(PROJECT_ID_STORAGE_KEY) || undefined;
    }
    return undefined;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedProjectId = localStorage.getItem(PROJECT_ID_STORAGE_KEY);
      if (storedProjectId) {
        setProjectId(storedProjectId);
      }
    }
  }, []);

  const handleSetProjectId = (newProjectId: string | undefined) => {
    setProjectId(newProjectId);
    if (typeof window !== 'undefined') {
      if (newProjectId) {
        localStorage.setItem(PROJECT_ID_STORAGE_KEY, newProjectId);
      } else {
        localStorage.removeItem(PROJECT_ID_STORAGE_KEY);
      }
    }
  };

  return { projectId, setProjectId: handleSetProjectId };
}
