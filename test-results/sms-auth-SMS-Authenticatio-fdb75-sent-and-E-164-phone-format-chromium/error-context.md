# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications alt+T"
  - generic [ref=e4]:
    - heading "SMS Authentication" [level=2] [ref=e5]
    - generic [ref=e6]:
      - generic [ref=e7]: Phone number
      - textbox "Phone number" [ref=e8]: "+15551234"
      - paragraph [ref=e9]: "Example: +1 555 123 4567"
      - generic [ref=e10]:
        - checkbox "I consent to receive SMS verification codes." [checked] [ref=e11]
        - generic [ref=e12]: I consent to receive SMS verification codes.
      - button "Send Code" [ref=e13] [cursor=pointer]
    - alert [ref=e14]: Unsupported phone provider
```