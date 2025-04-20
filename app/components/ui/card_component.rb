# WARNING: Multiple JSX elements found, using heuristics to identify the root element

# frozen_string_literal: true

module Ui
  class CardComponent < ViewComponent::Base
    attr_reader :title
    attr_reader :description
    attr_reader :imageUrl
    attr_reader :buttonText
    attr_reader :onClick

    def initialize(title:, description:, imageUrl:, buttonText:, onClick:)
      @title = title
      @description = description
      @imageUrl = imageUrl
      @buttonText = buttonText
      @onClick = onClick
    end

  end
end
