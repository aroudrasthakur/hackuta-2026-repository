import type { ReactNode } from "react";

type OdysseyButtonProps = {
  href?: string;
  children: ReactNode;
  inactive?: boolean;
  className?: string;
};

export function OdysseyButton({
  href,
  children,
  inactive = false,
  className,
}: OdysseyButtonProps) {
  const classes = ["odyssey-btn", className].filter(Boolean).join(" ");

  if (inactive) {
    return (
      <button
        type="button"
        className={classes}
        disabled
        aria-disabled="true"
      >
        {children}
      </button>
    );
  }

  const external = href?.startsWith("http");

  return (
    <a
      className={classes}
      href={href}
      {...(external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : undefined)}
    >
      {children}
    </a>
  );
}
