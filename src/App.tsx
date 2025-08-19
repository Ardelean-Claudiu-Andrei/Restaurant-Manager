import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import AdminRedirect from "./pages/AdminRedirect";
import AdminPanel from "./pages/AdminPanel";
import AdminPanelDev from "./pages/AdminPanelDev";
import "./App.css";
import Footer from "./components/Footer";
// import About from "./pages/About";

const App: React.FC = () => {
  return (
    <div className="app-container">
      <main className="main-content container">
        <Routes>
          <Route path="/" element={<Home />} />
          {/* <Route path="/about" element={<About />} /> */}
          <Route path="/admin" element={<AdminRedirect />} />
          <Route path="/adminpage" element={<AdminPanel />} />
          <Route path="/admindev" element={<AdminPanelDev />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;
