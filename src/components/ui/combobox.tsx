import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export type ComboboxOption = { value: string; label: string; keywords?: string[] };

type Props = {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  /** Allow keeping a typed value that is not in the list (e.g. city). */
  allowCustom?: boolean;
  customLabel?: (query: string) => string;
  disabled?: boolean;
  className?: string;
  id?: string;
};

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "اختر",
  searchPlaceholder = "ابحث…",
  emptyText = "لا نتائج",
  allowCustom = false,
  customLabel,
  disabled,
  className,
  id,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const selected = options.find((o) => o.value === value);
  const shown = selected?.label ?? (value || "");
  const q = query.trim();
  const canAdd =
    allowCustom &&
    q.length > 0 &&
    !options.some((o) => o.label.toLowerCase() === q.toLowerCase() || o.value.toLowerCase() === q.toLowerCase());

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    setQuery("");
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !shown && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{shown || placeholder}</span>
          <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] min-w-[14rem] p-0"
        align="start"
      >
        <Command
          filter={(itemValue, search, keywords) => {
            const hay = `${itemValue} ${(keywords ?? []).join(" ")}`.toLowerCase();
            return hay.includes(search.trim().toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput placeholder={searchPlaceholder} value={query} onValueChange={setQuery} />
          <CommandList>
            {!canAdd && <CommandEmpty>{emptyText}</CommandEmpty>}
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.value}
                  value={o.label}
                  keywords={[o.value, ...(o.keywords ?? [])]}
                  onSelect={() => pick(o.value)}
                >
                  <Check
                    className={cn("me-2 h-4 w-4", o.value === value ? "opacity-100" : "opacity-0")}
                  />
                  <span className="truncate">{o.label}</span>
                </CommandItem>
              ))}
              {canAdd && (
                <CommandItem value={`__add__${q}`} keywords={[q]} onSelect={() => pick(q)}>
                  <Plus className="me-2 h-4 w-4" />
                  <span className="truncate">{customLabel ? customLabel(q) : q}</span>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** Shared bilingual labels for combobox search UI. */
export function comboText(lang: "ar" | "en") {
  return lang === "en"
    ? {
        search: "Search…",
        empty: "No results",
        add: (q: string) => `Use "${q}"`,
        choose: "Select",
        pickCountryFirst: "Choose a country first",
      }
    : {
        search: "ابحث…",
        empty: "لا نتائج",
        add: (q: string) => `استخدام «${q}»`,
        choose: "اختر",
        pickCountryFirst: "اختر الدولة أولاً",
      };
}

