import React, { useEffect, useMemo, useState } from "react";
import { ref, onValue } from "firebase/database";
import { realtimeDB } from "../firebase";
import { Category, CategoryName, Product, SiteSettings } from "../types";
import Chip from "../components/Chip";
import ProductCard from "../components/ProductCard";
import ProductDetailsModal from "../components/ProductDetailsModal";
import "./Home.css";
import { ChipGroup } from "../components/ChipGroup";

function Home() {
  const [active, setActive] = useState<Category>("All");
  const [all, setAll] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Product | null>(null);

  const [settings, setSettings] = useState<SiteSettings>({
    title: "RESTAURANT MENU",
    heroImage: "",
    showBadges: true,
  });
  // helper: #RRGGBB -> rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const h = hex.replace("#", "");
    const f =
      h.length === 3
        ? h
            .split("")
            .map((c) => c + c)
            .join("")
        : h;
    const n = parseInt(f, 16);
    const r = (n >> 16) & 255,
      g = (n >> 8) & 255,
      b = n & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const overlayColor = settings.heroOverlayColor || "#000000";
  const rawOpacity = settings.heroOverlayOpacity;
  const overlayOpacity =
    typeof rawOpacity === "number"
      ? rawOpacity
      : parseFloat(String(rawOpacity ?? "0.35")) || 0.35;
  const clamped = Math.max(0, Math.min(1, overlayOpacity));
  const overlayBg = hexToRgba(overlayColor, clamped);
  const titleColor = settings.heroTextColor || "#ffffff";

  // Categories from DB (raw)
  const [categoriesDb, setCategoriesDb] = useState<CategoryName[]>([]);
  const [bgImage, setBgImage] = useState<string>(""); // <- imaginea din /background

  // ---- Products
  useEffect(() => {
    const productsRef = ref(realtimeDB, "products");
    const off = onValue(productsRef, (snap) => {
      if (!snap.exists()) {
        setAll([]);
        setLoading(false);
        return;
      }
      const data = snap.val() as Record<string, Omit<Product, "id">>;
      const items: Product[] = Object.entries(data).map(([id, p]) => ({
        id,
        ...(p as any),
      }));
      setAll(items);
      setLoading(false);
    });
    return () => off();
  }, []);

  // ---- Categories (from /categories)
  useEffect(() => {
    const cRef = ref(realtimeDB, "categories");
    const off = onValue(cRef, (snap) => {
      if (!snap.exists()) return setCategoriesDb([]);
      const raw = snap.val();
      // acceptă fie listă directă, fie map {id:{name}} / {id:"Burger"}
      const names: string[] = Array.isArray(raw)
        ? raw.filter(Boolean)
        : Object.values(raw).map((x: any) =>
            typeof x === "string" ? x : x?.name
          );
      const cleaned = names
        .filter(Boolean)
        .map((s) => String(s)) as CategoryName[];
      setCategoriesDb(cleaned);
    });
    return () => off();
  }, []);

  // ---- Site settings
  useEffect(() => {
    const settingsRef = ref(realtimeDB, "siteSettings");
    const off = onValue(settingsRef, (snap) => {
      if (snap.exists()) {
        const s = snap.val() as Partial<SiteSettings>;
        setSettings((prev) => ({ ...prev, ...s }));
        if (s.title) document.title = s.title;
      }
    });
    return () => off();
  }, []);

  // Categories shown in UI = All + (DB ∪ din produse)
  const uiCategories: Category[] = useMemo(() => {
    const fromProducts = Array.from(
      new Set(all.map((p) => p.category))
    ) as CategoryName[];
    const merged = Array.from(
      new Set(["All", ...categoriesDb, ...fromProducts])
    );
    return merged as Category[];
  }, [categoriesDb, all]);

  const filtered = useMemo(
    () => (active === "All" ? all : all.filter((p) => p.category === active)),
    [all, active]
  );

  // ---- Background din /background (prima înregistrare)
  useEffect(() => {
    const bRef = ref(realtimeDB, "background");
    const off = onValue(bRef, (snap) => {
      if (!snap.exists()) return setBgImage("");
      const obj = snap.val() as Record<string, any>;
      const first = Object.values(obj)[0] as any;
      // Acceptă atât imageBase64 (data URL), cât și image (URL din Storage)
      setBgImage(first?.imageBase64 || first?.image || "");
    });
    return () => off();
  }, []);
  const heroSrc = bgImage || settings.heroImage; /* || defaultHero */
  return (
    <>
      <header
        className="hero"
        style={
          heroSrc
            ? {
                backgroundImage: `url(${heroSrc})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <div className="hero__overlay" style={{ backgroundColor: overlayBg }} />
        <h1 className="hero__title" style={{ color: titleColor }}>
          {settings.title || "RESTAURANT MENU"}
        </h1>
      </header>

      <div className="container">
        <ChipGroup scroll className="chips">
          {uiCategories.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              active={active === cat}
              onClick={() => setActive(cat)}
            />
          ))}
        </ChipGroup>

        {loading ? (
          <p>Loading products…</p>
        ) : filtered.length === 0 ? (
          <p>No products in “{active}”.</p>
        ) : (
          <section className="grid">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} onDetails={setSelected} />
            ))}
          </section>
        )}
      </div>
      <ProductDetailsModal
        product={selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}

export default Home;
