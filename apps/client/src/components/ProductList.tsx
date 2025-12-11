import { ProductsType, ProductType } from "@repo/types";
import Categories from "./Categories";
import ProductCard from "./ProductCard";
import Link from "next/link";
import Filter from "./Filter";

const fetchData = async ({
  category,
  sort,
  search,
  params,
}: {
  category?: string;
  sort?: string;
  search?: string;
  params: "homepage" | "products";
}) => {
  const base = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || "";
  const url = new URL(base);

  if (category) url.searchParams.set("category", category);
  if (search) url.searchParams.set("search", search);
  url.searchParams.set("sort", sort || "newest");
  if (params === "homepage") url.searchParams.set("limit", "8");

  const res = await fetch(url.toString());
  const data = await res.json();

  return Array.isArray(data) ? (data as ProductType[]) : [];
};

const ProductList = async ({
  category,
  sort,
  search,
  params,
}: {
  category?: string;
  sort?: string;
  search?: string;
  params: "homepage" | "products";
}) => {
  const products = await fetchData({ category, sort, search, params });

  return (
    <div className="w-full">
      <Categories />
      {params === "products" && <Filter />}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-12">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <Link
        href={category ? `/products/?category=${category}` : "/products"}
        className="flex justify-end mt-4 underline text-sm text-gray-500"
      >
        View all products
      </Link>
    </div>
  );
};

export default ProductList;
