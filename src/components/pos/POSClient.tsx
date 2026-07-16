"use client";

import { useState, useEffect } from "react";
import { ProductGrid } from "./ProductGrid";
import { CartPanel } from "./CartPanel";
import { PaymentModal } from "./PaymentModal";
import { ReceiptModal } from "./ReceiptModal";
import { HoldTransactions, HoldTx } from "./HoldTransactions";
import { POSProduct, CartItem } from "@/types/pos";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ShoppingBag, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface POSClientProps {
  initialProducts: POSProduct[];
  categories: { id: string; name: string }[];
  tenantId: string;
  storeName: string;
}

export function POSClient({ initialProducts, categories, tenantId, storeName }: POSClientProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isHoldOpen, setIsHoldOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  
  const [lastTransaction, setLastTransaction] = useState<any>(null);

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
    
    const holdName = prompt("Masukkan nama/catatan untuk transaksi ini:", `Customer ${new Date().toLocaleTimeString('id-ID')}`);
    if (!holdName) return;

    const newHold: HoldTx = {
      id: Date.now().toString(),
      name: holdName,
      cart: [...cart],
      createdAt: Date.now()
    };

    const storageKey = `dicatat_hold_txs_${tenantId}`;
    const existing = localStorage.getItem(storageKey);
    const holds = existing ? JSON.parse(existing) : [];
    
    localStorage.setItem(storageKey, JSON.stringify([newHold, ...holds]));
    setCart([]);
    setIsMobileCartOpen(false);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden relative bg-white">
      
      {/* Left Panel: Product Grid */}
      <div className="flex-1 overflow-hidden h-full">
        <ProductGrid 
          products={initialProducts}
          categories={categories}
          isLoading={false}
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

      {/* Mobile Cart Button (Fixed Bottom) */}
      <div className="md:hidden fixed bottom-[64px] left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-40">
        <Sheet open={isMobileCartOpen} onOpenChange={setIsMobileCartOpen}>
          <SheetTrigger render={
            <Button className="w-full h-14 bg-[#0D1F3D] hover:bg-[#0D1F3D]/90 text-white rounded-xl flex items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingBag className="w-6 h-6" />
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0D1F3D]">
                      {totalItems}
                    </span>
                  )}
                </div>
                <span className="font-bold text-lg">Keranjang</span>
              </div>
              <span className="font-black text-xl">Rp {subtotal.toLocaleString("id-ID")}</span>
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

      {/* Floating Hold Transactions Button */}
      <Button 
        variant="outline" 
        size="icon"
        className="fixed bottom-[140px] md:bottom-6 right-4 md:right-[420px] rounded-full shadow-lg h-12 w-12 bg-white border-slate-200 text-slate-600 hover:text-[#0D1F3D] hover:border-[#0D1F3D] z-30"
        onClick={() => setIsHoldOpen(true)}
      >
        <Search className="w-5 h-5" />
      </Button>

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
        onNewTransaction={() => setCart([])}
      />

      <HoldTransactions 
        isOpen={isHoldOpen}
        onClose={() => setIsHoldOpen(false)}
        tenantId={tenantId}
        onResume={(heldCart) => setCart(heldCart)}
      />

    </div>
  );
}
