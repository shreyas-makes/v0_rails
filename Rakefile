require "bundler/gem_tasks"
require "rspec/core/rake_task"

RSpec::Core::RakeTask.new(:spec)

task :default => :spec

namespace :test do
  desc "Run Jest tests for the JS part"
  task :js do
    sh "npm test"
  end
  
  desc "Run RSpec tests for the Ruby part"
  task :ruby do
    sh "bundle exec rspec"
  end
  
  desc "Run all tests (JS and Ruby)"
  task :all => [:js, :ruby]
end

namespace :build do
  desc "Build the JS part"
  task :js do
    sh "npm run build"
  end
  
  desc "Build the Ruby gem"
  task :ruby do
    sh "gem build v0_rails.gemspec"
  end
  
  desc "Build everything"
  task :all => [:js, :ruby]
end

desc "Run the example conversion"
task :example do
  sh "node cli/index.js 'examples/*.jsx' -d example_output -s -v"
end 