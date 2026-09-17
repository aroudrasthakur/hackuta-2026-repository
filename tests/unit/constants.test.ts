import { describe, expect, it } from "vitest";
import { HACKATHON_ID, MIN_GRADUATION_YEAR } from "../../shared/registration/constants";
import { HERO_AMBIENT_STORM } from "../../src/constants/heroWeather";
import {
  coastSrcSet,
  COAST_DEFAULT_SRC,
  logoDefaultSrc,
  logoSrcSet,
  LOGO_SIZES,
} from "../../src/constants/images";
import { PRIMARY_NAV_LINKS } from "../../src/constants/navigation";
import { SPONSOR_TIERS } from "../../src/constants/sponsors";

describe("shared registration constants", () => {
  it("exports stable registration metadata", () => {
    expect(HACKATHON_ID).toBeTruthy();
    expect(MIN_GRADUATION_YEAR).toBeGreaterThan(2020);
  });
});

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
    expect(SPONSOR_TIERS.length).toBeGreaterThan(0);
    expect(HERO_AMBIENT_STORM).toBeGreaterThan(0);
  });
});
