"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

interface Category {
  id: string;
  name: string;
  _count: {
    products: number;
  };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState("");
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Delete state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Terjadi kesalahan sistem");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setCurrentId("");
    setName("");
    setIsOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setIsEditing(true);
    setCurrentId(cat.id);
    setName(cat.name);
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const url = isEditing ? `/api/categories/${currentId}` : "/api/categories";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();

      if (data.success) {
        setIsOpen(false);
        fetchCategories();
      } else {
        alert(data.error || "Gagal menyimpan kategori");
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenDelete = (cat: Category) => {
    setCategoryToDelete(cat);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/categories/${categoryToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        setIsDeleteDialogOpen(false);
        fetchCategories();
      } else {
        alert(data.error || "Gagal menghapus kategori");
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
          <h1 className="text-2xl font-bold text-slate-900">Kategori Produk</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola daftar kategori produk untuk toko Anda.</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger render={
            <Button onClick={handleOpenCreate} className="bg-[#00A76F] hover:bg-[#00A76F]/90 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Kategori
            </Button>
          } />
          <DialogContent>
            <form onSubmit={handleSave}>
              <DialogHeader>
                <DialogTitle>{isEditing ? "Edit Kategori" : "Tambah Kategori Baru"}</DialogTitle>
              </DialogHeader>
              <div className="py-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Kategori</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Contoh: Makanan Ringan"
                    required 
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
                  Batal
                </Button>
                <Button type="submit" disabled={isSaving || !name.trim()} className="bg-[#0D1F3D] hover:bg-[#0D1F3D]/90 text-white">
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Simpan
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Nama Kategori</TableHead>
              <TableHead>Jumlah Produk</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="h-32 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                  <p className="text-sm text-slate-500 mt-2">Memuat data...</p>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={3} className="h-32 text-center text-red-500">
                  <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                  {error}
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-32 text-center text-slate-500">
                  Belum ada kategori. Silakan tambahkan kategori pertama Anda.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium text-slate-900">{cat.name}</TableCell>
                  <TableCell className="text-slate-600">{cat._count.products} Produk</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(cat)}>
                        <Edit2 className="w-4 h-4 text-slate-500" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleOpenDelete(cat)}>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Kategori</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600">
              Apakah Anda yakin ingin menghapus kategori <strong>{categoryToDelete?.name}</strong>?
            </p>
            {categoryToDelete && categoryToDelete._count.products > 0 && (
              <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p>
                  Kategori ini tidak dapat dihapus karena masih digunakan oleh {categoryToDelete._count.products} produk. 
                  Ubah kategori produk tersebut terlebih dahulu.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
              Batal
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || Boolean(categoryToDelete && categoryToDelete._count.products > 0)}
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
