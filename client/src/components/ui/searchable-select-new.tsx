import React, { useState, useRef, useEffect, useCallback } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/utils/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  searchPlaceholder?: string;
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
>(({
  options = [],
  value,
  onValueChange,
  placeholder = "Select an option...",
  emptyText = "No options found",
  searchPlaceholder = "Search...",
  disabled = false,
  className,
  loading = false,
  onSearch,
  clearable = false,
  allowCustomValue = false,
}, ref) => {
  // State Management
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isTyping, setIsTyping] = useState(false);
  
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Find selected option
  const selectedOption = options.find(opt => String(opt.value) === String(value));

  // Filter options based on search
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Display value logic
  const displayValue = isTyping ? searchQuery : (selectedOption?.label || "");

  // Update search query when external search is provided
  useEffect(() => {
    if (onSearch && searchQuery) {
      const timeoutId = setTimeout(() => onSearch(searchQuery), 300);
      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [searchQuery, onSearch]);

  // Handle option selection
  const handleSelect = useCallback((selectedValue: string) => {
    const option = filteredOptions.find(opt => opt.value === selectedValue);
    onValueChange?.(selectedValue);
    setSearchQuery("");
    setIsTyping(false);
    setOpen(false);
    setHighlightedIndex(-1);
  }, [filteredOptions, onValueChange]);

  // Handle clear
  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange?.("");
    setSearchQuery("");
    setIsTyping(false);
    setHighlightedIndex(-1);
  }, [onValueChange]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setIsTyping(true);
    setHighlightedIndex(-1);
    
    if (!open) {
      setOpen(true);
    }
  }, [open]);

  // Handle input focus
  const handleInputFocus = useCallback(() => {
    setOpen(true);
    setIsTyping(true);
  }, []);

  // Handle input blur
  const handleInputBlur = useCallback(() => {
    // Small delay to allow for option selection
    setTimeout(() => {
      setOpen(false);
      setIsTyping(false);
    }, 150);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!open) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[highlightedIndex].value);
        } else if (allowCustomValue && searchQuery) {
          handleSelect(searchQuery);
        }
        break;
      
      case "Escape":
        e.preventDefault();
        setOpen(false);
        setIsTyping(false);
        setHighlightedIndex(-1);
        break;
      
      case "Tab":
        setOpen(false);
        setIsTyping(false);
        break;
    }
  }, [open, highlightedIndex, filteredOptions, handleSelect, allowCustomValue, searchQuery]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && optionRefs.current[highlightedIndex]) {
      optionRefs.current[highlightedIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth"
      });
    }
  }, [highlightedIndex]);

  // Handle option click
  const handleOptionClick = useCallback((optionValue: string, index: number) => {
    setHighlightedIndex(index);
    handleSelect(optionValue);
  }, [handleSelect]);

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              ref={inputRef}
              value={displayValue}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className={cn("pr-16", className)}
            />
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
              {clearable && value && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  onClick={handleClear}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </div>
          </div>
        </PopoverTrigger>
        
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <div ref={listRef} className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {allowCustomValue && searchQuery ? (
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => handleSelect(searchQuery)}
                  >
                    Create "{searchQuery}"
                  </Button>
                ) : (
                  emptyText
                )}
              </div>
            ) : (
              <div className="p-1">
                {filteredOptions.map((option, index) => (
                  <div
                    key={option.value}
                    ref={el => optionRefs.current[index] = el}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md cursor-pointer text-sm",
                      "hover:bg-accent hover:text-accent-foreground",
                      highlightedIndex === index && "bg-accent text-accent-foreground",
                      option.disabled && "opacity-50 cursor-not-allowed",
                      value === option.value && "bg-accent/50"
                    )}
                    onClick={() => !option.disabled && handleOptionClick(option.value, index)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{option.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
});

SearchableSelect.displayName = "SearchableSelect";