import { Navigate, Route, Routes } from "react-router-dom";

import { DirectPage } from "@/pages/direct";
import { DashboardPage } from "@/pages/dashboard";
import { DrillPage } from "@/pages/drill";
import { FocusPage } from "@/pages/focus";
import { HomePage } from "@/pages/home";
import { MapPage } from "@/pages/map";
import { NewProjectPage } from "@/pages/new-project";
import { ProjectLayout } from "@/pages/project-layout";
import { RetrievalPage } from "@/pages/retrieval";
import { SettingsPage } from "@/pages/settings";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/projects/new" element={<NewProjectPage />} />
      <Route path="/projects/:id" element={<ProjectLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="focus" element={<FocusPage />} />
        <Route path="retrieval" element={<RetrievalPage />} />
        <Route path="direct" element={<DirectPage />} />
        <Route path="drill" element={<DrillPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
