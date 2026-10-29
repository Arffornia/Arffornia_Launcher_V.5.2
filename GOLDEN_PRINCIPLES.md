# Golden principles — Arffornia_Launcher_V.5.2

Opinionated rules that keep the launcher safe and legible for humans and agents. A principle broken
twice gets a sensor. Each line names its sensor, or "review".

1. **The renderer is a web page.** It gets no Node, no `electron`, no main-process imports. Sensor: `make arch` (dependency-cruiser).
2. **One door: `window.api`.** The preload exposes nothing else, one method per channel. Sensor: `tools/check-preload-exposure.mjs`.
3. **Main trusts nothing it receives.** Every IPC handler validates arguments and sender. Sensor: unit tests per handler (planned), review.
4. **What we download, we verify.** Hash, temp file, rename. Sensor: unit tests (planned), review.
5. **Secrets never reach logs or disk in clear.** Sensor: log-redaction test (planned), review.
6. **Every word on screen is translated (en + fr).** Sensor: i18n key parity check (#67), review.
7. **The owner's libraries are improved, never replaced.** Sensor: review.
8. **Debt only shrinks.** Known-violation files lose lines, never gain them. Sensor: review + AI review rule.
9. **Prove it.** A change ships with the test that fails without it and the `make check` output. Sensor: Stop hook, PR template.
