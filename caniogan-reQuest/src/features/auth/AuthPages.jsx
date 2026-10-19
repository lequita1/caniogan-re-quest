import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import {
  ActionLink,
  Button,
  Notice,
  PageHeading,
  TextField,
} from "../../components/ui";
import {
  authError,
  createResidentProfile,
  login,
  logout,
  refreshEmailStatus,
  registerResident,
  resendVerification,
  resetPassword,
} from "./authService";
import { homeFor, useAuth } from "./authContext";
import { FormErrors, PasswordField } from "./AuthControls";

const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export function SignInPage() {
  const { t } = useTranslation();
  const { user, account, loading } = useAuth();
  const [errors, setErrors] = useState(null);
  const [busy, setBusy] = useState(false);
  if (!loading && user) return <Navigate to={homeFor(account)} replace />;
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    const email = data.get("email"),
      password = data.get("password");
    const next = {};
    if (!validEmail(email)) next.email = "Ilagay ang tamang email address.";
    if (!password) next.password = "Ilagay ang password.";
    setErrors(Object.keys(next).length ? next : null);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await login({ email, password, remember: data.get("remember") === "on" });
    } catch (error) {
      setErrors({ form: authError(error) });
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-grid">
      <aside className="auth-intro">
        <h2>{t("Isang lugar para sa tulong at serbisyong barangay.")}</h2>
        <p>
          {t(
            "Humingi ng tulong, makilahok sa komunidad, at subaybayan ang iyong mga kahilingan.",
          )}{" "}
        </p>
        <p className="small muted">
          {t(
            "Bagong account? Kukumpirmahin muna ang email at paninirahan sa Caniogan.",
          )}{" "}
        </p>
      </aside>
      <section className="auth-card page-stack">
        <PageHeading
          title={t("Mag-log in")}
          description={t("Gamitin ang email at password ng iyong account.")}
        />
        <FormErrors errors={errors} />
        <form className="page-stack" onSubmit={submit} noValidate>
          <TextField
            id="email"
            name="email"
            label={t("Email address")}
            type="email"
            autoComplete="username"
            required
            error={errors?.email}
          />
          <PasswordField
            id="password"
            name="password"
            label={t("Password")}
            autoComplete="current-password"
            required
            error={errors?.password}
          />
          <label className="check-field">
            <input type="checkbox" name="remember" />
            <span>
              {t("Panatilihing naka-log in")}{" "}
              <span className="field__hint">
                {t(
                  "Huwag piliin sa computer o phone na ginagamit din ng iba.",
                )}{" "}
              </span>
            </span>
          </label>
          <Button type="submit" loading={busy}>
            {t("Mag-log in")}{" "}
          </Button>
          <Link to="/forgot-password">{t("Nakalimutan ang password?")}</Link>
        </form>
        <p>
          {t("Wala ka pang account?")}{" "}
          <Link to="/sign-up">{t("Gumawa ng account")}</Link>
        </p>
      </section>
    </div>
  );
}

export function SignUpPage() {
  const { t } = useTranslation();
  const { user, account, loading } = useAuth();
  const navigate = useNavigate();
  const [errors, setErrors] = useState(null);
  const [busy, setBusy] = useState(false);
  // Keep registration mounted until profile creation and the first email attempt finish.
  if (!loading && user && !busy)
    return <Navigate to={homeFor(account)} replace />;
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    const displayName = data.get("displayName").trim(),
      email = data.get("email"),
      password = data.get("password");
    const next = {};
    if (displayName.length < 2 || displayName.length > 80)
      next.displayName = "Ilagay ang pangalan na may 2–80 character.";
    if (!validEmail(email)) next.email = "Ilagay ang tamang email address.";
    if (password.length < 8)
      next.password = "Gumamit ng password na may hindi bababa sa 8 character.";
    if (password !== data.get("confirmPassword"))
      next.confirmPassword = "Hindi magkapareho ang dalawang password.";
    if (!data.get("acknowledge"))
      next.acknowledge = "Basahin at kumpirmahin ang paggamit ng impormasyon.";
    setErrors(Object.keys(next).length ? next : null);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      const result = await registerResident({ displayName, email, password });
      navigate("/verify-email", {
        replace: true,
        state: { emailSent: result.emailSent },
      });
    } catch (error) {
      setErrors({ form: authError(error) });
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-card auth-card--wide page-stack">
      <PageHeading
        title={t("Gumawa ng account")}
        description={t(
          "Gumawa ng account upang makapagpadala at masubaybayan ang iyong mga kahilingan.",
        )}
      />
      <FormErrors errors={errors} />
      <form className="page-stack" onSubmit={submit} noValidate>
        <TextField
          id="displayName"
          name="displayName"
          label={t("Pangalan sa profile")}
          autoComplete="nickname"
          maxLength={80}
          required
          error={errors?.displayName}
        />
        <TextField
          id="email"
          name="email"
          label={t("Email address")}
          type="email"
          autoComplete="email"
          required
          error={errors?.email}
          hint={t("Dito ipapadala ang link para kumpirmahin ang email.")}
        />
        <PasswordField
          id="password"
          name="password"
          label={t("Password")}
          autoComplete="new-password"
          minLength={8}
          required
          error={errors?.password}
          hint={t(
            "Hindi bababa sa 8 character. Puwedeng gumamit ng mahabang parirala.",
          )}
        />
        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          label={t("Ulitin ang password")}
          autoComplete="new-password"
          required
          error={errors?.confirmPassword}
        />
        <label className="check-field">
          <input
            id="acknowledge"
            name="acknowledge"
            type="checkbox"
            aria-invalid={!!errors?.acknowledge}
          />
          <span>
            {t("Nabasa ko ang")}{" "}
            <Link to="/privacy" target="_blank" rel="noreferrer">
              {t("paggamit ng impormasyon (bagong tab)")}{" "}
            </Link>{" "}
            {t(
              "at pinapayagan ko ang paggamit ng aking detalye para sa pagpapatunay ng account.",
            )}{" "}
          </span>
        </label>
        <Button type="submit" loading={busy}>
          {t("Gumawa ng account")}{" "}
        </Button>
      </form>
      <p>
        {t("May account ka na?")} <Link to="/sign-in">{t("Mag-log in")}</Link>
      </p>
    </div>
  );
}

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [errors, setErrors] = useState(null),
    [busy, setBusy] = useState(false),
    [sent, setSent] = useState(false);
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const email = new FormData(event.currentTarget).get("email");
    if (!validEmail(email)) {
      setErrors({ email: "Ilagay ang tamang email address." });
      return;
    }
    setErrors(null);
    setBusy(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (error) {
      if (error.code === "auth/user-not-found") setSent(true);
      else setErrors({ form: authError(error) });
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-card page-stack">
      <PageHeading
        title={t("I-reset ang password")}
        backTo="/sign-in"
        backLabel={t("Bumalik sa pag-log in")}
        description={t("Gamitin ang email na inilagay mo sa iyong account.")}
      />
      <FormErrors errors={errors} />
      {sent ? (
        <Notice title={t("Tingnan ang iyong email")} role="status">
          <p>
            {t(
              "Kung may account ang email na ito, makakatanggap ka ng reset link. Tingnan din ang spam folder. Buksan ang link para gumawa ng bagong password, pagkatapos ay bumalik dito.",
            )}{" "}
          </p>
        </Notice>
      ) : (
        <form className="page-stack" onSubmit={submit} noValidate>
          <TextField
            id="email"
            name="email"
            label={t("Email address")}
            type="email"
            autoComplete="email"
            required
            error={errors?.email}
          />
          <Button type="submit" loading={busy}>
            {t("Ipadala ang reset link")}{" "}
          </Button>
        </form>
      )}
    </div>
  );
}

export function VerifyEmailPage() {
  const { t } = useTranslation();
  const { user, account } = useAuth();
  const location = useLocation();
  const [errors, setErrors] = useState(null),
    [message, setMessage] = useState(
      location.state?.emailSent === false
        ? "Nagawa ang account pero hindi naipadala ang email. Piliin ang “Ipadala muli ang link”."
        : "",
    ),
    [busy, setBusy] = useState(false),
    [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  if (user?.emailVerified) return <Navigate to={homeFor(account)} replace />;
  async function perform(action) {
    setBusy(true);
    setErrors(null);
    setMessage("");
    try {
      if (action === "resend") {
        await resendVerification();
        setCooldown(60);
        setMessage(
          "Naipadala ang verification link. Tingnan ang inbox at spam folder.",
        );
      } else {
        const verified = await refreshEmailStatus();
        if (!verified)
          setMessage(
            "Hindi pa nakumpirma ang email. Buksan muna ang link sa email, saka subukan muli.",
          );
      }
    } catch (error) {
      setErrors({ form: authError(error) });
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-card page-stack">
      <PageHeading
        title={t("I-verify ang iyong email")}
        description={t("Buksan ang link na ipinadala sa {{email}}.", {
          email: user?.email || t("iyong email"),
        })}
      />
      <ol className="step-list">
        <li>{t("Tingnan ang inbox o spam folder.")}</li>
        <li>
          {t(
            "Buksan ang link sa email upang ma-verify ang iyong email address.",
          )}
        </li>
        <li>{t("Bumalik dito at piliin ang “Na-verify ko na ang email”.")}</li>
      </ol>
      <FormErrors errors={errors} />
      {message && (
        <Notice title={t("Katayuan ng email")} role="status">
          <p>{t(message)}</p>
        </Notice>
      )}
      <Button loading={busy} onClick={() => perform("refresh")}>
        {t("Na-verify ko na ang email")}{" "}
      </Button>
      <Button
        variant="secondary"
        disabled={busy || cooldown > 0}
        onClick={() => perform("resend")}
      >
        {cooldown
          ? t("Ipadala muli pagkaraan ng {{seconds}}s", { seconds: cooldown })
          : t("Ipadala muli ang link")}
      </Button>
      <SignOutButton />
      <Link to="/help">{t("Kailangan ng tulong?")}</Link>
    </div>
  );
}

export function CompleteAccountPage() {
  const { t } = useTranslation();
  const { account } = useAuth();
  const [errors, setErrors] = useState(null),
    [busy, setBusy] = useState(false);
  if (account) return <Navigate to={homeFor(account)} replace />;
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const name = new FormData(event.currentTarget).get("displayName").trim();
    if (name.length < 2 || name.length > 80) {
      setErrors({ displayName: "Ilagay ang pangalan na may 2–80 character." });
      return;
    }
    setBusy(true);
    setErrors(null);
    try {
      await createResidentProfile(name);
    } catch (error) {
      setErrors({ form: authError(error) });
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-card page-stack">
      <PageHeading
        title={t("Kumpletuhin ang account")}
        description={t(
          "May account ka na. I-save ang profile para magpatuloy; hindi kailangang mag-register muli.",
        )}
      />
      <FormErrors errors={errors} />
      <form className="page-stack" onSubmit={submit} noValidate>
        <TextField
          id="displayName"
          name="displayName"
          label={t("Pangalan sa profile")}
          autoComplete="nickname"
          maxLength={80}
          required
          error={errors?.displayName}
        />
        <Button loading={busy} type="submit">
          {t("I-save ang profile")}{" "}
        </Button>
      </form>
      <SignOutButton />
    </div>
  );
}

export function SignOutButton() {
  const { t } = useTranslation();
  const [error, setError] = useState(null),
    [busy, setBusy] = useState(false);
  return (
    <div className="page-stack">
      {error && <p role="alert">{t(error)}</p>}
      <Button
        variant="secondary"
        loading={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await logout();
          } catch (failure) {
            setError(authError(failure));
          } finally {
            setBusy(false);
          }
        }}
      >
        {t("Mag-log out")}{" "}
      </Button>
    </div>
  );
}

export function AccountStatusPage() {
  const { t } = useTranslation();
  return (
    <div className="auth-card page-stack">
      <PageHeading title={t("Hindi muna magagamit ang account")} />
      <Notice title={t("Kailangan ng tulong mula sa barangay")}>
        <p>
          {t(
            "May paghihigpit sa account na ito. Lumapit sa barangay desk para malaman ang susunod na hakbang.",
          )}{" "}
        </p>
      </Notice>
      <SignOutButton />
      <Link to="/help">{t("Gabay at tulong")}</Link>
    </div>
  );
}

export function AccessDeniedPage() {
  const { t } = useTranslation();
  const { account } = useAuth();
  return (
    <div className="auth-card page-stack">
      <PageHeading
        title={t("Walang access sa pahinang ito")}
        description={t(
          "Hindi kasama ang pahinang ito sa tungkulin ng iyong account.",
        )}
      />
      <ActionLink to={homeFor(account)}>
        {t("Bumalik sa iyong Home")}
      </ActionLink>
      <SignOutButton />
    </div>
  );
}

export function PrivacyPage() {
  const { t } = useTranslation();
  return (
    <div className="auth-card auth-card--wide page-stack">
      <PageHeading
        title={t("Privacy at personal na impormasyon")}
        description={t(
          "Alamin kung paano ginagamit at pinoprotektahan ang iyong impormasyon.",
        )}
      />
      <h2>{t("Impormasyong ginagamit")}</h2>
      <p>
        {t(
          "Ginagamit ang iyong pangalan, email at address upang mapatunayan ang account at paninirahan, at maiproseso ang iyong mga kahilingan. Hindi ipinapakita sa komunidad ang iyong address o aplikasyon sa pagpapatunay.",
        )}
      </p>
      <h2>{t("Access sa iyong impormasyon")}</h2>
      <p>
        {t(
          "Ikaw at ang kawani na may pahintulot sa pagsusuri ang maaaring makakita ng iyong aplikasyon sa pagpapatunay. Hindi ibinabahagi ang iyong password sa kawani.",
        )}
      </p>
      <h2>{t("Kaligtasan ng account")}</h2>
      <p>
        {t(
          "Gumamit ng password na hindi mo ginagamit sa ibang account. Mag-log out pagkatapos gumamit ng device na pinagsasaluhan. Huwag ibigay ang iyong password sa sinuman.",
        )}
      </p>
      <h2>{t("Pagwawasto at mga tanong")}</h2>
      <p>
        {t(
          "Kung may mali sa iyong impormasyon o may tanong tungkol sa paggamit nito, makipag-ugnayan sa tanggapan ng barangay bago magpasa ng karagdagang detalye.",
        )}
      </p>
      <ActionLink to="/sign-in">{t("Bumalik sa pag-log in")}</ActionLink>
    </div>
  );
}

export function AccountPage() {
  const { t } = useTranslation();
  const { user, account } = useAuth();
  return (
    <div className="task-column page-stack">
      <PageHeading title={t("Account at privacy")} />
      <dl className="definition-list">
        <div>
          <dt>{t("Pangalan sa profile")}</dt>
          <dd>{account?.profile?.displayName}</dd>
        </div>
        <div>
          <dt>{t("Email")}</dt>
          <dd>{user?.email}</dd>
        </div>
        <div>
          <dt>{t("Katayuan")}</dt>
          <dd>{t("Kumpirmadong email at aprubadong paninirahan")}</dd>
        </div>
      </dl>
      <Link to="/privacy">{t("Privacy")}</Link>
      <SignOutButton />
    </div>
  );
}
