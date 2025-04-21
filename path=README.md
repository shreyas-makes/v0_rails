# Overview

The v0-rails converter exists to solve a specific problem: helping Rails developers use modern UI components without JavaScript overhead.

## Getting Started

Before using v0-rails, you need:

1. **A Rails application** with:
   - ViewComponent installed and configured
   - tailwindcss-rails gem set up
   - Stimulus for interactive components (if needed)

2. **A v0 or React project** containing the JSX/TSX components you want to convert

### Basic Workflow:
1. Set up your Rails app with the required dependencies
2. Install v0-rails tools (both NPM package and Ruby gem)
3. Run the converter from your Rails app directory, pointing to your React components
4. Use the generated ViewComponents in your Rails views

Example workflow:
```bash
# From your Rails app directory
v0-rails "../my-v0-project/components/**/*.jsx" -d app/components -n Ui
```

## Why use this tool? 