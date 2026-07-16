import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  iconClassName?: string;
  iconWrapperClassName?: string;
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue,
  iconClassName,
  iconWrapperClassName
}: StatCardProps) {
  return (
    <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", iconWrapperClassName)}>
          <Icon className={cn("w-4 h-4", iconClassName)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-[#0D1F3D]">
          {value}
        </div>
        {(trend || trendValue) && (
          <div className="flex items-center gap-1 mt-1">
            {trend === "up" && (
              <ArrowUpRight className="w-3 h-3 text-[#00A76F]" />
            )}
            {trend === "down" && (
              <ArrowDownRight className="w-3 h-3 text-red-500" />
            )}
            <span
              className={cn(
                "text-xs",
                trend === "up" && "text-[#00A76F]",
                trend === "down" && "text-red-500",
                trend === "neutral" && "text-muted-foreground"
              )}
            >
              {trendValue}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
