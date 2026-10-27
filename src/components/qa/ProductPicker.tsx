"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { PRODUCTS } from "@/lib/mock";
import { PRODUCT_CATEGORIES, type ProductCategory } from "@/lib/types";
import { cn, inputClass } from "@/lib/utils";

interface ProductPickerProps {
  productId: string;
  onChange: (productId: string) => void;
}

/** 상품 선택: 대분류 → 소분류(상품명) 드롭다운 + 상품명 검색 */
export function ProductPicker({ productId, onChange }: ProductPickerProps) {
  const product = PRODUCTS.find((p) => p.id === productId) ?? PRODUCTS[0];
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const inCategory = PRODUCTS.filter((p) => p.category === product.category);
  const keyword = query.replace(/\s+/g, "").toLowerCase();
  const results = keyword
    ? PRODUCTS.filter((p) => `${p.name}${p.category}`.replace(/\s+/g, "").toLowerCase().includes(keyword))
    : [];

  const handleCategory = (category: ProductCategory) => {
    const first = PRODUCTS.find((p) => p.category === category);
    if (first) onChange(first.id);
  };

  const pick = (id: string) => {
    onChange(id);
    setQuery("");
    setSearchOpen(false);
  };

  return (
    <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-2 lg:grid-cols-[160px_minmax(0,1fr)_minmax(0,280px)]">
      <select
        aria-label="상품 대분류"
        value={product.category}
        onChange={(e) => handleCategory(e.target.value as ProductCategory)}
        className={inputClass}
      >
        {PRODUCT_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select
        aria-label="상품명"
        value={product.id}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      >
        {inCategory.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <div className="relative col-span-2 lg:col-span-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSearchOpen(true);
          }}
          onFocus={() => setSearchOpen(true)}
          onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) {
              e.preventDefault();
              pick(results[0].id);
            }
          }}
          placeholder="상품명 검색"
          className={cn(inputClass, "pl-10")}
        />
        {searchOpen && keyword && (
          <ul className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-line bg-white shadow-lg">
            {results.length === 0 ? (
              <li className="px-4 py-3 text-sm text-muted">검색 결과가 없어요.</li>
            ) : (
              results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(p.id)}
                    className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm hover:bg-brand-50"
                  >
                    <span className="truncate text-ink">{p.name}</span>
                    <Badge>{p.category}</Badge>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}