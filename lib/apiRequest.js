// lib/apiRequest.js
// Shared client helper for API calls.

import toast from "react-hot-toast";

function buildUrl(endpoint) {
  return endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

// GET helper: returns parsed JSON or null.
export async function makeGetRequest(endpoint) {
  try {
    const response = await fetch(buildUrl(endpoint), {
      cache: "no-store",
    });

    const result = await readJson(response);

    if (response.ok) {
      return result;
    }

    toast.error(result?.message || "Failed to load data");

    return null;
  } catch (error) {
    console.error("[apiRequest] GET failed:", error);

    toast.error("Network error, please try again");

    return null;
  }
}

// POST helper.
export async function makePostRequest(
  setLoading,
  endpoint,
  data,
  resourceName,
  reset,
  redirect
) {
  try {
    setLoading(true);

    const response = await fetch(buildUrl(endpoint), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await readJson(response);

    console.log(
      "[apiRequest] POST",
      endpoint,
      response.status,
      result
    );

    if (response.ok) {
      toast.success(
        `New ${resourceName} Created Successfully`
      );

      if (typeof reset === "function") {
        reset();
      }

      if (typeof redirect === "function") {
        redirect();
      }

      return result;
    }

    toast.error(result?.message || "Something Went wrong");

    return null;
  } catch (error) {
    console.error("[apiRequest] POST failed:", error);

    toast.error("Network error, please try again");

    return null;
  } finally {
    setLoading(false);
  }
}

// PUT helper.
export async function makePutRequest(
  setLoading,
  endpoint,
  data,
  resourceName,
  redirect,
  reset
) {
  try {
    setLoading(true);

    const response = await fetch(buildUrl(endpoint), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await readJson(response);

    console.log(
      "[apiRequest] PUT",
      endpoint,
      response.status,
      result
    );

    if (response.ok) {
      toast.success(
        `${resourceName} Updated Successfully`
      );

      if (typeof reset === "function") {
        reset();
      }

      if (typeof redirect === "function") {
        redirect();
      }

      return result;
    }

    toast.error(result?.message || "Something Went wrong");

    return null;
  } catch (error) {
    console.error("[apiRequest] PUT failed:", error);

    toast.error("Network error, please try again");

    return null;
  } finally {
    setLoading(false);
  }
}

// DELETE helper with an optional JSON body.
// Used for bulk deletion: { ids: [...] }
export async function makeDeleteRequest(
  setLoading,
  endpoint,
  body,
  successMessage
) {
  try {
    setLoading(true);

    const response = await fetch(buildUrl(endpoint), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const result = await readJson(response);

    console.log(
      "[apiRequest] DELETE",
      endpoint,
      response.status,
      result
    );

    if (response.ok) {
      toast.success(
        result?.message ||
          successMessage ||
          "Deleted successfully"
      );

      return result;
    }

    toast.error(result?.message || "Something Went wrong");

    return null;
  } catch (error) {
    console.error("[apiRequest] DELETE failed:", error);

    toast.error("Network error, please try again");

    return null;
  } finally {
    setLoading(false);
  }
}