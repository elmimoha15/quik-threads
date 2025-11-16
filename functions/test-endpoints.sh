#!/bin/bash

echo "Testing QuikThread Backend API Endpoints"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test health endpoint
echo "1. Testing /health endpoint..."
response=$(curl -s -w "\n%{http_code}" http://localhost:3001/health)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ Health endpoint working${NC}"
    echo "Response: $body"
else
    echo -e "${RED}✗ Health endpoint failed (HTTP $http_code)${NC}"
fi
echo ""

# Test root endpoint
echo "2. Testing / endpoint..."
response=$(curl -s -w "\n%{http_code}" http://localhost:3001/)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ Root endpoint working${NC}"
    echo "Response: $body"
else
    echo -e "${RED}✗ Root endpoint failed (HTTP $http_code)${NC}"
fi
echo ""

# Test protected endpoint without auth
echo "3. Testing /api/test endpoint (no auth - should fail)..."
response=$(curl -s -w "\n%{http_code}" http://localhost:3001/api/test)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "401" ]; then
    echo -e "${GREEN}✓ Auth protection working${NC}"
    echo "Response: $body"
else
    echo -e "${RED}✗ Auth protection not working (HTTP $http_code)${NC}"
fi
echo ""

# Test protected endpoint with mock token
echo "4. Testing /api/test endpoint (with mock token)..."
response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer test-token" http://localhost:3001/api/test)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ Mock auth working${NC}"
    echo "Response: $body"
else
    echo -e "${RED}✗ Mock auth failed (HTTP $http_code)${NC}"
fi
echo ""

# Test /api/users/usage endpoint
echo "5. Testing /api/users/usage endpoint..."
response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer test-token" http://localhost:3001/api/users/usage)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ Usage endpoint working${NC}"
    echo "Response: $body"
else
    echo -e "${RED}✗ Usage endpoint failed (HTTP $http_code)${NC}"
    echo "Response: $body"
fi
echo ""

# Test /api/users/profile endpoint
echo "6. Testing /api/users/profile endpoint..."
response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer test-token" http://localhost:3001/api/users/profile)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ Profile endpoint working${NC}"
    echo "Response: $body"
else
    echo -e "${RED}✗ Profile endpoint failed (HTTP $http_code)${NC}"
    echo "Response: $body"
fi
echo ""

echo "========================================"
echo "Backend API Test Complete"
