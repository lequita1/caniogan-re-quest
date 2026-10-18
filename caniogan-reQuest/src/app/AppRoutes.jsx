import { Navigate, Route, Routes } from "react-router";
import { AppShell, RouteFocus } from "./AppShell";
import {
  AccountPage,
  CommunityPage,
  DocumentDetail,
  DocumentsPage,
  EventDetail,
  EventsPage,
  HelpPage,
  MessagesPage,
  NewRequestPage,
  NotificationsPage,
  RequestDetail,
  RequestsPage,
  ResidentHome,
} from "../features/preview/ResidentPages";
import {
  CaptainHome,
  StaffHome,
  StaffQueue,
} from "../features/preview/StaffPages";
import { ActionLink, EmptyState, PageHeading } from "../components/ui";

function NotFound() {
  return (
    <div className="task-column page-stack">
      <PageHeading title="Hindi makita ang pahina" />
      <EmptyState
        title="Maaaring nagbago ang link"
        action={<ActionLink to="/resident">Bumalik sa Tahanan</ActionLink>}
      >
        <p>Pumili ng pahina mula sa menu para magpatuloy.</p>
      </EmptyState>
    </div>
  );
}

export function AppRoutes() {
  return (
    <>
      <RouteFocus />
      <Routes>
        <Route path="/" element={<Navigate to="/resident" replace />} />
        <Route path="resident" element={<AppShell audience="resident" />}>
          <Route index element={<ResidentHome />} />
          <Route path="requests" element={<RequestsPage />} />
          <Route path="requests/new" element={<NewRequestPage />} />
          <Route path="requests/:requestId" element={<RequestDetail />} />
          <Route path="community" element={<CommunityPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="documents/:documentId" element={<DocumentDetail />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="events/:eventId" element={<EventDetail />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="account" element={<AccountPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="help" element={<HelpPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="staff" element={<AppShell audience="staff" />}>
          <Route index element={<StaffHome />} />
          <Route path="help" element={<HelpPage home="/staff" />} />
          <Route path=":queueId" element={<StaffQueue />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="captain" element={<AppShell audience="captain" />}>
          <Route index element={<CaptainHome />} />
          <Route path="help" element={<HelpPage home="/captain" />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route element={<AppShell audience="resident" />}>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
