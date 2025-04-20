import { Controller } from "@hotwired/stimulus"

// Converted from React component: Card
export default class extends Controller {
  connect() {
    // Controller connected to DOM
    console.log("card controller connected")
  }

  click(event) {
    // TODO: Implement onClick logic
    console.log("click event triggered", event)
  }
}
