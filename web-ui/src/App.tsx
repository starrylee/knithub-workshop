import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import PatternsPage from "./pages/PatternsPage";
import PatternDetailPage from "./pages/PatternDetailPage";
import NotebookPage from "./pages/NotebookPage";
import CommunityPage from "./pages/CommunityPage";
import GroupDetailPage from "./pages/GroupDetailPage";
import AboutPage from "./pages/AboutPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="flex flex-col min-h-screen" style={{ background: "var(--background)" }}>
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/patterns" element={<PatternsPage />} />
              <Route path="/patterns/:id" element={<PatternDetailPage />} />
              <Route path="/users/:username" element={<NotebookPage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/community/groups/:id" element={<GroupDetailPage />} />
              <Route path="/about" element={<AboutPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
