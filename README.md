# shiba-shooter

Portrait shoot-'em-up. The playfield is a 195 by 422 pixel buffer. It integer-scales by at least 2 and fills a 390 by 844 viewport.

```bash
npm test
npm run dev
npm run build
```

GitHub Actions runs the test and the build on pull requests, and deploys `dist` to GitHub Pages from `main`.
