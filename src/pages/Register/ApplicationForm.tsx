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
const labelClass = "flex flex-col gap-1.5 text-sm";
const legendClass = "text-(--color-sand)";
const fieldsetClass = "flex flex-col gap-2 text-sm";
const checkboxRowClass = "flex items-center gap-2 text-(--color-light)";

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

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <h1 className="font-(family-name:--font-display) text-3xl text-(--color-light)">
          Tell us about yourself
        </h1>
        <p className="mt-2 text-sm text-(--color-mist)">
          Signed in as <span className="text-(--color-sand)">{email}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          <span className={legendClass}>First name</span>
          <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={legendClass}>Last name</span>
          <input required value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={legendClass}>Phone number</span>
          <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={legendClass}>Age</span>
          <input
            required
            type="number"
            min={18}
            max={120}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          <span className={legendClass}>School / university</span>
          <input required value={school} onChange={(e) => setSchool(e.target.value)} className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={legendClass}>Level of study</span>
          <select required value={levelOfStudy} onChange={(e) => setLevelOfStudy(e.target.value)} className={inputClass}>
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
        <label className={labelClass}>
          <span className={legendClass}>Major / field of study</span>
          <input required value={major} onChange={(e) => setMajor(e.target.value)} className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={legendClass}>Expected graduation year</span>
          <input
            required
            type="number"
            min={2024}
            max={2035}
            value={graduationYear}
            onChange={(e) => setGraduationYear(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      <label className={labelClass}>
        <span className={legendClass}>Gender</span>
        <select required value={gender} onChange={(e) => setGender(e.target.value)} className={inputClass}>
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

      <label className={labelClass}>
        <span className={legendClass}>T-shirt size</span>
        <select required value={tshirtSize} onChange={(e) => setTshirtSize(e.target.value)} className={inputClass}>
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

      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>Is this your first hackathon?</legend>
        <div className="flex gap-4">
          <label className={checkboxRowClass}>
            <input
              type="radio"
              name="firstHackathon"
              required
              checked={firstHackathon === "yes"}
              onChange={() => setFirstHackathon("yes")}
            />
            Yes
          </label>
          <label className={checkboxRowClass}>
            <input
              type="radio"
              name="firstHackathon"
              required
              checked={firstHackathon === "no"}
              onChange={() => setFirstHackathon("no")}
            />
            No
          </label>
        </div>
      </fieldset>

      <label className={labelClass}>
        <span className={legendClass}>How did you hear about HackUTA?</span>
        <select required value={hearAbout} onChange={(e) => setHearAbout(e.target.value)} className={inputClass}>
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
        <label className={labelClass}>
          <span className={legendClass}>Resume link (optional)</span>
          <input type="url" value={resumeUrl} onChange={(e) => setResumeUrl(e.target.value)} placeholder="https://" className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={legendClass}>LinkedIn (optional)</span>
          <input type="url" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://" className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={legendClass}>GitHub (optional)</span>
          <input type="url" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://" className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={legendClass}>Portfolio (optional)</span>
          <input type="url" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} placeholder="https://" className={inputClass} />
        </label>
      </div>

      <label className={labelClass}>
        <span className={legendClass}>Accessibility needs or accommodations (optional)</span>
        <textarea value={accessibilityNeeds} onChange={(e) => setAccessibilityNeeds(e.target.value)} rows={2} className={inputClass} />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          <span className={legendClass}>Emergency contact name</span>
          <input required value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={legendClass}>Emergency contact phone</span>
          <input required type="tel" value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)} className={inputClass} />
        </label>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-(--color-ocean)/40 p-4 text-sm">
        <label className={checkboxRowClass}>
          <input
            type="checkbox"
            required
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
        <label className={checkboxRowClass}>
          <input
            type="checkbox"
            required
            checked={mlhDataSharingConsent}
            onChange={(e) => setMlhDataSharingConsent(e.target.checked)}
          />
          I authorize HackUTA to share my registration information with Major League Hacking for
          event administration, ranking, and MLH administration in-line with the MLH Privacy Policy.
        </label>
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
