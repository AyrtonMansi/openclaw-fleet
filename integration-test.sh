#!/bin/bash
# Integration test for OpenClaw Fleet

set -e

FLEET_URL="${FLEET_URL:-http://localhost}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@localhost}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin}"

echo "=== OpenClaw Fleet Integration Test ==="
echo "Testing against: $FLEET_URL"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
test_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((TESTS_PASSED++))
}

test_fail() {
    echo -e "${RED}✗${NC} $1"
    ((TESTS_FAILED++))
}

# Test health endpoint
echo ""
echo "Testing health endpoint..."
if curl -sf "$FLEET_URL/api/health" > /dev/null; then
    test_pass "Health endpoint"
else
    test_fail "Health endpoint"
fi

# Test login
echo ""
echo "Testing authentication..."
LOGIN_RESPONSE=$(curl -sf -X POST "$FLEET_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" 2>/dev/null)

if [ -n "$LOGIN_RESPONSE" ]; then
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$TOKEN" ]; then
        test_pass "Login"
    else
        test_fail "Login - no token in response"
    fi
else
    test_fail "Login - request failed"
    TOKEN=""
fi

# Skip further tests if no token
if [ -z "$TOKEN" ]; then
    echo ""
    echo "Cannot continue tests without authentication token"
    exit 1
fi

# Test get current user
echo ""
echo "Testing user endpoints..."
if curl -sf "$FLEET_URL/api/auth/me" -H "Authorization: Bearer $TOKEN" > /dev/null; then
    test_pass "Get current user"
else
    test_fail "Get current user"
fi

# Test machines list
echo ""
echo "Testing fleet endpoints..."
if curl -sf "$FLEET_URL/api/fleet/machines" -H "Authorization: Bearer $TOKEN" > /dev/null; then
    test_pass "List machines"
else
    test_fail "List machines"
fi

# Test agents list
if curl -sf "$FLEET_URL/api/fleet/agents" -H "Authorization: Bearer $TOKEN" > /dev/null; then
    test_pass "List agents"
else
    test_fail "List agents"
fi

# Test job creation
echo ""
echo "Testing job endpoints..."
JOB_RESPONSE=$(curl -sf -X POST "$FLEET_URL/api/jobs" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"title":"Test Job","priority":5,"payload":{"type":"command","command":["echo","hello"]},"routing":{},"max_retries":1}' 2>/dev/null)

if [ -n "$JOB_RESPONSE" ]; then
    test_pass "Create job"
    JOB_ID=$(echo "$JOB_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
else
    test_fail "Create job"
    JOB_ID=""
fi

# Test list jobs
if curl -sf "$FLEET_URL/api/jobs" -H "Authorization: Bearer $TOKEN" > /dev/null; then
    test_pass "List jobs"
else
    test_fail "List jobs"
fi

# Test get job
if [ -n "$JOB_ID" ]; then
    if curl -sf "$FLEET_URL/api/jobs/$JOB_ID" -H "Authorization: Bearer $TOKEN" > /dev/null; then
        test_pass "Get job"
    else
        test_fail "Get job"
    fi
fi

# Test runner tokens
echo ""
echo "Testing runner token endpoints..."
if curl -sf "$FLEET_URL/api/tokens" -H "Authorization: Bearer $TOKEN" > /dev/null; then
    test_pass "List tokens"
else
    test_fail "List tokens"
fi

# Summary
echo ""
echo "========================================"
echo "Tests Passed: $TESTS_PASSED"
echo "Tests Failed: $TESTS_FAILED"
echo "========================================"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed${NC}"
    exit 1
fi
