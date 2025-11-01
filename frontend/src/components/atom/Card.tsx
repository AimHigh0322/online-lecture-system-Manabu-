import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
  variant?: "default" | "elevated" | "outlined";
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  padding = "md",
  variant = "default",
}) => {
  const baseClasses = "rounded-3xl shadow-2xl";

  const paddingClasses = {
    sm: "p-6",
    md: "p-8",
    lg: "p-10",
  };

  const variantClasses = {
    default: "bg-white/90 backdrop-blur-sm",
    elevated: "bg-white shadow-2xl",
    outlined: "bg-white border-2 border-gray-200",
  };

  const classes = `${baseClasses} ${paddingClasses[padding]} ${variantClasses[variant]} ${className}`;

  return <div className={classes}>{children}</div>;
};

export default Card;
