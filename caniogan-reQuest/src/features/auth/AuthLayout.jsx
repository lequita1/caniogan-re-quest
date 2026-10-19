import { useTranslation } from "react-i18next";
import { Link, Outlet } from "react-router";
import seal from "../../assets/brand/caniogan-seal.png";
import "./auth.css";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";

export function AuthLayout() {
  const { t } = useTranslation();
  return (
    <div className="app-shell auth-shell">
      <a className="skip-link" href="#main-content">
        {t("Lumaktaw sa nilalaman")}{" "}
      </a>
      <header className="site-header header-row">
        <Link to="/" className="brand">
          <img
            src={seal}
            alt=""
            width="44"
            height="44"
            className="brand__seal"
          />
          <span className="brand__identity">
            <span className="brand__name">{t("Caniogan Re:Quest")}</span>
            <span className="brand__place">{t("Malolos, Bulacan")}</span>
          </span>
        </Link>
        <div className="header-tools">
          <LanguageSwitcher />
          <Link to="/help" className="auth-help">
            {t("Gabay at tulong")}{" "}
          </Link>
        </div>
      </header>
      <main id="main-content" className="auth-main" tabIndex="-1">
        <Outlet />
      </main>
      <footer className="auth-footer">
        <span>{t("Barangay Caniogan · Malolos, Bulacan")}</span>
        <Link to="/privacy">{t("Privacy")}</Link>
      </footer>
    </div>
  );
}
