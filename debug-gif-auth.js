// Debugging script for GIF authentication issues
// Run this in the browser console on the frontend

console.log("=== GIF Authentication Debug ===");

// Check if token exists
const token = localStorage.getItem("token");
console.log("1. Token exists:", !!token);
console.log("2. Token length:", token ? token.length : 0);
console.log(
  "3. Token preview:",
  token ? token.substring(0, 20) + "..." : "null"
);

// Test if user appears to be logged in
const userStr = localStorage.getItem("user");
console.log("4. User data exists:", !!userStr);
if (userStr) {
  try {
    const user = JSON.parse(userStr);
    console.log("5. User data:", {
      id: user.id,
      username: user.username,
      email: user.email,
    });
  } catch (e) {
    console.log("5. User data parsing error:", e);
  }
}

// Test the GIF API endpoint
if (token) {
  console.log("6. Testing GIF API...");
  fetch("/api/v1/gifs/trending", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      console.log("7. API Response status:", response.status);
      console.log("8. API Response ok:", response.ok);
      if (!response.ok) {
        return response.text().then((text) => {
          console.log("9. API Error response:", text);
          throw new Error(`HTTP ${response.status}: ${text}`);
        });
      }
      return response.json();
    })
    .then((data) => {
      console.log("10. API Success! GIF count:", data.results?.length || 0);
      console.log("11. First GIF:", data.results?.[0] || "none");
    })
    .catch((error) => {
      console.log("12. API Error:", error.message);
    });
} else {
  console.log("6. No token found - user needs to log in first");
}

// Test auth endpoint to see if token is valid
if (token) {
  console.log("13. Testing token validity...");
  fetch("/api/v1/auth/profile", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      console.log("14. Auth check status:", response.status);
      if (response.ok) {
        console.log("15. Token is valid ✅");
      } else {
        console.log("15. Token is invalid ❌ - user needs to log in again");
      }
    })
    .catch((error) => {
      console.log("15. Auth check failed:", error.message);
    });
}

console.log("=== End Debug ===");
