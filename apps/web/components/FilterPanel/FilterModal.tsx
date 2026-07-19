'use client';

import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Loader2, Search } from 'lucide-react';

import { FilterConfig } from './FilterPanel';

interface FilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configs: FilterConfig[];
  values: Record<string, { value: string; label: string }[]>;
  onApply: (values: Record<string, { value: string; label: string }[]>) => void;
}

export function FilterModal({
  open,
  onOpenChange,
  configs,
  values,
  onApply,
}: FilterModalProps) {
  const [activeKey, setActiveKey] = useState<string>('');
  const [tempValues, setTempValues] = useState<
    Record<string, { value: string; label: string }[]>
  >({});

  // Search & async pagination state for current active filter
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [asyncOptions, setAsyncOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Set default active category
  useEffect(() => {
    const firstCfg = configs[0];
    if (firstCfg && !activeKey) {
      setActiveKey(firstCfg.key);
    }
  }, [configs, activeKey]);

  // Sync initial values when modal opens
  useEffect(() => {
    if (open) {
      setTempValues(values);
      setSearchText('');
      setDebouncedSearch('');
      const firstCfg = configs[0];
      if (firstCfg) {
        setActiveKey(firstCfg.key);
      }
    }
  }, [open, values, configs]);

  // Debounce search text
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchText]);

  const activeConfig = configs.find((c) => c.key === activeKey);

  // Load first page for async select when active key or search query changes
  useEffect(() => {
    if (!open || !activeConfig || activeConfig.type !== 'async-select') return;

    let isMounted = true;
    const fetchInitial = async () => {
      setIsLoading(true);
      try {
        const result = await activeConfig.loadOptions!(debouncedSearch, 1);
        if (isMounted) {
          setAsyncOptions(result.items);
          setHasMore(result.hasMore);
          setPage(1);
        }
      } catch (err) {
        console.error('Error loading filter options:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchInitial();
    return () => {
      isMounted = false;
    };
  }, [open, activeKey, debouncedSearch, activeConfig]);

  // Reset category search when switching categories
  const handleCategoryClick = (key: string) => {
    setActiveKey(key);
    setSearchText('');
    setDebouncedSearch('');
    setAsyncOptions([]);
    setHasMore(true);
    setPage(1);
  };

  // Load more async options (infinite scroll)
  const loadMore = async () => {
    if (isLoading || isLoadingMore || !hasMore || !activeConfig?.loadOptions)
      return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    try {
      const result = await activeConfig.loadOptions(debouncedSearch, nextPage);
      setAsyncOptions((prev) => {
        const existingIds = new Set(prev.map((o) => o.value));
        const filteredNew = result.items.filter(
          (item) => !existingIds.has(item.value),
        );
        return [...prev, ...filteredNew];
      });
      setHasMore(result.hasMore);
      setPage(nextPage);
    } catch (err) {
      console.error('Error loading more filter options:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 15) {
      void loadMore();
    }
  };

  // Toggle option selection
  const handleToggleOption = (option: { value: string; label: string }) => {
    setTempValues((prev) => {
      const currentList = prev[activeKey] || [];
      const exists = currentList.some((item) => item.value === option.value);
      const newList = exists
        ? currentList.filter((item) => item.value !== option.value)
        : [...currentList, option];
      return {
        ...prev,
        [activeKey]: newList,
      };
    });
  };

  const handleClearAll = () => {
    const cleared = configs.reduce<
      Record<string, { value: string; label: string }[]>
    >((acc, cfg) => {
      acc[cfg.key] = [];
      return acc;
    }, {});
    setTempValues(cleared);
  };

  const handleApply = () => {
    onApply(tempValues);
    onOpenChange(false);
  };

  // Compute displayed options for local selects vs. async selects
  const currentOptions = useMemo(() => {
    if (!activeConfig) return [];
    if (activeConfig.type === 'async-select') {
      return asyncOptions;
    }
    const cleanSearch = debouncedSearch.trim().toLowerCase();
    const opts = activeConfig.options || [];
    if (!cleanSearch) return opts;
    return opts.filter((opt) => opt.label.toLowerCase().includes(cleanSearch));
  }, [activeConfig, asyncOptions, debouncedSearch]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl sm:max-w-4xl w-full p-0 overflow-hidden flex flex-col rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-lg"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Filters</DialogTitle>
        <div className="flex flex-row h-[500px] min-h-[500px]">
          {/* Left Category Sidebar */}
          <div className="w-1/4 bg-zinc-50/50 dark:bg-zinc-900/10 border-r border-zinc-150 dark:border-zinc-900 flex flex-col py-3 overflow-y-auto">
            <span className="px-4 py-1.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider select-none">
              Filter by
            </span>
            <div className="flex flex-col mt-1 px-2 space-y-0.5">
              {configs.map((cfg) => {
                const isActive = cfg.key === activeKey;
                const count = tempValues[cfg.key]?.length || 0;
                return (
                  <button
                    key={cfg.key}
                    type="button"
                    onClick={() => handleCategoryClick(cfg.key)}
                    className={cn(
                      'flex items-center justify-between w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer focus:outline-hidden',
                      isActive
                        ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 border-l-2 border-primary pl-2.5'
                        : 'text-zinc-650 hover:bg-zinc-100/50 dark:text-zinc-400 dark:hover:bg-zinc-900/50',
                    )}
                  >
                    <span className="truncate pr-1">{cfg.label}</span>
                    {count > 0 && (
                      <span className="h-4.5 min-w-4.5 px-1 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Options Area */}
          <div className="w-3/4 flex flex-col h-full bg-white dark:bg-zinc-950">
            {/* Search filter options */}
            <div className="flex items-center px-4 py-3 border-b border-zinc-150 dark:border-zinc-900">
              <Search className="h-4 w-4 text-zinc-400 mr-2.5 shrink-0" />
              <Input
                type="text"
                placeholder={`Search ${activeConfig?.label || 'options'}...`}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="h-8 border-none bg-transparent shadow-none px-0 text-xs focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            {/* Options List */}
            <div
              ref={containerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin"
            >
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
                  <Loader2 className="h-5 w-5 animate-spin text-primary mr-1" />
                  <span className="text-[10px] mt-1.5">Loading options...</span>
                </div>
              ) : currentOptions.length === 0 ? (
                <div className="py-16 text-center text-xs text-zinc-400 dark:text-zinc-500">
                  No options found.
                </div>
              ) : (
                <div className="space-y-1">
                  {currentOptions.map((opt) => {
                    const isChecked = (tempValues[activeKey] || []).some(
                      (item) => item.value === opt.value,
                    );
                    return (
                      <label
                        key={opt.value}
                        className={cn(
                          'flex items-center gap-2.5 w-full cursor-pointer select-none rounded-lg px-3 py-2 text-xs transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60',
                          isChecked && 'bg-zinc-50/50 dark:bg-zinc-900/20',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleOption(opt)}
                          className="h-3.5 w-3.5 rounded border-zinc-300 text-primary focus:ring-primary/20 dark:border-zinc-800 dark:bg-zinc-950"
                        />
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                          {opt.label}
                        </span>
                      </label>
                    );
                  })}

                  {isLoadingMore && (
                    <div className="flex items-center justify-center py-2 text-zinc-400">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="h-[60px] bg-zinc-50 dark:bg-zinc-900/40 border-t border-zinc-150 dark:border-zinc-900 px-4 py-3 flex items-center justify-between select-none">
          <Button
            variant="ghost"
            size="xs"
            onClick={handleClearAll}
            className="text-xs hover:bg-zinc-200/50 dark:hover:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 font-semibold"
          >
            Clear All
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              onClick={() => onOpenChange(false)}
              className="text-xs bg-white dark:bg-zinc-950 hover:bg-zinc-100 font-semibold"
            >
              Cancel
            </Button>
            <Button
              size="xs"
              onClick={handleApply}
              className="text-xs font-semibold px-4"
            >
              Apply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
