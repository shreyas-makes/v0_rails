require 'spec_helper'

RSpec.describe V0Rails do
  it "has a version number" do
    expect(V0Rails::VERSION).not_to be nil
  end
  
  describe "module configuration" do
    it "provides Rails integration" do
      expect(defined?(V0Rails::Engine)).to eq('constant')
      expect(defined?(V0Rails::Railtie)).to eq('constant')
    end
  end
end 