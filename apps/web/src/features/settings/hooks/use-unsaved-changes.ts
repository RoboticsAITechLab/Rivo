'use client';

import * as React from 'react';

export function useUnsavedChanges<T = any>(initialValues?: T) {
  const [currentValues, setCurrentValues] = React.useState<T>(initialValues || ({} as T));
  const [initialSnapshot, setInitialSnapshot] = React.useState<T>(initialValues || ({} as T));
  const [showUnsavedDialog, setShowUnsavedDialog] = React.useState(false);
  const [manualDirty, setManualDirty] = React.useState(false);
  const [pendingNavigation, setPendingNavigation] = React.useState<(() => void) | null>(null);

  const isDirty = React.useMemo(() => {
    if (manualDirty) return true;
    if (initialSnapshot === undefined || currentValues === undefined) return false;
    return JSON.stringify(currentValues) !== JSON.stringify(initialSnapshot);
  }, [currentValues, initialSnapshot, manualDirty]);

  const setIsDirty = React.useCallback((dirty: boolean) => {
    setManualDirty(dirty);
  }, []);

  const markSaved = React.useCallback((savedValues?: T) => {
    if (savedValues !== undefined) {
      setInitialSnapshot(savedValues);
      setCurrentValues(savedValues);
    } else {
      setInitialSnapshot(currentValues);
    }
    setManualDirty(false);
    setShowUnsavedDialog(false);
  }, [currentValues]);

  const resetForm = React.useCallback(() => {
    setCurrentValues(initialSnapshot);
    setManualDirty(false);
    setShowUnsavedDialog(false);
  }, [initialSnapshot]);

  const confirmNavigation = React.useCallback((action: () => void) => {
    if (isDirty) {
      setPendingNavigation(() => action);
      setShowUnsavedDialog(true);
    } else {
      action();
    }
  }, [isDirty]);

  const confirmLeave = React.useCallback(() => {
    setManualDirty(false);
    setShowUnsavedDialog(false);
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  }, [pendingNavigation]);

  const cancelLeave = React.useCallback(() => {
    setShowUnsavedDialog(false);
    setPendingNavigation(null);
  }, []);

  return {
    currentValues,
    setCurrentValues,
    isDirty,
    setIsDirty,
    markSaved,
    resetForm,
    showUnsavedDialog,
    setShowUnsavedDialog,
    showDialog: showUnsavedDialog,
    setShowDialog: setShowUnsavedDialog,
    confirmNavigation,
    pendingNavigation,
    confirmLeave,
    cancelLeave,
    onDiscard: confirmLeave,
    onContinueEditing: cancelLeave,
  };
}

