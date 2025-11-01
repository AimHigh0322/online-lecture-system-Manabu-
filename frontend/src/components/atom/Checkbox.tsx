import React from "react";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  error,
  className = "",
  ...props
}) => {
  return (
    <div>
      <label className="flex items-center cursor-pointer">
        <input
          type="checkbox"
          className={`h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded cursor-pointer ${className}`}
          {...props}
        />
        <span className="ml-2 text-sm text-orange-600">{label}</span>
      </label>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Checkbox;
