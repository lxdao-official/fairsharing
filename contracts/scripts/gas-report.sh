#!/bin/bash

echo "Running tests with gas reporting..."
echo ""

# Run tests with gas report
forge test --gas-report > gas-report.txt

# Display the report
cat gas-report.txt

# Also save a timestamp version
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
cp gas-report.txt "gas-reports/gas-report-${TIMESTAMP}.txt"

echo ""
echo "Gas report saved to:"
echo "  - gas-report.txt (latest)"
echo "  - gas-reports/gas-report-${TIMESTAMP}.txt (archived)"
