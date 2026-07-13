'use client';

import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { Popover as PopoverPrimitive } from 'radix-ui';

export interface SearchableSelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface SearchableSelectProps extends Omit<
  React.ComponentPropsWithoutRef<'select'>,
  'onChange'
> {
  options: SearchableSelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?:
    | ((value: string) => void)
    | ((event: {
        target: { name: string; value: string };
        currentTarget: { name: string; value: string };
      }) => void);
  placeholder?: string;
  emptyMessage?: string;
  debounceMs?: number;
  limitDefaultOptions?: boolean;
}

const SearchableSelect = React.forwardRef<
  HTMLSelectElement,
  SearchableSelectProps
>(
  (
    {
      options = [],
      value: controlledValue,
      defaultValue,
      onChange,
      placeholder = 'Select...',
      emptyMessage = 'No results found.',
      debounceMs = 300,
      limitDefaultOptions = true,
      className,
      disabled,
      id,
      name,
      ...props
    },
    forwardedRef,
  ) => {
    const [open, setOpen] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Internal state to keep track of selected option
    const [selectedValue, setSelectedValue] = useState<string>(
      controlledValue ?? defaultValue ?? '',
    );

    // Sync state when controlled value changes
    useEffect(() => {
      if (controlledValue !== undefined) {
        setSelectedValue(controlledValue);
      }
    }, [controlledValue]);

    // Handle search input debounce
    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedSearch(searchText);
      }, debounceMs);

      return () => {
        clearTimeout(handler);
      };
    }, [searchText, debounceMs]);

    const selectRef = useRef<HTMLSelectElement>(null);

    // Share ref with react-hook-form / consumer forwardedRef
    React.useImperativeHandle(forwardedRef, () => selectRef.current!);

    // Handle external change events on the native element (e.g. form reset)
    useEffect(() => {
      const selectEl = selectRef.current;
      if (!selectEl) return;

      const handleNativeChange = (e: Event) => {
        const val = (e.target as HTMLSelectElement).value;
        setSelectedValue(val);
      };

      selectEl.addEventListener('change', handleNativeChange);
      return () => {
        selectEl.removeEventListener('change', handleNativeChange);
      };
    }, []);

    // Reset search when dropdown opens/closes
    useEffect(() => {
      if (!open) {
        setSearchText('');
        setDebouncedSearch('');
      }
    }, [open]);

    // Update the native select and trigger DOM change events
    const updateValue = (val: string) => {
      setSelectedValue(val);

      if (selectRef.current) {
        const selectEl = selectRef.current;

        // Get the prototype value setter to bypass React's wrapper setter
        const prototype = Object.getPrototypeOf(selectEl);
        const valueSetter = Object.getOwnPropertyDescriptor(
          prototype,
          'value',
        )?.set;

        if (valueSetter) {
          valueSetter.call(selectEl, val);
        } else {
          selectEl.value = val;
        }

        // Trigger change and input events so react-hook-form registers it
        const changeEvent = new Event('change', { bubbles: true });
        selectEl.dispatchEvent(changeEvent);

        const inputEvent = new Event('input', { bubbles: true });
        selectEl.dispatchEvent(inputEvent);
      }

      if (onChange) {
        if (name) {
          // If name is present, it's likely a react-hook-form register spread
          const eventHandler = onChange as (event: {
            target: { name: string; value: string };
            currentTarget: { name: string; value: string };
          }) => void;
          eventHandler({
            target: { name, value: val },
            currentTarget: { name, value: val },
          });
        } else {
          // Otherwise, it's a standard controlled component state setter
          const valueHandler = onChange as (value: string) => void;
          valueHandler(val);
        }
      }
    };

    // Calculate options to display
    const filteredOptions = useMemo(() => {
      const cleanedSearch = debouncedSearch.trim().toLowerCase();
      if (!cleanedSearch) {
        // Only show top 6 options by default if limitDefaultOptions is true
        return limitDefaultOptions ? options.slice(0, 6) : options;
      }
      return options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(cleanedSearch) ||
          opt.description?.toLowerCase().includes(cleanedSearch),
      );
    }, [options, debouncedSearch, limitDefaultOptions]);

    // Find the currently selected option to display its label
    const selectedOption = useMemo(() => {
      return options.find((opt) => opt.value === selectedValue);
    }, [options, selectedValue]);

    return (
      <div className="relative w-full">
        {/* Hidden native select for standard HTML form & react-hook-form validation */}
        <select
          ref={selectRef}
          name={name}
          id={id}
          value={selectedValue}
          onChange={() => {}} // React warning bypass (controlled by value + dispatchEvent)
          className="sr-only"
          disabled={disabled}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
          <PopoverPrimitive.Trigger asChild>
            <button
              type="button"
              disabled={disabled}
              className={cn(
                'flex h-9 w-full items-center justify-between rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-xs transition-colors outline-none select-none focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 text-left',
                !selectedValue && 'text-muted-foreground',
                className,
              )}
            >
              <span className="truncate">
                {selectedOption ? selectedOption.label : placeholder}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </button>
          </PopoverPrimitive.Trigger>

          <PopoverPrimitive.Portal>
            <PopoverPrimitive.Content
              align="start"
              sideOffset={4}
              className="z-50 w-(--radix-popover-trigger-width) min-w-[240px] overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:overflow-hidden data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 animate-none relative bg-popover/80 before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:rounded-[inherit] before:backdrop-blur-2xl before:backdrop-saturate-150"
            >
              <div className="flex items-center border-b border-foreground/10 px-3 py-2 bg-muted/10">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <input
                  type="text"
                  placeholder="Search options..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="flex h-7 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="max-h-[220px] overflow-y-auto p-1">
                {filteredOptions.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    {emptyMessage}
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {filteredOptions.map((option) => {
                      const isSelected = selectedValue === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            updateValue(option.value);
                            setOpen(false);
                          }}
                          className={cn(
                            'relative flex w-full cursor-pointer select-none items-center rounded-md py-1.5 pl-8 pr-2 text-sm outline-hidden hover:bg-foreground/10 text-left transition-colors',
                            isSelected && 'font-medium bg-foreground/5',
                          )}
                        >
                          <span className="absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center">
                            {isSelected && <Check className="h-3.5 w-3.5" />}
                          </span>
                          <div className="flex flex-col">
                            <span className="truncate">{option.label}</span>
                            {option.description && (
                              <span className="text-[10px] text-muted-foreground/80 font-normal mt-0.5">
                                {option.description}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {!searchText && options.length > 6 && limitDefaultOptions && (
                <div className="px-3 py-2 text-center text-[10px] text-muted-foreground/80 border-t border-foreground/10 bg-muted/5 font-medium">
                  + {options.length - 6} more options. Type to search...
                </div>
              )}
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
      </div>
    );
  },
);

SearchableSelect.displayName = 'SearchableSelect';

export { SearchableSelect };
