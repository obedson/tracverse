#!/bin/bash
# MLM API Testing Commands

echo "🧪 Testing MLM Referral System APIs"
echo "=================================="

# Test 1: Register root user (no sponsor)
echo "1. Registering root user..."
curl -X POST http://localhost:3000/api/referrals/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "root@test.com",
    "password": "password123"
  }'
echo -e "\n"

# Test 2: Register user with sponsor (replace TRV123456 with actual code from step 1)
echo "2. Registering sponsored user..."
curl -X POST http://localhost:3000/api/referrals/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user1@test.com",
    "password": "password123",
    "sponsor_code": "TRV123456"
  }'
echo -e "\n"

# Test 3: Validate referral code
echo "3. Validating referral code..."
curl http://localhost:3000/api/referrals/validate/TRV123456
echo -e "\n"

# Test 4: Get referral tree (replace USER_ID with actual ID from registration)
echo "4. Getting referral tree..."
curl http://localhost:3000/api/referrals/tree/USER_ID_HERE
echo -e "\n"

# Test 5: Get referral stats
echo "5. Getting referral stats..."
curl http://localhost:3000/api/referrals/stats/USER_ID_HERE
echo -e "\n"
