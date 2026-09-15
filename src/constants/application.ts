export const LEVELS_OF_STUDY = [
  "High school",
  "Undergraduate - Freshman",
  "Undergraduate - Sophomore",
  "Undergraduate - Junior",
  "Undergraduate - Senior",
  "Graduate",
  "PhD",
  "Other",
] as const;

export const GENDERS = [
  "Man",
  "Woman",
  "Non-binary",
  "Prefer to self-describe",
  "Prefer not to answer",
] as const;

export const RACE_ETHNICITY_OPTIONS = [
  "American Indian or Alaska Native",
  "Asian",
  "Black or African American",
  "Hispanic or Latino",
  "Native Hawaiian or Other Pacific Islander",
  "White",
  "Prefer not to answer",
  "Other",
] as const;

export const DIETARY_OPTIONS = [
  "None",
  "Vegetarian",
  "Vegan",
  "Gluten-free",
  "Halal",
  "Kosher",
  "Nut allergy",
  "Other",
] as const;

export const TSHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export const HEAR_ABOUT_OPTIONS = [
  "Instagram",
  "Discord",
  "A friend",
  "School club or class",
  "MLH",
  "Previous HackUTA",
  "Other",
] as const;

export interface RegistrationPayload {
  token: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  age: number;
  school: string;
  levelOfStudy: (typeof LEVELS_OF_STUDY)[number];
  major: string;
  graduationYear: number;
  gender: (typeof GENDERS)[number];
  raceEthnicity: string[];
  dietaryRestrictions: string[];
  otherDietary: string;
  tshirtSize: (typeof TSHIRT_SIZES)[number];
  firstHackathon: boolean;
  hearAbout: (typeof HEAR_ABOUT_OPTIONS)[number];
  resumeUrl: string;
  linkedin: string;
  github: string;
  portfolio: string;
  accessibilityNeeds: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  codeOfConductAgreed: boolean;
  mlhDataSharingConsent: boolean;
  mlhCommunicationsConsent: boolean;
}
