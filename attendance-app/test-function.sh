#!/bin/bash
# Bash script to test Cloud Functions locally

echo "Testing Cloud Functions locally..."

# Test 1: Send test notification to specific user
echo ""
echo "1. Testing sendTestNotification..."
read -p "Enter user ID to test (e.g., #1234): " testUserId

curl -X POST http://localhost:5001/attendance-37566/us-central1/sendTestNotification \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$testUserId\"}"

echo ""
echo ""

# Test 2: Trigger inactivity check
echo "2. Testing sendTestInactivityNotification..."
curl -X POST http://localhost:5001/attendance-37566/us-central1/sendTestInactivityNotification

echo ""
echo "✅ Testing complete!"
echo "Check Emulator UI at http://localhost:4000 for logs"
