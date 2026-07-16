"use client";

import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { CartItem } from "@/types/pos";

interface CartPanelProps {
  cart: CartItem[];
  updateQty: (productId: string, newQty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  onPayClick: () => void;
  onHoldClick: () => void;
}

export function CartPanel({
  cart,
  updateQty,
  removeFromCart,
  clearCart,
  onPayClick,
  onHoldClick,
}: CartPanelProps) {
  
  const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);

  return (
    <div className="w-full h-full bg-white flex flex-col border-l border-slate-200">
      {/* Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-[#0D1F3D]" />
          <h2 className="font-bold text-lg text-slate-900">Pesanan</h2>
          <span className="bg-[#00A76F]/10 text-[#00A76F] text-xs font-bold px-2 py-0.5 rounded-full">
            {totalItems}
          </span>
        </div>
        {cart.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearCart} className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 px-2 text-xs">
            Kosongkan
          </Button>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <ShoppingBag className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-sm font-medium">Keranjang masih kosong</p>
            <p className="text-xs mt-1">Pilih produk dari area kiri</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.product.id} className="flex gap-3 items-start border-b border-slate-50 pb-4 last:border-0">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-800 line-clamp-1 truncate">
                    {item.product.name}
                  </h3>
                  <div className="text-[#00A76F] font-bold text-xs mt-0.5">
                    {formatCurrency(item.product.sellPrice)}
                  </div>
                  
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg">
                      <button 
                        onClick={() => updateQty(item.product.id, item.qty - 1)}
                        className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-200 rounded-l-lg transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-semibold text-slate-700">
                        {item.qty}
                      </span>
                      <button 
                        onClick={() => updateQty(item.product.id, item.qty + 1)}
                        className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-200 rounded-r-lg transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-red-400 hover:text-red-600 p-1 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="text-right shrink-0 font-bold text-sm text-[#0D1F3D]">
                  {formatCurrency(item.subtotal)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="bg-slate-50 p-4 border-t border-slate-200 shrink-0">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-slate-500 font-medium">Subtotal</span>
          <span className="text-sm font-bold text-slate-700">{formatCurrency(subtotal)}</span>
        </div>
        
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200 border-dashed">
          <span className="text-sm text-slate-500 font-medium">Total Item</span>
          <span className="text-sm font-bold text-slate-700">{totalItems} pcs</span>
        </div>

        <div className="flex justify-between items-end mb-6">
          <span className="text-base text-slate-800 font-bold">Total Pembayaran</span>
          <span className="text-2xl font-black text-[#0D1F3D]">{formatCurrency(subtotal)}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            className="w-full text-[#0D1F3D] border-slate-300"
            disabled={cart.length === 0}
            onClick={onHoldClick}
          >
            Hold Transaksi
          </Button>
          <Button 
            className="w-full bg-[#00A76F] hover:bg-[#00A76F]/90 text-white font-bold"
            disabled={cart.length === 0}
            onClick={onPayClick}
          >
            Bayar (F2)
          </Button>
        </div>
      </div>
    </div>
  );
}
