import dims from "./art-dims.json";

export type Collection = {
  slug: string;
  name: string;
  number: string;
  era: string;
  tagline: string;
  description: string;
};

export type Artwork = {
  slug: string;
  title: string;
  artist: string;
  artistLife: string;
  year: string;
  medium: string;
  location: string;
  collection: string;
  basePrice: number;
  edition: number;
  description: string;
  image: string;
  texture: string;
  width: number;
  height: number;
};

export const collections: Collection[] = [
  {
    slug: "rebirth",
    name: "Rebirth",
    number: "01",
    era: "Italian & Northern Renaissance · 1434 – 1519",
    tagline: "When the world learned to look again.",
    description:
      "Rebirth gathers the panels and frescoes that taught Europe to paint the human face, the human body and the space around them. Smiles that follow you, gods stepping out of the sea, and a single finger about to give life — the founding images of Western art, printed at museum fidelity.",
  },
  {
    slug: "quiet-light",
    name: "Quiet Light",
    number: "02",
    era: "Dutch & Spanish Golden Age · 1642 – 1668",
    tagline: "Window light, held still for four centuries.",
    description:
      "Quiet Light is about the hush of a room in Delft and the theatre of a court in Madrid. Vermeer's daylight, Rembrandt's torchlit militia and Velázquez's mirror-game are reproduced from high-resolution museum captures, so every pearl and brushstroke reads.",
  },
  {
    slug: "starry-nights",
    name: "Starry Nights",
    number: "03",
    era: "Vincent van Gogh · 1887 – 1890",
    tagline: "Three years. A lifetime of colour.",
    description:
      "In his final, feverish years Van Gogh painted skies that swirl, flowers that blaze and blossoms that feel like a lullaby. Starry Nights collects six of the works that made him the most loved painter on earth — printed with pigment inks that keep his yellows loud.",
  },
  {
    slug: "impressions",
    name: "Impressions",
    number: "04",
    era: "French Impressionism & Pointillism · 1872 – 1906",
    tagline: "A Sunday that never ends.",
    description:
      "Impressions is a walk along the Seine: sunrise over Le Havre, a breeze on a hillside, dancing in Montmartre and a million dots of an afternoon on La Grande Jatte. Light was the subject — and these prints are made to catch it.",
  },
  {
    slug: "floating-world",
    name: "The Floating World",
    number: "05",
    era: "Japanese Ukiyo-e · 1831 – 1857",
    tagline: "Waves, mountains and sudden rain.",
    description:
      "The woodblock prints of Hokusai and Hiroshige crossed oceans and rewired European painting. The Floating World brings together the Great Wave, Red Fuji and two of Hiroshige's views of Edo — flat colour, bold line, endlessly modern.",
  },
  {
    slug: "storm-and-gold",
    name: "Storm & Gold",
    number: "06",
    era: "Romanticism to Vienna Secession · 1818 – 1908",
    tagline: "Fog, fire, a scream and a kiss.",
    description:
      "Storm & Gold runs from Friedrich's wanderer above the clouds to Klimt's lovers wrapped in gold leaf. Revolution, a dying warship and the most famous anxiety in art history — the century when painting became personal.",
  },
];

type Raw = Omit<Artwork, "image" | "texture" | "width" | "height">;

const raw: Raw[] = [
  // ── Rebirth ───────────────────────────────────────────────
  {
    slug: "mona-lisa",
    title: "Mona Lisa",
    artist: "Leonardo da Vinci",
    artistLife: "1452 – 1519",
    year: "c. 1503 – 1519",
    medium: "Oil on poplar panel",
    location: "Musée du Louvre, Paris",
    collection: "rebirth",
    basePrice: 90,
    edition: 250,
    description:
      "Lisa Gherardini, wife of a Florentine silk merchant, sits before a dreamlike valley that dissolves into blue haze. Leonardo's sfumato — smoke-soft transitions with no hard lines — makes the smile seem to appear and vanish as you look. He carried the panel with him for the rest of his life and never delivered it.",
  },
  {
    slug: "lady-with-an-ermine",
    title: "Lady with an Ermine",
    artist: "Leonardo da Vinci",
    artistLife: "1452 – 1519",
    year: "c. 1489 – 1491",
    medium: "Oil on walnut panel",
    location: "Czartoryski Museum, Kraków",
    collection: "rebirth",
    basePrice: 75,
    edition: 150,
    description:
      "Cecilia Gallerani turns towards someone just outside the frame, an ermine — symbol of purity and of her lover Ludovico Sforza — alert in her arms. The twist of the body is one of Leonardo's great inventions: a portrait caught in motion rather than posed.",
  },
  {
    slug: "birth-of-venus",
    title: "The Birth of Venus",
    artist: "Sandro Botticelli",
    artistLife: "1445 – 1510",
    year: "c. 1484 – 1486",
    medium: "Tempera on canvas",
    location: "Uffizi Gallery, Florence",
    collection: "rebirth",
    basePrice: 85,
    edition: 250,
    description:
      "The goddess arrives on a scallop shell, blown ashore by the winds Zephyr and Aura while a Hora rushes to cloak her. Botticelli's long, rhythmic line and pale sea-light turned an ancient myth into the defining image of Florentine beauty.",
  },
  {
    slug: "primavera",
    title: "Primavera",
    artist: "Sandro Botticelli",
    artistLife: "1445 – 1510",
    year: "c. 1477 – 1482",
    medium: "Tempera on panel",
    location: "Uffizi Gallery, Florence",
    collection: "rebirth",
    basePrice: 80,
    edition: 150,
    description:
      "In an orange grove, Venus presides over spring: the Three Graces dance, Flora scatters blossoms and Mercury parts the clouds. Botticelli painted around 500 identifiable plant species into the meadow — a garden you can study for hours.",
  },
  {
    slug: "creation-of-adam",
    title: "The Creation of Adam",
    artist: "Michelangelo",
    artistLife: "1475 – 1564",
    year: "c. 1508 – 1512",
    medium: "Fresco",
    location: "Sistine Chapel, Vatican City",
    collection: "rebirth",
    basePrice: 85,
    edition: 250,
    description:
      "The almost-touching fingers of God and Adam are the most reproduced gesture in art. Michelangelo painted it lying on scaffolding twenty metres above the chapel floor; this print is taken from the ceiling's post-restoration colour.",
  },
  {
    slug: "arnolfini-portrait",
    title: "The Arnolfini Portrait",
    artist: "Jan van Eyck",
    artistLife: "c. 1390 – 1441",
    year: "1434",
    medium: "Oil on oak panel",
    location: "National Gallery, London",
    collection: "rebirth",
    basePrice: 70,
    edition: 100,
    description:
      "A merchant and his wife stand in a Bruges bedroom, every object — the oranges, the dog, the single lit candle — painted with impossible precision. Look into the convex mirror: Van Eyck reflected himself, and signed the wall above it, ‘Jan van Eyck was here’.",
  },
  // ── Quiet Light ───────────────────────────────────────────
  {
    slug: "girl-with-a-pearl-earring",
    title: "Girl with a Pearl Earring",
    artist: "Johannes Vermeer",
    artistLife: "1632 – 1675",
    year: "c. 1665",
    medium: "Oil on canvas",
    location: "Mauritshuis, The Hague",
    collection: "quiet-light",
    basePrice: 90,
    edition: 250,
    description:
      "Not a portrait but a tronie — a study of a face, a turban and a moment. The pearl is just two strokes of paint: a soft reflection below and a single bright highlight above. Against the black ground, her glance has the immediacy of a photograph.",
  },
  {
    slug: "the-milkmaid",
    title: "The Milkmaid",
    artist: "Johannes Vermeer",
    artistLife: "1632 – 1675",
    year: "c. 1657 – 1658",
    medium: "Oil on canvas",
    location: "Rijksmuseum, Amsterdam",
    collection: "quiet-light",
    basePrice: 80,
    edition: 150,
    description:
      "A kitchen maid pours milk in a corner of cool window light. Vermeer turns a domestic task into something monumental — the bread glitters with tiny dots of paint, and the thin white stream seems to keep flowing.",
  },
  {
    slug: "the-art-of-painting",
    title: "The Art of Painting",
    artist: "Johannes Vermeer",
    artistLife: "1632 – 1675",
    year: "c. 1666 – 1668",
    medium: "Oil on canvas",
    location: "Kunsthistorisches Museum, Vienna",
    collection: "quiet-light",
    basePrice: 75,
    edition: 100,
    description:
      "A tapestry is pulled back like a curtain: we watch a painter, seen from behind, at work on a model dressed as Clio, muse of history. Vermeer kept this picture until his death — an allegory of his own craft and its ambitions.",
  },
  {
    slug: "the-night-watch",
    title: "The Night Watch",
    artist: "Rembrandt van Rijn",
    artistLife: "1606 – 1669",
    year: "1642",
    medium: "Oil on canvas",
    location: "Rijksmuseum, Amsterdam",
    collection: "quiet-light",
    basePrice: 85,
    edition: 250,
    description:
      "A militia company bursts into motion — drums, muskets, a girl in gold lit like a spotlight. Rembrandt turned a static group portrait into street theatre. It isn't a night scene at all: centuries of darkened varnish gave the painting its name.",
  },
  {
    slug: "las-meninas",
    title: "Las Meninas",
    artist: "Diego Velázquez",
    artistLife: "1599 – 1660",
    year: "1656",
    medium: "Oil on canvas",
    location: "Museo del Prado, Madrid",
    collection: "quiet-light",
    basePrice: 80,
    edition: 150,
    description:
      "The Infanta Margarita and her maids of honour look out at us — or at the king and queen, reflected in the mirror at the back. Velázquez paints himself at the easel, turning the viewer into the subject. Painters have argued about this picture ever since.",
  },
  // ── Starry Nights ─────────────────────────────────────────
  {
    slug: "starry-night",
    title: "The Starry Night",
    artist: "Vincent van Gogh",
    artistLife: "1853 – 1890",
    year: "1889",
    medium: "Oil on canvas",
    location: "Museum of Modern Art, New York",
    collection: "starry-nights",
    basePrice: 95,
    edition: 250,
    description:
      "Painted from memory at the asylum in Saint-Rémy, the view from his east-facing window becomes a sky of spiralling energy above a sleeping village. A cypress flares up like a dark flame. Van Gogh thought it a failure; the world disagreed.",
  },
  {
    slug: "cafe-terrace-at-night",
    title: "Café Terrace at Night",
    artist: "Vincent van Gogh",
    artistLife: "1853 – 1890",
    year: "1888",
    medium: "Oil on canvas",
    location: "Kröller-Müller Museum, Otterlo",
    collection: "starry-nights",
    basePrice: 85,
    edition: 150,
    description:
      "His first painting of a starry sky — and not a speck of black in it. The gas-lit terrace on the Place du Forum in Arles glows yellow against deep blue, the cobbles catching the light like scattered coins.",
  },
  {
    slug: "sunflowers",
    title: "Sunflowers",
    artist: "Vincent van Gogh",
    artistLife: "1853 – 1890",
    year: "1888",
    medium: "Oil on canvas",
    location: "National Gallery, London",
    collection: "starry-nights",
    basePrice: 90,
    edition: 250,
    description:
      "Painted to decorate Gauguin's room in the Yellow House, these fifteen blooms run from full flower to seed. Van Gogh explored yellow on yellow, using the newly invented chrome pigments — the sunflowers became his signature.",
  },
  {
    slug: "irises",
    title: "Irises",
    artist: "Vincent van Gogh",
    artistLife: "1853 – 1890",
    year: "1889",
    medium: "Oil on canvas",
    location: "J. Paul Getty Museum, Los Angeles",
    collection: "starry-nights",
    basePrice: 80,
    edition: 150,
    description:
      "Made in his first week at Saint-Rémy, from the asylum garden. The outlines and flat patches of colour show his love of Japanese woodblocks — and one lone white iris stands out among the violet.",
  },
  {
    slug: "almond-blossom",
    title: "Almond Blossom",
    artist: "Vincent van Gogh",
    artistLife: "1853 – 1890",
    year: "1890",
    medium: "Oil on canvas",
    location: "Van Gogh Museum, Amsterdam",
    collection: "starry-nights",
    basePrice: 85,
    edition: 250,
    description:
      "A gift for his newborn nephew, named Vincent after him. White blossom against turquoise sky, painted as a symbol of new life — it hung above the baby's bed, and remains one of his most tender works.",
  },
  {
    slug: "van-gogh-self-portrait",
    title: "Self-Portrait",
    artist: "Vincent van Gogh",
    artistLife: "1853 – 1890",
    year: "1887",
    medium: "Oil on artist's board",
    location: "Art Institute of Chicago",
    collection: "starry-nights",
    basePrice: 70,
    edition: 100,
    description:
      "Painted in Paris after meeting the Pointillists, Van Gogh builds his own face out of rhythmic dabs of complementary colour — orange against blue, red against green. Too poor to pay models, he painted himself more than thirty times.",
  },
  // ── Impressions ───────────────────────────────────────────
  {
    slug: "impression-sunrise",
    title: "Impression, Sunrise",
    artist: "Claude Monet",
    artistLife: "1840 – 1926",
    year: "1872",
    medium: "Oil on canvas",
    location: "Musée Marmottan Monet, Paris",
    collection: "impressions",
    basePrice: 85,
    edition: 250,
    description:
      "The port of Le Havre in morning mist, an orange sun and its broken reflection. A critic mocked the title and named a movement: Impressionism. In greyscale the sun almost disappears — it has the same brightness as the sky around it.",
  },
  {
    slug: "woman-with-a-parasol",
    title: "Woman with a Parasol",
    artist: "Claude Monet",
    artistLife: "1840 – 1926",
    year: "1875",
    medium: "Oil on canvas",
    location: "National Gallery of Art, Washington",
    collection: "impressions",
    basePrice: 80,
    edition: 150,
    description:
      "Camille Monet and their son Jean on a summer hillside, seen from below against a moving sky. Quick strokes capture wind in the veil and grass — a snapshot of a family afternoon painted in a single outing.",
  },
  {
    slug: "water-lilies",
    title: "Water Lilies",
    artist: "Claude Monet",
    artistLife: "1840 – 1926",
    year: "1906",
    medium: "Oil on canvas",
    location: "Art Institute of Chicago",
    collection: "impressions",
    basePrice: 90,
    edition: 250,
    description:
      "No horizon, no shore — only the surface of the pond at Giverny, its lilies and the reflected sky. Monet painted his garden roughly 250 times over three decades, and these canvases pointed straight towards abstraction.",
  },
  {
    slug: "la-grande-jatte",
    title: "A Sunday on La Grande Jatte",
    artist: "Georges Seurat",
    artistLife: "1859 – 1891",
    year: "1884 – 1886",
    medium: "Oil on canvas",
    location: "Art Institute of Chicago",
    collection: "impressions",
    basePrice: 85,
    edition: 150,
    description:
      "Parisians at leisure on an island in the Seine, built from countless tiny dots of pure colour that blend in the eye. Seurat spent two years on it, and the stillness of the figures makes a lazy afternoon feel eternal.",
  },
  {
    slug: "moulin-de-la-galette",
    title: "Bal du moulin de la Galette",
    artist: "Pierre-Auguste Renoir",
    artistLife: "1841 – 1919",
    year: "1876",
    medium: "Oil on canvas",
    location: "Musée d'Orsay, Paris",
    collection: "impressions",
    basePrice: 80,
    edition: 150,
    description:
      "A Sunday dance in Montmartre, sunlight dappling through acacia leaves onto dresses, faces and straw hats. Renoir painted on site, his friends posing among the crowd — the purest picture of joy Impressionism produced.",
  },
  // ── The Floating World ────────────────────────────────────
  {
    slug: "the-great-wave",
    title: "The Great Wave off Kanagawa",
    artist: "Katsushika Hokusai",
    artistLife: "1760 – 1849",
    year: "c. 1831",
    medium: "Woodblock print, ink and colour on paper",
    location: "Thirty-six Views of Mount Fuji",
    collection: "floating-world",
    basePrice: 85,
    edition: 250,
    description:
      "A wave rears up with claw-like foam over three boats of rowers, while Mount Fuji sits small and calm in the trough. Printed with imported Prussian blue, it became the most famous image in Asian art.",
  },
  {
    slug: "red-fuji",
    title: "Fine Wind, Clear Morning",
    artist: "Katsushika Hokusai",
    artistLife: "1760 – 1849",
    year: "c. 1831",
    medium: "Woodblock print, ink and colour on paper",
    location: "Thirty-six Views of Mount Fuji",
    collection: "floating-world",
    basePrice: 75,
    edition: 150,
    description:
      "Known as ‘Red Fuji’: the mountain glows in late-summer dawn light under a sky of mackerel clouds. Three colours and a few lines — one of the most economical masterpieces ever made.",
  },
  {
    slug: "plum-garden",
    title: "Plum Park in Kameido",
    artist: "Utagawa Hiroshige",
    artistLife: "1797 – 1858",
    year: "1857",
    medium: "Woodblock print, ink and colour on paper",
    location: "One Hundred Famous Views of Edo",
    collection: "floating-world",
    basePrice: 70,
    edition: 100,
    description:
      "A gnarled plum branch fills the foreground while visitors admire the blossom beyond. The radical cropping so excited Van Gogh that he copied the print in oil — the copy hangs today in Amsterdam.",
  },
  {
    slug: "sudden-shower",
    title: "Sudden Shower over Shin-Ōhashi",
    artist: "Utagawa Hiroshige",
    artistLife: "1797 – 1858",
    year: "1857",
    medium: "Woodblock print, ink and colour on paper",
    location: "One Hundred Famous Views of Edo",
    collection: "floating-world",
    basePrice: 70,
    edition: 100,
    description:
      "Figures hurry across a bridge as rain slashes down in fine dark lines — two blocks cut at different angles. Hiroshige made weather itself the subject, and Van Gogh copied this one too.",
  },
  // ── Storm & Gold ──────────────────────────────────────────
  {
    slug: "wanderer-above-the-sea-of-fog",
    title: "Wanderer above the Sea of Fog",
    artist: "Caspar David Friedrich",
    artistLife: "1774 – 1840",
    year: "c. 1818",
    medium: "Oil on canvas",
    location: "Hamburger Kunsthalle, Hamburg",
    collection: "storm-and-gold",
    basePrice: 85,
    edition: 250,
    description:
      "A man stands on a rocky summit, his back to us, gazing over a landscape swallowed by fog. Friedrich invites us to stand in his place — the emblem of Romantic longing and of the sublime.",
  },
  {
    slug: "fighting-temeraire",
    title: "The Fighting Temeraire",
    artist: "J. M. W. Turner",
    artistLife: "1775 – 1851",
    year: "1839",
    medium: "Oil on canvas",
    location: "National Gallery, London",
    collection: "storm-and-gold",
    basePrice: 80,
    edition: 150,
    description:
      "A ghostly warship that fought at Trafalgar is towed to the breakers by a black steam tug, under a blazing sunset. Turner's elegy for the age of sail was voted the greatest painting in Britain.",
  },
  {
    slug: "liberty-leading-the-people",
    title: "Liberty Leading the People",
    artist: "Eugène Delacroix",
    artistLife: "1798 – 1863",
    year: "1830",
    medium: "Oil on canvas",
    location: "Musée du Louvre, Paris",
    collection: "storm-and-gold",
    basePrice: 80,
    edition: 150,
    description:
      "Marianne strides over the barricade, the tricolour raised, leading Parisians of every class through the smoke of the July Revolution. Delacroix fused allegory and reportage into a symbol of freedom still used today.",
  },
  {
    slug: "the-scream",
    title: "The Scream",
    artist: "Edvard Munch",
    artistLife: "1863 – 1944",
    year: "1893",
    medium: "Oil, tempera and pastel on cardboard",
    location: "National Museum, Oslo",
    collection: "storm-and-gold",
    basePrice: 90,
    edition: 250,
    description:
      "On a fjord path at sunset Munch felt ‘an infinite scream passing through nature’. The figure, the bridge and the blood-red sky all ripple with the same shudder. Modern anxiety has had a face ever since.",
  },
  {
    slug: "the-kiss",
    title: "The Kiss",
    artist: "Gustav Klimt",
    artistLife: "1862 – 1918",
    year: "1907 – 1908",
    medium: "Oil and gold leaf on canvas",
    location: "Belvedere, Vienna",
    collection: "storm-and-gold",
    basePrice: 95,
    edition: 250,
    description:
      "Two lovers embrace on a flowering cliff edge, wrapped in robes of geometric gold — his of rectangles, hers of circles and flowers. The high point of Klimt's Golden Period; this print uses a metallic-toned ink set.",
  },
  {
    slug: "adele-bloch-bauer",
    title: "Portrait of Adele Bloch-Bauer I",
    artist: "Gustav Klimt",
    artistLife: "1862 – 1918",
    year: "1907",
    medium: "Oil, silver and gold leaf on canvas",
    location: "Neue Galerie, New York",
    collection: "storm-and-gold",
    basePrice: 85,
    edition: 150,
    description:
      "Adele's face and hands emerge from a shimmering field of gold, eyes and spirals. Seized by the Nazis and recovered by her niece after a landmark case, the ‘Woman in Gold’ has one of the most extraordinary histories of any painting.",
  },
];

const dimMap = dims as unknown as Record<string, [number, number]>;

export const artworks: Artwork[] = raw.map((a) => {
  const [width, height] = dimMap[a.slug] ?? [1200, 1500];
  return {
    ...a,
    image: `/art/${a.slug}.jpg`,
    texture: `/art/tex/${a.slug}.jpg`,
    width,
    height,
  };
});

export const getArtwork = (slug: string) => artworks.find((a) => a.slug === slug);
export const getCollection = (slug: string) => collections.find((c) => c.slug === slug);
export const worksIn = (slug: string) => artworks.filter((a) => a.collection === slug);

export const artists = Array.from(
  artworks.reduce((map, a) => {
    const entry = map.get(a.artist) ?? { name: a.artist, life: a.artistLife, works: [] as Artwork[] };
    entry.works.push(a);
    map.set(a.artist, entry);
    return map;
  }, new Map<string, { name: string; life: string; works: Artwork[] }>()).values(),
).sort((a, b) => lastName(a.name).localeCompare(lastName(b.name)));

function lastName(name: string) {
  const parts = name.replace(/\./g, "").split(" ");
  if (name.startsWith("J. M. W.")) return "Turner";
  if (name === "Michelangelo") return "Michelangelo";
  if (name.includes("van Rijn")) return "Rembrandt";
  if (name.includes("da Vinci")) return "Leonardo";
  return parts[parts.length - 1];
}

export const artistSlug = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
