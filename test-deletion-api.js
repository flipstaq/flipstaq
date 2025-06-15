// Test script to debug user deletion
const axios = require("axios");

async function testUserDeletion() {
  try {
    console.log("🧪 Testing user deletion API...");

    // First, let's get all users to find one to delete
    const usersResponse = await axios.get("http://localhost:3001/api/users", {
      headers: {
        Authorization: "Bearer test-token", // This will be replaced by actual JWT in production
        "Content-Type": "application/json",
      },
    });

    console.log("📋 Users response:", usersResponse.data);

    const users = usersResponse.data.users || [];
    const userToDelete = users.find((u) => !u.deletedAt && u.role !== "OWNER");

    if (!userToDelete) {
      console.log("❌ No suitable user found to delete");
      return;
    }

    console.log("🎯 Found user to delete:", userToDelete);

    // Now delete the user
    console.log("🗑️ Deleting user...");
    const deleteResponse = await axios.delete(
      `http://localhost:3001/api/users/${userToDelete.id}`,
      {
        headers: {
          Authorization: "Bearer test-token",
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Delete response:", deleteResponse.data);

    // Now fetch the user details to see if deletedBy is set
    console.log("🔍 Fetching user details after deletion...");
    const userDetailsResponse = await axios.get(
      `http://localhost:3001/api/users/${userToDelete.id}`,
      {
        headers: {
          Authorization: "Bearer test-token",
          "Content-Type": "application/json",
        },
      }
    );

    console.log(
      "📊 User details after deletion:",
      JSON.stringify(userDetailsResponse.data, null, 2)
    );
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

testUserDeletion();
