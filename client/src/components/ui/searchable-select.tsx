import React, { useState, useRef, useEffect, useCallback } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/utils/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";

export interface SearchableSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  loading?: boolean;
  onSearch?: (query: string) => void;
  clearable?: boolean;
  allowCustomValue?: boolean;
  autoFocus?: boolean;
  name?: string;
  id?: string;
}

export const SearchableSelect = React.forwardRef<
  HTMLInputElement,
  SearchableSelectProps
>(({
  options = [],
  value,
  onValueChange,
  placeholder = "Select option...",
  emptyText = "No options found",
  searchPlaceholder = "Search options...",
  disabled = false,
  className,
  loading = false,
  onSearch,
  clearable = false,
  allowCustomValue = false,
  autoFocus = false,
  name,
  id,
}, ref) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Keep track of which item is highlighted for keyboard nav
  const [highlightedIdx, setHighlightedIdx] = useState<number | null>(null);

  // Reset search query on dropdown open/close
  useEffect(() => {
    if (open) {
      const sel = options.find(opt => String(opt.value) === String(value));
      setSearchQuery(sel?.label ?? "");
      setHighlightedIdx(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setHighlightedIdx(null);
    }
    // eslint-disable-next-line
  }, [open]);

  useEffect(() => {
    const sel = options.find(opt => String(opt.value) === String(value));
    setSearchQuery(sel?.label ?? "");
    // eslint-disable-next-line
  }, [value, options]);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  // Move highlight up/down with keys
  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }

    if (filteredOptions.length === 0) return;

    if (e.key === "ArrowDown") {
      setHighlightedIdx((prev) => {
        if (prev === null || prev === filteredOptions.length - 1) return 0;
        return prev + 1;
      });
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setHighlightedIdx((prev) => {
        if (prev === null || prev === 0) return filteredOptions.length - 1;
        return prev - 1;
      });
      e.preventDefault();
    } else if (e.key === "Enter") {
      if (highlightedIdx !== null && filteredOptions[highlightedIdx]) {
        handleSelect(filteredOptions[highlightedIdx].value);
      }
      e.preventDefault();
    } else if (e.key === "Escape") {
      setOpen(false);
      e.stopPropagation();
    }
  }, [filteredOptions, open, highlightedIdx]);

  // Always refocus input after selection
  const handleSelect = useCallback((selectedValue: string) => {
    if (onValueChange) onValueChange(selectedValue);
    setOpen(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [onValueChange]);

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onValueChange) onValueChange("");
    setSearchQuery("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleCreateCustom = () => {
    if (allowCustomValue && searchQuery && onValueChange) {
      onValueChange(searchQuery);
      setOpen(false);
      setSearchQuery("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (onSearch) onSearch(query);
    setHighlightedIdx(null);
    if (!open) setOpen(true);
  };

  // Mouse hover for highlighting
  const handleMouseEnter = (idx: number) => setHighlightedIdx(idx);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            ref={inputRef}
            autoFocus={autoFocus}
            id={id}
            name={name}
            role="combobox"
            aria-controls={open ? "searchable-select-listbox" : undefined}
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-activedescendant={highlightedIdx !== null && filteredOptions[highlightedIdx]
              ? `option-${filteredOptions[highlightedIdx].value}`
              : undefined}
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={handleInputKeyDown}
            className={cn("w-full pr-16", className)}
            disabled={disabled}
            tabIndex={0}
            autoComplete="off"
            spellCheck={false}
          />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {clearable && value && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                onClick={handleClear}
                tabIndex={-1}
                aria-label="Clear selection"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="z-[9999] w-full p-0" align="start" side="bottom">
        <Command shouldFilter={false} id="searchable-select-listbox" role="listbox" className="pointer-events-auto">
          <CommandList ref={listRef} className="pointer-events-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading...
              </div>
            ) : filteredOptions.length === 0 ? (
              <CommandEmpty>
                {allowCustomValue && searchQuery ? (
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={handleCreateCustom}
                  >
                    Create "{searchQuery}"
                  </Button>
                ) : (
                  emptyText
                )}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredOptions.map((option, i) => (
                  <button
                    key={option.value}
                    type="button"
                    id={`option-${option.value}`}
                    role="option"
                    tabIndex={-1}
                    disabled={option.disabled}
                    aria-selected={String(option.value) === String(value)}
                    onMouseEnter={() => handleMouseEnter(i)}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelect(option.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelect(option.value);
                      }
                    }}
                    className={cn(
                      "w-full text-left flex items-center px-3 py-2 text-sm",
                      "cursor-pointer hover:bg-accent hover:text-accent-foreground",
                      "focus:bg-accent focus:text-accent-foreground focus:outline-none",
                      "active:bg-accent disabled:opacity-50 disabled:cursor-not-allowed",
                      "transition-colors duration-150",
                      highlightedIdx === i && "bg-accent text-accent-foreground",
                      String(value) === String(option.value) && "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        String(value) === String(option.value) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{option.label}</span>
                  </button>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
});

SearchableSelect.displayName = "SearchableSelect";

export default SearchableSelect;