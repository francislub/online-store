// lib/apiRequest.js
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