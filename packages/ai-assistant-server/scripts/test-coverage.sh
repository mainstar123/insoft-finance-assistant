#!/bin/bash

# Run tests with coverage
echo "Running tests with coverage..."
pnpm test:cov

# Check if coverage directory exists
if [ -d "coverage" ]; then
  # Open coverage report in browser
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open coverage/lcov-report/index.html
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open coverage/lcov-report/index.html
  elif [[ "$OSTYPE" == "msys" ]]; then
    # Windows
    start coverage/lcov-report/index.html
  else
    echo "Coverage report generated at: $(pwd)/coverage/lcov-report/index.html"
  fi

  # Print coverage summary
  echo "Coverage summary:"
  cat coverage/coverage-summary.json | jq '.total'
else
  echo "Error: Coverage directory not found."
  exit 1
fi
