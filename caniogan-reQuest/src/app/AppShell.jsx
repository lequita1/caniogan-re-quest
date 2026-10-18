import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import seal from "../assets/brand/caniogan-seal.png";
import { useAuth } from "../features/auth/authContext";
import { SignOutButton } from "../features/auth/AuthPages";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

const residentLinks = [
  ["Home", "/resident"],
  ["Mga kahilingan", "/resident/requests"],
  ["Komunidad", "/resident/community"],
  ["Dokumento", "/resident/documents"],
  ["Mga aktibidad", "/resident/events"],
  ["Mensahe", "/resident/messages"],
];
const staffLinks = [
  ["Mga susuriin", "/staff"],
  ["Dokumento", "/staff/documents"],
  ["Puntos", "/staff/points"],
];
const captainLinks = [["Pangkalahatang ulat", "/captain"]];

export function AppShell({ audience }) {
  const { t } = useTranslation();
  const { account } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef(null);
  const location = useLocation();
  const isResident = audience === "resident";
  const home = `/${audience}`;
  const links = isResident
    ? residentLinks
    : audience === "staff"
      ? staffLinks
      : captainLinks;
  const help = `${home}/help`;
  function closeMenu() {
    setMenuOpen(false);
  }
  function onEscape(event) {
    if (event.key === "Escape" && menuOpen) {
      setMenuOpen(false);
      menuButton.current?.focus();
    }
  }
  return (
    <div className="app-shell" data-audience={audience} onKeyDown={onEscape}>
      <a className="skip-link" href="#main-content">
        {t("Lumaktaw sa nilalaman")}{" "}
      </a>
      <header className="site-header">
        <div className="header-row">
          <Link
            to={home}
            className="brand"
            aria-label={t("Caniogan Re:Quest — Home")}
            onClick={closeMenu}
          >
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
            <nav className="utility-nav" aria-label={t("Account at tulong")}>
              {isResident ? (
                <Link className="utility-link" to="/resident/account">
                  {account?.profile?.displayName}
                  {t("· Account")}{" "}
                </Link>
              ) : (
                <span className="role-label">
                  {t("Tungkulin:")}{" "}
                  {audience === "staff" ? t("Kawani") : t("Captain")}
                </span>
              )}
              <Link className="utility-link" to={help}>
                {t("Gabay")}{" "}
              </Link>
              {isResident && (
                <Link className="utility-link" to="/resident/notifications">
                  {t("Mga abiso")}{" "}
                </Link>
              )}
            </nav>
          </div>
        </div>
        <nav className="desktop-nav" aria-label={t("Pangunahing nabigasyon")}>
          {links.map(([label, to]) => (
            <NavLink key={to} to={to} end={to === home} className="nav-link">
              {t(label)}
            </NavLink>
          ))}
        </nav>
        <nav
          className="mobile-nav"
          aria-label={t("Pangunahing nabigasyon sa maliit na screen")}
        >
          <NavLink to={home} end className="nav-link" onClick={closeMenu}>
            {isResident
              ? t("Home")
              : audience === "staff"
                ? t("Mga susuriin")
                : t("Mga ulat")}
          </NavLink>
          <NavLink
            to={isResident ? "/resident/requests" : help}
            className="nav-link"
            onClick={closeMenu}
          >
            {isResident ? t("Mga kahilingan") : t("Gabay")}
          </NavLink>
          <button
            type="button"
            className="nav-link"
            ref={menuButton}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? t("Isara") : t("Menu")}
          </button>
        </nav>
        {menuOpen && (
          <nav
            id="mobile-menu"
            className="mobile-menu"
            aria-label={t("Lahat ng pahina")}
          >
            {links.map(([label, to]) => (
              <NavLink to={to} end={to === home} key={to} onClick={closeMenu}>
                {t(label)}
              </NavLink>
            ))}
            {isResident && (
              <>
                <NavLink to="/resident/notifications" onClick={closeMenu}>
                  {t("Mga abiso")}{" "}
                </NavLink>
                <NavLink to="/resident/account" onClick={closeMenu}>
                  {t("Account at privacy")}{" "}
                </NavLink>
              </>
            )}
            <NavLink to={help} onClick={closeMenu}>
              {t("Gabay at tulong")}{" "}
            </NavLink>
          </nav>
        )}
      </header>
      <main
        id="main-content"
        className="main-content"
        tabIndex="-1"
        key={location.pathname}
      >
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="footer-content">
          <div>
            <p className="footer-name">
              {t("Barangay Caniogan · Malolos, Bulacan")}
            </p>
            <p className="small muted">
              {t(
                "Para sa oras ng opisina at mga kinakailangan, makipag-ugnayan sa tanggapan ng barangay.",
              )}{" "}
            </p>
          </div>
          <Link to={help}>{t("Gabay at tulong")}</Link>
        </div>
        <div className="preview-links">
          <SignOutButton />
        </div>
      </footer>
    </div>
  );
}

export function RouteFocus() {
  const { i18n } = useTranslation();
  const { pathname } = useLocation();
  const previousPath = useRef(pathname);
  useEffect(() => {
    const heading = document.getElementById("page-title");
    document.title = heading
      ? `${heading.textContent} | Caniogan Re:Quest`
      : "Caniogan Re:Quest";
    if (previousPath.current !== pathname) {
      window.scrollTo(0, 0);
      heading?.focus({ preventScroll: true });
      previousPath.current = pathname;
    }
  }, [pathname, i18n.resolvedLanguage]);
  return null;
}
