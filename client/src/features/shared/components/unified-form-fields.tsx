/**
 * Unified form field components - DRY solution for repeated form patterns
 */
import { useState } from "react";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Button } from "../../../components/ui/button";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";

export interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Base form field with consistent styling and error handling
 */
export function FormField({
  label,
  value,
  onChange,
  error,
  placeholder,
  required,
  disabled,
  className,
  ...props
}: FormFieldProps & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={label.toLowerCase().replace(/\s+/g, '-')}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id={label.toLowerCase().replace(/\s+/g, '-')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={error ? "border-red-500 focus:border-red-500" : ""}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Email field with built-in validation and icon
 */
export function EmailField({
  label = "Email",
  placeholder = "Enter your email address",
  ...props
}: Omit<FormFieldProps, 'type'> & any) {
  return (
    <div className="relative">
      <FormField
        label={label}
        type="email"
        placeholder={placeholder}
        {...props}
      />
      <Mail className="absolute right-3 top-9 h-4 w-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

/**
 * Password field with show/hide toggle
 */
export interface PasswordFieldProps extends Omit<FormFieldProps, 'type'> {
  showPasswordToggle?: boolean;
  autoComplete?: string;
}

export function PasswordField({
  label = "Password",
  placeholder = "Enter your password",
  showPasswordToggle = true,
  autoComplete = "current-password",
  ...props
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <FormField
        label={label}
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        autoComplete={autoComplete}
        {...props}
      />
      <Lock className="absolute left-3 top-9 h-4 w-4 text-gray-400 pointer-events-none" />
      {showPasswordToggle && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-8 h-8 w-8 p-0"
          onClick={() => setShowPassword(!showPassword)}
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );
}

/**
 * Username field with validation
 */
export function UsernameField({
  label = "Username",
  placeholder = "Choose a username",
  ...props
}: Omit<FormFieldProps, 'type'> & any) {
  return (
    <div className="relative">
      <FormField
        label={label}
        type="text"
        placeholder={placeholder}
        autoComplete="username"
        {...props}
      />
      <User className="absolute left-3 top-9 h-4 w-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

/**
 * Name fields (first/last name)
 */
export function FirstNameField(props: Omit<FormFieldProps, 'type'>) {
  return (
    <FormField
      label="First Name"
      type="text"
      placeholder="Enter your first name"
      autoComplete="given-name"
      {...props}
    />
  );
}

export function LastNameField(props: Omit<FormFieldProps, 'type'>) {
  return (
    <FormField
      label="Last Name"
      type="text"
      placeholder="Enter your last name"
      autoComplete="family-name"
      {...props}
    />
  );
}

/**
 * Verification code field
 */
export function VerificationCodeField({
  label = "Verification Code",
  placeholder = "Enter 6-digit code",
  maxLength = 6,
  ...props
}: Omit<FormFieldProps, 'type'> & { maxLength?: number }) {
  return (
    <FormField
      label={label}
      type="text"
      placeholder={placeholder}
      maxLength={maxLength}
      className="text-center text-lg tracking-widest"
      autoComplete="one-time-code"
      {...props}
    />
  );
}

/**
 * Combined name fields (first + last)
 */
export interface NameFieldsProps {
  firstName: string;
  lastName: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  firstNameError?: string;
  lastNameError?: string;
  required?: boolean;
  disabled?: boolean;
}

export function NameFields({
  firstName,
  lastName,
  onFirstNameChange,
  onLastNameChange,
  firstNameError,
  lastNameError,
  required,
  disabled
}: NameFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <FirstNameField
        value={firstName}
        onChange={onFirstNameChange}
        error={firstNameError}
        required={required}
        disabled={disabled}
      />
      <LastNameField
        value={lastName}
        onChange={onLastNameChange}
        error={lastNameError}
        required={required}
        disabled={disabled}
      />
    </div>
  );
}

/**
 * Form section wrapper for consistent spacing
 */
export interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({
  title,
  description,
  children,
  className = ""
}: FormSectionProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {title && (
        <div className="space-y-1">
          <h3 className="text-lg font-medium">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

/**
 * Authentication form layout
 */
export interface AuthFormLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthFormLayout({
  title,
  description,
  children,
  footer
}: AuthFormLayoutProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{title}</h2>
        {description && (
          <p className="text-gray-600 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
      
      <div className="space-y-4">
        {children}
      </div>
      
      {footer && (
        <div className="pt-4 border-t">
          {footer}
        </div>
      )}
    </div>
  );
}