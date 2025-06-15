const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testDeletion() {
  try {
    console.log("🔍 Testing Prisma deletion tracking...");

    // Find all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        deletedAt: true,
        deletedById: true,
        deletedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    console.log("📊 All users:");
    users.forEach((user) => {
      console.log(`  ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`    ID: ${user.id}`);
      console.log(`    Deleted: ${user.deletedAt ? "Yes" : "No"}`);
      console.log(`    DeletedById: ${user.deletedById || "null"}`);
      console.log(
        `    DeletedBy: ${
          user.deletedBy
            ? `${user.deletedBy.firstName} ${user.deletedBy.lastName}`
            : "null"
        }`
      );
      console.log("");
    });

    // Find a non-deleted user to test with
    const activeUser = users.find((u) => !u.deletedAt);
    const adminUser = users.find(
      (u) => u.deletedAt === null && u.id !== activeUser?.id
    );

    if (activeUser && adminUser) {
      console.log(
        `🎯 Testing deletion of ${activeUser.firstName} by ${adminUser.firstName}...`
      );

      // Simulate deletion
      const result = await prisma.user.update({
        where: { id: activeUser.id },
        data: {
          deletedAt: new Date(),
          deletedById: adminUser.id,
          isActive: false,
        },
        select: {
          id: true,
          firstName: true,
          deletedAt: true,
          deletedById: true,
          deletedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      });

      console.log("✅ Deletion result:", JSON.stringify(result, null, 2));

      // Query the user again to confirm
      const confirmedUser = await prisma.user.findUnique({
        where: { id: activeUser.id },
        select: {
          id: true,
          firstName: true,
          deletedAt: true,
          deletedById: true,
          deletedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      });

      console.log(
        "🔍 Confirmed user state:",
        JSON.stringify(confirmedUser, null, 2)
      );
    } else {
      console.log("❌ Need at least 2 users to test deletion tracking");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testDeletion();
