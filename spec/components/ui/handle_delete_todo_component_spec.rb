# frozen_string_literal: true

require "test_helper"

module Ui
  class HandleDeleteTodoComponentTest < ViewComponent::TestCase
    def test_component_renders
      # Arrange
      props = {}
      
      # Act
      render_inline(Ui::HandleDeleteTodoComponent.new(props: props))
      
      # Assert
      assert_selector("div")
      assert_matches_snapshot
    end
  end
end
