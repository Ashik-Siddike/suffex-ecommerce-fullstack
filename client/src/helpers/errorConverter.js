/**
 * Helper to extract customized error message sent from the backend
 * @param {Object} error - Axios error object
 * @returns {string|null}
 */
export const errorMsgGeneratorFunc = (error) => {
  if (!error) return null;

  // Backend returned custom message in response data
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // Backend returned validation errors array
  if (Array.isArray(error.response?.data?.errors)) {
    return error.response.data.errors
      .map((err) => (typeof err === "string" ? err : err.message || err.msg))
      .filter(Boolean)
      .join(", ");
  }

  // Backend returned a plain text error body
  if (typeof error.response?.data === "string" && error.response.data.trim()) {
    return error.response.data;
  }

  // Default error message property if not a generic Axios message
  if (
    error.message &&
    error.message !== "Network Error" &&
    !error.message.startsWith("Request failed with status")
  ) {
    return error.message;
  }

  return null;
};

/**
 * Converts standard HTTP status codes and network issues to user-friendly messages
 * @param {Object} error - Axios error object
 * @returns {string}
 */
export const convertErrorStatusToText = (error) => {
  if (!error) return "An unexpected error occurred.";

  // Timeout or Aborted
  if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
    return "Server response timeout. Please check your internet connection.";
  }

  // Network connection issue
  if (error.message === "Network Error" || !error.response) {
    return "Unable to connect to the server. Please verify your internet connection.";
  }

  const status = error.response?.status;

  switch (status) {
    case 400:
      return "Bad request. Please verify the request parameters.";
    case 401:
      return "Unauthorized access. Your session has expired. Please log in again.";
    case 403:
      return "Forbidden. You do not have permission to access this resource.";
    case 404:
      return "Requested resource was not found on the server.";
    case 408:
      return "Request timed out.";
    case 422:
      return "Validation failed. Please verify the submitted data.";
    case 429:
      return "Too many requests. Please wait a moment and try again.";
    case 500:
      return "Internal server error. Please try again later.";
    case 502:
      return "Bad gateway. The upstream server is currently unavailable.";
    case 503:
      return "Service unavailable. The server is undergoing maintenance.";
    case 504:
      return "Gateway timeout. The server took too long to respond.";
    default:
      return `Request failed with HTTP status code ${status || "unknown"}.`;
  }
};
