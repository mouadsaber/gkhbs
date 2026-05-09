## GK Valises (Next.js)

Boutique premium de valises avec catalogue + pages produits + commande via EmailJS.

### Run locally

```bash
npm run dev
```

Open http://localhost:3000

### Meta Pixel + EmailJS config

- Copy `.env.example` to `.env.local`
- Set:
  - `NEXT_PUBLIC_META_PIXEL_ID` (optional, enables Pixel `PageView`, `ViewContent`, `AddToCart`, `Lead`)
  - `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY`
  - `NEXT_PUBLIC_EMAILJS_SERVICE_ID`
  - `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID`

### Admin-ready product data

Products live in `src/data/products.ts`.
