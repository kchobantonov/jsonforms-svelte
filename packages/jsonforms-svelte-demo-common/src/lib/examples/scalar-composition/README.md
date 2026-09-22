# Scalar composition

Available in Shadcn, Skeleton, and Flowbite as **Scalar composition (validation without branch forms)**.

Each field uses one scalar input. Validation still uses the complete original schema.

| Field                              | Try                | Expected result                                                                                            |
| ---------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------- |
| Min Length                         | 123, then -1       | Keeps its label through the referenced annotation-only allOf; -1 fails minimum 0.                          |
| Disjoint ranges                    | 5, 25, 15          | First two valid; 15 invalid. Neither branch restricts the other branch's valid range.                      |
| Exclusive multiples                | 6, 10, 15          | First two valid; 15 matches both oneOf branches and is invalid.                                            |
| Initially invalid multiple         | Initial 15, then 6 | Invalid incoming data remains visible; changing to 6 clears its error.                                     |
| Combined validation bounds         | 4, then 15         | allOf validates both bounds without rendering separate inputs.                                             |
| Enclosing bounds with alternatives | 25, 15, 101        | Enclosing 0–100 bounds remain applicable; 15 fails the alternatives and 101 exceeds the enclosing maximum. |
| Inferred string editor             | AB, xy, hello      | Type is inferred from both string branches; only xy is invalid.                                            |

The initial form intentionally contains one invalid value. Correct **Initially invalid multiple**
to make the entire initial form valid. Use the demo's data/error views to inspect
committed values and validator errors while editing.

These are draft-07 examples. No special UI variant requests scalar composition.
The controls enable restrict, but that does not authorize combining alternative
bounds or steps into contradictory native-input restrictions.
