// export async function getData(endpoint) {
//     try {
//       const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
//       const response = await fetch(`${baseUrl}/api/${endpoint}`, {
//         cache: "no-store",
//       });
//       const data = await response.json();
//       return data;
//     } catch (error) {
//       console.log(error);
//     }
//   }

export async function getData(endpoint) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}/api/${endpoint}`, {
        cache: "no-store",
      });
  
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
  
      const text = await response.text(); // Read response as text first
      return text ? JSON.parse(text) : null; // Convert to JSON only if not empty
    } catch (error) {
      console.error("Error fetching data:", error);
      return null; // Return null instead of undefined
    }
  }
  