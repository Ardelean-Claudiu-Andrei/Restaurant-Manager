import { Product } from "../types";

export const products: Product[] = [
  {
    id: 1,
    name: "Fish Burger",
    description: "Chiflă pufoasă, file de pește crocant, sos tartar.",
    image:
      "https://images.unsplash.com/photo-1550317138-10000687a72b?q=80&w=1200&auto=format",
    category: "Burger",
    tags: ["popular"],
  },
  {
    id: 2,
    name: "Bacon Cheeseburger",
    description: "Cheddar topit, bacon afumat, sos special.",
    image:
      "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1200&auto=format",
    category: "Burger",
    tags: ["new"],
  },
  {
    id: 3,
    name: "Beef Burger",
    description: "Chiftea suculentă, salată proaspătă, susan.",
    image:
      "https://images.unsplash.com/photo-1606756790138-261d2b21cd87?q=80&w=1200&auto=format",
    category: "Burger",
  },
  {
    id: 4,
    name: "Margherita",
    description: "Roșii, mozzarella, busuioc proaspăt.",
    image:
      "https://images.unsplash.com/photo-1542281286-9e0a16bb7366?q=80&w=1200&auto=format",
    category: "Pizza",
  },
  {
    id: 5,
    name: "Diavola",
    description: "Pepperoni picant, mozzarella, sos de roșii.",
    image:
      "https://images.unsplash.com/photo-1548365328-9f547fb09530?q=80&w=1200&auto=format",
    category: "Pizza",
    tags: ["popular"],
  },
  {
    id: 6,
    name: "Quattro Formaggi",
    description: "Mozzarella, gorgonzola, parmesan, brie.",
    image:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1200&auto=format",
    category: "Pizza",
  },
  {
    id: 7,
    name: "Cheesecake",
    description: "Cremă fină, blat de biscuiți, topping de fructe.",
    image:
      "https://images.unsplash.com/photo-1505253758473-96b7015fcd84?q=80&w=1200&auto=format",
    category: "Dessert",
    tags: ["new"],
  },
  {
    id: 8,
    name: "Brownie",
    description: "Ciocolată intensă, interior fudgy, nuci.",
    image:
      "https://images.unsplash.com/photo-1606313564200-e75d5e30476d?q=80&w=1200&auto=format",
    category: "Dessert",
  },
  {
    id: 9,
    name: "Tiramisu",
    description: "Cafea, mascarpone, cacao — clasic italian.",
    image:
      "https://images.unsplash.com/photo-1625944526114-fd1f56e11e7d?q=80&w=1200&auto=format",
    category: "Dessert",
    tags: ["popular"],
  },
];
