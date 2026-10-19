import { useTranslation } from "react-i18next";
import { Route, Routes } from "react-router";
import { AppShell, RouteFocus } from "./AppShell";
import {
  DocumentDetail,
  DocumentsPage,
  EventDetail,
  EventsPage,
  HelpPage,
  MessagesPage,
} from "../features/preview/ResidentPages";
import {
  CaptainHome,
  StaffHome,
  StaffQueue,
} from "../features/preview/StaffPages";
import { ActionLink, EmptyState, PageHeading } from "../components/ui";
import { AuthLayout } from "../features/auth/AuthLayout";
import {
  AccessDeniedPage,
  AccountPage,
  AccountStatusPage,
  CompleteAccountPage,
  ForgotPasswordPage,
  PrivacyPage,
  SignInPage,
  SignUpPage,
  VerifyEmailPage,
} from "../features/auth/AuthPages";
import {
  HomeRedirect,
  RequireEmail,
  RequireRole,
  RequireSession,
} from "../features/auth/RouteGuards";
import {
  VerificationPage,
  VerificationQueue,
  VerificationReview,
} from "../features/verification/VerificationPages";

import {
  RequestHome,
  MyRequestsPage,
  NewHelpRequest,
  EditHelpRequest,
  HelpRequestDetail,
  CommunityBoard,
  RequestReviewQueue,
  RequestReviewPage,
  RequestUpdatesPage,
} from "../features/requests/RequestPages";
import { VolunteeringPage } from "../features/requests/VolunteeringPage";

function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="task-column page-stack">
      <PageHeading title={t("Hindi makita ang pahina")} />
      <EmptyState
        title={t("Maaaring nagbago ang link")}
        action={<ActionLink to="/resident">{"Bumalik sa Home"}</ActionLink>}
      >
        <p>{t("Pumili ng pahina mula sa menu para magpatuloy.")}</p>
      </EmptyState>
    </div>
  );
}

export function AppRoutes() {
  return (
    <>
      <RouteFocus />
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route element={<AuthLayout />}>
          <Route path="sign-in" element={<SignInPage />} />
          <Route path="sign-up" element={<SignUpPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="help" element={<HelpPage home="/" />} />
          <Route element={<RequireSession />}>
            <Route path="complete-account" element={<CompleteAccountPage />} />
            <Route path="verify-email" element={<VerifyEmailPage />} />
            <Route path="account-status" element={<AccountStatusPage />} />
            <Route element={<RequireEmail />}>
              <Route path="verification" element={<VerificationPage />} />
              <Route path="access-denied" element={<AccessDeniedPage />} />
            </Route>
          </Route>
        </Route>
        <Route element={<RequireSession />}>
          <Route element={<RequireEmail />}>
            <Route element={<RequireRole role="resident" />}>
              <Route path="resident" element={<AppShell audience="resident" />}>
                <Route index element={<RequestHome />} />
                <Route path="requests" element={<MyRequestsPage />} />
                <Route path="volunteering" element={<VolunteeringPage />} />
                <Route path="requests/new" element={<NewHelpRequest />} />
                <Route
                  path="requests/:requestId"
                  element={<HelpRequestDetail />}
                />
                <Route
                  path="requests/:requestId/edit"
                  element={<EditHelpRequest />}
                />
                <Route path="community" element={<CommunityBoard />} />
                <Route
                  path="community/:requestId"
                  element={<HelpRequestDetail board />}
                />
                <Route path="documents" element={<DocumentsPage />} />
                <Route
                  path="documents/:documentId"
                  element={<DocumentDetail />}
                />
                <Route path="events" element={<EventsPage />} />
                <Route path="events/:eventId" element={<EventDetail />} />
                <Route path="messages" element={<MessagesPage />} />
                <Route path="account" element={<AccountPage />} />
                <Route path="notifications" element={<RequestUpdatesPage />} />
                <Route path="help" element={<HelpPage />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Route>
            <Route element={<RequireRole role="staff" />}>
              <Route path="staff" element={<AppShell audience="staff" />}>
                <Route index element={<StaffHome />} />
                <Route path="help" element={<HelpPage home="/staff" />} />
                <Route
                  element={
                    <RequireRole role="staff" capability="reviewResidents" />
                  }
                >
                  <Route path="verification" element={<VerificationQueue />} />
                  <Route
                    path="verification/:uid"
                    element={<VerificationReview />}
                  />
                </Route>
                <Route
                  element={
                    <RequireRole role="staff" capability="reviewRequests" />
                  }
                >
                  <Route path="moderation" element={<RequestReviewQueue />} />
                  <Route
                    path="moderation/:requestId"
                    element={<RequestReviewPage />}
                  />
                </Route>
                <Route path=":queueId" element={<StaffQueue />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Route>
            <Route element={<RequireRole role="captain" />}>
              <Route path="captain" element={<AppShell audience="captain" />}>
                <Route index element={<CaptainHome />} />
                <Route path="help" element={<HelpPage home="/captain" />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Route>
          </Route>
        </Route>
        <Route element={<AuthLayout />}>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
