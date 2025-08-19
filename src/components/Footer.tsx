import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { realtimeDB } from "../firebase";
import "./Footer.css";

type SiteSettings = {
  companyName?: string;
  title?: string;
  phone?: string;
  email?: string;
  address?: string;
  mapSrc?: string; // embed URL (Google Maps etc.)
};

const Footer: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings>({});

  useEffect(() => {
    const settingsRef = ref(realtimeDB, "siteSettings");
    const off = onValue(settingsRef, (snap) => {
      const s = (snap.val() ?? {}) as SiteSettings;
      setSettings(s);
    });
    return () => off();
  }, []);

  const companyName =
    (settings.companyName && settings.companyName.trim()) ||
    (settings.title && settings.title.trim()) ||
    "Your Name";

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-info">
          <h4 className="footer-brand">{companyName}</h4>

          {settings.address && (
            <p className="footer-line">
              <span className="footer-label">Adresă:</span> {settings.address}
            </p>
          )}

          <ul className="contact-list">
            {settings.phone && (
              <li>
                <span className="footer-label">Telefon:</span>{" "}
                <a href={`tel:${settings.phone}`}>{settings.phone}</a>
              </li>
            )}
            {settings.email && (
              <li>
                <span className="footer-label">Email:</span>{" "}
                <a href={`mailto:${settings.email}`}>{settings.email}</a>
              </li>
            )}
          </ul>
        </div>

        {settings.mapSrc ? (
          <div className="footer-map">
            <iframe
              src={settings.mapSrc}
              title={`${companyName} map`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        ) : null}
      </div>

      <div className="footer-bottom">
        <div className="container">
          <p>
            &copy; {new Date().getFullYear()} {companyName}. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
