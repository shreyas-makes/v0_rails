### Converting the Landing Page to Rails ViewComponents

To implement this landing page in a Rails application using ViewComponents, you'll need to restructure the React components into Ruby ViewComponents. Here's how you can approach it:

## 1. Setting up ViewComponents in Rails

First, make sure you have the ViewComponent gem installed:

```ruby file="Gemfile"
...
```

Run `bundle install` and then set up Tailwind CSS:

```shellscript
bin/rails tailwindcss:install
```

## 2. Creating the ViewComponents Structure

Here's how you would structure the landing page using ViewComponents:

```ruby file="app/components/button_component.rb"
...
# app/components/button_component.rb
class ButtonComponent < ViewComponent::Base
  attr_reader :variant, :size, :class_name

  def initialize(variant: "default", size: "default", class_name: "")
    @variant = variant
    @size = size
    @class_name = class_name
  end

  private

  def classes
    base = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    
    variant_classes = {
      "default" => "bg-primary text-primary-foreground shadow hover:bg-primary/90",
      "outline" => "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
      "ghost" => "hover:bg-accent hover:text-accent-foreground"
    }
    
    size_classes = {
      "default" => "h-9 px-4 py-2 text-sm",
      "sm" => "h-8 px-3 text-xs",
      "lg" => "h-10 px-8 text-base"
    }
    
    [base, variant_classes[variant], size_classes[size], class_name].join(" ")
  end
end
```

```plaintext file="app/components/button_component.html.erb"
...
<button class="<%= classes %>">
  <%= content %>
</button>
```

```ruby file="app/components/card_component.rb"
...
# app/components/card_component.rb
class CardComponent < ViewComponent::Base
  renders_one :header
  renders_one :content
  renders_one :footer
end
```

```plaintext file="app/components/card_component.html.erb"
...
<div class="rounded-lg border bg-card text-card-foreground shadow-sm">
  <% if header %>
    <div class="flex flex-col space-y-1.5 p-6">
      <%= header %>
    </div>
  <% end %>
  
  <% if content %>
    <div class="p-6 pt-0">
      <%= content %>
    </div>
  <% end %>
  
  <% if footer %>
    <div class="flex items-center p-6 pt-0">
      <%= footer %>
    </div>
  <% end %>
</div>
```

```ruby file="app/components/icon_component.rb"
...
# app/components/icon_component.rb
class IconComponent < ViewComponent::Base
  attr_reader :name, :class_name

  def initialize(name:, class_name: "")
    @name = name
    @class_name = class_name
  end
end
```

```plaintext file="app/components/icon_component.html.erb"
...
<% case name %>
<% when "rocket" %>
  <svg xmlns="http://www.w3.org/2000/svg" class="<%= class_name %>" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path></svg>
<% when "zap" %>
  <svg xmlns="http://www.w3.org/2000/svg" class="<%= class_name %>" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
<% when "code" %>
  <svg xmlns="http://www.w3.org/2000/svg" class="<%= class_name %>" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
<% when "globe" %>
  <svg xmlns="http://www.w3.org/2000/svg" class="<%= class_name %>" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" x2="22" y1="12" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
<% when "check-circle" %>
  <svg xmlns="http://www.w3.org/2000/svg" class="<%= class_name %>" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
<% when "arrow-right" %>
  <svg xmlns="http://www.w3.org/2000/svg" class="<%= class_name %>" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
<% end %>
```

## 3. Creating the Landing Page Component

```ruby file="app/components/landing_page_component.rb"
...
# app/components/landing_page_component.rb
class LandingPageComponent < ViewComponent::Base
  def current_year
    Time.current.year
  end
end
```

```plaintext file="app/components/landing_page_component.html.erb"
...
<div class="flex min-h-screen flex-col">
  <header class="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div class="container flex h-16 items-center justify-between">
      <div class="flex items-center gap-2 font-bold">
        <%= render IconComponent.new(name: "rocket", class_name: "h-5 w-5 text-primary") %>
        <span>DevStack</span>
      </div>
      <nav class="hidden md:flex gap-6">
        <a href="#features" class="text-sm font-medium transition-colors hover:text-primary">Features</a>
        <a href="#pricing" class="text-sm font-medium transition-colors hover:text-primary">Pricing</a>
        <a href="#testimonials" class="text-sm font-medium transition-colors hover:text-primary">Testimonials</a>
        <a href="#contact" class="text-sm font-medium transition-colors hover:text-primary">Contact</a>
      </nav>
      <div class="flex items-center gap-4">
        <%= render(ButtonComponent.new(variant: "outline", size: "sm", class_name: "hidden md:flex")) do %>
          Log in
        <% end %>
        <%= render(ButtonComponent.new(size: "sm")) do %>
          Get Started
        <% end %>
      </div>
    </div>
  </header>
  
  <main class="flex-1">
    <section class="py-20 md:py-28">
      <div class="container px-4 md:px-6">
        <div class="flex flex-col items-center gap-4 text-center">
          <div class="space-y-2">
            <h1 class="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
              Build faster with modern <span class="text-primary">dev tools</span>
            </h1>
            <p class="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              Streamline your development workflow with our cutting-edge tools and components designed for the
              modern web.
            </p>
          </div>
          <div class="flex flex-col gap-2 min-[400px]:flex-row">
            <%= render(ButtonComponent.new(size: "lg", class_name: "gap-1")) do %>
              Get Started <%= render IconComponent.new(name: "arrow-right", class_name: "h-4 w-4") %>
            <% end %>
            <%= render(ButtonComponent.new(size: "lg", variant: "outline")) do %>
              View Documentation
            <% end %>
          </div>
        </div>
      </div>
    </section>
    
    <section id="features" class="bg-muted/50 py-20">
      <div class="container px-4 md:px-6">
        <div class="mb-12 flex flex-col items-center gap-4 text-center">
          <div class="space-y-2">
            <h2 class="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Features built for developers
            </h2>
            <p class="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              Our platform provides everything you need to build modern web applications quickly and efficiently.
            </p>
          </div>
        </div>
        
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <%= render CardComponent.new do |c| %>
            <% c.with_header do %>
              <%= render IconComponent.new(name: "zap", class_name: "h-10 w-10 text-primary mb-2") %>
              <h3 class="text-xl font-bold">Lightning Fast</h3>
              <p class="text-sm text-muted-foreground">
                Optimized for speed and performance, ensuring your applications load quickly.
              </p>
            <% end %>
            
            <% c.with_content do %>
              <ul class="space-y-2 text-sm">
                <li class="flex items-center gap-2">
                  <%= render IconComponent.new(name: "check-circle", class_name: "h-4 w-4 text-primary") %>
                  <span>Optimized build process</span>
                </li>
                <li class="flex items-center gap-2">
                  <%= render IconComponent.new(name: "check-circle", class_name: "h-4 w-4 text-primary") %>
                  <span>Efficient code splitting</span>
                </li>
                <li class="flex items-center gap-2">
                  <%= render IconComponent.new(name: "check-circle", class_name: "h-4 w-4 text-primary") %>
                  <span>Minimal bundle sizes</span>
                </li>
              </ul>
            <% end %>
            
            <% c.with_footer do %>
              <%= render(ButtonComponent.new(variant: "ghost", class_name: "w-full gap-1")) do %>
                Learn more <%= render IconComponent.new(name: "arrow-right", class_name: "h-4 w-4") %>
              <% end %>
            <% end %>
          <% end %>
          
          <%= render CardComponent.new do |c| %>
            <% c.with_header do %>
              <%= render IconComponent.new(name: "code", class_name: "h-10 w-10 text-primary mb-2") %>
              <h3 class="text-xl font-bold">Developer Experience</h3>
              <p class="text-sm text-muted-foreground">
                Built with developers in mind, providing a seamless development experience.
              </p>
            <% end %>
            
            <% c.with_content do %>
              <ul class="space-y-2 text-sm">
                <li class="flex items-center gap-2">
                  <%= render IconComponent.new(name: "check-circle", class_name: "h-4 w-4 text-primary") %>
                  <span>Hot module replacement</span>
                </li>
                <li class="flex items-center gap-2">
                  <%= render IconComponent.new(name: "check-circle", class_name: "h-4 w-4 text-primary") %>
                  <span>Intuitive API design</span>
                </li>
                <li class="flex items-center gap-2">
                  <%= render IconComponent.new(name: "check-circle", class_name: "h-4 w-4 text-primary") %>
                  <span>Comprehensive documentation</span>
                </li>
              </ul>
            <% end %>
            
            <% c.with_footer do %>
              <%= render(ButtonComponent.new(variant: "ghost", class_name: "w-full gap-1")) do %>
                Learn more <%= render IconComponent.new(name: "arrow-right", class_name: "h-4 w-4") %>
              <% end %>
            <% end %>
          <% end %>
          
          <%= render CardComponent.new do |c| %>
            <% c.with_header do %>
              <%= render IconComponent.new(name: "globe", class_name: "h-10 w-10 text-primary mb-2") %>
              <h3 class="text-xl font-bold">Global Scale</h3>
              <p class="text-sm text-muted-foreground">Deploy your applications globally with just a few clicks.</p>
            <% end %>
            
            <% c.with_content do %>
              <ul class="space-y-2 text-sm">
                <li class="flex items-center gap-2">
                  <%= render IconComponent.new(name: "check-circle", class_name: "h-4 w-4 text-primary") %>
                  <span>Edge network deployment</span>
                </li>
                <li class="flex items-center gap-2">
                  <%= render IconComponent.new(name: "check-circle", class_name: "h-4 w-4 text-primary") %>
                  <span>Automatic scaling</span>
                </li>
                <li class="flex items-center gap-2">
                  <%= render IconComponent.new(name: "check-circle", class_name: "h-4 w-4 text-primary") %>
                  <span>Global CDN integration</span>
                </li>
              </ul>
            <% end %>
            
            <% c.with_footer do %>
              <%= render(ButtonComponent.new(variant: "ghost", class_name: "w-full gap-1")) do %>
                Learn more <%= render IconComponent.new(name: "arrow-right", class_name: "h-4 w-4") %>
              <% end %>
            <% end %>
          <% end %>
        </div>
      </div>
    </section>
    
    <section class="py-20">
      <div class="container px-4 md:px-6">
        <div class="flex flex-col items-center justify-center gap-4 text-center">
          <div class="space-y-2">
            <h2 class="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Ready to get started?</h2>
            <p class="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              Join thousands of developers building better applications with our platform.
            </p>
          </div>
          <div class="flex flex-col gap-2 min-[400px]:flex-row">
            <%= render(ButtonComponent.new(size: "lg", class_name: "gap-1")) do %>
              Get Started <%= render IconComponent.new(name: "arrow-right", class_name: "h-4 w-4") %>
            <% end %>
            <%= render(ButtonComponent.new(size: "lg", variant: "outline")) do %>
              Contact Sales
            <% end %>
          </div>
        </div>
      </div>
    </section>
  </main>
  
  <footer class="border-t bg-muted/50">
    <div class="container flex flex-col gap-6 py-8 md:flex-row md:items-center md:justify-between md:py-12">
      <div class="flex items-center gap-2 font-bold">
        <%= render IconComponent.new(name: "rocket", class_name: "h-5 w-5 text-primary") %>
        <span>DevStack</span>
      </div>
      <nav class="flex gap-4 sm:gap-6">
        <a href="#" class="text-xs hover:underline underline-offset-4">Terms</a>
        <a href="#" class="text-xs hover:underline underline-offset-4">Privacy</a>
        <a href="#" class="text-xs hover:underline underline-offset-4">Cookies</a>
      </nav>
      <div class="text-xs text-muted-foreground">
        © <%= current_year %> DevStack, Inc. All rights reserved.
      </div>
    </div>
  </footer>
</div>
```

## 4. Setting up the Rails Controller and View

```ruby file="app/controllers/pages_controller.rb"
...
# app/controllers/pages_controller.rb
class PagesController < ApplicationController
  def home
  end
end
```

```plaintext file="app/views/pages/home.html.erb"
...
<%= render LandingPageComponent.new %>
```

```ruby file="config/routes.rb"
...
Rails.application.routes.draw do
  root to: "pages#home"
end
```

## 5. Configuring Tailwind CSS

Make sure your `tailwind.config.js` file includes the necessary configuration:

```javascript file="tailwind.config.js"
...
```

## 6. Importing Tailwind in your application.css

```css file="app/assets/stylesheets/application.css"
...
module.exports = {
    content: ["./app/views/**/*.html.erb", "./app/helpers/**/*.rb", "./app/components/**/*.html.erb", "./app/components/**/*.rb", "./app/javascript/**/*.js", "*.{js,ts,jsx,tsx,mdx}"],
    theme: {
      extend: {
        colors: {
          primary: {
            DEFAULT: 'hsl(220, 100%, 50%)',
            foreground: 'hsl(0, 0%, 100%)',
          },
          muted: {
            DEFAULT: 'hsl(220, 15%, 95%)',
            foreground: 'hsl(220, 15%, 40%)',
          },
          accent: {
            DEFAULT: 'hsl(220, 15%, 90%)',
            foreground: 'hsl(220, 15%, 20%)',
          },
          card: {
            DEFAULT: 'hsl(0, 0%, 100%)',
            foreground: 'hsl(220, 15%, 20%)',
          },
          background: 'hsl(0, 0%, 100%)',
          ring: 'hsl(220, 15%, 80%)',
          input: 'hsl(220, 15%, 80%)',
        },
        container: {
          center: true,
          padding: '2rem',
          screens: {
            '2xl': '1400px',
          },
        },
      },
    },
    plugins: [],
  }
```

## Key Differences from React Implementation

1. **Component Structure**: Rails ViewComponents use Ruby classes with ERB templates instead of JSX.
2. **Slots Pattern**: ViewComponents use the `renders_one` and `renders_many` methods to define slots (similar to React's children props).
3. **Styling**: Tailwind CSS is used the same way, but you need to configure it specifically for Rails.
4. **Icons**: Instead of importing from a library like Lucide React, we've created an IconComponent that renders SVG based on the icon name.
5. **Rendering Components**: In Rails, you use `<%= render ComponentName.new(...) do %>` instead of JSX's `<ComponentName>`.


This implementation maintains the same visual design and structure as the React version but adapts it to Rails' component architecture.