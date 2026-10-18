import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import seal from "../assets/brand/caniogan-seal.png";

const residentLinks = [
  ["Tahanan", "/resident"],
  ["Mga kahilingan", "/resident/requests"],
  ["Komunidad", "/resident/community"],
  ["Dokumento", "/resident/documents"],
  ["Mga aktibidad", "/resident/events"],
  ["Mensahe", "/resident/messages"],
];
const staffLinks = [
  ["Mga queue", "/staff"],
  ["Dokumento", "/staff/documents"],
  ["Puntos", "/staff/points"],
];
const captainLinks = [["Pangkalahatang ulat", "/captain"]];

export function AppShell({ audience }) {
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
        Lumaktaw sa nilalaman
      </a>
      <div className="preview-banner">PROTOTYPE · Sample na datos</div>
      <header className="site-header">
        <div className="header-row">
          <Link
            to={home}
            className="brand"
            aria-label="Caniogan Re:Quest — Tahanan"
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
              <span className="brand__name">Caniogan Re:Quest</span>
              <span className="brand__place">Malolos, Bulacan</span>
            </span>
          </Link>
          <nav className="utility-nav" aria-label="Account at tulong">
            {isResident ? (
              <Link className="utility-link" to="/resident/account">
                Alex · Account
              </Link>
            ) : (
              <span className="role-label">
                Tungkulin: {audience === "staff" ? "Kawani" : "Captain"}
              </span>
            )}
            <Link className="utility-link" to={help}>
              Gabay
            </Link>
            {isResident && (
              <Link className="utility-link" to="/resident/notifications">
                Mga abiso
              </Link>
            )}
          </nav>
        </div>
        <nav className="desktop-nav" aria-label="Pangunahing nabigasyon">
          {links.map(([label, to]) => (
            <NavLink key={to} to={to} end={to === home} className="nav-link">
              {label}
            </NavLink>
          ))}
        </nav>
        <nav
          className="mobile-nav"
          aria-label="Pangunahing nabigasyon sa maliit na screen"
        >
          <NavLink to={home} end className="nav-link" onClick={closeMenu}>
            {isResident
              ? "Tahanan"
              : audience === "staff"
                ? "Mga queue"
                : "Mga ulat"}
          </NavLink>
          <NavLink
            to={isResident ? "/resident/requests" : help}
            className="nav-link"
            onClick={closeMenu}
          >
            {isResident ? "Mga hiling" : "Gabay"}
          </NavLink>
          <button
            type="button"
            className="nav-link"
            ref={menuButton}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? "Isara" : "Menu"}
          </button>
        </nav>
        {menuOpen && (
          <nav
            id="mobile-menu"
            className="mobile-menu"
            aria-label="Lahat ng pahina"
          >
            {links.map(([label, to]) => (
              <NavLink to={to} end={to === home} key={to} onClick={closeMenu}>
                {label}
              </NavLink>
            ))}
            {isResident && (
              <>
                <NavLink to="/resident/notifications" onClick={closeMenu}>
                  Mga abiso
                </NavLink>
                <NavLink to="/resident/account" onClick={closeMenu}>
                  Account at privacy
                </NavLink>
              </>
            )}
            <NavLink to={help} onClick={closeMenu}>
              Gabay at tulong
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
            <p className="footer-name">Barangay Caniogan · Malolos, Bulacan</p>
            <p className="small muted">
              Address, oras at opisyal na requirements: [placeholder]
            </p>
          </div>
          <Link to={help}>Gabay at tulong</Link>
        </div>
        <nav className="preview-links" aria-label="Mga halimbawa ng layout">
          <span>Mga layout na puwedeng tingnan:</span>
          <NavLink to="/resident">Residente</NavLink>
          <NavLink to="/staff">Kawani</NavLink>
          <NavLink to="/captain">Captain</NavLink>
        </nav>
      </footer>
    </div>
  );
}

export function RouteFocus() {
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
  }, [pathname]);
  return null;
}
