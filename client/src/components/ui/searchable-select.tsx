import React, { useState, useRef, useEffect, useCallback } from "react";
import { Check, ChevronDown, X, Loader2 } from "lucide-react";
import { cn } from "@/utils/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  HTMLButtonElement,
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
    const [searchValue, setSearchValue] = useState("");

    const selectedOption = options.find((opt) => opt.value === value);

    const handleSelect = useCallback(
      (selectedValue: string) => {
        if (selectedValue === value) {
          onValueChange?.("");
        } else {
          onValueChange?.(selectedValue);
        }
        setOpen(false);
        setSearchValue("");
      },
      [onValueChange, value]
    );

    const handleClear = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onValueChange?.("");
        setSearchValue("");
      },
      [onValueChange]
    );

    const handleOpenChange = useCallback((newOpen: boolean) => {
      setOpen(newOpen);
      if (!newOpen) {
        setSearchValue("");
      }
    }, []);

    useEffect(() => {
      if (onSearch) {
        const timeout = setTimeout(() => {
          onSearch(searchValue);
        }, 300);
        return () => clearTimeout(timeout);
      }
    }, [searchValue, onSearch]);

    return (
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
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
            <span className="truncate">
              {selectedOption?.label || placeholder}
            </span>
            <div className="flex items-center gap-1 ml-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
              {clearable && value && !disabled && (
                <X
                  className="h-4 w-4 opacity-50 hover:opacity-80 cursor-pointer shrink-0"
                  onClick={handleClear}
                />
              )}
              <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={`Search ${placeholder.toLowerCase()}...`}
              value={searchValue}
              onValueChange={setSearchValue}
              className="h-9"
            />
            <CommandList>
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <>
                  <CommandEmpty>{emptyText}</CommandEmpty>
                  <CommandGroup>
                    {options
                      .filter((option) =>
                        option.label.toLowerCase().includes(searchValue.toLowerCase())
                      )
                      .map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          disabled={option.disabled}
                          onSelect={() => handleSelect(option.value)}
                          className={cn(
                            "flex items-center gap-2 px-2 py-1.5",
                            option.disabled && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <Check
                            className={cn(
                              "h-4 w-4 shrink-0",
                              value === option.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className="truncate">{option.label}</span>
                        </CommandItem>
                      ))}
                    {allowCustomValue && 
                     searchValue.trim() && 
                     !options.some(opt => opt.value.toLowerCase() === searchValue.toLowerCase()) && (
                      <CommandItem
                        value={searchValue.trim()}
                        onSelect={() => handleSelect(searchValue.trim())}
                        className="flex items-center gap-2 px-2 py-1.5"
                      >
                        <Check className="h-4 w-4 shrink-0 opacity-0" />
                        <span className="truncate">
                          Create "{searchValue.trim()}"
                        </span>
                      </CommandItem>
                    )}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);

SearchableSelect.displayName = "SearchableSelect";