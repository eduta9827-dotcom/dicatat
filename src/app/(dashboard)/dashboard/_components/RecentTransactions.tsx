import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface Transaction {
  id: string;
  invoice: string;
  grandTotal: number;
  createdAt: Date;
  customer?: {
    name: string;
  } | null;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card className="border-slate-100 shadow-sm h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          5 Transaksi Terakhir
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="flex items-center justify-center h-[250px] text-sm text-slate-500">
            Belum ada transaksi
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between border-b border-slate-50 last:border-0 pb-3 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {t.customer?.name || "Pelanggan Umum"}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500">{t.invoice}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500">
                      {new Date(t.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
                <div className="text-sm font-bold text-[#0D1F3D]">
                  {formatCurrency(t.grandTotal)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
