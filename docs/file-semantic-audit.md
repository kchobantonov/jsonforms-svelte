# File control semantic audit

The acceptance target is §18.18.4 of the canonical extended spec, with the
React Antd/shadcn file controls as behavioral references. This audit uses
current source and passing focused checks; it does not treat earlier broad
builds as proof for code changed afterward.

| Requirement                                                                                                                                                               | Current evidence                                                                                                                                    | State   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| Select supported scalar encodings and homogeneous file arrays, including item references; leave ordinary arrays and tuples to other renderers                             | `fileOptions.spec.ts`, three native file-control suites                                                                                             | Covered |
| Store base64 for byte/base64, full data URL for base64 plus URI, and data URL with encoded filename for binary; show persisted names or localized fallback                | Three native file-control suites and `file-control` production matrix                                                                               | Covered |
| Resolve explicit `accept`, including empty, before a usable media-type hint without claiming content validation                                                           | `fileOptions.spec.ts`, three native file-control suites                                                                                             | Covered |
| Apply finite non-negative inclusive/exclusive byte bounds; restricted rejection before read and unrestricted owned errors for accepted values                             | `fileSizeBounds.spec.ts`, three native file-control suites and `webcomponent-file-size-bounds` production matrix                                    | Covered |
| Append atomic batches in chooser order, enforce min/max count with authored restriction precedence, deduplicate only for `uniqueItems`, remove one occurrence by position | Shared read-session tests, three native file-control suites and `file-control` production matrix                                                    | Covered |
| Keep selected-byte metadata on the attachment actually committed; imported values without metadata have no inferred size                                                  | Three native regressions for a skipped duplicate beside an accepted file, existing metadata relocation/removal checks, and rebuilt production hosts | Covered |
| Preserve host-replaced data and committed attachments on read failure; cancel/abort pending readers without late writes                                                   | Shared read-session tests; all three native suites cover array host replacement during its second read and chooser cancellation between reads       | Covered |
| Localize operation feedback, keep host errors independent, and expose compact feedback on hover/focus/activation                                                          | Three native suites, `file-control` and `webcomponent-file-feedback-overlays` production matrices                                                   | Covered |
| Respect readonly, clearable, `disableAdd`/`disableRemove`, `minItems`, and keyboard access to persisted filenames                                                         | Three native suites and `webcomponent-file-action-permissions` production matrix                                                                    | Covered |
| Keep ordinary and table/AG Grid file controls bounded and usable in EN/BG, light/dark and narrow views                                                                    | `file-visual-snapshot` matrix and `file-native-review.md`                                                                                           | Covered |

The canonical spec's older paragraphs that contradicted **Local operation
feedback versus validation** have been reconciled in the sibling specification
checkout. A refused selection or failed read that preserves a valid committed
value remains local operation feedback; an accepted, stored file with a known
invalid original byte size publishes an owned error. The file example and
implementation pitfalls now state the same distinction. The spec validator
passes for 47 examples, 169 documents and six schemas. This matches the React
file controls' local rejection behavior and the Svelte native acceptance tests.

Current focused verification: shared helpers **30/30**; file-control component
suites **45/45 Flowbite**, **44/44 shadcn**, **44/44 Skeleton**. After the
metadata correction, all three production demo/Web Component build chains
passed. The generated demo outputs were restored after disk-bounded sequential
builds, then all four file-specific production suites passed together at
**30/30** across the three families, EN/BG and applicable native/Web Component
hosts. The separate native regressions cover the new unique-array and mid-read
lifecycle cases.
