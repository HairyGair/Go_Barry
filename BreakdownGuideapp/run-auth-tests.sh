#!/bin/bash

# Authentication Security Test Runner
# Runs comprehensive authentication tests for the Breakdown Guide system

set -e

echo "🔐 Authentication Security Test Suite"
echo "=================================="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
BACKEND_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:5173"
TEST_EMAIL="anthony.gair@example.com"
TEST_PASSWORD="TempPassword2025!"
INVALID_EMAIL="nonexistent@example.com"
INVALID_PASSWORD="WrongPassword123!"

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $message"
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}❌ FAIL${NC}: $message"
    elif [ "$status" = "INFO" ]; then
        echo -e "${BLUE}ℹ️  INFO${NC}: $message"
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}⚠️  WARN${NC}: $message"
    fi
}

# Function to check if services are running
check_services() {
    echo "Checking required services..."

    # Check backend
    if curl -s "$BACKEND_URL/health" > /dev/null; then
        print_status "PASS" "Backend is running on $BACKEND_URL"
    else
        print_status "FAIL" "Backend is not running on $BACKEND_URL"
        echo "Please start the backend with: cd backend && npm run dev"
        exit 1
    fi

    # Check frontend (if available)
    if curl -s "$FRONTEND_URL" > /dev/null 2>&1; then
        print_status "PASS" "Frontend is running on $FRONTEND_URL"
    else
        print_status "WARN" "Frontend may not be running on $FRONTEND_URL"
    fi

    echo
}

# Test 1: Valid Login
test_valid_login() {
    echo "🔍 Test 1: Valid Login - Correct Email/Password"

    local response=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n -1)

    if [ "$http_code" = "200" ]; then
        local success=$(echo "$body" | grep -o '"success":true' || echo "")
        if [ -n "$success" ]; then
            print_status "PASS" "Valid credentials accepted"

            # Extract token for subsequent tests
            AUTH_TOKEN=$(echo "$body" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
            if [ -n "$AUTH_TOKEN" ]; then
                print_status "PASS" "Auth token received"
            else
                print_status "FAIL" "No auth token in response"
            fi
        else
            print_status "FAIL" "Login succeeded but success flag not set"
        fi
    else
        print_status "FAIL" "Login failed with HTTP $http_code"
        echo "Response: $body"
    fi
    echo
}

# Test 2: Invalid Email
test_invalid_email() {
    echo "🔍 Test 2: Invalid Email - Non-existent User"

    local response=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$INVALID_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n -1)

    if [ "$http_code" = "401" ]; then
        local error_msg=$(echo "$body" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
        if [[ "$error_msg" == *"Invalid credentials"* ]]; then
            print_status "PASS" "Generic error message for invalid email"
        else
            print_status "FAIL" "Error message reveals too much information: $error_msg"
        fi

        # Check that response doesn't reveal email doesn't exist
        if [[ "$body" != *"email not found"* ]] && [[ "$body" != *"user does not exist"* ]]; then
            print_status "PASS" "No email enumeration vulnerability"
        else
            print_status "FAIL" "Response reveals email existence status"
        fi
    else
        print_status "FAIL" "Expected 401, got HTTP $http_code"
    fi
    echo
}

# Test 3: Invalid Password
test_invalid_password() {
    echo "🔍 Test 3: Invalid Password - Wrong Password"

    local response=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$INVALID_PASSWORD\"}")

    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n -1)

    if [ "$http_code" = "401" ]; then
        local error_msg=$(echo "$body" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
        if [[ "$error_msg" == *"Invalid credentials"* ]]; then
            print_status "PASS" "Generic error message for wrong password"
        else
            print_status "FAIL" "Error message reveals too much: $error_msg"
        fi
    else
        print_status "FAIL" "Expected 401, got HTTP $http_code"
    fi
    echo
}

# Test 4: Rate Limiting
test_rate_limiting() {
    echo "🔍 Test 4: Rate Limiting - Brute Force Protection"

    local rate_limited=false

    # Attempt 6 rapid failed logins
    for i in {1..6}; do
        local response=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/api/auth/login" \
            -H "Content-Type: application/json" \
            -d "{\"email\":\"ratetest$i@example.com\",\"password\":\"wrongpassword\"}")

        local http_code=$(echo "$response" | tail -n1)
        local body=$(echo "$response" | head -n -1)

        if [ "$http_code" = "429" ]; then
            rate_limited=true
            print_status "PASS" "Rate limiting activated after $i attempts"
            break
        fi

        # Small delay to avoid overwhelming the server
        sleep 0.1
    done

    if [ "$rate_limited" = false ]; then
        print_status "WARN" "Rate limiting not triggered after 6 attempts (may be configured differently)"
    fi
    echo
}

# Test 5: Protected Route Access
test_protected_routes() {
    echo "🔍 Test 5: Protected Routes - Token Validation"

    if [ -z "$AUTH_TOKEN" ]; then
        print_status "FAIL" "No auth token available for testing"
        echo
        return
    fi

    # Test with valid token
    local response=$(curl -s -w "\n%{http_code}" -X GET "$BACKEND_URL/api/breakdowns/stats" \
        -H "Authorization: Bearer $AUTH_TOKEN")

    local http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "200" ]; then
        print_status "PASS" "Protected route accessible with valid token"
    else
        print_status "FAIL" "Protected route rejected valid token (HTTP $http_code)"
    fi

    # Test without token
    local response=$(curl -s -w "\n%{http_code}" -X GET "$BACKEND_URL/api/breakdowns/stats")

    local http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "401" ]; then
        print_status "PASS" "Protected route rejects requests without token"
    else
        print_status "FAIL" "Protected route allows access without token (HTTP $http_code)"
    fi

    # Test with invalid token
    local response=$(curl -s -w "\n%{http_code}" -X GET "$BACKEND_URL/api/breakdowns/stats" \
        -H "Authorization: Bearer invalid-token-123")

    local http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "401" ]; then
        print_status "PASS" "Protected route rejects invalid tokens"
    else
        print_status "FAIL" "Protected route accepts invalid token (HTTP $http_code)"
    fi
    echo
}

# Test 6: Logout Functionality
test_logout() {
    echo "🔍 Test 6: Logout - Session Clearing"

    if [ -z "$AUTH_TOKEN" ]; then
        print_status "FAIL" "No auth token available for logout testing"
        echo
        return
    fi

    # Test logout
    local response=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/api/auth/logout" \
        -H "Authorization: Bearer $AUTH_TOKEN")

    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n -1)

    if [ "$http_code" = "200" ]; then
        local success=$(echo "$body" | grep -o '"success":true' || echo "")
        if [ -n "$success" ]; then
            print_status "PASS" "Logout succeeded"

            # Try to use token after logout (should fail)
            local test_response=$(curl -s -w "\n%{http_code}" -X GET "$BACKEND_URL/api/breakdowns/stats" \
                -H "Authorization: Bearer $AUTH_TOKEN")

            local test_http_code=$(echo "$test_response" | tail -n1)

            if [ "$test_http_code" = "401" ]; then
                print_status "PASS" "Token invalidated after logout"
            else
                print_status "FAIL" "Token still valid after logout (HTTP $test_http_code)"
            fi
        else
            print_status "FAIL" "Logout response missing success flag"
        fi
    else
        print_status "FAIL" "Logout failed with HTTP $http_code"
    fi
    echo
}

# Test 7: Input Validation
test_input_validation() {
    echo "🔍 Test 7: Input Validation - Malformed Requests"

    # Test missing email
    local response=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"password":"SomePassword123!"}')

    local http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "400" ]; then
        print_status "PASS" "Missing email rejected properly"
    else
        print_status "FAIL" "Missing email not handled correctly (HTTP $http_code)"
    fi

    # Test missing password
    local response=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\"}")

    local http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "400" ]; then
        print_status "PASS" "Missing password rejected properly"
    else
        print_status "FAIL" "Missing password not handled correctly (HTTP $http_code)"
    fi

    # Test malformed JSON
    local response=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"invalid": json}')

    local http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "400" ]; then
        print_status "PASS" "Malformed JSON rejected properly"
    else
        print_status "WARN" "Malformed JSON handling may need improvement (HTTP $http_code)"
    fi
    echo
}

# Test 8: Security Headers
test_security_headers() {
    echo "🔍 Test 8: Security Headers - CORS and Security"

    local response=$(curl -s -I "$BACKEND_URL/health")

    if echo "$response" | grep -i "x-content-type-options" > /dev/null; then
        print_status "PASS" "X-Content-Type-Options header present"
    else
        print_status "WARN" "X-Content-Type-Options header missing"
    fi

    if echo "$response" | grep -i "x-frame-options" > /dev/null; then
        print_status "PASS" "X-Frame-Options header present"
    else
        print_status "WARN" "X-Frame-Options header missing"
    fi

    # Test CORS preflight
    local cors_response=$(curl -s -I -X OPTIONS "$BACKEND_URL/api/auth/login" \
        -H "Origin: http://localhost:3000" \
        -H "Access-Control-Request-Method: POST")

    if echo "$cors_response" | grep -i "access-control-allow" > /dev/null; then
        print_status "PASS" "CORS headers present"
    else
        print_status "WARN" "CORS headers may be missing"
    fi
    echo
}

# Test 9: Performance
test_performance() {
    echo "🔍 Test 9: Performance - Response Times"

    local start_time=$(date +%s%N)
    local response=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
    local end_time=$(date +%s%N)

    local duration=$(((end_time - start_time) / 1000000)) # Convert to milliseconds

    if [ "$duration" -lt 2000 ]; then
        print_status "PASS" "Login response time: ${duration}ms (< 2000ms)"
    else
        print_status "WARN" "Login response time: ${duration}ms (>= 2000ms)"
    fi

    # Test health check performance
    local start_time=$(date +%s%N)
    local response=$(curl -s "$BACKEND_URL/health")
    local end_time=$(date +%s%N)

    local duration=$(((end_time - start_time) / 1000000))

    if [ "$duration" -lt 500 ]; then
        print_status "PASS" "Health check response time: ${duration}ms (< 500ms)"
    else
        print_status "WARN" "Health check response time: ${duration}ms (>= 500ms)"
    fi
    echo
}

# Run all tests
run_all_tests() {
    echo "Starting comprehensive authentication security tests..."
    echo "Test Date: $(date)"
    echo "Backend URL: $BACKEND_URL"
    echo "Frontend URL: $FRONTEND_URL"
    echo

    check_services
    test_valid_login
    test_invalid_email
    test_invalid_password
    test_rate_limiting
    test_protected_routes
    test_logout
    test_input_validation
    test_security_headers
    test_performance

    echo "🔐 Authentication Security Test Suite Complete"
    echo "============================================="
    echo "Review the results above for any security issues."
    echo "For manual testing, see: AUTHENTICATION_TEST_SCENARIOS.md"
    echo
}

# Check command line arguments
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Authentication Security Test Runner"
    echo "Usage: $0 [test_name]"
    echo
    echo "Available tests:"
    echo "  all                 - Run all tests (default)"
    echo "  valid-login        - Test valid login"
    echo "  invalid-email      - Test invalid email"
    echo "  invalid-password   - Test invalid password"
    echo "  rate-limiting      - Test rate limiting"
    echo "  protected-routes   - Test protected route access"
    echo "  logout             - Test logout functionality"
    echo "  input-validation   - Test input validation"
    echo "  security-headers   - Test security headers"
    echo "  performance        - Test performance"
    echo
    echo "Examples:"
    echo "  $0                 # Run all tests"
    echo "  $0 valid-login     # Run only valid login test"
    echo
    exit 0
fi

# Run specific test or all tests
case "${1:-all}" in
    "all")
        run_all_tests
        ;;
    "valid-login")
        check_services
        test_valid_login
        ;;
    "invalid-email")
        check_services
        test_invalid_email
        ;;
    "invalid-password")
        check_services
        test_invalid_password
        ;;
    "rate-limiting")
        check_services
        test_rate_limiting
        ;;
    "protected-routes")
        check_services
        test_valid_login  # Need token first
        test_protected_routes
        ;;
    "logout")
        check_services
        test_valid_login  # Need token first
        test_logout
        ;;
    "input-validation")
        check_services
        test_input_validation
        ;;
    "security-headers")
        check_services
        test_security_headers
        ;;
    "performance")
        check_services
        test_performance
        ;;
    *)
        echo "Unknown test: $1"
        echo "Use --help for available options"
        exit 1
        ;;
esac