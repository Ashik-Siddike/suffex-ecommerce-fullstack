import { useEffect, useCallback } from "react";
import useApiCall from "./useApiCall";

/**
 * Custom hook to fetch a single product by ID using the production useApiCall architecture
 * @param {number|string|null} productId - The ID of the product
 * @returns {{ product: Object|null, loading: boolean, error: string|null, refetch: Function }}
 */
export function useProduct(productId) {
  const {
    isLoading: loading,
    responseData: product,
    isError: error,
    apiFetcher,
    handleReset,
  } = useApiCall(null);

  const fetchProduct = useCallback(() => {
    if (!productId) {
      handleReset();
      return;
    }

    const cleanId = String(productId).replace(/^prod-/, "");
    apiFetcher({
      options: {
        method: "GET",
        url: `/products/${cleanId}`,
      },
    });
  }, [productId, apiFetcher, handleReset]);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    } else {
      handleReset();
    }
  }, [productId, fetchProduct, handleReset]);

  return {
    product,
    loading,
    error,
    refetch: fetchProduct,
  };
}

export default useProduct;
