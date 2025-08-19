export type CategoryName = "Burger" | "Pizza" | "Dessert" | (string & {});
export type Category = "All" | CategoryName;
export type Tag = "new" | "popular";

export interface Product {
  id: string | number;
  name: string;
  description: string;
  category: CategoryName;
  price?: number;
  tags?: ("new" | "popular")[];
  image?: string;
  imageBase64?: string;
}

export interface SiteSettings {
  title: string;
  heroImage?: string;
  showBadges?: boolean;
  heroTextColor?: string;
  heroOverlayColor?: string;
  heroOverlayOpacity?: number | string;
}
