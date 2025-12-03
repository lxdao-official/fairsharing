#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  Fairsharing Test Suite${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Function to run a test group
run_test_group() {
    local name=$1
    local pattern=$2
    local description=$3

    echo -e "${YELLOW}Running: ${description}${NC}"
    if forge test --match-path "$pattern" -vv; then
        echo -e "${GREEN}✓ ${name} tests passed${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}✗ ${name} tests failed${NC}"
        echo ""
        return 1
    fi
}

# Track failures
FAILED=0

# Run all test groups
echo -e "${BLUE}1. Unit Tests${NC}"
echo "----------------------------------------"

run_test_group "ProjectFactory" "test/unit/ProjectFactory.t.sol" "Testing ProjectFactory contract"
if [ $? -ne 0 ]; then FAILED=$((FAILED + 1)); fi

run_test_group "Project" "test/unit/Project.t.sol" "Testing Project contract"
if [ $? -ne 0 ]; then FAILED=$((FAILED + 1)); fi

echo -e "${BLUE}2. Integration Tests${NC}"
echo "----------------------------------------"

run_test_group "Integration" "test/integration/Integration.t.sol" "Testing complete user flows"
if [ $? -ne 0 ]; then FAILED=$((FAILED + 1)); fi

echo -e "${BLUE}3. Gas Benchmarks${NC}"
echo "----------------------------------------"

run_test_group "Gas" "test/gas/GasBenchmark.t.sol" "Running gas benchmarks"
if [ $? -ne 0 ]; then FAILED=$((FAILED + 1)); fi

# Summary
echo ""
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  Test Summary${NC}"
echo -e "${BLUE}================================${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All test groups passed!${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}✗ ${FAILED} test group(s) failed${NC}"
    echo ""
    exit 1
fi
