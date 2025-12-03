#!/bin/bash

# Quick test script - runs all tests without verbose output
echo "Running all tests..."
forge test

# Check exit code
if [ $? -eq 0 ]; then
    echo "✓ All tests passed!"
    exit 0
else
    echo "✗ Some tests failed"
    exit 1
fi
