#!/bin/bash

# Test coverage report
echo "Generating test coverage report..."
echo ""

forge coverage --report lcov

# Check if genhtml is available (part of lcov package)
if command -v genhtml &> /dev/null; then
    genhtml lcov.info --output-directory coverage --branch-coverage
    echo ""
    echo "✓ Coverage report generated!"
    echo "  Open coverage/index.html in your browser"
else
    echo ""
    echo "✓ Coverage data generated in lcov.info"
    echo "  Install lcov to generate HTML report: sudo apt-get install lcov"
fi
