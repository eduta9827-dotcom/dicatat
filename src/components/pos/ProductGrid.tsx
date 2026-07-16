"use client";

import { useState } from "react";
import { Search, Loader2, PackageX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { POSProduct } from "@/types/pos"; // We'll create this types file later or define inline

interface Category {
  id: string;
  name: string;
}

interface ProductGridProps {
  products: POSProduct[];
  categories: Category[];
  isLoading: boolean;
  onAddToCart: (product: POSProduct) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
}

export function ProductGrid({
  products,
  categories,
  isLoading,
  onAddToCart,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
}: ProductGridProps) {
  
  // Skeleton loader
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col h-full bg-slate-50/50 p-4">
        <div className="flex gap-4 mb-6">
          <div className="h-10 w-full bg-slate-200 animate-pulse rounded-md" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div key={i} className="bg-white p-3 rounded-xl border border-slate-100 h-48 animate-pulse flex flex-col">
              <div className="w-full h-24 bg-slate-200 rounded-lg mb-3" />
              <div className="h-4 w-3/4 bg-slate-200 rounded mb-2" />
              <div className="h-4 w-1/2 bg-slate-200 rounded mt-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Filter products client-side for fast UX, or rely on passed props if already filtered
  // We'll assume the parent component fetches all products and passes them here.
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCategory = selectedCategory === "all" || p.categoryId === selectedCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 p-4 overflow-hidden">
      
      {/* Top Bar: Search & Categories */}
      <div className="flex flex-col gap-4 mb-4 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input 
            autoFocus
            placeholder="Cari nama produk atau scan barcode (F1)..." 
            className="pl-10 h-12 bg-white text-base shadow-sm border-slate-200 rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Categories Tab */}
        <div className="flex flex-wrap gap-2 pb-1 shrink-0">
          <Badge 
            variant={selectedCategory === "all" ? "default" : "outline"}
            className={`px-4 py-2 text-sm font-medium cursor-pointer shrink-0 rounded-full transition-colors ${
              selectedCategory === "all" 
                ? "bg-[#0D1F3D] hover:bg-[#0D1F3D]/90 text-white border-transparent" 
                : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200"
            }`}
            onClick={() => setSelectedCategory("all")}
          >
            Semua
          </Badge>
          {categories.map(cat => (
            <Badge 
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              className={`px-4 py-2 text-sm font-medium cursor-pointer shrink-0 rounded-full transition-colors ${
                selectedCategory === cat.id 
                  ? "bg-[#0D1F3D] hover:bg-[#0D1F3D]/90 text-white border-transparent" 
                  : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200"
              }`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto pb-24 md:pb-4 pr-2">
        {filteredProducts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <PackageX className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium text-slate-500">Produk tidak ditemukan</p>
            <p className="text-sm">Coba ubah kata kunci pencarian atau kategori</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 content-start">
            {filteredProducts.map(product => {
              const outOfStock = product.stock <= 0;
              return (
                <div 
                  key={product.id}
                  onClick={() => !outOfStock && onAddToCart(product)}
                  className={`bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm flex flex-col transition-all duration-200 ${
                    outOfStock 
                      ? "opacity-60 grayscale-[0.5] cursor-not-allowed" 
                      : "cursor-pointer hover:shadow-md hover:border-[#00A76F]/30 active:scale-[0.98]"
                  }`}
                >
                  <div className="w-full aspect-square bg-slate-50 rounded-lg mb-3 relative overflow-hidden flex items-center justify-center">
                    {product.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-slate-300 flex flex-col items-center">
                        <PackageX className="w-8 h-8 mb-1 opacity-50" />
                      </div>
                    )}
                    {outOfStock && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md rotate-[-10deg]">
                          HABIS
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col flex-1">
                    <p className="text-sm font-semibold text-slate-800 line-clamp-2 leading-tight mb-1">
                      {product.name}
                    </p>
                    <div className="mt-auto flex items-end justify-between">
                      <p className="text-[#00A76F] font-bold text-sm">
                        {formatCurrency(product.sellPrice)}
                      </p>
                      <p className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        Stok: {product.stock}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
