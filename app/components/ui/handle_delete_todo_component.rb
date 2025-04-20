# WARNING: Component uses React hook: useState. This may require manual conversion.
# WARNING: Component uses React hook: useState. This may require manual conversion.
# WARNING: Multiple JSX elements found, using heuristics to identify the root element

# frozen_string_literal: true

module Ui
  class HandleDeleteTodoComponent < ViewComponent::Base
    attr_reader :props

    def initialize(props:)
      @props = props
    end

  end
end
