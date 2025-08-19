// src/components/Header.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ref, onValue } from "firebase/database";
import { realtimeDB } from "../firebase";
import "./Header.css";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  // State pentru setările site-ului, inclusiv numele firmei
  const [siteSettings, setSiteSettings] = useState({
    companyName: "Your Name",
  });

  const toggleMenu = () => setMenuOpen(!menuOpen);
  // Închid meniul atunci când se face click pe un link
  const handleLinkClick = () => setMenuOpen(false);

  // Preluare setări site (inclusiv numele firmei) din Firebase
  useEffect(() => {
    const settingsRef = ref(realtimeDB, "siteSettings");
    onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        setSiteSettings(snapshot.val());
      }
    });
  }, []);

  return (
    <header className="header-section">
      <div className="container nav-container">
        <div className="logo">
          <Link to="/" className="logo">
            <h1>{siteSettings.companyName}</h1>
          </Link>
        </div>
        <nav className="nav-menu">
          <div className="hamburger" onClick={toggleMenu}>
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </div>
          <ul className={menuOpen ? "open" : ""}>
            <li onClick={handleLinkClick}>
              <Link to="/">Acasă</Link>
            </li>
            <li onClick={handleLinkClick}>
              <Link to="/about">Despre</Link>
            </li>
            <li onClick={handleLinkClick}>
              <Link to="/gallery">Galerie</Link>
            </li>
            <li onClick={handleLinkClick}>
              <Link to="/contact">Contact</Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
