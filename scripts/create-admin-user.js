#!/usr/bin/env node

/**
 * Create Admin User Script
 *
 * This script creates a new admin user on your Vercel hosted website
 * Usage: node scripts/create-admin-user.js
 */

const readline = require("readline");
const crypto = require("crypto");

// Your Vercel deployment URL
const BASE_URL = process.env.VERCEL_URL || "https://your-app.vercel.app";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to prompt for input
function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

// Function to prompt for password (hidden input)
function questionPassword(query) {
  return new Promise((resolve) => {
    process.stdout.write(query);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    let password = "";
    process.stdin.on("data", function (char) {
      char = char + "";
      switch (char) {
        case "\n":
        case "\r":
        case "\u0004":
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write("\n");
          resolve(password);
          break;
        case "\u0003":
          process.exit();
          break;
        default:
          password += char;
          process.stdout.write("*");
          break;
      }
    });
  });
}

// Function to generate a strong password
function generateStrongPassword() {
  const length = 16;
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
  let password = "";

  // Ensure at least one of each required character type
  password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
  password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
  password += "0123456789"[Math.floor(Math.random() * 10)];
  password += "!@#$%^&*()_+-=[]{}|;:,.<>?"[Math.floor(Math.random() * 25)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

// Function to create admin user
async function createAdminUser() {
  console.log("🔐 Admin User Creation Tool");
  console.log("===============================\n");

  try {
    // Step 1: Admin login
    console.log("Step 1: Admin Authentication");
    const adminEmail =
      (await question("Enter admin email (default: admin@brainliest.com): ")) ||
      "admin@brainliest.com";
    const adminPassword = await questionPassword("Enter admin password: ");

    // Login as admin
    const loginResponse = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword,
      }),
    });

    const loginResult = await loginResponse.json();

    if (!loginResult.success) {
      console.error("❌ Admin login failed:", loginResult.message);
      return;
    }

    console.log("✅ Admin authentication successful\n");

    // Step 2: New user details
    console.log("Step 2: New Admin User Details");
    const newEmail = await question("Enter new admin email: ");
    const firstName = await question("Enter first name (optional): ");
    const lastName = await question("Enter last name (optional): ");
    const username = await question("Enter username (optional): ");

    // Generate or ask for password
    const useGeneratedPassword = await question(
      "Generate secure password automatically? (y/n): "
    );
    let newPassword;

    if (useGeneratedPassword.toLowerCase() === "y") {
      newPassword = generateStrongPassword();
      console.log(`Generated password: ${newPassword}`);
    } else {
      newPassword = await questionPassword("Enter new admin password: ");
    }

    // Step 3: Create user
    console.log("\nStep 3: Creating Admin User...");

    const createResponse = await fetch(`${BASE_URL}/api/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${loginResult.token}`,
      },
      body: JSON.stringify({
        email: newEmail,
        password: newPassword,
        role: "admin",
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        username: username || undefined,
      }),
    });

    const createResult = await createResponse.json();

    if (!createResult.success) {
      console.error("❌ Failed to create admin user:", createResult.message);
      return;
    }

    console.log("✅ Admin user created successfully!");
    console.log("\n📋 Admin User Details:");
    console.log(`Email: ${newEmail}`);
    console.log(`Password: ${newPassword}`);
    console.log(`Role: admin`);
    console.log(`Admin URL: ${BASE_URL}/admin`);

    console.log("\n🔒 Security Note:");
    console.log("- Please save these credentials securely");
    console.log("- The user can change their password after first login");
    console.log("- This user has full admin privileges");
  } catch (error) {
    console.error("❌ Error creating admin user:", error.message);
  } finally {
    rl.close();
  }
}

// Run the script
createAdminUser().catch(console.error);
