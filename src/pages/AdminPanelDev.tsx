// src/pages/AdminPanel.tsx
import React, { useEffect, useState, useMemo } from "react";
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
  DatabaseReference,
} from "firebase/database";
import { auth, realtimeDB } from "../firebase";
import "./AdminPanelDev.css";

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

export interface SiteSettings {
  title: string;
  phone?: string;
  email?: string;
  address?: string;
  about?: string;
  mapSrc?: string;
  heroImage?: string; // opțional, imagine header
}

/* ===================== Helpers ===================== */

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });

/* ===================== Component ===================== */

const DEVELOPERS = new Set<string>(["aclaudiuandrei586@gmail.com"]);
const CLIENTS = new Set<string>(["adresaclient@gmail.com"]);

type Tab = "products" | "categories" | "gallery" | "background" | "settings";

const AdminPanelDev: React.FC = () => {
  const navigate = useNavigate();

  // auth
  const [user, setUser] = useState<typeof auth.currentUser>(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // tabs
  const [tab, setTab] = useState<Tab>("products");

  // products
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // add/edit product
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

  // categories
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [newCategory, setNewCategory] = useState<CategoryName>("");

  // gallery
  type GalleryItem = { id: string; title: string; imageBase64: string };
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [newGalleryTitle, setNewGalleryTitle] = useState("");
  const [galleryFile, setGalleryFile] = useState<File | null>(null);

  // background (single item list)
  type BackgroundItem = {
    id: string;
    title: string;
    description?: string;
    imageBase64: string;
  };
  const [background, setBackground] = useState<BackgroundItem[]>([]);
  const [bgTitle, setBgTitle] = useState("");
  const [bgDesc, setBgDesc] = useState("");
  const [bgFile, setBgFile] = useState<File | null>(null);

  // site settings
  const [settings, setSettings] = useState<SiteSettings>({
    title: "RESTAURANT MENU",
  });
  const [loadingSettings, setLoadingSettings] = useState(false);

  /* --------------------- Auth --------------------- */

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const { user } = await signInWithEmailAndPassword(
        auth,
        loginEmail,
        loginPassword
      );
      const email = user.email ?? "";
      if (DEVELOPERS.has(email)) {
        // rămâne în acest panel (dev)
      } else if (CLIENTS.has(email)) {
        // dacă ai panou separat pt client:
        navigate("/adminpage", { replace: true });
        return;
      } else {
        alert("Acces interzis.");
        await signOut(auth);
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

  /* --------------------- Fetchers --------------------- */

  const mapList = <T extends object>(obj: Record<string, T>) =>
    Object.entries(obj).map(([id, v]) => ({ id, ...(v as any) }));

  useEffect(() => {
    if (!user) return;

    // products
    setLoadingProducts(true);
    const pRef = ref(realtimeDB, "products");
    const offProducts = onValue(pRef, (snap) => {
      setProducts(snap.exists() ? (mapList(snap.val()) as Product[]) : []);
      setLoadingProducts(false);
    });

    // categories
    const cRef = ref(realtimeDB, "categories");
    const offCategories = onValue(cRef, (snap) => {
      if (!snap.exists()) return setCategories([]);
      // acceptă fie listă de obiecte {name}, fie map cu { id: {name:""} } sau chiar string direct
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

    // gallery
    const gRef = ref(realtimeDB, "gallery");
    const offGallery = onValue(gRef, (snap) =>
      setGallery(snap.exists() ? (mapList(snap.val()) as GalleryItem[]) : [])
    );

    // background
    const bRef = ref(realtimeDB, "background");
    const offBg = onValue(bRef, (snap) =>
      setBackground(
        snap.exists() ? (mapList(snap.val()) as BackgroundItem[]) : []
      )
    );

    // siteSettings
    (async () => {
      setLoadingSettings(true);
      const sRef = ref(realtimeDB, "siteSettings");
      const s = await get(sRef);
      if (s.exists()) {
        const val = s.val() as SiteSettings;
        setSettings((prev) => ({ ...prev, ...val }));
        if (val.title) document.title = val.title;
      }
      setLoadingSettings(false);
    })();

    return () => {
      offProducts();
      offCategories();
      offGallery();
      offBg();
    };
  }, [user]);

  /* --------------------- Products CRUD --------------------- */
  // util: scoate cheile cu undefined
  // const cleanUndefined = <T extends Record<string, any>>(obj: T): T => {
  //   const copy = { ...obj };
  //   Object.keys(copy).forEach((k) => copy[k] === undefined && delete copy[k]);
  //   return copy;
  // };

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
    setNewProduct({
      name: "",
      description: "",
      category: "Burger",
      price: undefined,
      tags: [],
      imageBase64: "",
    });
    setProductImageFile(null);
  };

  const startEdit = (p: Product) => {
    setEditProduct({ ...p });
    setEditImageFile(null);
  };

  const cleanUndefined = (o: Record<string, any>) => {
    const c = { ...o };
    Object.keys(c).forEach((k) => c[k] === undefined && delete c[k]);
    return c;
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
      ...(imageBase64 ? { imageBase64 } : {}), // include doar dacă există
      // dacă ai și URL:
      // ...(editProduct.image ? { image: editProduct.image } : {}),
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
    await set(push(ref(realtimeDB, "categories")), {
      name: newCategory.trim(),
    });
    setNewCategory("");
  };

  const deleteCategory = async (id: string) => {
    await remove(ref(realtimeDB, `categories/${id}`));
  };

  /* --------------------- Gallery CRUD --------------------- */

  const addGallery = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!galleryFile) return alert("Alege o imagine.");
    const imageBase64 = await toBase64(galleryFile);
    await set(push(ref(realtimeDB, "gallery")), {
      title: newGalleryTitle || "Photo",
      imageBase64,
    });
    setNewGalleryTitle("");
    setGalleryFile(null);
  };

  const deleteGallery = async (id: string) => {
    await remove(ref(realtimeDB, `gallery/${id}`));
  };

  /* --------------------- Background CRUD --------------------- */

  const addBackground = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (background.length > 0)
      return alert("Există deja un background. Șterge-l sau editează-l.");
    if (!bgFile) return alert("Alege o imagine pentru background.");
    const imageBase64 = await toBase64(bgFile);
    await set(push(ref(realtimeDB, "background")), {
      title: bgTitle || "Hero",
      description: bgDesc || "",
      imageBase64,
    });
    setBgTitle("");
    setBgDesc("");
    setBgFile(null);
  };

  const editBackground = async (id: string) => {
    const bRef = ref(realtimeDB, `background/${id}`);
    let imageBase64: string | undefined;
    if (bgFile) imageBase64 = await toBase64(bgFile);
    await update(bRef, {
      title: bgTitle || undefined,
      description: bgDesc || undefined,
      ...(imageBase64 ? { imageBase64 } : {}),
    });
    setBgTitle("");
    setBgDesc("");
    setBgFile(null);
  };

  const deleteBackground = async (id: string) => {
    await remove(ref(realtimeDB, `background/${id}`));
  };

  /* --------------------- Site Settings --------------------- */

  const saveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const sRef = ref(realtimeDB, "siteSettings");
    await update(sRef, settings);
    if (settings.title) document.title = settings.title;
    alert("Setări salvate.");
  };

  const handleSettingsChange =
    (field: keyof SiteSettings) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.currentTarget.value; // <- capturează ACUM
      setSettings((s) => ({ ...s, [field]: value }));
    };

  /* --------------------- UI --------------------- */

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

  return (
    <div className="admin-panel">
      <div className="top-bar">
        <h1>Admin – Menu</h1>
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
            <li
              className={tab === "gallery" ? "active" : ""}
              onClick={() => setTab("gallery")}
            >
              Galerie
            </li>
            <li
              className={tab === "background" ? "active" : ""}
              onClick={() => setTab("background")}
            >
              Background
            </li>
            <li
              className={tab === "settings" ? "active" : ""}
              onClick={() => setTab("settings")}
            >
              Setări site
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
                <div className="modal-overlay">
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

          {/* GALLERY */}
          {tab === "gallery" && (
            <section className="admin-content">
              <h2>Galerie</h2>
              <form className="row" onSubmit={addGallery}>
                <input
                  placeholder="Titlu"
                  value={newGalleryTitle}
                  onChange={(e) => setNewGalleryTitle(e.currentTarget.value)}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setGalleryFile(e.target.files?.[0] ?? null)}
                />
                <button className="action-button" type="submit">
                  Adaugă
                </button>
              </form>

              <div className="thumbs">
                {gallery.map((g) => (
                  <figure key={g.id}>
                    <img src={g.imageBase64} alt={g.title} />
                    <figcaption>{g.title}</figcaption>
                    <button
                      className="action-button"
                      onClick={() => deleteGallery(g.id)}
                    >
                      Șterge
                    </button>
                  </figure>
                ))}
              </div>
            </section>
          )}

          {/* BACKGROUND */}
          {tab === "background" && (
            <section className="admin-content">
              <h2>Background</h2>

              <form className="grid-2" onSubmit={addBackground}>
                <label>
                  Titlu
                  <input
                    value={bgTitle}
                    onChange={(e) => setBgTitle(e.currentTarget.value)}
                  />
                </label>
                <label>
                  Descriere
                  <input
                    value={bgDesc}
                    onChange={(e) => setBgDesc(e.currentTarget.value)}
                  />
                </label>
                <label className="col-span-2">
                  Imagine
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setBgFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                <button className="action-button" type="submit">
                  Adaugă
                </button>
              </form>

              {background.length > 0 && (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Preview</th>
                      <th>Titlu</th>
                      <th>Descriere</th>
                      <th>Opțiuni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {background.map((b) => (
                      <tr key={b.id}>
                        <td>
                          <img src={b.imageBase64} alt={b.title} width={120} />
                        </td>
                        <td>{b.title}</td>
                        <td>{b.description}</td>
                        <td>
                          <button
                            className="action-button"
                            onClick={() => editBackground(b.id)}
                          >
                            Editează
                          </button>
                          <button
                            className="action-button"
                            onClick={() => deleteBackground(b.id)}
                          >
                            Șterge
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          )}

          {/* SETTINGS */}
          {tab === "settings" && (
            <section className="admin-content">
              <h2>Setări Site</h2>
              {loadingSettings ? (
                <p>Se încarcă…</p>
              ) : (
                <form className="grid-2" onSubmit={saveSettings}>
                  <label className="col-span-2">
                    Titlu site
                    <input
                      value={settings.title}
                      onChange={handleSettingsChange("title")}
                      required
                    />
                  </label>

                  <label>
                    Telefon
                    <input
                      value={settings.phone ?? ""}
                      onChange={handleSettingsChange("phone")}
                    />
                  </label>

                  <label>
                    Email
                    <input
                      type="email"
                      value={settings.email ?? ""}
                      onChange={handleSettingsChange("email")}
                    />
                  </label>

                  <label className="col-span-2">
                    Adresă
                    <input
                      value={settings.address ?? ""}
                      onChange={handleSettingsChange("address")}
                    />
                  </label>

                  <label className="col-span-2">
                    Despre noi
                    <textarea
                      value={settings.about ?? ""}
                      onChange={handleSettingsChange("about")}
                    />
                  </label>

                  <label className="col-span-2">
                    Map src
                    <input
                      value={settings.mapSrc ?? ""}
                      onChange={handleSettingsChange("mapSrc")}
                    />
                  </label>

                  <button className="action-button" type="submit">
                    Salvează
                  </button>
                </form>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminPanelDev;
