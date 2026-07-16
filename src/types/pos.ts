export interface POSProduct {
  id: string;
  name: string;
  categoryId: string | null;
  categoryName: string | null;
  sellPrice: number;
  stock: number;
  image: string | null;
  barcode: string | null;
}

export interface CartItem {
  product: POSProduct;
  qty: number;
  subtotal: number;
}
