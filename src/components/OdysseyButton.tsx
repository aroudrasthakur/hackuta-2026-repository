import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";

type OdysseyButtonProps = {
  href?: string;
  children: ReactNode;
  inactive?: boolean;
  disabled?: boolean;
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  className?: string;
};

export function OdysseyButton({
  href,
  children,
  inactive = false,
  disabled = false,
  type = "button",
  className,
}: OdysseyButtonProps) {
  const classes = ["odyssey-btn", className].filter(Boolean).join(" ");
  const isDisabled = inactive || disabled;

  if (href && !isDisabled) {
    if (href.startsWith("http")) {
      return (
        <a
          className={classes}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      );
    }

    if (href.startsWith("/")) {
      return (
        <Link className={classes} to={href}>
          {children}
        </Link>
      );
    }

    return (
      <a className={classes} href={href}>
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={isDisabled}
      aria-disabled={isDisabled || undefined}
    >
      {children}
    </button>
  );
}
