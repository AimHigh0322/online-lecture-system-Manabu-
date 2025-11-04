import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  placeholder?: string;
  icon?: React.ReactNode;
  error?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  theme?: "orange" | "slate";
}

export const Select: React.FC<SelectProps> = ({
  options,
  placeholder = "選択してください",
  icon,
  error,
  value = "",
  onChange,
  disabled = false,
  className = "",
  theme = "orange",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (optionValue: string) => {
    setSelectedValue(optionValue);
    onChange?.(optionValue);
    setIsOpen(false);
  };

  const selectedOption = options.find(
    (option) => option.value === selectedValue
  );

  // Theme colors
  const themeColors = {
    orange: {
      ring: "focus:ring-orange-500 focus:border-orange-500",
      hover: "hover:border-orange-300",
      icon: "text-orange-400",
      optionHover: "hover:bg-orange-50",
      optionActive: "bg-orange-50 text-orange-600",
      check: "text-orange-600",
    },
    slate: {
      ring: "focus:ring-slate-500 focus:border-slate-500",
      hover: "hover:border-slate-400",
      icon: "text-slate-500",
      optionHover: "hover:bg-slate-50",
      optionActive: "bg-slate-100 text-slate-700",
      check: "text-slate-600",
    },
  };

  const currentTheme = themeColors[theme];

  // Adjust padding and border radius based on theme - slate theme has reduced height
  const paddingClasses = theme === "slate" ? "py-3" : "py-2";
  const borderRadius = theme === "slate" ? "rounded-lg" : "rounded-lg";

  const baseClasses = `block w-full pl-12 pr-12 ${paddingClasses} border border-gray-300 ${borderRadius} text-gray-900 focus:outline-none focus:ring-2 transition-all duration-200 text-base bg-white cursor-pointer ${currentTheme.ring} ${currentTheme.hover}`;

  const errorClasses = error
    ? "border-red-300 focus:ring-red-500 focus:border-red-500 hover:border-red-300"
    : "";

  const disabledClasses = disabled
    ? "bg-gray-50 text-gray-400 cursor-not-allowed hover:border-gray-300"
    : "";

  const classes = `${baseClasses} ${errorClasses} ${disabledClasses} ${className}`;

  return (
    <div className="relative" ref={dropdownRef}>
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
          <div className={currentTheme.icon}>{icon}</div>
        </div>
      )}

      <button
        type="button"
        className={`${classes} cursor-pointer`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span
          className={`block truncate text-left ${
            selectedValue ? "text-gray-900" : "text-gray-400"
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
      </button>

      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
        <ChevronDown
          className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {isOpen && !disabled && (
        <div
          className={`absolute z-50 w-full mt-1 bg-white border border-gray-200 ${borderRadius} shadow-lg max-h-60 overflow-auto`}
        >
          {options.map((option) => {
            const optionPadding = theme === "slate" ? "py-2.5" : "py-3";
            const optionRoundedTop =
              theme === "slate" ? "rounded-t-lg" : "rounded-t-xl";
            const optionRoundedBottom =
              theme === "slate" ? "rounded-b-lg" : "rounded-b-xl";
            return (
              <button
                key={option.value}
                type="button"
                className={`w-full px-4 ${optionPadding} text-left cursor-pointer ${
                  currentTheme.optionHover
                } transition-colors duration-150 flex items-center justify-between ${
                  selectedValue === option.value
                    ? `${currentTheme.optionActive} font-medium`
                    : "text-gray-900"
                } ${option === options[0] ? optionRoundedTop : ""} ${
                  option === options[options.length - 1]
                    ? optionRoundedBottom
                    : ""
                }`}
                onClick={() => handleSelect(option.value)}
              >
                <span>{option.label}</span>
                {selectedValue === option.value && (
                  <Check className={`h-4 w-4 ${currentTheme.check}`} />
                )}
              </button>
            );
          })}
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Select;
