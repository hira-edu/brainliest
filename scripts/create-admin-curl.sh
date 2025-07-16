#!/bin/bash

# Create Admin User via cURL
# Usage: ./scripts/create-admin-curl.sh

# Configuration
VERCEL_URL="https://brainliest-fpttls7q6-tapha1s-projects.vercel.app"
DEFAULT_ADMIN_EMAIL="admin@brainliest.com"
DEFAULT_ADMIN_PASSWORD="Super.Admin.123!@#"

echo "🔐 Admin User Creation Tool (cURL)"
echo "==================================="
echo

# Function to read password silently
read_password() {
    local prompt="$1"
    local password
    echo -n "$prompt"
    read -s password
    echo
    echo "$password"
}

# Function to generate random password
generate_password() {
    openssl rand -base64 12 | tr -d "=+/" | cut -c1-16
}

# Step 1: Get admin credentials
echo "Step 1: Admin Authentication"
echo "----------------------------"
read -p "Admin email (default: $DEFAULT_ADMIN_EMAIL): " admin_email
admin_email=${admin_email:-$DEFAULT_ADMIN_EMAIL}

if [ "$admin_email" = "$DEFAULT_ADMIN_EMAIL" ]; then
    echo "Using default admin password"
    admin_password="$DEFAULT_ADMIN_PASSWORD"
else
    admin_password=$(read_password "Admin password: ")
fi

# Step 2: Login as admin
echo
echo "Step 2: Authenticating admin user..."
echo "-----------------------------------"

login_response=$(curl -s -X POST "$VERCEL_URL/api/admin/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$admin_email\",\"password\":\"$admin_password\"}")

# Check if login was successful
if ! echo "$login_response" | grep -q '"success":true'; then
    echo "❌ Admin login failed!"
    echo "Response: $login_response"
    exit 1
fi

# Extract token
token=$(echo "$login_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$token" ]; then
    echo "❌ Failed to extract admin token"
    exit 1
fi

echo "✅ Admin authentication successful"

# Step 3: Get new user details
echo
echo "Step 3: New Admin User Details"
echo "------------------------------"
read -p "New admin email: " new_email
read -p "First name (optional): " first_name
read -p "Last name (optional): " last_name
read -p "Username (optional): " username

# Password generation option
echo
read -p "Generate secure password automatically? (y/n): " gen_password

if [ "$gen_password" = "y" ] || [ "$gen_password" = "Y" ]; then
    new_password=$(generate_password)
    echo "Generated password: $new_password"
else
    new_password=$(read_password "New admin password: ")
fi

# Step 4: Create new admin user
echo
echo "Step 4: Creating admin user..."
echo "-----------------------------"

# Build JSON payload
json_payload="{\"email\":\"$new_email\",\"password\":\"$new_password\",\"role\":\"admin\""

if [ -n "$first_name" ]; then
    json_payload="$json_payload,\"firstName\":\"$first_name\""
fi

if [ -n "$last_name" ]; then
    json_payload="$json_payload,\"lastName\":\"$last_name\""
fi

if [ -n "$username" ]; then
    json_payload="$json_payload,\"username\":\"$username\""
fi

json_payload="$json_payload}"

# Create user
create_response=$(curl -s -X POST "$VERCEL_URL/api/admin/users" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $token" \
    -d "$json_payload")

# Check if creation was successful
if echo "$create_response" | grep -q '"success":true'; then
    echo "✅ Admin user created successfully!"
    echo
    echo "📋 Admin User Details:"
    echo "====================="
    echo "Email: $new_email"
    echo "Password: $new_password"
    echo "Role: admin"
    echo "Admin URL: $VERCEL_URL/admin"
    echo
    echo "🔒 Security Note:"
    echo "- Please save these credentials securely"
    echo "- The user can change their password after first login"
    echo "- This user has full admin privileges"
else
    echo "❌ Failed to create admin user"
    echo "Response: $create_response"
    exit 1
fi

echo
echo "🎉 Admin user creation completed!" 