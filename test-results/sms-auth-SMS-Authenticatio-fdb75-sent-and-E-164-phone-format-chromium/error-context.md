# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications alt+T":
    - list:
      - listitem [ref=e3]:
        - img [ref=e5]
        - generic [ref=e8]: Unsupported phone provider
  - generic [ref=e10]:
    - heading "SMS Authentication" [level=2] [ref=e11]
    - generic [ref=e12]:
      - generic [ref=e13]: Phone number
      - textbox "Phone number" [ref=e14]: "+15551234"
      - paragraph [ref=e15]: "Example: +1 555 123 4567"
      - generic [ref=e16]:
        - checkbox "I consent to receive SMS verification codes." [checked] [ref=e17]
        - generic [ref=e18]: I consent to receive SMS verification codes.
      - button "Send Code" [ref=e19] [cursor=pointer]
    - alert [ref=e20]: Unsupported phone provider
```