import React, { useState, useRef, useEffect, useCallback } from "react";
import { Check, ChevronDown, X, Loader2 } from "lucide-react";
import { cn } from "@/utils/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

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
  disabled?: boolean;
  className?: string;
  loading?: boolean;
  onSearch?: (query: string) => void;
  clearable?: boolean;
  allowCustomValue?: boolean;
}

export const SearchableSelect = React.forwardRef<
  HTMLInputElement,
  SearchableSelectProps
>(
  (
    {
      options = [],
      value,
      onValueChange,
      placeholder = "Select an option...",
      emptyText = "No options found",
      disabled = false,
      className,
      loading = false,
      onSearch,
      clearable = false,
      allowCustomValue = false,
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const inputRef = useRef<HTMLInputElement>(null);
    const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

    const selectedOption = options.find((opt) => opt.value === value);

    const filteredOptions = options.filter((option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
      if (onSearch && searchQuery) {
        const timeout = setTimeout(() => onSearch(searchQuery), 300);
        return () => clearTimeout(timeout);
      }
    }, [searchQuery, onSearch]);

    const handleSelect = useCallback(
      (selectedValue: string) => {
        onValueChange?.(selectedValue);
        setSearchQuery("");
        setOpen(false);
        setHighlightedIndex(-1);
      },
      [onValueChange]
    );

    const handleClear = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        handleSelect("");
      },
      [handleSelect]
    );

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
      if (!open) setOpen(true);
    }, [open]);

    const handleInputClick = useCallback(() => {
      setSearchQuery("");
      setOpen(true);
    }, []);

    const handleBlur = useCallback(() => {
      setTimeout(() => setOpen(false), 200);
    }, []);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (!open) {
          if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
          }
          return;
        }

        switch (e.key) {
          case "Escape":
            e.preventDefault();
            setOpen(false);
            setSearchQuery("");
            setHighlightedIndex(-1);
            break;
          case "Enter":
            e.preventDefault();
            if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
              handleSelect(filteredOptions[highlightedIndex].value);
            } else if (allowCustomValue && searchQuery.trim()) {
              handleSelect(searchQuery.trim());
            }
            break;
          case "ArrowDown":
            e.preventDefault();
            setHighlightedIndex((prev) => 
              prev < filteredOptions.length - 1 ? prev + 1 : 0
            );
            break;
          case "ArrowUp":
            e.preventDefault();
            setHighlightedIndex((prev) => 
              prev > 0 ? prev - 1 : filteredOptions.length - 1
            );
            break;
        }
      },
      [open, highlightedIndex, filteredOptions, handleSelect, allowCustomValue, searchQuery]
    );

    useEffect(() => {
      if (highlightedIndex >= 0 && optionRefs.current[highlightedIndex]) {
        optionRefs.current[highlightedIndex]?.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }, [highlightedIndex]);

    const displayValue = searchQuery || selectedOption?.label || "";

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              !value && "text-muted-foreground",
              className
            )}
            disabled={disabled}
          >
            <Input
              ref={inputRef}
              value={displayValue}
              onChange={handleInputChange}
              onClick={handleInputClick}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              placeholder={placeholder}
              className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={disabled}
            />
            <div className="flex items-center gap-1">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {clearable && value && (
                <X
                  className="h-4 w-4 opacity-50 hover:opacity-80 cursor-pointer"
                  onClick={handleClear}
                />
              )}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <div className="max-h-60 overflow-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                {loading ? "Loading..." : emptyText}
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <div
                  key={option.value}
                  ref={(el) => (optionRefs.current[index] = el)}
                  className={cn(
                    "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                    option.disabled
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer hover:bg-accent hover:text-accent-foreground",
                    highlightedIndex === index && "bg-accent text-accent-foreground",
                    value === option.value && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => !option.disabled && handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </div>
              ))
            )}
            {allowCustomValue && searchQuery.trim() && !filteredOptions.some(opt => opt.value === searchQuery.trim()) && (
              <div
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                  highlightedIndex === filteredOptions.length && "bg-accent text-accent-foreground"
                )}
                onClick={() => handleSelect(searchQuery.trim())}
              >
                <Check className="mr-2 h-4 w-4 opacity-0" />
                Create "{searchQuery.trim()}"
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);

SearchableSelect.displayName = "SearchableSelect";