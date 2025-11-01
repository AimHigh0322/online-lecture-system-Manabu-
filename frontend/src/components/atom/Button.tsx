import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  className = "",
  disabled,
  ...props
}) => {
  const baseClasses =
    "font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

  const variantClasses = {
    primary:
      "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 focus:ring-orange-500 shadow-lg",
    secondary:
      "bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-500",
    outline:
      "border-2 border-orange-500 text-orange-600 hover:bg-orange-50 focus:ring-orange-500",
  };

  const sizeClasses = {
    sm: "py-2 px-4 text-sm",
    md: "py-3 px-6 text-base",
    lg: "py-4 px-6 text-lg",
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading ? "処理中..." : children}
    </button>
  );
};

export default Button;
