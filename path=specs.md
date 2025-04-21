my_app/
 ├── app/components/
 │    └── ui/
 │        ├── app/                // Mirror v0's /app structure
 │        │    └── page_component.rb
 │        ├── components/         // Mirror v0's /components
 │        │    └── card_component.rb
 │        └── ...

* **Directory Structure**: Handles both `/app` and `/components` source directories from v0 projects. These will be mirrored under the destination's namespace directory.

* File paths preserve original directory structure:
  * `src/app/page.tsx` → `app/components/ui/app/page_component.rb`
  * `src/components/Card.tsx` → `app/components/ui/components/card_component.rb`

-n, --namespace <ns>       Ruby module namespace and root directory (default: Ui) 