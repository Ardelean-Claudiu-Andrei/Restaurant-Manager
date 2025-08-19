// src/pages/AdminPanel.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  ref,
  onValue,
  push,
  set,
  update,
  remove,
  get,
} from "firebase/database";
import { auth, realtimeDB } from "../firebase";
import "./AdminPanelDev.css"; // reutilizăm stilurile existente

/* ===================== Types ===================== */

export type CategoryName = "Burger" | "Pizza" | "Dessert" | (string & {});
export type Tag = "new" | "popular";

export interface Product {
  id: string;
  name: string;
  description: string;
  imageBase64?: string;
  image?: string; // dacă vrei să folosești URL din Storage
  category: CategoryName;
  price?: number;
  tags?: Tag[];
}

export interface CategoryItem {
  id: string;
  name: CategoryName;
}

/* ===================== Helpers ===================== */

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });

const cleanUndefined = (o: Record<string, any>) => {
  const c = { ...o };
  Object.keys(c).forEach((k) => c[k] === undefined && delete c[k]);
  return c;
};

const mapList = <T extends object>(obj: Record<string, T>) =>
  Object.entries(obj).map(([id, v]) => ({ id, ...(v as any) }));

/* ===================== Component ===================== */

// IMPORTANT: adaugă aici email-urile clientului care au voie în acest panou
const CLIENTS = new Set<string>(["adresaclient@gmail.com"]);
// (opțional) dacă se autentifică un developer, îl redirecționăm în panoul lui
const DEVELOPERS = new Set<string>(["aclaudiuandrei586@gmail.com"]);

type Tab = "products" | "categories";

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();

  /* --------------------- Auth --------------------- */
  const [user, setUser] = useState<typeof auth.currentUser>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) return;
      const email = u.email ?? "";
      if (CLIENTS.has(email)) {
        setAccessDenied(false);
        return; // rămâne în acest panou
      }
      if (DEVELOPERS.has(email)) {
        navigate("/admindev", { replace: true });
        return;
      }
      // nu are acces
      setAccessDenied(true);
    });
    return () => unsub();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const { user } = await signInWithEmailAndPassword(
        auth,
        loginEmail,
        loginPassword
      );
      const email = user.email ?? "";
      if (!CLIENTS.has(email)) {
        if (DEVELOPERS.has(email)) {
          navigate("/admindev", { replace: true });
        } else {
          alert("Nu ai acces la panoul client.");
          await signOut(auth);
        }
        return;
      }
      setLoginEmail("");
      setLoginPassword("");
    } catch (err) {
      console.error(err);
      alert("Email sau parolă greșită.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/admin", { replace: true });
  };

  /* --------------------- Tabs & Data State --------------------- */
  const [tab, setTab] = useState<Tab>("products");

  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const emptyProduct: Omit<Product, "id"> = {
    name: "",
    description: "",
    category: "Burger",
    price: undefined,
    tags: [],
    imageBase64: "",
  };

  const [newProduct, setNewProduct] =
    useState<Omit<Product, "id">>(emptyProduct);
  const [productImageFile, setProductImageFile] = useState<File | null>(null);

  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);

  // Categories
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [newCategory, setNewCategory] = useState<CategoryName>("");

  // fetch Products & Categories când user este autentificat și are drepturi
  useEffect(() => {
    if (!user) return;
    const email = user.email ?? "";
    if (!CLIENTS.has(email)) return;

    // PRODUCTS
    setLoadingProducts(true);
    const pRef = ref(realtimeDB, "products");
    const offProducts = onValue(pRef, (snap) => {
      setProducts(snap.exists() ? (mapList(snap.val()) as Product[]) : []);
      setLoadingProducts(false);
    });

    // CATEGORIES
    const cRef = ref(realtimeDB, "categories");
    const offCategories = onValue(cRef, (snap) => {
      if (!snap.exists()) return setCategories([]);
      const raw = snap.val();
      const arr: CategoryItem[] = Array.isArray(raw)
        ? raw
            .filter(Boolean)
            .map((name: string, i: number) => ({ id: String(i), name }))
        : mapList(raw).map((x: any) =>
            typeof x.name === "string"
              ? ({ id: x.id, name: x.name } as CategoryItem)
              : ({ id: x.id, name: String(x) } as CategoryItem)
          );
      setCategories(arr);
    });

    return () => {
      offProducts();
      offCategories();
    };
  }, [user]);

  /* --------------------- Products CRUD --------------------- */
  const addProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let imageBase64 = newProduct.imageBase64;
    if (productImageFile) imageBase64 = await toBase64(productImageFile);

    const payload = cleanUndefined({
      name: newProduct.name.trim(),
      description: newProduct.description.trim(),
      category: newProduct.category,
      price: newProduct.price,
      tags: newProduct.tags ?? [],
      ...(imageBase64 ? { imageBase64 } : {}),
    });

    await set(push(ref(realtimeDB, "products")), payload);
    setNewProduct({ ...emptyProduct });
    setProductImageFile(null);
  };

  const startEdit = (p: Product) => {
    setEditProduct({ ...p });
    setEditImageFile(null);
  };

  const saveEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editProduct) return;
    let imageBase64 = editProduct.imageBase64;
    if (editImageFile) imageBase64 = await toBase64(editImageFile);

    const payload = cleanUndefined({
      name: editProduct.name.trim(),
      description: editProduct.description.trim(),
      category: editProduct.category,
      price: editProduct.price,
      tags: editProduct.tags ?? [],
      ...(imageBase64 ? { imageBase64 } : {}),
    });

    await update(ref(realtimeDB, `products/${editProduct.id}`), payload);
    setEditProduct(null);
    setEditImageFile(null);
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm("Ștergi produsul?")) return;
    await remove(ref(realtimeDB, `products/${id}`));
  };

  /* --------------------- Categories CRUD --------------------- */
  const addCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    // evităm dublurile (case-insensitive)
    const exists = categories.some(
      (c) => c.name.toLowerCase().trim() === newCategory.toLowerCase().trim()
    );
    if (exists) {
      alert("Categoria există deja.");
      return;
    }

    await set(push(ref(realtimeDB, "categories")), {
      name: newCategory.trim(),
    });
    setNewCategory("");
  };

  const deleteCategory = async (id: string) => {
    if (
      !window.confirm(
        "Ștergi categoria? (Produsele existente nu vor fi modificate)"
      )
    )
      return;
    await remove(ref(realtimeDB, `categories/${id}`));
  };

  /* --------------------- UI --------------------- */

  // Ecran Login
  if (!user) {
    return (
      <div className="admin-login login-container">
        <h2>Admin Login</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.currentTarget.value)}
              type="email"
              required
            />
          </div>
          <div className="form-group">
            <label>Parolă</label>
            <input
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.currentTarget.value)}
              type="password"
              required
            />
          </div>
          <button type="submit">Login</button>
        </form>
      </div>
    );
  }

  // Ecran acces interzis (autentificat, dar nu e în lista CLIENTS)
  if (accessDenied) {
    return (
      <div className="admin-panel">
        <div className="top-bar">
          <h1>Acces interzis</h1>
          <button onClick={handleLogout}>Logout</button>
        </div>
        <div className="admin-container">
          <main className="content-area">
            <p>Contul tău nu are acces la panoul client.</p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="top-bar">
        <h1>Admin – Client</h1>
        <button onClick={handleLogout}>Logout</button>
      </div>

      <div className="admin-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <ul>
            <li
              className={tab === "products" ? "active" : ""}
              onClick={() => setTab("products")}
            >
              Produse
            </li>
            <li
              className={tab === "categories" ? "active" : ""}
              onClick={() => setTab("categories")}
            >
              Categorii
            </li>
          </ul>
        </aside>

        {/* Content */}
        <main className="content-area">
          {/* PRODUCTS */}
          {tab === "products" && (
            <section className="admin-content">
              <h2>Produse</h2>

              <form className="card" onSubmit={addProduct}>
                <h3>Adaugă produs</h3>
                <div className="grid-2">
                  <label>
                    Nume
                    <input
                      value={newProduct.name}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          name: e.currentTarget.value,
                        })
                      }
                      required
                    />
                  </label>
                  <label>
                    Preț
                    <input
                      type="number"
                      step="0.01"
                      value={newProduct.price ?? ""}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          price: Number(e.currentTarget.value) || undefined,
                        })
                      }
                    />
                  </label>
                  <label className="col-span-2">
                    Descriere
                    <textarea
                      value={newProduct.description}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          description: e.currentTarget.value,
                        })
                      }
                      required
                    />
                  </label>
                  <label>
                    Categorie
                    <select
                      value={newProduct.category}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          category: e.currentTarget.value as CategoryName,
                        })
                      }
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Imagine
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setProductImageFile(e.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                  <label>
                    Tag-uri
                    <select
                      multiple
                      value={newProduct.tags ?? []}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          tags: Array.from(e.currentTarget.selectedOptions).map(
                            (o) => o.value as Tag
                          ),
                        })
                      }
                    >
                      <option value="new">New</option>
                      <option value="popular">Popular</option>
                    </select>
                  </label>
                </div>
                <button className="action-button" type="submit">
                  Salvează
                </button>
              </form>

              <div className="table-wrap">
                {loadingProducts ? (
                  <p>Se încarcă…</p>
                ) : products.length === 0 ? (
                  <p>Nu există produse.</p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Imagine</th>
                        <th>Nume</th>
                        <th>Categorie</th>
                        <th>Preț</th>
                        <th>Tag-uri</th>
                        <th>Opțiuni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={p.id}>
                          <td>
                            {p.imageBase64 ? (
                              <img
                                src={p.imageBase64}
                                alt={p.name}
                                width={80}
                              />
                            ) : (
                              "—"
                            )}
                          </td>
                          <td>{p.name}</td>
                          <td>{p.category}</td>
                          <td>{p.price ?? "—"}</td>
                          <td>{p.tags?.join(", ") ?? "—"}</td>
                          <td>
                            <button
                              className="action-button"
                              onClick={() => startEdit(p)}
                            >
                              Edit
                            </button>
                            <button
                              className="action-button"
                              onClick={() => deleteProduct(p.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Edit modal (simplu inline) */}
              {editProduct && (
                <div
                  className="modal-overlay"
                  onClick={() => setEditProduct(null)}
                >
                  <div className="modal" onClick={(e) => e.stopPropagation()}>
                    <h3>Editează produs</h3>
                    <form onSubmit={saveEdit}>
                      <label>
                        Nume
                        <input
                          value={editProduct.name}
                          onChange={(e) =>
                            setEditProduct({
                              ...editProduct,
                              name: e.currentTarget.value,
                            })
                          }
                          required
                        />
                      </label>
                      <label>
                        Preț
                        <input
                          type="number"
                          step="0.01"
                          value={editProduct.price ?? ""}
                          onChange={(e) =>
                            setEditProduct({
                              ...editProduct,
                              price: Number(e.currentTarget.value) || undefined,
                            })
                          }
                        />
                      </label>
                      <label>
                        Descriere
                        <textarea
                          value={editProduct.description}
                          onChange={(e) =>
                            setEditProduct({
                              ...editProduct,
                              description: e.currentTarget.value,
                            })
                          }
                          required
                        />
                      </label>
                      <label>
                        Categorie
                        <select
                          value={editProduct.category}
                          onChange={(e) =>
                            setEditProduct({
                              ...editProduct,
                              category: e.currentTarget.value as CategoryName,
                            })
                          }
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Tag-uri
                        <select
                          multiple
                          value={editProduct.tags ?? []}
                          onChange={(e) =>
                            setEditProduct({
                              ...editProduct,
                              tags: Array.from(
                                e.currentTarget.selectedOptions
                              ).map((o) => o.value as Tag),
                            })
                          }
                        >
                          <option value="new">New</option>
                          <option value="popular">Popular</option>
                        </select>
                      </label>
                      <label>
                        Imagine (lasă necompletat pentru a păstra actuala)
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setEditImageFile(e.target.files?.[0] ?? null)
                          }
                        />
                      </label>
                      <div className="modal-actions">
                        <button className="action-button" type="submit">
                          Salvează
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditProduct(null)}
                        >
                          Anulează
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* CATEGORIES */}
          {tab === "categories" && (
            <section className="admin-content">
              <h2>Categorii</h2>
              <form className="row" onSubmit={addCategory}>
                <input
                  placeholder="Ex: Burger"
                  value={newCategory}
                  onChange={(e) =>
                    setNewCategory(e.currentTarget.value as CategoryName)
                  }
                  required
                />
                <button className="action-button" type="submit">
                  Adaugă
                </button>
              </form>

              <ul className="list">
                {categories.map((c) => (
                  <li key={c.id}>
                    {c.name}
                    <button
                      className="action-button"
                      onClick={() => deleteCategory(c.id)}
                    >
                      Șterge
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
