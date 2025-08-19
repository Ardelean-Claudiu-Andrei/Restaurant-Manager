// src/pages/AdminRedirect.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../firebase";

const DEVELOPERS = new Set<string>(["aclaudiuandrei586@gmail.com"]);
const CLIENTS = new Set<string>(["adresaclient@gmail.com"]);

const AdminRedirect: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      const userEmail = user.email ?? "";

      if (DEVELOPERS.has(userEmail)) {
        navigate("/admindev", { replace: true });
      } else if (CLIENTS.has(userEmail)) {
        navigate("/adminpage", { replace: true });
      } else {
        alert("Nu ai acces la zona de administrare.");
        await signOut(auth);
      }
    } catch (error) {
      console.error("Eroare la autentificare:", error);
      alert("Email sau parolă greșită!");
    }
  };

  return (
    <div className="admin-login login-container">
      <h2>Autentificare Administrator</h2>
      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Parolă:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <button type="submit">Autentificare</button>
      </form>
    </div>
  );
};

export default AdminRedirect;
