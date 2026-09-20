import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Header } from "./Header";

const SHIP = { width: 1600, height: 1047 } as const;

type AuthMode = "login" | "signup";

function modeFromPath(pathname: string): AuthMode {
  const path = pathname.replace(/\/+$/, "") || "/";
  return path === "/signup" ? "signup" : "login";
}

export function Auth() {
  const location = useLocation();
  const navigate = useNavigate();
  const mode = modeFromPath(location.pathname);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const previous = document.title;
    document.title =
      mode === "signup" ? "Join the crew · HackUTA 2026" : "Log in · HackUTA 2026";
    return () => {
      document.title = previous;
    };
  }, [mode]);

  const switchMode = (next: AuthMode) => {
    setNotice("");
    navigate(next === "signup" ? "/signup" : "/login", { replace: true });
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mode === "signup" && password !== confirm) {
      setNotice("Those passwords do not match.");
      return;
    }
    setNotice("The crew roster is not open yet. This berth will be ready when applications launch.");
  };

  return (
    <>
      <a className="skip-link" href="#auth-title">
        Skip to content
      </a>
      <Header />
      <main id="main-content" tabIndex={-1}>
        <section className="auth-page" data-theme="dark" aria-labelledby="auth-title">
          <div
            className="auth-ship"
            aria-hidden="true"
          >
            <img
              src="/images/ship-water.webp"
              alt=""
              width={SHIP.width}
              height={SHIP.height}
              decoding="async"
              draggable={false}
            />
          </div>

          <div className="auth-panel">
            <p className="auth-kicker uppercase">
              {mode === "signup" ? "Join the voyage" : "Return to port"}
            </p>
            <h1 id="auth-title" className="auth-title">
              {mode === "signup" ? "Create your account" : "Log in"}
            </h1>
            <p className="auth-lede">
              {mode === "signup"
                ? "Take a berth on the crew. Applications are not open yet, but you can prepare your passage."
                : "Come aboard with the email you will use for HackUTA 2026."}
            </p>

            <div className="auth-tabs" role="tablist" aria-label="Account options">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "login"}
                className="auth-tab"
                onClick={() => switchMode("login")}
              >
                Log in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "signup"}
                className="auth-tab"
                onClick={() => switchMode("signup")}
              >
                Create account
              </button>
            </div>

            <form className="auth-form" onSubmit={onSubmit}>
              {mode === "signup" && (
                <label className="auth-field">
                  <span>Name</span>
                  <input
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                </label>
              )}
              <label className="auth-field">
                <span>Email</span>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
              <label className="auth-field">
                <span>Password</span>
                <input
                  name="password"
                  type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  required
                />
              </label>
              {mode === "signup" && (
                <label className="auth-field">
                  <span>Confirm password</span>
                  <input
                    name="confirm"
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                    minLength={8}
                    required
                  />
                </label>
              )}

              <button className="odyssey-btn auth-submit" type="submit">
                {mode === "signup" ? "Join the crew" : "Come aboard"}
              </button>
            </form>

            {notice && (
              <p className="auth-notice" role="status">
                {notice}
              </p>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
