import { describe, expect, it } from "vitest";
import { HERO_AMBIENT_STORM } from "../../src/constants/heroWeather";
import {
  coastSrcSet,
  COAST_DEFAULT_SRC,
  logoDefaultSrc,
  logoSrcSet,
  LOGO_SIZES,
} from "../../src/constants/images";
import { PRIMARY_NAV_LINKS } from "../../src/constants/navigation";
import { HACKATHON_SCHEDULE } from "../../src/constants/hackathon";
import { REGISTER_URL } from "../../src/constants/site";
import { SPONSOR_GROUPS, sponsors } from "../../src/constants/sponsors";

describe("image helpers", () => {
  it("builds logo and coast src sets", () => {
    expect(logoSrcSet("light")).toContain(".webp");
    expect(logoDefaultSrc("dark")).toContain("hackuta-logo-white");
    expect(LOGO_SIZES.header).toBeTruthy();
    expect(coastSrcSet()).toContain("coast-cliff");
    expect(COAST_DEFAULT_SRC).toContain("coast-cliff");
  });
});

describe("site constants", () => {
  it("exports navigation and sponsor data", () => {
    expect(PRIMARY_NAV_LINKS.length).toBeGreaterThan(0);
    expect(SPONSOR_GROUPS.length).toBeGreaterThan(0);
    expect(HERO_AMBIENT_STORM).toBeGreaterThan(0);
  });

  it("keeps the approved sponsor roster in sync", () => {
    const direct = sponsors.filter((sponsor) => sponsor.group === "direct");
    const inKind = sponsors.filter((sponsor) => sponsor.group === "in-kind");
    expect(direct).toHaveLength(8);
    expect(inKind).toHaveLength(5);
    expect(inKind.map((sponsor) => sponsor.name)).toContain("Deepspace");
    expect(inKind.find((sponsor) => sponsor.name === "Deepspace")).toMatchObject({
      image: "/images/sponsors/deepspace.png",
      link: "https://deep.space/",
    });
    for (const sponsor of sponsors) {
      expect(sponsor.image).toMatch(/^\/images\/sponsors\//);
      expect(sponsor.link).toMatch(/^https:\/\//);
    }
  });

  it("points the register call to action at an absolute registration URL", () => {
    expect(REGISTER_URL).toMatch(/^https?:\/\//);
  });

  it("keeps the fallback hackathon window on November 14–15, 2026", () => {
    expect(HACKATHON_SCHEDULE.endsAt).toBeGreaterThan(HACKATHON_SCHEDULE.startsAt);
    expect(new Date(HACKATHON_SCHEDULE.startsAt).toISOString()).toBe("2026-11-14T15:00:00.000Z");
  });
});
