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

- **Reduced JavaScript** - Converts React components to server-rendered Rails ViewComponents, eliminating client-side React bundle
- **Framework alignment** - Lets you use Vercel v0's beautiful UI components within Rails' ecosystem  
- **Performance** - Server-rendered components load faster and use less client resources
- **Maintainability** - Keeps your application in a single technology stack (Ruby/Rails) rather than mixing React and Rails
- **Accessibility** - Works even with JavaScript disabled or limited

If you already have v0 components you like and want to use them in a Rails app without the React runtime overhead, this tool provides a bridge to convert them into native Rails components.

Convert React/JSX + Tailwind UI code (typically produced by Vercel v0) into Rails‑native ViewComponent classes and ERB templates, preserving visual fidelity while minimizing JavaScript footprint.

## Installation

### Node.js CLI

```bash
npm install -g v0-rails
```

### Ruby Gem

Add this line to your application's Gemfile:

```ruby
gem 'v0_rails'
```

And then execute:

```bash
bundle install
```

## Prerequisites

- Node.js >= 20
- Ruby >= 3.3
- Rails >= 7.1
- ViewComponent >= 3.9
- Stimulus >= 3.2

## Usage

### Basic Conversion
Convert a single component:
```bash
v0-rails src/components/Button.jsx -d app/components
```

Convert multiple components using glob patterns:
```bash
v0-rails "src/{components,app}/*.{jsx,tsx}" --stimulus
```

### Common Conversion Scenarios

1. **Full v0 Project Conversion**
```bash
# Convert all JSX/TSX files in typical v0 project structure
v0-rails "app/**/*.{jsx,tsx}" "components/**/*.{jsx,tsx}" \
  -d app/components \
  -n Ui \
  -s \
  -v
```

2. **TypeScript Conversion**  
Automatically handles .tsx files:
```bash
v0-rails "src/app/*.tsx" -d app/components/ui
```

3. **Updating Existing Components**  
Safe update with conflict detection:
```bash
v0-rails "src/**/*.jsx" --update --namespace MyComponents
```

4. **Generate Stimulus Controllers**  
For interactive components:
```bash
v0-rails "src/components/*.jsx" --stimulus
```

### CLI Options Reference
| Option | Description | Example |
|--------|-------------|---------|
| `-d, --dest` | Output directory structure | `-d app/view_components` |
| `-n, --namespace` | Ruby module namespace | `-n Admin::Ui` |
| `-s, --stimulus` | Generate JS controllers | `--stimulus` |
| `-u, --update` | Update existing components | `--update` |
| `--dry-run` | Preview changes | `--dry-run` |
| `--strict` | Fail on warnings | `--strict` |

### Conversion Process
1. Place v0 components in standard structure:

## Example

Original JSX:
```jsx
import React from 'react';

const Card = ({ title, description, imageUrl, buttonText, onClick }) => {
  return (
    <div className="max-w-sm rounded overflow-hidden shadow-lg">
      {imageUrl && (
        <img className="w-full" src={imageUrl} alt={title} />
      )}
      <div className="px-6 py-4">
        <div className="font-bold text-xl mb-2">{title}</div>
        <p className="text-gray-700 text-base">
          {description}
        </p>
      </div>
      <div className="px-6 pt-4 pb-2">
        <button 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={onClick}
        >
          {buttonText || 'Learn More'}
        </button>
      </div>
    </div>
  );
};
```

Generated ViewComponent:
```ruby
# frozen_string_literal: true

module Ui
  class CardComponent < ViewComponent::Base
    attr_reader :title
    attr_reader :description
    attr_reader :imageUrl
    attr_reader :buttonText
    attr_reader :onClick

    def initialize(title:, description:, imageUrl:, buttonText: nil, onClick:)
      @title = title
      @description = description
      @imageUrl = imageUrl
      @buttonText = buttonText
      @onClick = onClick
    end
  end
end
```

Generated ERB template:
```erb
<div class="max-w-sm rounded overflow-hidden shadow-lg" data-controller="card">
  <% if @imageUrl %>
    <img class="w-full" src="<%= @imageUrl %>" alt="<%= @title %>">
  <% end %>
  <div class="px-6 py-4">
    <div class="font-bold text-xl mb-2"><%= @title %></div>
    <p class="text-gray-700 text-base">
      <%= @description %>
    </p>
  </div>
  <div class="px-6 pt-4 pb-2">
    <button 
      class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      data-action="click->card#click"
    >
      <%= @buttonText || 'Learn More' %>
    </button>
  </div>
</div>
```

4. CSS files are automatically copied to the assets directory

### Key Features
- **CSS File Support**  
  Copies and transforms CSS files to Rails asset pipeline
- **Tailwind Compatibility**  
  Preserves class names and handles Rails asset path helpers
- **File Type Support**  
  Converts `.jsx`, `.tsx` and copies `.css` files
- **Directory Structure Preservation**  
  Maintains folder hierarchy under destination directory
- **Name Conversion**  
  `src/app/page.tsx` → `app/components/ui/page_component.rb`
- **Stimulus Integration**  
  Auto-generates controllers for event handlers
- **TypeScript Support**  
  Converts TSX type annotations to Ruby type comments

## License

The gem and CLI are available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT). 

## Rails Integration

### Required Rails Setup

1. **Install ViewComponent**

   Add to your Gemfile:
   ```ruby
   gem "view_component"
   ```

   Then run:
   ```bash
   bundle install
   ```

2. **Configure ViewComponent**

   In your application.rb:
   ```ruby
   # config/application.rb
   require "view_component"
   
   class Application < Rails::Application
     # ...
     config.view_component.preview_paths << "#{Rails.root}/spec/components/previews"
   end
   ```

3. **Configure ApplicationController** (optional but recommended)

   ```ruby
   # app/controllers/application_controller.rb
   class ApplicationController < ActionController::Base
     view_component_paths << Rails.root.join("app/components")
   end
   ```

4. **Setup Stimulus** (if using interactive components)

   Ensure stimulus is installed and configured in your Rails app:
   ```bash
   bin/rails stimulus:install
   ```

### Using Generated Components

Once your components are generated, use them in your Rails views:

```erb
<%# In any view file %>
<%= render(Ui::ButtonComponent.new(text: "Click me")) %>

<%# With content blocks %>
<%= render(Ui::CardComponent.new(title: "My Card")) do %>
  <p>This content goes inside the card</p>
<% end %>
```

## Migration Guide

### React to ViewComponent Comparison

| React Pattern | ViewComponent Equivalent |
|---------------|--------------------------|
| `<Button text="Click">` | `<%= render(Ui::ButtonComponent.new(text: "Click")) %>` |
| `<Card><p>Content</p></Card>` | `<%= render(Ui::CardComponent.new) { tag.p("Content") } %>` |
| Props | Initialize parameters |
| Children | Content blocks |
| Conditional rendering | ERB conditionals |
| Event handlers | Stimulus controllers |

### Example Migration

**React Component:**
```jsx
const Button = ({ primary, size, label, onClick }) => {
  const mode = primary ? 'bg-blue-500' : 'bg-gray-500';
  return (
    <button
      className={`${mode} text-white rounded px-4 py-2 text-${size}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
```

**Rails ViewComponent Usage:**
```erb
<%= render(Ui::ButtonComponent.new(
  primary: true,
  size: "sm",
  label: "Submit",
  onClick: "handleSubmit"
)) %>
```

### Advanced Component Features

- **Component Slots**: Use ViewComponent's slot API for named content areas
- **Collection Rendering**: Use ViewComponent's collection rendering feature
- **Preview Examples**: Generate component previews for different states

For more details on ViewComponent usage, see the [ViewComponent documentation](https://viewcomponent.org/).

## Rails Setup Automation

You can automatically configure your Rails application with the required ViewComponent setup:

```bash
v0-rails setup
```

This command:
- Adds ViewComponent to your Gemfile if not present
- Configures application.rb with ViewComponent settings
- Creates component preview directories
- Sets up Stimulus controllers directory if needed

## Future Features

- **Rails Naming Option**: A `--rails-naming` flag to enforce Rails conventions
- **Props Validation**: Generation of Ruby-style parameter validation
- **ViewComponent Specific Features**: Support for sidecar CSS files and preview examples
- **Import CSS Processing**: Improved CSS handling with Rails asset pipeline
- **Advanced Stimulus Integration**: Better event handling and action mapping

## Key Features
- **CSS File Support**  
  Copies and transforms CSS files to Rails asset pipeline
- **Tailwind Compatibility**  
  Preserves class names and handles Rails asset path helpers
- **File Type Support**  
  Converts `.jsx`, `.tsx` and copies `.css` files
- **Directory Structure Preservation**  
  Maintains folder hierarchy under destination directory
- **Name Conversion**  
  `src/app/page.tsx` → `app/components/ui/page_component.rb`
- **Stimulus Integration**  
  Auto-generates controllers for event handlers
- **TypeScript Support**  
  Converts TSX type annotations to Ruby type comments

