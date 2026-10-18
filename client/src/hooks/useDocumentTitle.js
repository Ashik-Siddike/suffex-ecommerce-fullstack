import { useEffect } from "react";

/**
 * Custom hook to dynamically update document.title for SEO & tab clarity
 * @param {string} title - The specific page or resource title
 * @param {string} [brand="Suffex Store"] - Brand suffix
 */
export function useDocumentTitle(title, brand = "Suffex Store") {
  useEffect(() => {
    const prevTitle = document.title;
    if (title) {
      document.title = `${title} | ${brand}`;
    }
    return () => {
      document.title = prevTitle;
    };
  }, [title, brand]);
}

export default useDocumentTitle;
