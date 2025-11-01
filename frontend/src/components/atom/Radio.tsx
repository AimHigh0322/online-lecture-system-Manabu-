import React from "react";

interface RadioOption {
  value: string;
  label: string;
}

interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
}

export const Radio: React.FC<RadioProps> = ({
  options,
  value,
  onChange,
  error,
  label,
  className = "",
  ...props
}) => {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-center cursor-pointer"
          >
            <input
              type="radio"
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              className={`h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 cursor-pointer ${className}`}
              {...props}
            />
            <span className="ml-2 text-sm text-gray-700">{option.label}</span>
          </label>
        ))}
      </div>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Radio;
