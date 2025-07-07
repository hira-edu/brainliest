import React, { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

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
  HTMLButtonElement,
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
}, ref) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(() => {
    // Initialize with the selected option's label if there's a value
    const selectedOption = options.find(opt => String(opt.value) === String(value));
    return selectedOption?.label || "";
  });
  const inputRef = useRef<HTMLInputElement>(null);

  // Find the selected option - use String coercion for robust matching
  const selectedOption = options.find((option) => 
    String(option.value) === String(value)
  );

  // Filter options based on search query
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle search input change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  // Handle option selection
  const handleSelect = (selectedValue: string) => {
    console.log("SearchableSelect - Option selected:", selectedValue);
    const selectedOption = filteredOptions.find(opt => opt.value === selectedValue);
    
    if (onValueChange) {
      onValueChange(selectedValue);
    }
    setOpen(false);
    // Set the input to show the selected label
    setSearchQuery(selectedOption?.label || "");
  };

  // Handle clear selection
  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onValueChange) {
      onValueChange("");
    }
    setSearchQuery("");
  };

  // Handle custom value creation
  const handleCreateCustom = () => {
    if (allowCustomValue && searchQuery && onValueChange) {
      onValueChange(searchQuery);
      setOpen(false);
      setSearchQuery("");
    }
  };

  // Auto-focus search input when popover opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            ref={inputRef}
            placeholder={selectedOption ? selectedOption.label : placeholder}
            value={searchQuery}
            onChange={(e) => {
              handleSearchChange(e.target.value);
              if (!open) setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className={cn(
              "w-full pr-16",
              className
            )}
            disabled={disabled}
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
      <PopoverContent 
        className="w-full p-0" 
        align="start"
      >
        <Command 
          shouldFilter={false}
          onKeyDown={(e) => {
            // Prevent Command from handling arrow keys and enter when input is focused
            if (inputRef.current === document.activeElement) {
              e.stopPropagation();
            }
          }}
        >
          <CommandList>
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
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(selectedValue) => {
                      handleSelect(selectedValue);
                    }}
                    disabled={option.disabled}
                    className="cursor-pointer hover:bg-accent"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{option.label}</span>
                  </CommandItem>
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