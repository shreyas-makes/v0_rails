# frozen_string_literal: true

require "test_helper"

module Ui
  class CardComponentTest < ViewComponent::TestCase
    def test_component_renders
      # Arrange
      title = nil
      description = nil
      imageUrl = nil
      buttonText = nil
      onClick = nil
      
      # Act
      render_inline(Ui::CardComponent.new(title: title, description: description, imageUrl: imageUrl, buttonText: buttonText, onClick: onClick))
      
      # Assert
      assert_selector("div")
      assert_matches_snapshot
    end
  end
end
