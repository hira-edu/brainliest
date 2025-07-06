import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CertificationIcons } from "@/assets/icons/certifications";
import { ChevronDown } from "lucide-react";

interface IconSelectorProps {
  selectedIcon: string;
  onSelect: (iconName: string) => void;
  className?: string;
}

export default function IconSelector({ selectedIcon, onSelect, className }: IconSelectorProps) {
  const [open, setOpen] = useState(false);

  const iconEntries = Object.entries(CertificationIcons);
  const selectedIconComponent = CertificationIcons[selectedIcon.toLowerCase()];

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-12"
          >
            <div className="flex items-center space-x-2">
              {selectedIconComponent ? (
                <>
                  {React.createElement(selectedIconComponent, { className: "w-6 h-6" })}
                  <span className="capitalize">{selectedIcon}</span>
                </>
              ) : (
                <span className="text-gray-500">Select an icon...</span>
              )}
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0">
          <div className="p-4">
            <h4 className="text-sm font-medium mb-3">Official Certification Icons</h4>
            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
              {iconEntries.map(([iconName, IconComponent]) => (
                <Button
                  key={iconName}
                  variant={selectedIcon.toLowerCase() === iconName ? "default" : "outline"}
                  className="h-16 flex flex-col items-center justify-center p-2"
                  onClick={() => {
                    onSelect(iconName);
                    setOpen(false);
                  }}
                >
                  <IconComponent className="w-8 h-8 mb-1" />
                  <span className="text-xs capitalize truncate w-full text-center">
                    {iconName}
                  </span>
                </Button>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <h5 className="text-xs font-medium text-gray-600 mb-2">Or use FontAwesome icon</h5>
              <div className="text-xs text-gray-500">
                Enter FontAwesome class names like: <Badge variant="outline" className="text-xs">fas fa-star</Badge>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}