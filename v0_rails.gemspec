require_relative "lib/v0_rails/version"

Gem::Specification.new do |spec|
  spec.name = "v0_rails"
  spec.version = V0Rails::VERSION
  spec.authors = [""]
  spec.email = [""]
  
  spec.summary = "Convert React/JSX + Tailwind UI code to Rails ViewComponent classes and ERB templates"
  spec.description = "A converter tool to transform React/JSX + Tailwind UI code (typically from Vercel v0) into Rails-native ViewComponent classes and ERB templates"
  spec.homepage = "https://github.com/user/v0-rails"
  spec.license = "MIT"
  spec.required_ruby_version = ">= 3.3.0"

  spec.files = Dir["lib/**/*", "bin/*", "LICENSE.txt", "README.md"]
  spec.bindir = "exe"
  spec.executables = spec.files.grep(%r{\Aexe/}) { |f| File.basename(f) }
  
  spec.add_dependency "view_component", ">= 3.9.0"
  spec.add_dependency "rails", ">= 7.1.0"
  spec.add_dependency "tailwindcss-rails", ">= 1.3.0"
  
  spec.add_development_dependency "rspec", "~> 3.12"
  spec.add_development_dependency "rubocop", "~> 1.60"
  spec.add_development_dependency "brakeman", "~> 6.1"
end 