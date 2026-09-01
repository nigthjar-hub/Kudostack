import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { AddFic } from "./pages/AddFic";
import { Library } from "./pages/Library";
import { Profile } from "./pages/Profile";
import { ProfileEdit } from "./pages/ProfileEdit";
import { Friends } from "./pages/Friends";
import { Stats } from "./pages/Stats";
import { Settings } from "./pages/Settings";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/library" element={<Library />} />
          <Route path="/add" element={<AddFic />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile/edit" element={<ProfileEdit />} />
          <Route path="/u/:username" element={<Profile />} />
          <Route path="/" element={<Navigate to="/friends" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/friends" replace />} />
    </Routes>
  );
}
