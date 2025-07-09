Here's an improved `SearchableSelect` React component, which automatically clears the input when clicked and includes enhanced scrolling behavior for better usability:

```tsx
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
        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            setHighlightedIndex((prev) => (prev + 1) % filteredOptions.length);
            break;
          case "ArrowUp":
            e.preventDefault();
            setHighlightedIndex(
              (prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length
            );
            break;
          case "Enter":
            e.preventDefault();
            if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
              handleSelect(filteredOptions[highlightedIndex].value);
            } else if (allowCustomValue && searchQuery) {
              handleSelect(searchQuery);
            }
            break;
          case "Escape":
            setOpen(false);
            break;
        }
      },
      [filteredOptions, highlightedIndex, handleSelect, allowCustomValue, searchQuery]
    );

    useEffect(() => {
      if (highlightedIndex >= 0) {
        optionRefs.current[highlightedIndex]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, [highlightedIndex]);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              ref={inputRef}
              value={searchQuery || selectedOption?.label || ""}
              onChange={handleInputChange}
              onClick={handleInputClick}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className={cn("pr-10", className)}
            />
            <div className="absolute inset-y-0 right-2 flex items-center">
              {clearable && value && (
                <Button variant="ghost" size="icon" className="h-6 w-6 p-0" onClick={handleClear}>
                  <X className="h-4 w-4" />
                </Button>
              )}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-1 max-h-60 overflow-auto">
          {loading ? (
            <div className="p-4 flex items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading...
            </div>
          ) : filteredOptions.length ? (
            filteredOptions.map((option, index) => (
              <div
                key={option.value}
                ref={(el) => (optionRefs.current[index] = el)}
                className={cn(
                  "flex items-center px-3 py-2 cursor-pointer rounded-sm",
                  highlightedIndex === index && "bg-accent",
                  option.disabled && "opacity-50 cursor-not-allowed"
                )}
                onMouseDown={() => !option.disabled && handleSelect(option.value)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
                {option.label}
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {allowCustomValue && searchQuery ? `Create \"${searchQuery}\"` : emptyText}
            </div>
          )}
        </PopoverContent>
      </Popover>
    );
  }
);

SearchableSelect.displayName = "SearchableSelect";
