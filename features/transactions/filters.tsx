"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { FormSelect } from "@/components/ui/form-select";
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
      className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-4"
      aria-label="Filter transactions"
    >
      <div className="space-y-2">
        <Label htmlFor="filter-type">Type</Label>
        <FormSelect
          id="filter-type"
          name="type"
          className="w-full"
          value={type}
          onValueChange={(value) => {
            setType(value);
            setCategoryId("");
          }}
         options={[{value:"",label:"All types"},{value:"INCOME",label:"Income"},{value:"EXPENSE",label:"Expense"}]} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="filter-category">Category</Label>
        <FormSelect
          id="filter-category"
          name="categoryId"
          className="w-full"
          value={categoryId}
          onValueChange={(value) => setCategoryId(value)}
         options={[{value:"",label:"All categories"},...categories.filter(category=>!type||category.type===type).map(category=>({value:category.id,label:category.name}))]} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="filter-from">From</Label>
        <DatePicker
          id="filter-from"
          label="From"
          name="from"
          min="1900-01-01"
          max="9999-12-31"
          defaultValue={filters.from ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="filter-to">To</Label>
        <DatePicker
          id="filter-to"
          label="To"
          name="to"
          min="1900-01-01"
          max="9999-12-31"
          defaultValue={filters.to ?? ""}
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="filter-q">Search merchant or note</Label>
        <Input id="filter-q" name="q" maxLength={100} defaultValue={filters.q ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="filter-min">Minimum (MMK)</Label>
        <Input id="filter-min" name="minAmount" inputMode="numeric" pattern="[0-9]+" maxLength={16} defaultValue={filters.minAmount ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="filter-max">Maximum (MMK)</Label>
        <Input id="filter-max" name="maxAmount" inputMode="numeric" pattern="[0-9]+" maxLength={16} defaultValue={filters.maxAmount ?? ""} />
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
