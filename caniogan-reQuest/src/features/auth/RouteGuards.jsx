import { useTranslation } from "react-i18next";
import { Navigate, Outlet, useLocation } from "react-router";
import { Button, Notice, PageHeading } from "../../components/ui";
import { homeFor, useAuth } from "./authContext";
import { logout } from "./authService";

export function SessionLoading() {
  const { t } = useTranslation();
  return (
    <div className="session-state" role="status">
      {t("Binubuksan ang iyong account…")}{" "}
    </div>
  );
}

export function RequireSession() {
  const { t } = useTranslation();
  const { user, account, loading, error, retry } = useAuth();
  const location = useLocation();
  if (loading) return <SessionLoading />;
  if (!user)
    return (
      <Navigate to="/sign-in" state={{ from: location.pathname }} replace />
    );
  if (error)
    return (
      <div className="session-state page-stack">
        <PageHeading title={t("Hindi mabuksan ang account")} />
        <Notice title={t("Tingnan ang koneksiyon")}>
          <p>
            {t(
              "Hindi mabasa ang account. Kung may internet ka na, ipasuri sa tagapangasiwa ang access settings.",
            )}{" "}
          </p>
        </Notice>
        <Button onClick={retry}>{t("Subukan muli")}</Button>
        <Button variant="secondary" onClick={() => logout().catch(retry)}>
          {t("Mag-log out")}{" "}
        </Button>
      </div>
    );
  if (!account && location.pathname !== "/complete-account")
    return <Navigate to="/complete-account" replace />;
  return <Outlet />;
}

export function RequireEmail() {
  const { user } = useAuth();
  return user?.emailVerified ? (
    <Outlet />
  ) : (
    <Navigate to="/verify-email" replace />
  );
}

export function RequireRole({ role, capability }) {
  const { account } = useAuth();
  if (account?.standing !== "active")
    return <Navigate to="/account-status" replace />;
  if (
    account?.role !== role ||
    (capability && account?.capabilities?.[capability] !== true)
  )
    return <Navigate to="/access-denied" replace />;
  if (role === "resident" && account.verification?.status !== "approved")
    return <Navigate to="/verification" replace />;
  return <Outlet />;
}

export function HomeRedirect() {
  const { user, account, loading } = useAuth();
  if (loading) return <SessionLoading />;
  return <Navigate to={user ? homeFor(account) : "/sign-in"} replace />;
}
