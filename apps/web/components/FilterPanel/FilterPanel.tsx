'use client';

import * as React from 'react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  SavedFilter,
  useCreateSavedFilter,
  useDeleteSavedFilter,
  useSavedFilters,
} from '@/services/api/requests/saved-filters';
import {
  Bookmark,
  Check,
  ChevronDown,
  ListFilter,
  Loader2,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { FilterModal } from './FilterModal';

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'async-select';
  options?: { value: string; label: string }[];
  loadOptions?: (
    search: string,
    page: number,
  ) => Promise<{ items: { value: string; label: string }[]; hasMore: boolean }>;
  placeholder?: string;
}

export interface FilterPanelProps {
  feature: string;
  configs: FilterConfig[];
  values: Record<string, { value: string; label: string }[]>;
  onChange: (
    values: Record<string, { value: string; label: string }[]>,
  ) => void;
}

export function FilterPanel({
  feature,
  configs,
  values,
  onChange,
}: FilterPanelProps) {
  const { data: savedFilters = [] } = useSavedFilters(feature);
  const { mutateAsync: createFilter, isPending: isSaving } =
    useCreateSavedFilter();
  const { mutateAsync: deleteFilter } = useDeleteSavedFilter();

  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);
  const [isNaming, setIsNaming] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Find currently active saved filter by comparing values
  const activeSavedFilter = useMemo(() => {
    return savedFilters.find((f) => {
      return configs.every((cfg) => {
        const currentVals = (values[cfg.key] || []).map((x) => x.value).sort();
        const savedRaw = f.filters[cfg.key] || [];
        const savedVals = (Array.isArray(savedRaw) ? savedRaw : [savedRaw])
          .map((x: any) => x?.value)
          .filter(Boolean)
          .sort();
        return (
          currentVals.length === savedVals.length &&
          currentVals.every((val, idx) => val === savedVals[idx])
        );
      });
    });
  }, [savedFilters, configs, values]);

  // Update activeFilterId based on matches
  React.useEffect(() => {
    if (activeSavedFilter) {
      setActiveFilterId(activeSavedFilter.id);
    } else {
      setActiveFilterId(null);
    }
  }, [activeSavedFilter]);

  // Determine if filter values differ from empty state (or active saved filter state)
  const hasChanges = useMemo(() => {
    const baseState = activeSavedFilter
      ? activeSavedFilter.filters
      : configs.reduce<Record<string, []>>((acc, cfg) => {
          acc[cfg.key] = [];
          return acc;
        }, {});

    return configs.some((cfg) => {
      const currentVals = (values[cfg.key] || []).map((x) => x.value).sort();
      const baseRaw = baseState[cfg.key] || [];
      const baseVals = (Array.isArray(baseRaw) ? baseRaw : [baseRaw])
        .map((x: any) => x?.value)
        .filter(Boolean)
        .sort();
      return (
        currentVals.length !== baseVals.length ||
        !currentVals.every((val, idx) => val === baseVals[idx])
      );
    });
  }, [configs, values, activeSavedFilter]);

  // Count how many active filters are selected
  const activeCount = useMemo(() => {
    return configs.reduce((count, cfg) => {
      return count + (values[cfg.key]?.length || 0);
    }, 0);
  }, [configs, values]);

  const handleCancel = () => {
    setIsNaming(false);
    setNewFilterName('');
    if (activeSavedFilter) {
      onChange(activeSavedFilter.filters);
    } else {
      const emptyState = configs.reduce<Record<string, []>>((acc, cfg) => {
        acc[cfg.key] = [];
        return acc;
      }, {});
      onChange(emptyState);
    }
  };

  const handleSaveClick = () => {
    setIsNaming(true);
    setNewFilterName('');
  };

  const handleConfirmSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newFilterName.trim()) {
      toast.error('Please enter a filter name.');
      return;
    }

    try {
      const result = await createFilter({
        name: newFilterName.trim(),
        feature,
        filters: values,
      });
      toast.success(`Filter "${result.name}" saved successfully.`);
      setActiveFilterId(result.id);
      setIsNaming(false);
      setNewFilterName('');
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save filter.';
      toast.error(errMsg);
    }
  };

  const handleDeleteFilter = async (
    id: string,
    name: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    try {
      await deleteFilter({ id, feature });
      toast.success(`Filter "${name}" deleted.`);
      if (activeFilterId === id) {
        setActiveFilterId(null);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete filter.');
    }
  };

  const handleSelectSavedFilter = (filter: SavedFilter) => {
    onChange(filter.filters);
    setActiveFilterId(filter.id);
    setIsNaming(false);
  };

  const currentActiveName = savedFilters.find(
    (f) => f.id === activeFilterId,
  )?.name;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-start rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 shadow-xs select-none">
      <div className="flex flex-wrap items-center gap-2">
        {/* Main Filter Button - opens the FilterModal */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className={cn(
            'h-9 gap-2 text-xs font-semibold cursor-pointer border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900',
            activeCount > 0 &&
              'border-primary/50 bg-primary/5 hover:bg-primary/10 text-primary dark:border-primary/50 dark:bg-primary/10 dark:text-primary',
          )}
        >
          <ListFilter className="h-4 w-4" />
          <span>Filter{activeCount > 0 ? ` (${activeCount})` : ''}</span>
        </Button>

        {/* Saved Filters Dropdown - Only show if saved filters exist */}
        {savedFilters.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <Bookmark className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                <span className="max-w-[120px] truncate text-xs font-semibold">
                  {currentActiveName
                    ? `Saved: ${currentActiveName}`
                    : 'Saved Filter'}
                </span>
                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-56 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800"
            >
              <div className="px-2 py-1.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Your Saved Filters
              </div>
              {savedFilters.map((f) => (
                <DropdownMenuItem
                  key={f.id}
                  onClick={() => handleSelectSavedFilter(f)}
                  className="flex items-center justify-between cursor-pointer group text-xs py-1.5"
                >
                  <span className="truncate pr-2 font-medium">{f.name}</span>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteFilter(f.id, f.name, e)}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-500 p-0.5 rounded-sm transition-opacity"
                    title="Delete saved filter"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Save / Cancel controls */}
      <div className="flex items-center gap-2 shrink-0 justify-start select-none">
        {hasChanges && (
          <>
            {isNaming ? (
              <form
                onSubmit={handleConfirmSave}
                className="flex items-center gap-1.5"
              >
                <Input
                  autoFocus
                  placeholder="Filter name..."
                  value={newFilterName}
                  onChange={(e) => setNewFilterName(e.target.value)}
                  className="h-8 w-40 text-xs px-2"
                  disabled={isSaving}
                />
                <Button
                  size="icon-sm"
                  type="submit"
                  disabled={isSaving || !newFilterName.trim()}
                  className="h-8 w-8"
                  title="Save Filter"
                >
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  type="button"
                  onClick={() => setIsNaming(false)}
                  disabled={isSaving}
                  className="h-8 w-8"
                  title="Back"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </form>
            ) : (
              <div className="flex items-center gap-1.5">
                <Button
                  size="xs"
                  onClick={handleSaveClick}
                  className="h-8 px-3 text-xs"
                >
                  Save
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={handleCancel}
                  className="h-8 px-3 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  Cancel
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Filter Modal Dialog */}
      <FilterModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        configs={configs}
        values={values}
        onApply={onChange}
      />
    </div>
  );
}
