# Image Asset Mapping

This note describes how the pre-rendered shelf images under `output_final/` map to the physical structure defined in the database.

- File pattern: `output_final/module{module_number}/{front|back}/s{unit_number}_r{shelf_number}.jpg`.
- `module_number` matches `Modules.module_number` (e.g., `module1`).
- `{front|back}` comes from `Module_parts.part_name`, lowercased.
- `unit_number` corresponds to `Shelving_units.unit_number` (1-8 per face), producing `s{unit_number}`.
- `shelf_number` corresponds to `Shelves.shelf_number` (1-5 per unit), producing `_r{shelf_number}`.
- The MySQL view `vw_complete_structure` and the `find_book_location` stored procedure now expose an `image_relative_path` column with this relative path, allowing the backend to surface the correct image without manual mapping.
- The backend helper `search-book.ts` logs this path after successful lookups; front-end or API layers can reuse the same column to serve the static asset.

Keeping the numbering aligned between database records and filenames ensures that new assets can be generated or swapped without additional configuration.
