"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import type { CategoryOption, TransactionFilters } from "./schemas";

export function TransactionFiltersForm({
  categories,
  filters,
}: {
  categories: CategoryOption[];
  filters: TransactionFilters;
}) {
  const [type, setType] = useState(filters.type ?? "");
  const [categoryId, setCategoryId] = useState(filters.categoryId ?? "");
  return (
    <form
      action="/transactions"
      method="get"
      className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1.4fr_1fr_1fr_auto]"
      aria-label="Filter transactions"
    >
      <div className="space-y-2">
        <Label htmlFor="filter-type">Type</Label>
        <NativeSelect
          id="filter-type"
          name="type"
          className="w-full"
          value={type}
          onChange={(event) => {
            setType(event.target.value);
            setCategoryId("");
          }}
        >
          <NativeSelectOption value="">All types</NativeSelectOption>
          <NativeSelectOption value="INCOME">Income</NativeSelectOption>
          <NativeSelectOption value="EXPENSE">Expense</NativeSelectOption>
        </NativeSelect>
      </div>
      <div className="space-y-2">
        <Label htmlFor="filter-category">Category</Label>
        <NativeSelect
          id="filter-category"
          name="categoryId"
          className="w-full"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
        >
          <NativeSelectOption value="">All categories</NativeSelectOption>
          {categories
            .filter((category) => !type || category.type === type)
            .map((category) => (
              <NativeSelectOption key={category.id} value={category.id}>
                {category.name}
              </NativeSelectOption>
            ))}
        </NativeSelect>
      </div>
      <div className="space-y-2">
        <Label htmlFor="filter-from">From</Label>
        <Input
          id="filter-from"
          name="from"
          type="date"
          min="1900-01-01"
          max="9999-12-31"
          defaultValue={filters.from ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="filter-to">To</Label>
        <Input
          id="filter-to"
          name="to"
          type="date"
          min="1900-01-01"
          max="9999-12-31"
          defaultValue={filters.to ?? ""}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit">Apply</Button>
        <Button variant="ghost" asChild>
          <Link href="/transactions">Reset</Link>
        </Button>
      </div>
    </form>
  );
}
