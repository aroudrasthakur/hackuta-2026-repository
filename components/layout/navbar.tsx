const NAV_LINKS = [
  { label: "About", href: "#about" },
  { label: "Schedule", href: "#schedule" },
  { label: "FAQ", href: "#faq" },
  { label: "Sponsors", href: "#sponsors" },
] as const;

/**
 * Centered pill navigation from the Odyssey landing mockup.
 * Uppercase, letter-spaced links inside a thin navy outline capsule.
 */
export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center pt-5 sm:pt-6">
      <nav
        aria-label="Main"
        className="border-navy bg-parchment/95 inline-flex items-center rounded-full border px-6 py-2.5 shadow-sm sm:px-10 sm:py-3"
      >
        <ul className="flex items-center gap-5 sm:gap-8 md:gap-10">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-navy hover:text-navy-light text-[0.65rem] font-medium tracking-[0.22em] uppercase transition-colors sm:text-xs sm:tracking-[0.28em]"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
