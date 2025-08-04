// scripts/setAdmin.js
require("dotenv").config();
const admin = require("firebase-admin");

// Debug environment variables
console.log("🔍 Checking environment variables...");
console.log(
  "FIREBASE_PROJECT_ID:",
  process.env.FIREBASE_PROJECT_ID || "MISSING"
);
console.log(
  "FIREBASE_CLIENT_EMAIL:",
  process.env.FIREBASE_CLIENT_EMAIL || "MISSING"
);
console.log(
  "FIREBASE_PRIVATE_KEY length:",
  process.env.FIREBASE_PRIVATE_KEY?.length || 0
);

// Validate required environment variables
if (
  !process.env.FIREBASE_PROJECT_ID ||
  !process.env.FIREBASE_PRIVATE_KEY ||
  !process.env.FIREBASE_CLIENT_EMAIL
) {
  console.error(
    "❌ Missing required environment variables. Please check your .env file."
  );
  process.exit(1);
}

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const credential = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };

    console.log("🚀 Initializing Firebase Admin...");
    console.log("Project ID:", credential.projectId);
    console.log("Client Email:", credential.clientEmail);

    admin.initializeApp({
      credential: admin.credential.cert(credential),
    });

    console.log("✅ Firebase Admin initialized successfully");
  } catch (error) {
    console.error("❌ Firebase Admin initialization failed:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
}

async function setAdmin(email) {
  try {
    console.log(`\n🔍 Looking for user: ${email}`);

    // Check if user exists
    const user = await admin.auth().getUserByEmail(email);
    console.log(`✅ Found user:`, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
      disabled: user.disabled,
    });

    // Define admin custom claims
    const customClaims = {
      role: "admin",
      permissions: {
        read: true,
        write: true,
        ai_query: true,
        user_management: true,
      },
    };

    console.log("🔧 Setting custom claims...");
    await admin.auth().setCustomUserClaims(user.uid, customClaims);

    console.log("✅ Custom claims set successfully!");
    console.log("Applied claims:", JSON.stringify(customClaims, null, 2));

    // Verify the claims were applied
    console.log("🔍 Verifying claims...");
    const updatedUser = await admin.auth().getUser(user.uid);
    console.log(
      "✅ Verified custom claims:",
      JSON.stringify(updatedUser.customClaims, null, 2)
    );

    console.log(`\n🎉 SUCCESS: ${email} is now an admin!`);
    console.log("\n📝 Next steps:");
    console.log(
      "1. The user needs to log out and log back in for the changes to take effect"
    );
    console.log(
      "2. You can verify admin access by checking the UI or making authenticated API calls"
    );
  } catch (error) {
    console.error("❌ Error setting admin role:", error.message);

    if (error.code === "auth/user-not-found") {
      console.log("\n💡 User not found. To fix this:");
      console.log("1. Make sure the email address is correct");
      console.log("2. Have the user log in to your React app at least once");
      console.log("3. Then run this script again");
      console.log("\n🔧 Quick fix options:");
      console.log(
        "Option 1: Go to Firebase Console → Authentication → Users → Add user"
      );
      console.log("Option 2: Create a simple test login page");
      console.log("Option 3: Wait until you build the React frontend");
    } else if (error.code === "auth/invalid-email") {
      console.log("\n💡 Invalid email format. Please check the email address.");
    } else {
      console.log("\n🔧 Debug info:");
      console.log("Error code:", error.code);
      console.log("Error message:", error.message);
    }
  }
}

// Usage
async function main() {
  console.log("🚀 EMS Data Portal - Admin User Setup");
  console.log("=====================================");

  const EMAIL_TO_PROMOTE = "kailashchandrashenoyk@gmail.com";

  console.log(`📧 Promoting user: ${EMAIL_TO_PROMOTE}`);
  await setAdmin(EMAIL_TO_PROMOTE);
  process.exit(0);
}

main().catch(console.error);
