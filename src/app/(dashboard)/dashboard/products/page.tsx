"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Edit2, Trash2, Loader2, AlertCircle, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  image: string | null;
  category: Category | null;
  buyPrice: number;
  sellPrice: number;
  stock: number;
}

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId") || "all";
  const page = parseInt(searchParams.get("page") || "1");

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [meta, setMeta] = useState({ totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Local state for inputs to avoid immediate re-renders on every keystroke
  const [searchInput, setSearchInput] = useState(search);
  const [selectedCategory, setSelectedCategory] = useState(categoryId);

  // Delete state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(search)}&categoryId=${categoryId}&page=${page}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
        setMeta(data.meta);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Terjadi kesalahan sistem saat memuat produk");
    } finally {
      setIsLoading(false);
    }
  }, [search, categoryId, page]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error("Gagal memuat kategori", err);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Sync inputs with URL params
  useEffect(() => {
    setSearchInput(search);
    setSelectedCategory(categoryId);
  }, [search, categoryId]);

  const updateFilters = (newSearch: string, newCategory: string, newPage: number = 1) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (newSearch) params.set("search", newSearch);
    else params.delete("search");
    
    if (newCategory && newCategory !== "all") params.set("categoryId", newCategory);
    else params.delete("categoryId");
    
    if (newPage > 1) params.set("page", newPage.toString());
    else params.delete("page");
    
    router.push(`?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters(searchInput, selectedCategory, 1);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cat = e.target.value;
    setSelectedCategory(cat);
    updateFilters(searchInput, cat, 1);
  };

  const handleOpenDelete = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/products/${productToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        setIsDeleteDialogOpen(false);
        fetchProducts(); // Refresh list
      } else {
        alert(data.error || "Gagal menghapus produk");
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Produk</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola daftar produk, stok, dan harga barang.</p>
        </div>

        <Link href="/dashboard/products/create">
          <Button className="bg-[#00A76F] hover:bg-[#00A76F]/90 text-white w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Produk
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari nama produk..." 
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">Cari</Button>
        </form>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-w-[180px]"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-20">Foto</TableHead>
                <TableHead>Nama Produk</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Harga Beli</TableHead>
                <TableHead>Harga Jual</TableHead>
                <TableHead className="text-center">Stok</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                    <p className="text-sm text-slate-500 mt-2">Memuat data produk...</p>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-red-500">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                    {error}
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <p>Tidak ada produk yang ditemukan.</p>
                      {(search || categoryId !== "all") && (
                        <Button 
                          variant="link" 
                          onClick={() => updateFilters("", "all", 1)}
                          className="mt-2 text-[#00A76F]"
                        >
                          Reset Filter
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {p.image ? (
                        <div className="w-10 h-10 rounded-md bg-slate-100 overflow-hidden border border-slate-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-xs text-slate-400">
                          No Img
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">{p.name}</TableCell>
                    <TableCell className="text-slate-600">{p.category?.name || "-"}</TableCell>
                    <TableCell className="text-slate-600">{formatCurrency(p.buyPrice)}</TableCell>
                    <TableCell className="text-[#0D1F3D] font-medium">{formatCurrency(p.sellPrice)}</TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.stock <= 5 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                        {p.stock}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/dashboard/products/${p.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit2 className="w-4 h-4 text-slate-500" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenDelete(p)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Controls */}
      {!isLoading && products.length > 0 && meta.totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-sm text-slate-500">
            Menampilkan halaman {page} dari {meta.totalPages}
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              disabled={page <= 1}
              onClick={() => updateFilters(search, categoryId, page - 1)}
            >
              Sebelumnya
            </Button>
            <Button 
              variant="outline" 
              disabled={page >= meta.totalPages}
              onClick={() => updateFilters(search, categoryId, page + 1)}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Produk</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-slate-600">
            Apakah Anda yakin ingin menghapus produk <strong>{productToDelete?.name}</strong>?
            Produk ini tidak akan ditampilkan lagi, tetapi riwayat transaksinya akan tetap ada.
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
              Batal
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="h-96 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>}>
      <ProductsContent />
    </Suspense>
  );
}
