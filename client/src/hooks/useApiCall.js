import { useState, useCallback } from "react";
import axiosClient from "../api/axiosClient";
import {
  convertErrorStatusToText,
  errorMsgGeneratorFunc,
} from "../helpers/errorConverter";
import { baseUrl } from "../config/baseURL";

/**
 * Production-level generic API call hook
 * Handles loading states, standardized error messages, response storage, callbacks, and resets.
 * 
 * @param {any} initialValue - Optional initial value for responseData
 * @returns {{ isLoading: boolean, responseData: any, isError: string|null, apiFetcher: Function, handleReset: Function }}
 */
const useApiCall = (initialValue = null) => {
  const [apiResponse, setApiResponse] = useState({
    isLoading: false,
    responseData: initialValue,
    isError: null,
  });

  const { isLoading, responseData, isError } = apiResponse;

  const handleReset = useCallback(() => {
    setApiResponse({
      isLoading: false,
      isError: null,
      responseData: initialValue,
    });
  }, [initialValue]);

  const apiFetcher = useCallback(
    async ({ options = {}, callback } = {}) => {
      setApiResponse((prev) => ({
        ...prev,
        isLoading: true,
        isError: null,
        responseData: null,
      }));

      // Safely format url whether given as relative or full URL
      const relativeOrAbsoluteUrl = options.url || "";
      const finalUrl = relativeOrAbsoluteUrl.startsWith("http")
        ? relativeOrAbsoluteUrl
        : `${baseUrl}${relativeOrAbsoluteUrl.startsWith("/") ? "" : "/"}${relativeOrAbsoluteUrl}`;

      try {
        const response = await axiosClient({
          ...options,
          url: finalUrl,
        });

        const data = response?.data;
        if (data !== undefined) {
          setApiResponse({
            isLoading: false,
            responseData: data,
            isError: null,
          });

          if (typeof callback === "function") {
            callback(data);
          }
          return data;
        }
        return null;
      } catch (error) {
        console.log("error=======>>>>>>", error);
        const formattedError =
          errorMsgGeneratorFunc(error) ?? convertErrorStatusToText(error);

        setApiResponse({
          isLoading: false,
          responseData: null,
          isError: formattedError,
        });
        return null;
      }
    },
    []
  );

  return { isLoading, responseData, isError, apiFetcher, handleReset };
};

export default useApiCall;
