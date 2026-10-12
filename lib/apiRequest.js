// lib/apiRequest.js
// Route: n/a (shared client helper for all API calls)
import toast from "react-hot-toast";

function buildUrl(endpoint) {
  return endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
}

async function readJson(response) {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}

export async function makePostRequest(setLoading, endpoint, data, resourceName, reset, redirect) {
  try {
    setLoading(true);
    const response = await fetch(buildUrl(endpoint), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await readJson(response);
    console.log("[apiRequest] POST", endpoint, response.status, result);

    if (response.ok) {
      toast.success(`New ${resourceName} Created Successfully`);
      if (typeof reset === "function") reset();
      if (typeof redirect === "function") redirect();
      return result;
    }

    toast.error(result?.message || "Something Went wrong");
    return null;
  } catch (error) {
    console.log(error);
    toast.error("Network error, please try again");
    return null;
  } finally {
    setLoading(false);
  }
}

export async function makePutRequest(setLoading, endpoint, data, resourceName, redirect, reset) {
  try {
    setLoading(true);
    const response = await fetch(buildUrl(endpoint), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await readJson(response);
    console.log("[apiRequest] PUT", endpoint, response.status, result);

    if (response.ok) {
      toast.success(`${resourceName} Updated Successfully`);
      if (typeof reset === "function") reset();
      if (typeof redirect === "function") redirect();
      return result;
    }

    toast.error(result?.message || "Something Went wrong");
    return null;
  } catch (error) {
    console.log(error);
    toast.error("Network error, please try again");
    return null;
  } finally {
    setLoading(false);
  }
}

// DELETE with an optional JSON body (used for bulk delete: { ids: [...] })
export async function makeDeleteRequest(setLoading, endpoint, body, successMessage) {
  try {
    setLoading(true);
    const response = await fetch(buildUrl(endpoint), {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const result = await readJson(response);
    console.log("[apiRequest] DELETE", endpoint, response.status, result);

    if (response.ok) {
      toast.success(successMessage || result?.message || "Deleted successfully");
      return result;
    }

    toast.error(result?.message || "Something Went wrong");
    return null;
  } catch (error) {
    console.log(error);
    toast.error("Network error, please try again");
    return null;
  } finally {
    setLoading(false);
  }
}