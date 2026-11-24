# Rotunda — a walk-through 3D art gallery

A Next.js art gallery where you **walk a curved, two-sided corridor** hung with the world's most famous paintings — the Mona Lisa, The Starry Night, The Great Wave, Girl with a Pearl Earring, The Kiss and more — then click any work to fly up to it and open its print shop page.

## Features

- **3D corridor gallery** (React Three Fiber): scroll, drag or use arrow keys to walk; works hang on both walls in soft arched niches with museum wall labels.
- **Fly-in transition**: the camera walks up to a painting, the room fades away and the painting glides into the product page.
- **Print shop**: paper, size, edition and frame options with live pricing, bag drawer, checkout (demo), currency switcher.
- **View in Room**: see the print at true scale in a living room, bedroom or study — **drag & drop it anywhere on the wall**, change wall colour, size and frame.
- **Light & dark mode**, ⌘K search, list view, saved works, artist index, collections, auctions with live countdowns, help/FAQ.

## Tech

Next.js 16 (App Router, intercepting routes) · React 19 · Three.js / @react-three/fiber · Motion · Zustand · TypeScript

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Credits

All paintings are public-domain works; images are museum reproductions from Wikimedia Commons.
Background music (Satie, Debussy, Chopin, Bach) is public-domain / CC0 recordings from Wikimedia Commons — see [public/music/CREDITS.md](public/music/CREDITS.md).
Checkout, auctions and sign-in are demos — no payments are taken.
