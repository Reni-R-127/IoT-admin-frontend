import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "./components/layout/AdminLayout";
import Overview from "./components/dashboard/Overview";
import CoursesPage from "./pages/CoursesPage";
import BlogsPage from "./pages/BlogsPage";
import PricingPage from "./pages/PricingPage";
import ProjectLabPage from "./pages/ProjectLabPage";
import EnquiriesPage from "./components/enquiries/EnquiriesPage";
import NotificationsPage from "./components/notifications/NotificationsPage";
import ReviewsPage from "./components/reviews/ReviewsPage";
import StudentTestimonialsPage from "./components/testimonials/StudentTestimonialsPage";
import StaffPage from "./components/staff/StaffPage";
import SettingsPage from "./components/settings/SettingsPage";
import "./styles/global.css";

export default function App() {
  return <BrowserRouter><Routes><Route element={<AdminLayout />}>
    <Route index element={<Navigate to="/overview" replace />} />
    <Route path="/overview" element={<Overview />} />
    <Route path="/courses" element={<CoursesPage />} />
    <Route path="/blogs" element={<BlogsPage />} />
    <Route path="/pricing" element={<PricingPage />} />
    <Route path="/projects" element={<ProjectLabPage />} />
    <Route path="/testimonials" element={<StudentTestimonialsPage />} />
    <Route path="/enquiries" element={<EnquiriesPage />} />
    <Route path="/notifications" element={<NotificationsPage />} />
    <Route path="/reviews" element={<ReviewsPage />} />
    <Route path="/staff" element={<StaffPage />} />
    <Route path="/settings" element={<SettingsPage />} />
    <Route path="*" element={<Navigate to="/overview" replace />} />
  </Route></Routes></BrowserRouter>;
}
