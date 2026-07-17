"use client";

import { useState, useEffect, useCallback } from "react";
import { ProductGrid } from "./ProductGrid";
import { CartPanel } from "./CartPanel";
import { PaymentModal } from "./PaymentModal";
import { ReceiptModal } from "./ReceiptModal";
import { HoldTransactions, HoldTx } from "./HoldTransactions";
import { POSProduct, CartItem } from "@/types/pos";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ShoppingBag, PauseCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface POSClientProps {
  initialProducts: POSProduct[];
  categories: { id: string; name: string }[];
  tenantId: string;
  storeName: string;
}

export function POSClient({ initialProducts, categories, tenantId, storeName }: POSClientProps) {
  const [products, setProducts] = useState<POSProduct[]>(initialProducts);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isProductsLoading, setIsProductsLoading] = useState(false);

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isHoldOpen, setIsHoldOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const [lastTransaction, setLastTransaction] = useState<any>(null);

  // FIX 6: Track hold count for badge
  const [holdCount, setHoldCount] = useState(0);
  const storageKey = `dicatat_hold_txs_${tenantId}`;

  const refreshHoldCount = useCallback(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      const holds: HoldTx[] = stored ? JSON.parse(stored) : [];
      setHoldCount(holds.length);
    } catch {
      setHoldCount(0);
    }
  }, [storageKey]);

  useEffect(() => {
    refreshHoldCount();
  }, [refreshHoldCount]);

  // FIX 2: Re-fetch products from API to update stock after transaction
  const refreshProducts = useCallback(async () => {
    setIsProductsLoading(true);
    try {
      const res = await fetch("/api/pos/products");
      const data = await res.json();
      if (data.success && data.data) {
        setProducts(data.data);
      }
    } catch (err) {
      console.error("Gagal memuat ulang produk:", err);
    } finally {
      setIsProductsLoading(false);
    }
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F1") {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Cari nama"]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      } else if (e.key === "F2") {
        e.preventDefault();
        if (cart.length > 0 && !isPaymentOpen && !isReceiptOpen && !isHoldOpen) {
          setIsPaymentOpen(true);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart.length, isPaymentOpen, isReceiptOpen, isHoldOpen]);

  const addToCart = (product: POSProduct) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) return prev; // Prevent adding more than stock
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, qty: item.qty + 1, subtotal: (item.qty + 1) * item.product.sellPrice }
            : item
        );
      }
      return [...prev, { product, qty: 1, subtotal: product.sellPrice }];
    });
  };

  const updateQty = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const qty = Math.min(newQty, item.product.stock); // Cap at stock
        return { ...item, qty, subtotal: qty * item.product.sellPrice };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const holdTransaction = () => {
    if (cart.length === 0) return;

    const holdName = prompt("Masukkan nama/catatan untuk transaksi ini:", `Customer ${new Date().toLocaleTimeString("id-ID")}`);
    if (!holdName) return;

    const newHold: HoldTx = {
      id: Date.now().toString(),
      name: holdName,
      cart: [...cart],
      createdAt: Date.now()
    };

    const existing = localStorage.getItem(storageKey);
    const holds = existing ? JSON.parse(existing) : [];

    localStorage.setItem(storageKey, JSON.stringify([newHold, ...holds]));
    setCart([]);
    setIsMobileCartOpen(false);
    refreshHoldCount();
  };

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden relative bg-white">

      {/* Left Panel: Product Grid */}
      <div className="flex-1 overflow-hidden h-full">
        <ProductGrid
          products={products}
          categories={categories}
          isLoading={isProductsLoading}
          onAddToCart={addToCart}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />
      </div>

      {/* Right Panel: Cart (Desktop) */}
      <div className="hidden md:block w-[400px] shrink-0 border-l border-slate-200">
        <CartPanel
          cart={cart}
          updateQty={updateQty}
          removeFromCart={removeFromCart}
          clearCart={() => setCart([])}
          onPayClick={() => setIsPaymentOpen(true)}
          onHoldClick={holdTransaction}
        />
      </div>

      {/* Mobile Cart Bar (Fixed Bottom) — di atas BottomNav (h-16=64px) */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-2 p-3">
          
          {/* Tombol Hold — icon kecil di kiri */}
          <button
            onClick={() => {
              refreshHoldCount();
              setIsHoldOpen(true);
            }}
            className="relative shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-orange-50 hover:border-orange-200 transition-colors"
          >
            <PauseCircle className="w-5 h-5 text-orange-500" />
            <span className="text-[9px] font-semibold text-orange-600 leading-none mt-0.5">Hold</span>
            {holdCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[9px] font-bold min-w-[16px] h-[16px] rounded-full flex items-center justify-center px-0.5 border border-white">
                {holdCount}
              </span>
            )}
          </button>

          {/* Tombol Keranjang — flex-1 */}
          <Sheet open={isMobileCartOpen} onOpenChange={setIsMobileCartOpen}>
            <SheetTrigger render={
              <Button className="flex-1 h-12 bg-[#0D1F3D] hover:bg-[#0D1F3D]/90 text-white rounded-xl flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <ShoppingBag className="w-5 h-5" />
                    {totalItems > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#0D1F3D]">
                        {totalItems}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-sm">
                    {totalItems > 0 ? `Keranjang (${totalItems})` : "Keranjang"}
                  </span>
                </div>
                <span className="font-black text-base">Rp {subtotal.toLocaleString("id-ID")}</span>
              </Button>
            } />
            <SheetContent side="bottom" className="h-[85vh] p-0 rounded-t-2xl">
              <CartPanel
                cart={cart}
                updateQty={updateQty}
                removeFromCart={removeFromCart}
                clearCart={() => setCart([])}
                onPayClick={() => {
                  setIsMobileCartOpen(false);
                  setIsPaymentOpen(true);
                }}
                onHoldClick={holdTransaction}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Floating Hold Button — Desktop only (kanan panel cart) */}
      <div className="hidden md:block fixed bottom-6 right-[420px] z-30">
        <Button
          variant="outline"
          className="relative rounded-full shadow-lg h-12 px-4 gap-2 bg-white border-slate-200 text-slate-700 hover:text-[#0D1F3D] hover:border-[#0D1F3D] font-semibold text-sm"
          onClick={() => {
            refreshHoldCount();
            setIsHoldOpen(true);
          }}
        >
          <PauseCircle className="w-5 h-5 text-orange-500" />
          <span>Hold</span>
          {holdCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 border-2 border-white">
              {holdCount}
            </span>
          )}
        </Button>
      </div>

      {/* Modals */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        subtotal={subtotal}
        cart={cart}
        onSuccess={(txData) => {
          setIsPaymentOpen(false);
          setLastTransaction(txData);
          setIsReceiptOpen(true);
        }}
      />

      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        transaction={lastTransaction}
        storeName={storeName}
        onNewTransaction={() => {
          setCart([]);
          // FIX 2: Re-fetch products to update stock counts
          refreshProducts();
        }}
      />

      <HoldTransactions
        isOpen={isHoldOpen}
        onClose={() => {
          setIsHoldOpen(false);
          refreshHoldCount();
        }}
        tenantId={tenantId}
        onResume={(heldCart) => {
          setCart(heldCart);
          refreshHoldCount();
        }}
      />

    </div>
  );
}
