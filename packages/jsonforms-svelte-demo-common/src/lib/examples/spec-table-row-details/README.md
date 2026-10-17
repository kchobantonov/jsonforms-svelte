# Table row details: recruitment

One applicant collection with dialog, side panel, and bottom panel details, each shown with a normal table and AG Grid. Both use `options.rowDetail.detail`, an item-relative UI schema for the whole row.

The table shows Name, Email, Contact (an object), and Experience (an array of objects). Notes is available only in the row editor. Portable `columnDefs` selects and sizes these columns.

Every row editor has three tabs:
- **Applicant** edits name, email, and notes.
- **Contact** renders the contact object with a horizontal City/Phone layout.
- **Experience** uses `ListWithDetail`: select a company on the left and edit its company, role, and years on the right.

The Experience cell editor deliberately uses a plain `Control` at scope `#`, so it selects the default array renderer. It does not inherit the row editor's `ListWithDetail`. The Contact cell summarizes the city and uses its default object editor. This demonstrates that `cells[field].detail` and `rowDetail.detail` can present the same data differently.

Dialog edits are staged until Apply; panels edit immediately. Row detail selection is separate from deletion checkboxes and follows the original data row when the grid is sorted or filtered.

All presentations share pagination defaults. Explicit `agGridOptions.columnDefs` or native pagination settings override their portable equivalents. Name requests 170px and Email demonstrates minimum and maximum widths.

See docs/spec.md §18.21.1.

Cell dialogs request 720px width; row dialogs request 900px by 75vh. Both enable dragging and resizing, with maximize/restore available in the header.

## Label summaries and row context

All normal-table and AG Grid presentations include an Applicant summary column
bound to the whole row with `columnDefs[].scope: "#"`. Its `field` is a stable
column key, not a new schema property. Its Label summary interpolates
`{name} — {email}` through declared textParams and has no edit action because no detail is supplied.
The Contact column uses a Label summary with `{city} · {phone}` through declared textParams against
`item.contact.city` and `item.contact.phone`, and retains its explicit detail editor and validation marker.
Applicant parameters use `item.name` and `item.email`; `data` still denotes the whole form.
The dynamicValues gate must be enabled to access either namespace. Label summaries do not display object/array type icons.
These examples require the existing Label interpolation renderer capability.

## Checks to try

- In an AG Grid presentation, filter Contact with Contains `Boston`, then
  `555-0100`: both search the resolved summary text.
- Sort Applicant summary or Contact in either direction. Editing still opens
  the original row even after sorting, filtering or changing pages.
- Resize a long summary column smaller: its text should truncate without forcing
  unrelated columns wider. Scroll the table when its combined widths overflow.
- Change a row value and verify its Label updates. `item` always means the current
  source row; `data` continues to provide the whole form.
- Turn off dynamic values: row/root expressions must not expose their values
  through rendering, sorting or filtering.

## Collection error navigation

Applicant 07 intentionally has empty Notes, which violates minLength. Notes is
not a table column and the row starts on page two. The collection footer shows
the error count; “Go to first error” reveals the page and opens the row details.
The row action area also shows its error count. Correct Notes and the indicators
disappear. AG Grid keeps active filters; the detail editor can still open when
the affected row is filtered out.

### Label summary editing

All six table variants include a Full name virtual column. Its selectable Label
combines firstName and lastName; the pencil opens a dialog editing those two
fields. Applicant summary has no detail and therefore no edit button. Neither
virtual column offers a clear-row action. The original Name remains a separate
field in this example.

### Tab validation indicators

Categories explicitly enable `showValidationIndicator`, including Applicant,
Contact, and Experience in row details. Applicant 07 has an invalid Notes value,
so its Applicant tab shows the error marker even while another tab is selected.
The marker clears when the draft value becomes valid.
