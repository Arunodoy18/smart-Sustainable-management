#!/usr/bin/env bash
# Deployment Verification Script
# Run this after deployment to verify the production environment

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

BACKEND_URL="${1:-$BACKEND_URL}"
FRONTEND_URL="${2:-$FRONTEND_URL}"

if [ -z "$BACKEND_URL" ]; then
    echo -e "${RED}Error: BACKEND_URL is required${NC}"
    echo "Usage: ./verify-deployment.sh <backend_url> [frontend_url]"
    exit 1
fi

echo "========================================"
echo "  Production Deployment Verification"
echo "========================================"
echo ""
echo "Backend URL: $BACKEND_URL"
echo "Frontend URL: ${FRONTEND_URL:-'(not provided)'}"
echo ""

FAILURES=0

check_endpoint() {
    local name="$1"
    local url="$2"
    local expected_code="$3"
    local method="${4:-GET}"
    local data="${5:-}"
    
    if [ -n "$data" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url" \
            -H "Content-Type: application/json" -d "$data" 2>/dev/null || echo "000")
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url" 2>/dev/null || echo "000")
    fi
    
    if [ "$response" = "$expected_code" ]; then
        echo -e "${GREEN}✓${NC} $name (HTTP $response)"
        return 0
    elif [ "$response" = "000" ]; then
        echo -e "${RED}✗${NC} $name - Connection failed"
        return 1
    else
        echo -e "${YELLOW}⚠${NC} $name (HTTP $response, expected $expected_code)"
        return 1
    fi
}

echo "--- Backend Health Checks ---"
check_endpoint "Root endpoint" "$BACKEND_URL/" "200" || ((FAILURES++))
check_endpoint "Health endpoint" "$BACKEND_URL/health" "200" || ((FAILURES++))
check_endpoint "API Health" "$BACKEND_URL/api/v1/health" "200" || ((FAILURES++))

echo ""
echo "--- Auth Endpoints ---"
check_endpoint "Signup (validation)" "$BACKEND_URL/api/v1/auth/signup" "422" "POST" "{}" || ((FAILURES++))
check_endpoint "Login (validation)" "$BACKEND_URL/api/v1/auth/login/access-token" "422" "POST" || ((FAILURES++))
check_endpoint "Me (auth required)" "$BACKEND_URL/api/v1/auth/me" "401" || ((FAILURES++))

echo ""
echo "--- API Endpoints ---"
check_endpoint "Waste classify (auth)" "$BACKEND_URL/api/v1/waste/classify" "401" "POST" || ((FAILURES++))

if [ -n "$FRONTEND_URL" ]; then
    echo ""
    echo "--- Frontend ---"
    check_endpoint "Frontend home" "$FRONTEND_URL/" "200" || ((FAILURES++))
    check_endpoint "Frontend login" "$FRONTEND_URL/login" "200" || ((FAILURES++))
fi

echo ""
echo "========================================"
if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}All checks passed!${NC}"
    echo "========================================"
    exit 0
else
    echo -e "${RED}$FAILURES check(s) failed${NC}"
    echo "========================================"
    exit 1
fi
