Custom HTML games (engine "custom") are stored in Firestore and run from `srcdoc` inside
`<iframe sandbox="allow-scripts">` (no same-origin). They report scores with
`LZScore(points)` (posts `{type:"lz-score"}` to the parent). They always need staff approval.
