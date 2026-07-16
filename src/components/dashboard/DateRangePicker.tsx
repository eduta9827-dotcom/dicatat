"use client";

import * as React from "react";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { id } from "date-fns/locale";

export interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
  onPresetSelect?: (preset: string) => void;
}

export const getTodayWIB = () => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find(p => p.type === 'year')!.value;
  const month = parts.find(p => p.type === 'month')!.value;
  const day = parts.find(p => p.type === 'day')!.value;
  
  return new Date(Number(year), Number(month) - 1, Number(day));
};

export function DateRangePicker({
  className,
  date,
  setDate,
  onPresetSelect,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const presets = [
    {
      label: "Hari Ini",
      getValue: () => {
        const today = getTodayWIB();
        return { from: today, to: today };
      },
    },
    {
      label: "Kemarin",
      getValue: () => {
        const yesterday = subDays(getTodayWIB(), 1);
        return { from: yesterday, to: yesterday };
      },
    },
    {
      label: "7 Hari Terakhir",
      getValue: () => {
        const today = getTodayWIB();
        return { from: subDays(today, 6), to: today };
      },
    },
    {
      label: "Bulan Lalu",
      getValue: () => {
        const prevMonth = subMonths(getTodayWIB(), 1);
        return { 
          from: startOfMonth(prevMonth), 
          to: endOfMonth(prevMonth) 
        };
      },
    },
  ];

  const isDateEqual = (d1?: Date, d2?: Date) => {
    if (!d1 || !d2) return false;
    return d1.getTime() === d2.getTime();
  };

  const getActivePreset = () => {
    if (!date?.from || !date?.to) return null;
    return presets.find(p => {
      const pDate = p.getValue();
      return isDateEqual(date.from, pDate.from) && isDateEqual(date.to, pDate.to);
    });
  };

  const activePresetLabel = getActivePreset()?.label || "Custom";

  const handlePresetSelect = (preset: typeof presets[0]) => {
    const value = preset.getValue();
    setDate(value);
    if (onPresetSelect) {
      onPresetSelect(preset.label);
    }
  };

  const renderCustomLabel = () => {
    if (!date?.from) return "Custom";
    
    // If it's a known preset, just say "Custom"
    if (activePresetLabel !== "Custom") return "Custom";

    if (!date.to) {
      return format(date.from, "dd LLL y", { locale: id });
    }

    const sameDay = date.from.getDate() === date.to.getDate() && 
                    date.from.getMonth() === date.to.getMonth() && 
                    date.from.getFullYear() === date.to.getFullYear();

    if (sameDay) {
      return format(date.from, "dd LLL y", { locale: id });
    }

    return `${format(date.from, "dd LLL", { locale: id })} - ${format(date.to, "dd LLL y", { locale: id })}`;
  };

  return (
    <div className={cn("flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide w-full", className)}>
      {presets.map((preset) => (
        <button
          key={preset.label}
          onClick={() => handlePresetSelect(preset)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-colors",
            activePresetLabel === preset.label
              ? "bg-[#0D1F3D] text-white border-[#0D1F3D]"
              : "bg-white text-slate-700 border-slate-200 hover:border-[#0D1F3D] hover:text-[#0D1F3D]"
          )}
        >
          {preset.label}
        </button>
      ))}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger render={
          <button
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-colors",
              activePresetLabel === "Custom"
                ? "bg-[#0D1F3D] text-white border-[#0D1F3D]"
                : "bg-white text-slate-700 border-slate-200 hover:border-[#0D1F3D] hover:text-[#0D1F3D]"
            )}
          >
            <CalendarIcon className="w-4 h-4" />
            {renderCustomLabel()}
          </button>
        } />
        <PopoverContent className="w-auto p-0" align="end">
          <div className="p-3">
            <Calendar
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
              locale={id}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
