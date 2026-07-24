import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./features/auth/LoginPage";
import { GardensListPage } from "./features/gardens/GardensListPage";
import { GardenDetailPage } from "./features/gardens/GardenDetailPage";
import { PlotDetailPage } from "./features/plots/PlotDetailPage";
import { PlantDetailPage } from "./features/plants/PlantDetailPage";
import { GardenWorkspacePage } from "./features/workspace/GardenWorkspacePage";

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <GardensListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gardens/:gardenId"
            element={
              <ProtectedRoute>
                <GardenDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gardens/:gardenId/workspace"
            element={
              <ProtectedRoute>
                <GardenWorkspacePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gardens/:gardenId/plots/:plotId"
            element={
              <ProtectedRoute>
                <PlotDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gardens/:gardenId/plots/:plotId/plants/:plantId"
            element={
              <ProtectedRoute>
                <PlantDetailPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
