import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: string;
  label?: string;
}

export const Input: React.FC<InputProps> = ({
  icon,
  error,
  label,
  className = "",
  ...props
}) => {
  const baseClasses =
    "block w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-base";

  const errorClasses = error
    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
    : "";

  const classes = `${baseClasses} ${errorClasses} ${className}`;

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      {icon && (
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {icon}
        </div>
      )}

      <input className={classes} {...props} />

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Input;
