'use client';

import * as React from 'react';

export function useUnsavedChanges<T = any>(initialValues?: T) {
  const [currentValues, setCurrentValues] = React.useState<T>(initialValues || ({} as T));
  const [initialSnapshot, setInitialSnapshot] = React.useState<T>(initialValues || ({} as T));
  const [showUnsavedDialog, setShowUnsavedDialog] = React.useState(false);
  const [manualDirty, setManualDirty] = React.useState(false);
  const [pendingNavigation, setPendingNavigation] = React.useState<(() => void) | null>(null);

  const prevInitialRef = React.useRef(initialValues);
  if (initialValues && initialValues !== prevInitialRef.current) {
    prevInitialRef.current = initialValues;
    setInitialSnapshot(initialValues);
    setCurrentValues(initialValues);
  }

  const isDirty = React.useMemo(() => {
    if (manualDirty) return true;
    if (!initialValues) return manualDirty;
    return JSON.stringify(currentValues) !== JSON.stringify(initialSnapshot);
  }, [currentValues, initialSnapshot, manualDirty, initialValues]);

  const setIsDirty = (dirty: boolean) => {
    setManualDirty(dirty);
  };

  const markSaved = (savedValues?: T) => {
    if (savedValues !== undefined) {
      setInitialSnapshot(savedValues);
      setCurrentValues(savedValues);
    }
    setManualDirty(false);
    setShowUnsavedDialog(false);
  };

  const resetForm = () => {
    setCurrentValues(initialSnapshot);
    setManualDirty(false);
    setShowUnsavedDialog(false);
  };

  const confirmNavigation = (action: () => void) => {
    if (isDirty) {
      setPendingNavigation(() => action);
      setShowUnsavedDialog(true);
    } else {
      action();
    }
  };

  const confirmLeave = () => {
    setManualDirty(false);
    setShowUnsavedDialog(false);
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  };

  const cancelLeave = () => {
    setShowUnsavedDialog(false);
    setPendingNavigation(null);
  };

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
