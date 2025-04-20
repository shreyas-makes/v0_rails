# Overview

The v0-rails converter exists to solve a specific problem: helping Rails developers use modern UI components without JavaScript overhead.

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

2. Run conversion targeting JSX/TSX files:
```bash
v0-rails "my-v0-project/**/*.{jsx,tsx}" \
  -d app/components \
  -n V0Components \
  -s
```

3. Generated Rails structure:
```
rails-app/
├── app/components/
│   └── v0_components/
│       ├── button_component.rb
│       ├── button_component.html.erb
│       ├── theme_provider_component.rb
│       └── theme_provider_component.html.erb
└── app/javascript/controllers/
    ├── button_controller.js
    └── theme_provider_controller.js
```

4. Manually copy CSS files:
```bash
cp my-v0-project/app/globals.css rails-app/app/assets/stylesheets/
```

### Key Features
- **File Type Support**  
  Converts `.jsx` and `.tsx` while ignoring other file types
- **Directory Structure Preservation**  
  Maintains folder hierarchy under destination directory
- **Name Conversion**  
  `src/app/page.tsx` → `app/components/ui/page_component.rb`
- **Stimulus Integration**  
  Auto-generates controllers for event handlers
- **TypeScript Support**  
  Converts TSX type annotations to Ruby type comments

