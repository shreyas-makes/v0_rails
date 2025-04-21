# v0-rails

Convert [Vercel v0](https://v0.dev/) React/JSX + Tailwind UI code into Rails‑native ViewComponent classes and ERB templates, preserving visual fidelity while minimizing JavaScript footprint.

## Overview

The v0-rails converter exists to solve a specific problem: helping Rails developers use modern UI components without JavaScript overhead.

### Why use this tool?

* **Reduced JavaScript** - Converts React components to server-rendered Rails ViewComponents, eliminating client-side React bundle
* **Framework alignment** - Lets you use Vercel v0's beautiful UI components within Rails' ecosystem
* **Performance** - Server-rendered components load faster and use less client resources
* **Maintainability** - Keeps your application in a single technology stack (Ruby/Rails) rather than mixing React and Rails
* **Accessibility** - Works even with JavaScript disabled or limited

## Installation

### Node.js CLI

```bash
npm install -g v0-rails
```

### Ruby Gem

```ruby
# Add to your Gemfile
gem 'v0_rails'
```

Then execute:
```bash
bundle install
```

## Prerequisites

* Node.js >= 20
* Ruby >= 3.3
* Rails >= 7.1
* ViewComponent >= 3.9
* Stimulus >= 3.2

## Basic Usage

Convert a single component:

```bash
v0-rails src/components/Button.jsx -d app/components
```

Convert multiple components using glob patterns:

```bash
v0-rails "src/{components,app}/*.{jsx,tsx}" --stimulus
```

## Advanced Usage

### Complete Application Conversion

```bash
v0-rails "src/**/*.{jsx,tsx}" \
  --source-map v0-components \
  --maintain-hierarchy \
  --dest app/components \
  --namespace Ui \
  --stimulus \
  --generate-controllers-from-structure \
  --generate-routes-from-structure \
  --generate-views-from-structure \
  --configure-tailwind --shadcn-theme \
  --detect-slots \
  --generate-helpers \
  --enhanced-erb-conversion \
  --icon-component \
  --handle-composition
```

### Structure Preservation

Preserve the original v0 component structure for reference:

```bash
v0-rails "src/**/*.{jsx,tsx}" --source-map v0-components --maintain-hierarchy
```

### Dynamic Controller & Route Generation

Intelligently map v0/Next.js pages to Rails controllers and routes:

```bash
v0-rails "src/app/**/*.{jsx,tsx}" \
  --generate-controllers-from-structure \
  --generate-routes-from-structure \
  --generate-views-from-structure
```

For example:
- `src/app/page.jsx` → `HomeController#index`, route: `root to: "home#index"`
- `src/app/about/page.jsx` → `AboutController#index`, route: `get "about", to: "about#index"`
- `src/app/products/page.jsx` → `ProductsController#index`
- `src/app/products/[id]/page.jsx` → `ProductsController#show`, route: `resources :products, only: [:index, :show]`

### Advanced Component Handling

Handle complex component relationships and patterns:

```bash
v0-rails "src/components/*.jsx" \
  --detect-slots \
  --slot-mapping=content:renders_one,items:renders_many \
  --handle-composition \
  --icon-component
```

### Tailwind Configuration

Set up Tailwind with shadcn theme configurations:

```bash
v0-rails --configure-tailwind --shadcn-theme
```

## CLI Options Reference

| Option | Description | Example |
|--------|-------------|---------|
| `-d, --dest` | Output directory | `-d app/components` |
| `-n, --namespace` | Ruby module namespace | `-n Admin::Ui` |
| `-s, --stimulus` | Generate JS controllers | `--stimulus` |
| `-u, --update` | Update existing components | `--update` |
| `--dry-run` | Preview changes | `--dry-run` |
| `--strict` | Fail on warnings | `--strict` |
| `--source-map` | Copy original components | `--source-map v0-components` |
| `--maintain-hierarchy` | Preserve directory structure | `--maintain-hierarchy` |
| `--generate-controllers-from-structure` | Create controllers based on v0 pages | `--generate-controllers-from-structure` |
| `--generate-routes-from-structure` | Create routes based on v0 pages | `--generate-routes-from-structure` |
| `--generate-views-from-structure` | Create view templates | `--generate-views-from-structure` |
| `--configure-tailwind` | Set up Tailwind config | `--configure-tailwind` |
| `--shadcn-theme` | Use shadcn theme in Tailwind | `--shadcn-theme` |
| `--detect-slots` | Auto-detect component slots | `--detect-slots` |
| `--slot-mapping` | Map JSX children to slots | `--slot-mapping=content:renders_one` |
| `--generate-helpers` | Create helper methods | `--generate-helpers` |
| `--enhanced-erb-conversion` | Improved JSX to ERB conversion | `--enhanced-erb-conversion` |
| `--icon-component` | Special handling for icons | `--icon-component` |
| `--handle-composition` | Handle nested components | `--handle-composition` |

## Conversion Process

### Example: Original JSX

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

### Generated ViewComponent

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

### Generated ERB Template

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

## Generated Application Structure

```
rails-app/
├── app/
│   ├── components/
│   │   └── ui/
│   │       ├── button_component.rb
│   │       ├── button_component.html.erb
│   │       ├── card_component.rb
│   │       └── card_component.html.erb
│   ├── controllers/
│   │   ├── home_controller.rb
│   │   └── products_controller.rb
│   ├── javascript/
│   │   └── controllers/
│   │       ├── button_controller.js
│   │       └── card_controller.js
│   └── views/
│       ├── home/
│       │   └── index.html.erb
│       └── products/
│           ├── index.html.erb
│           └── show.html.erb
├── config/
│   └── routes.rb
└── v0-components/  # Original component reference
    ├── app/
    │   ├── page.jsx
    │   └── products/
    │       ├── page.jsx
    │       └── [id]/
    │           └── page.jsx
    └── components/
        └── ui/
            ├── button.jsx
            └── card.jsx
```

## License

MIT

