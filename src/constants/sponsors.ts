type SponsorGroup = "direct" | "in-kind";

export type Sponsor = {
  /** Used for the logo alt text and as the React key. */
  name: string;
  image: string;
  group: SponsorGroup;
  link: string;
};

export const SPONSOR_EMAIL = "sponsor@hackuta.org";

export const SPONSOR_MAILTO = `mailto:${SPONSOR_EMAIL}?subject=${encodeURIComponent(
  "HackUTA 2026 sponsorship",
)}`;

/** Direct sponsors appear together, followed by in-kind sponsors. */
export const SPONSOR_GROUPS: Array<{ group: SponsorGroup; label: string }> = [
  { group: "direct", label: "Direct sponsors" },
  { group: "in-kind", label: "In-kind sponsors" },
];

/** Only approved sponsors and logos belong here. Xome is awaiting approval. */
export const sponsors: Sponsor[] = [
  {
    name: "FaZe Clan",
    image: "/images/sponsors/faze-clan.webp",
    group: "direct",
    link: "https://fazeclan.com/",
  },
  {
    name: "CIQ",
    image: "/images/sponsors/ciq.svg",
    group: "direct",
    link: "https://ciq.com/",
  },
  {
    name: "Mouser Electronics",
    image: "/images/sponsors/mouser.webp",
    group: "direct",
    link: "https://www.mouser.com/",
  },
  {
    name: "UTA Department of Computer Science and Engineering",
    image: "/images/sponsors/uta-cse.png",
    group: "direct",
    link: "https://www.uta.edu/academics/schools-colleges/engineering/academics/departments/cse",
  },
  {
    name: "Pure Buttons",
    image: "/images/sponsors/pure-buttons.webp",
    group: "in-kind",
    link: "https://www.purebuttons.com/",
  },
  {
    name: "Lovable",
    image: "/images/sponsors/lovable.svg",
    group: "in-kind",
    link: "https://lovable.dev/",
  },
];
