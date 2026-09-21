'use client';

import * as React from 'react';
import { ALL_SETTINGS_NAV_ITEMS, SettingsNavItem } from '../config/settings-navigation';

export function useSettingsSearch(query: string): SettingsNavItem[] {
  return React.useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    return ALL_SETTINGS_NAV_ITEMS.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(trimmed);
      const matchDesc = item.description.toLowerCase().includes(trimmed);
      const matchCategory = item.category.toLowerCase().includes(trimmed);
      const matchKeywords = item.keywords.some((kw) => kw.toLowerCase().includes(trimmed));

      return matchTitle || matchDesc || matchCategory || matchKeywords;
    });
  }, [query]);
}
