import { useState, type FormEvent } from "react";
import {
  DIETARY_OPTIONS,
  GENDERS,
  HEAR_ABOUT_OPTIONS,
  LEVELS_OF_STUDY,
  RACE_ETHNICITY_OPTIONS,
  TSHIRT_SIZES,
} from "../../constants/application";
import { submitRegistration } from "./registerApi";

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}

const inputClass =
  "rounded-xl border border-(--color-ocean)/50 bg-(--color-night) px-4 py-3 text-(--color-light) outline-none focus:border-(--color-sand)";
const inputErrorClass = "border-red-400 focus:border-red-400";
const labelClass = "flex flex-col gap-1.5 text-sm";
const legendClass = "text-(--color-sand)";
const fieldsetClass = "flex flex-col gap-2 text-sm";
const checkboxRowClass = "flex items-center gap-2 text-(--color-light)";
const URL_PATTERN = /^https?:\/\/.+/i;
const PHONE_PATTERN = /^[0-9+\-\s()]{7,}$/;

type Errors = Record<string, string>;

const FIELD_ORDER = [
  "firstName",
  "lastName",
  "phone",
  "age",
  "school",
  "levelOfStudy",
  "major",
  "graduationYear",
  "gender",
  "tshirtSize",
  "firstHackathon",
  "hearAbout",
  "resumeUrl",
  "linkedin",
  "github",
  "portfolio",
  "emergencyContactName",
  "emergencyContactPhone",
  "codeOfConductAgreed",
  "mlhDataSharingConsent",
];

function fieldClass(hasError?: string) {
  return hasError ? `${inputClass} ${inputErrorClass}` : inputClass;
}

export function ApplicationForm({
  email,
  token,
  onSubmitted,
}: {
  email: string;
  token: string;
  onSubmitted: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [school, setSchool] = useState("");
  const [levelOfStudy, setLevelOfStudy] = useState<string>("");
  const [major, setMajor] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [gender, setGender] = useState<string>("");
  const [raceEthnicity, setRaceEthnicity] = useState<string[]>([]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [otherDietary, setOtherDietary] = useState("");
  const [tshirtSize, setTshirtSize] = useState<string>("");
  const [firstHackathon, setFirstHackathon] = useState<string>("");
  const [hearAbout, setHearAbout] = useState<string>("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [accessibilityNeeds, setAccessibilityNeeds] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [codeOfConductAgreed, setCodeOfConductAgreed] = useState(false);
  const [mlhDataSharingConsent, setMlhDataSharingConsent] = useState(false);
  const [mlhCommunicationsConsent, setMlhCommunicationsConsent] = useState(false);

  function validate(): Errors {
    const errs: Errors = {};

    if (!firstName.trim()) errs.firstName = "First name is required.";
    if (!lastName.trim()) errs.lastName = "Last name is required.";

    if (!phone.trim()) errs.phone = "Phone number is required.";
    else if (!PHONE_PATTERN.test(phone)) errs.phone = "Enter a valid phone number.";

    if (!age) errs.age = "Age is required.";
    else {
      const ageNum = Number(age);
      if (Number.isNaN(ageNum) || ageNum < 18 || ageNum > 120) {
        errs.age = "Age must be between 18 and 120.";
      }
    }

    if (!school.trim()) errs.school = "School / university is required.";
    if (!levelOfStudy) errs.levelOfStudy = "Please select a level of study.";
    if (!major.trim()) errs.major = "Major / field of study is required.";

    if (!graduationYear) errs.graduationYear = "Expected graduation year is required.";
    else {
      const gradYearNum = Number(graduationYear);
      if (Number.isNaN(gradYearNum) || gradYearNum < 2024 || gradYearNum > 2035) {
        errs.graduationYear = "Enter a year between 2024 and 2035.";
      }
    }

    if (!gender) errs.gender = "Please select a gender.";
    if (!tshirtSize) errs.tshirtSize = "Please select a t-shirt size.";
    if (!firstHackathon) errs.firstHackathon = "Please let us know if this is your first hackathon.";
    if (!hearAbout) errs.hearAbout = "Please select how you heard about HackUTA.";

    if (resumeUrl && !URL_PATTERN.test(resumeUrl)) {
      errs.resumeUrl = "Enter a valid URL starting with http:// or https://.";
    }
    if (linkedin && !URL_PATTERN.test(linkedin)) {
      errs.linkedin = "Enter a valid URL starting with http:// or https://.";
    }
    if (github && !URL_PATTERN.test(github)) {
      errs.github = "Enter a valid URL starting with http:// or https://.";
    }
    if (portfolio && !URL_PATTERN.test(portfolio)) {
      errs.portfolio = "Enter a valid URL starting with http:// or https://.";
    }

    if (!emergencyContactName.trim()) {
      errs.emergencyContactName = "Emergency contact name is required.";
    }
    if (!emergencyContactPhone.trim()) {
      errs.emergencyContactPhone = "Emergency contact phone is required.";
    } else if (!PHONE_PATTERN.test(emergencyContactPhone)) {
      errs.emergencyContactPhone = "Enter a valid phone number.";
    }

    if (!codeOfConductAgreed) {
      errs.codeOfConductAgreed = "You must agree to the MLH Code of Conduct to continue.";
    }
    if (!mlhDataSharingConsent) {
      errs.mlhDataSharingConsent = "You must authorize sharing your info with MLH to register.";
    }

    return errs;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setError("One or more of your answers is invalid. Please review the application.");
      const firstInvalidField = FIELD_ORDER.find((field) => validationErrors[field]);
      if (firstInvalidField) {
        document
          .getElementById(firstInvalidField)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setSubmitting(true);
    try {
      await submitRegistration({
        token,
        email,
        firstName,
        lastName,
        phone,
        age: Number(age),
        school,
        levelOfStudy,
        major,
        graduationYear: Number(graduationYear),
        gender,
        raceEthnicity,
        dietaryRestrictions,
        otherDietary,
        tshirtSize,
        firstHackathon: firstHackathon === "yes",
        hearAbout,
        resumeUrl,
        linkedin,
        github,
        portfolio,
        accessibilityNeeds,
        emergencyContactName,
        emergencyContactPhone,
        codeOfConductAgreed,
        mlhDataSharingConsent,
        mlhCommunicationsConsent,
      });
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <div>
        <h1 className="font-(family-name:--font-display) text-3xl text-(--color-light)">
          Tell us about yourself
        </h1>
        <p className="mt-2 text-sm text-(--color-mist)">
          Signed in as <span className="text-(--color-sand)">{email}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={labelClass} htmlFor="firstName">
          <span className={legendClass}>First name</span>
          <input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            aria-invalid={!!errors.firstName}
            className={fieldClass(errors.firstName)}
          />
        </label>
        <label className={labelClass} htmlFor="lastName">
          <span className={legendClass}>Last name</span>
          <input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            aria-invalid={!!errors.lastName}
            className={fieldClass(errors.lastName)}
          />
        </label>
        <label className={labelClass} htmlFor="phone">
          <span className={legendClass}>Phone number</span>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            aria-invalid={!!errors.phone}
            className={fieldClass(errors.phone)}
          />
        </label>
        <label className={labelClass} htmlFor="age">
          <span className={legendClass}>Age</span>
          <input
            id="age"
            type="number"
            min={18}
            max={120}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            aria-invalid={!!errors.age}
            className={fieldClass(errors.age)}
          />
        </label>
        <label className={labelClass} htmlFor="school">
          <span className={legendClass}>School / university</span>
          <input
            id="school"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            aria-invalid={!!errors.school}
            className={fieldClass(errors.school)}
          />
        </label>
        <label className={labelClass} htmlFor="levelOfStudy">
          <span className={legendClass}>Level of study</span>
          <select
            id="levelOfStudy"
            value={levelOfStudy}
            onChange={(e) => setLevelOfStudy(e.target.value)}
            aria-invalid={!!errors.levelOfStudy}
            className={fieldClass(errors.levelOfStudy)}
          >
            <option value="" disabled>
              Select one
            </option>
            {LEVELS_OF_STUDY.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass} htmlFor="major">
          <span className={legendClass}>Major / field of study</span>
          <input
            id="major"
            value={major}
            onChange={(e) => setMajor(e.target.value)}
            aria-invalid={!!errors.major}
            className={fieldClass(errors.major)}
          />
        </label>
        <label className={labelClass} htmlFor="graduationYear">
          <span className={legendClass}>Expected graduation year</span>
          <input
            id="graduationYear"
            type="number"
            min={2024}
            max={2035}
            value={graduationYear}
            onChange={(e) => setGraduationYear(e.target.value)}
            aria-invalid={!!errors.graduationYear}
            className={fieldClass(errors.graduationYear)}
          />
        </label>
      </div>

      <label className={labelClass} htmlFor="gender">
        <span className={legendClass}>Gender</span>
        <select
          id="gender"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          aria-invalid={!!errors.gender}
          className={fieldClass(errors.gender)}
        >
          <option value="" disabled>
            Select one
          </option>
          {GENDERS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>Race / ethnicity (select all that apply)</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {RACE_ETHNICITY_OPTIONS.map((option) => (
            <label key={option} className={checkboxRowClass}>
              <input
                type="checkbox"
                checked={raceEthnicity.includes(option)}
                onChange={() => setRaceEthnicity((prev) => toggleValue(prev, option))}
              />
              {option}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>Dietary restrictions (select all that apply)</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {DIETARY_OPTIONS.map((option) => (
            <label key={option} className={checkboxRowClass}>
              <input
                type="checkbox"
                checked={dietaryRestrictions.includes(option)}
                onChange={() => setDietaryRestrictions((prev) => toggleValue(prev, option))}
              />
              {option}
            </label>
          ))}
        </div>
        {dietaryRestrictions.includes("Other") && (
          <input
            value={otherDietary}
            onChange={(e) => setOtherDietary(e.target.value)}
            placeholder="Tell us more"
            className={inputClass}
          />
        )}
      </fieldset>

      <label className={labelClass} htmlFor="tshirtSize">
        <span className={legendClass}>T-shirt size</span>
        <select
          id="tshirtSize"
          value={tshirtSize}
          onChange={(e) => setTshirtSize(e.target.value)}
          aria-invalid={!!errors.tshirtSize}
          className={fieldClass(errors.tshirtSize)}
        >
          <option value="" disabled>
            Select one
          </option>
          {TSHIRT_SIZES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <fieldset id="firstHackathon" className={fieldsetClass}>
        <legend className={legendClass}>Is this your first hackathon?</legend>
        <div className="flex gap-4">
          <label className={checkboxRowClass}>
            <input
              type="radio"
              name="firstHackathon"
              checked={firstHackathon === "yes"}
              onChange={() => setFirstHackathon("yes")}
            />
            Yes
          </label>
          <label className={checkboxRowClass}>
            <input
              type="radio"
              name="firstHackathon"
              checked={firstHackathon === "no"}
              onChange={() => setFirstHackathon("no")}
            />
            No
          </label>
        </div>
      </fieldset>

      <label className={labelClass} htmlFor="hearAbout">
        <span className={legendClass}>How did you hear about HackUTA?</span>
        <select
          id="hearAbout"
          value={hearAbout}
          onChange={(e) => setHearAbout(e.target.value)}
          aria-invalid={!!errors.hearAbout}
          className={fieldClass(errors.hearAbout)}
        >
          <option value="" disabled>
            Select one
          </option>
          {HEAR_ABOUT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={labelClass} htmlFor="resumeUrl">
          <span className={legendClass}>Resume link (optional)</span>
          <input
            id="resumeUrl"
            type="url"
            value={resumeUrl}
            onChange={(e) => setResumeUrl(e.target.value)}
            placeholder="https://"
            aria-invalid={!!errors.resumeUrl}
            className={fieldClass(errors.resumeUrl)}
          />
        </label>
        <label className={labelClass} htmlFor="linkedin">
          <span className={legendClass}>LinkedIn (optional)</span>
          <input
            id="linkedin"
            type="url"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            placeholder="https://"
            aria-invalid={!!errors.linkedin}
            className={fieldClass(errors.linkedin)}
          />
        </label>
        <label className={labelClass} htmlFor="github">
          <span className={legendClass}>GitHub (optional)</span>
          <input
            id="github"
            type="url"
            value={github}
            onChange={(e) => setGithub(e.target.value)}
            placeholder="https://"
            aria-invalid={!!errors.github}
            className={fieldClass(errors.github)}
          />
        </label>
        <label className={labelClass} htmlFor="portfolio">
          <span className={legendClass}>Portfolio (optional)</span>
          <input
            id="portfolio"
            type="url"
            value={portfolio}
            onChange={(e) => setPortfolio(e.target.value)}
            placeholder="https://"
            aria-invalid={!!errors.portfolio}
            className={fieldClass(errors.portfolio)}
          />
        </label>
      </div>

      <label className={labelClass}>
        <span className={legendClass}>Accessibility needs or accommodations (optional)</span>
        <textarea value={accessibilityNeeds} onChange={(e) => setAccessibilityNeeds(e.target.value)} rows={2} className={inputClass} />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={labelClass} htmlFor="emergencyContactName">
          <span className={legendClass}>Emergency contact name</span>
          <input
            id="emergencyContactName"
            value={emergencyContactName}
            onChange={(e) => setEmergencyContactName(e.target.value)}
            aria-invalid={!!errors.emergencyContactName}
            className={fieldClass(errors.emergencyContactName)}
          />
        </label>
        <label className={labelClass} htmlFor="emergencyContactPhone">
          <span className={legendClass}>Emergency contact phone</span>
          <input
            id="emergencyContactPhone"
            type="tel"
            value={emergencyContactPhone}
            onChange={(e) => setEmergencyContactPhone(e.target.value)}
            aria-invalid={!!errors.emergencyContactPhone}
            className={fieldClass(errors.emergencyContactPhone)}
          />
        </label>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-(--color-ocean)/40 p-4 text-sm">
        <div className="flex flex-col gap-1">
          <label className={checkboxRowClass} htmlFor="codeOfConductAgreed">
            <input
              id="codeOfConductAgreed"
              type="checkbox"
              checked={codeOfConductAgreed}
              onChange={(e) => setCodeOfConductAgreed(e.target.checked)}
            />
            I have read and agree to the{" "}
            <a
              href="https://static.mlh.io/docs/mlh-code-of-conduct.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4"
            >
              MLH Code of Conduct
            </a>
            .
          </label>
        </div>
        <div className="flex flex-col gap-1">
          <label className={checkboxRowClass} htmlFor="mlhDataSharingConsent">
            <input
              id="mlhDataSharingConsent"
              type="checkbox"
              checked={mlhDataSharingConsent}
              onChange={(e) => setMlhDataSharingConsent(e.target.checked)}
            />
            I authorize HackUTA to share my registration information with Major League Hacking for
            event administration, ranking, and MLH administration in-line with the MLH Privacy Policy.
          </label>
        </div>
        <label className={checkboxRowClass}>
          <input
            type="checkbox"
            checked={mlhCommunicationsConsent}
            onChange={(e) => setMlhCommunicationsConsent(e.target.checked)}
          />
          I authorize MLH to send me occasional emails about relevant events, career opportunities,
          and community announcements (optional).
        </label>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-(--color-sand) px-6 py-3 font-semibold text-(--color-ink) transition hover:opacity-90 disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit application"}
      </button>
    </form>
  );
}