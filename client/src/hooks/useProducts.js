// Custom Hook: useProducts
// Fetches product list with support for search (q), category filtering, SQL-level sorting, and pagination
import { useState, useEffect, useCallback } from "react";
import axiosClient from "../api/axiosClient";

export function useProducts(options = {}) {
  const {
    endpoint = "/products",
    search = "",
    category = "",
    limit = 12,
    page = 1,
    skip = 0,
    sort = "",
    sortBy = "",
    order = "asc",
  } = options;

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(page);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {};

      // 1. Search Query
      if (search && search.trim() !== "") {
        params.q = search.trim();
      }

      // 2. Category Filter
      if (category && category !== "all" && category.trim() !== "") {
        params.category = category.trim();
      }

      // 3. Sorting (Direct sort param or legacy sortBy/order)
      if (sort && sort.trim() !== "") {
        params.sort = sort.trim();
      } else if (sortBy) {
        if (sortBy === "price") {
          params.sort = order === "desc" ? "price_desc" : "price_asc";
        } else if (sortBy === "created_at" || sortBy === "newest") {
          params.sort = "newest";
        } else {
          params.sortBy = sortBy;
          params.order = order;
        }
      }

      // 4. Pagination
      params.limit = limit;
      if (page) params.page = page;
      if (skip) params.skip = skip;

      const response = await axiosClient.get(endpoint, { params });
      const resData = response.data;

      // Extract products array
      const items =
        resData.data ||
        resData.products ||
        (Array.isArray(resData) ? resData : []);

      setProducts(items);
      setTotal(resData.total || items.length || 0);
      setTotalPages(resData.totalPages || Math.ceil((resData.total || items.length || 1) / limit) || 1);
      setCurrentPage(resData.page || page || 1);
    } catch (err) {
      setError(err?.message || "Failed to fetch products from server.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint, search, category, limit, page, skip, sort, sortBy, order]);

  // Automatically fetch when query parameters change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    total,
    totalPages,
    currentPage,
    loading,
    error,
    refetch: fetchProducts,
  };
}

export default useProducts;
