/**
 * Slug Management Component for Admin Panel
 * Provides slug viewing, editing, and validation for admin resources
 */

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Check, Edit, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SlugManagementProps {
  currentSlug?: string;
  resourceName: string;
  onSlugChange: (newSlug: string) => void;
  onValidateSlug?: (slug: string) => Promise<boolean>;
  readOnly?: boolean;
}

export function SlugManagement({ 
  currentSlug, 
  resourceName, 
  onSlugChange, 
  onValidateSlug,
  readOnly = false 
}: SlugManagementProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(currentSlug || "");
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!editValue.trim()) {
      setValidationError("Slug cannot be empty");
      return;
    }

    // Basic slug validation
    const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugPattern.test(editValue)) {
      setValidationError("Slug must contain only lowercase letters, numbers, and hyphens");
      return;
    }

    if (onValidateSlug) {
      setIsValidating(true);
      try {
        const isValid = await onValidateSlug(editValue);
        if (!isValid) {
          setValidationError("This slug is already in use");
          setIsValidating(false);
          return;
        }
      } catch (error) {
        setValidationError("Failed to validate slug");
        setIsValidating(false);
        return;
      }
      setIsValidating(false);
    }

    setValidationError(null);
    onSlugChange(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(currentSlug || "");
    setValidationError(null);
    setIsEditing(false);
  };

  const generateSlugFromName = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">
          SEO Slug for {resourceName}
        </label>
        {currentSlug && (
          <Badge variant="outline" className="text-xs">
            /{currentSlug}
          </Badge>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={editValue}
              onChange={(e) => {
                setEditValue(e.target.value);
                setValidationError(null);
              }}
              placeholder="enter-slug-here"
              className="font-mono text-sm"
              disabled={isValidating}
            />
            <Button 
              size="sm" 
              onClick={handleSave}
              disabled={isValidating || !editValue.trim()}
            >
              {isValidating ? (
                <AlertCircle className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleCancel}
              disabled={isValidating}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {validationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}
          
          <div className="text-xs text-gray-500">
            Preview URL: /{editValue || "slug-preview"}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <code className="px-2 py-1 bg-gray-100 rounded text-sm">
            {currentSlug || "auto-generated"}
          </code>
          {!readOnly && (
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setIsEditing(true)}
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}

      {!currentSlug && !isEditing && (
        <div className="text-xs text-gray-500">
          Slug will be auto-generated from the {resourceName.toLowerCase()} name
        </div>
      )}
    </div>
  );
}