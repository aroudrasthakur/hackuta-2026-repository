import { useState, type FormEvent, type ComponentProps } from "react";
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
const checkboxClass ="h-4 w-4 cursor-pointer accent-(--color-ocean) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-sand) disabled:cursor-not-allowed disabled:opacity-50";
const radioClass ="h-4 w-4 cursor-pointer accent-(--color-ocean) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-sand) disabled:cursor-not-allowed disabled:opacity-50";
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

type FieldProps = Omit<ComponentProps<"input">, "onChange"> & {
  label: string;
  error: string | undefined;
  onChange: (value: string) => void;
  options?: readonly string[];
};

function Field({ label, error, onChange, options, ...props }: FieldProps) {
  const shared = {
    id: props.id,
    value: props.value,
    "aria-invalid": !!error,
    className: error ? `${inputClass} ${inputErrorClass}` : inputClass,
  };
  return (
    <label className={labelClass} htmlFor={props.id}>
      <span className={legendClass}>{label}</span>
      {options ? (
        <select {...shared} onChange={(event) => onChange(event.target.value)}>
          <option value="" disabled>Select one</option>
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : (
        <input {...props} {...shared} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
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

    for (const [field, value] of Object.entries({ resumeUrl, linkedin, github, portfolio })) {
      if (value && !URL_PATTERN.test(value)) {
        errs[field] = "Enter a valid URL starting with http:// or https://.";
      }
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
        <Field
          label="First name" id="firstName"
          value={firstName} onChange={setFirstName} error={errors.firstName}
        />
        <Field
          label="Last name" id="lastName"
          value={lastName} onChange={setLastName} error={errors.lastName}
        />
        <Field
          label="Phone number" id="phone"
          type="tel"
          value={phone} onChange={setPhone} error={errors.phone}
        />
        <Field
          label="Age" id="age"
          type="number" min={18} max={120}
          value={age} onChange={setAge} error={errors.age}
        />
        <Field
          label="School / university" id="school"
          value={school} onChange={setSchool} error={errors.school}
        />
        <Field
          label="Level of study" id="levelOfStudy"
          options={LEVELS_OF_STUDY}
          value={levelOfStudy} onChange={setLevelOfStudy} error={errors.levelOfStudy}
        />
        <Field
          label="Major / field of study" id="major"
          value={major} onChange={setMajor} error={errors.major}
        />
        <Field
          label="Expected graduation year" id="graduationYear"
          type="number" min={2024} max={2035}
          value={graduationYear} onChange={setGraduationYear} error={errors.graduationYear}
        />
      </div>

      <Field
        label="Gender" id="gender"
        options={GENDERS}
        value={gender} onChange={setGender} error={errors.gender}
      />

      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>Race / ethnicity (select all that apply)</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {RACE_ETHNICITY_OPTIONS.map((option) => (
            <label key={option} className={checkboxRowClass}>
              <input
                type="checkbox"
                className={checkboxClass}
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
                className={checkboxClass}
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

      <Field
        label="T-shirt size" id="tshirtSize"
        options={TSHIRT_SIZES}
        value={tshirtSize} onChange={setTshirtSize} error={errors.tshirtSize}
      />

      <fieldset id="firstHackathon" className={fieldsetClass}>
        <legend className={legendClass}>Is this your first hackathon?</legend>
        <div className="flex gap-4">
          <label className={checkboxRowClass}>
            <input
              type="radio"
              className={radioClass}
              name="firstHackathon"
              checked={firstHackathon === "yes"}
              onChange={() => setFirstHackathon("yes")}
            />
            Yes
          </label>
          <label className={checkboxRowClass}>
            <input
              type="radio"
              className={radioClass}
              name="firstHackathon"
              checked={firstHackathon === "no"}
              onChange={() => setFirstHackathon("no")}
            />
            No
          </label>
        </div>
      </fieldset>

      <Field
        label="How did you hear about HackUTA?" id="hearAbout"
        options={HEAR_ABOUT_OPTIONS}
        value={hearAbout} onChange={setHearAbout} error={errors.hearAbout}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Resume link (optional)" id="resumeUrl"
          type="url" placeholder="https://"
          value={resumeUrl} onChange={setResumeUrl} error={errors.resumeUrl}
        />
        <Field
          label="LinkedIn (optional)" id="linkedin"
          type="url" placeholder="https://"
          value={linkedin} onChange={setLinkedin} error={errors.linkedin}
        />
        <Field
          label="GitHub (optional)" id="github"
          type="url" placeholder="https://"
          value={github} onChange={setGithub} error={errors.github}
        />
        <Field
          label="Portfolio (optional)" id="portfolio"
          type="url" placeholder="https://"
          value={portfolio} onChange={setPortfolio} error={errors.portfolio}
        />
      </div>

      <label className={labelClass}>
        <span className={legendClass}>Accessibility needs or accommodations (optional)</span>
        <textarea value={accessibilityNeeds} onChange={(e) => setAccessibilityNeeds(e.target.value)} rows={2} className={inputClass} />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Emergency contact name" id="emergencyContactName"
          value={emergencyContactName} onChange={setEmergencyContactName} error={errors.emergencyContactName}
        />
        <Field
          label="Emergency contact phone" id="emergencyContactPhone"
          type="tel"
          value={emergencyContactPhone} onChange={setEmergencyContactPhone} error={errors.emergencyContactPhone}
        />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-(--color-ocean)/40 p-4 text-sm">
        <div className="flex flex-col gap-1">
          <label className={checkboxRowClass} htmlFor="codeOfConductAgreed">
            <input
              id="codeOfConductAgreed"
              type="checkbox"
              className={checkboxClass}
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
              className={checkboxClass}
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
            className={checkboxClass}
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