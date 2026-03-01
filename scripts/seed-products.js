// Seed products to Firebase Firestore using REST API
// This avoids needing the Firebase SDK in the script environment

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY

if (!projectId || !apiKey) {
  console.error("Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID or NEXT_PUBLIC_FIREBASE_API_KEY")
  process.exit(1)
}

const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`

function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null }
  if (typeof val === "string") return { stringValue: val }
  if (typeof val === "number") {
    if (Number.isInteger(val)) return { integerValue: String(val) }
    return { doubleValue: val }
  }
  if (typeof val === "boolean") return { booleanValue: val }
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } }
  }
  if (typeof val === "object") {
    const fields = {}
    for (const [k, v] of Object.entries(val)) {
      fields[k] = toFirestoreValue(v)
    }
    return { mapValue: { fields } }
  }
  return { stringValue: String(val) }
}

function toFirestoreDoc(obj) {
  const fields = {}
  for (const [k, v] of Object.entries(obj)) {
    fields[k] = toFirestoreValue(v)
  }
  return { fields }
}

async function setDocument(collection, docId, data) {
  const url = `${FIRESTORE_BASE}/${collection}/${docId}?key=${apiKey}`
  const body = toFirestoreDoc(data)
  
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Failed to set ${collection}/${docId}: ${res.status} - ${errText}`)
  }
  return await res.json()
}

const products = [
  {
    id: "wig-1",
    name: "Natural Black Body Wave",
    category: "wigs",
    price: 22000.0,
    image: "/natural black body wave.jpg",
    description: "Luxurious Natural Black Body Wave Hair",
    images: [
      "/natural black body wave.jpg",
      "/natural black body wave 2.jpg",
      "/natural black body wave 3.jpg",
      "/natural black body wave 4.jpg",
    ],
    status: "available",
    specifications: {
      hairLength: "30 inches",
      laceSize: "13x6 HD Lace Frontal",
      density: "180%",
      hairType: "100% Human Hair",
    },
  },
  {
    id: "wig-2",
    name: "613 Blonde Body Wave",
    category: "wigs",
    price: 25000.0,
    image: "/32-blonde.jpg",
    description: "Chic 32 Blonde Body Wave Wig with Natural Shine",
    images: ["/32-blonde.jpg", "/32-blonde-1.jpg", "/32-blonde-2.jpg", "/32-blonde-3.jpg"],
    status: "available",
    specifications: {
      hairLength: "32 inches",
      laceSize: "13x6 Transparent Lace",
      density: "200%",
      hairType: "Human Hair",
    },
  },
  {
    id: "wig-3",
    name: "Deep Wave Wig",
    category: "wigs",
    price: 22000.0,
    image: "/30-deep-wave.jpg",
    description: "Stunning deep wave wig perfect for any occasion",
    images: ["/30-deep-wave.jpg", "/30-deep-wave-1.jpg", "/30-deep-wave-2.jpg", "/30-deep-wave-3.jpg"],
    status: "available",
    specifications: {
      hairLength: "30 inches",
      laceSize: "13x6 HD Lace Frontal",
      density: "200%",
      hairType: "100% Human Hair",
    },
  },
  {
    id: "wig-4",
    name: "Chic Body Wave Bob",
    category: "wigs",
    price: 16000.0,
    image: "/16-body-wave.jpg",
    description: "Gorgeous Layered Body Wave Bob",
    images: ["/16-body-wave.jpg", "/16-body-wave-1.jpg", "/16-body-wave-2.jpg", "/16-body-wave-3.jpg"],
    status: "available",
    specifications: {
      hairLength: "16 inches",
      laceSize: "6x8 Lace",
      density: "250%",
      hairType: "100% Human Hair",
    },
  },
  {
    id: "wig-5",
    name: "Reddish Brown",
    category: "wigs",
    price: 20000.0,
    image: "/28-reddish.jpg",
    description: "Dreamy reddish brown effect for a bold statement",
    images: ["/28-reddish.jpg", "/28-reddish-1.jpg", "/28-reddish-2.jpg", "/28-reddish-3.jpg"],
    status: "available",
    specifications: {
      hairLength: "28 inches",
      laceSize: "13x4 HD Lace",
      density: "200%",
      hairType: "100% Human Hair - Pre-colored",
    },
  },
  {
    id: "wig-6",
    name: "Layered Body Wave",
    category: "wigs",
    price: 12000.0,
    image: "/10-body.jpg",
    description: "Beautiful caramel highlights on dark brown base",
    images: ["/10-body.jpg", "/10-body-1.jpg", "/10-body-2.jpg", "/10-body-3.jpg"],
    status: "available",
    specifications: {
      hairLength: "10 inches",
      laceSize: "7x5 Transparent Lace",
      density: "250%",
      hairType: "100% Human Hair",
    },
  },
  {
    id: "wig-7",
    name: "12A Water Wave Bundles",
    category: "wigs",
    price: 15000.0,
    image: "/water-wave.jpg",
    description: "Wet and Wavy Double Weft Burmese Curly Hair Extensions",
    images: ["/water-wave.jpg", "/water-wave-2.jpg", "/water-wave-3.jpg", "/water-wave-4.jpg"],
    status: "available",
    specifications: {
      hairLength: "20, 22, 24, 26 inches",
      laceSize: "Not Applicable",
      density: "200%",
      hairType: "100% Human Hair",
    },
  },
  {
    id: "wig-8",
    name: "Deep Wave Boho Hair",
    category: "wigs",
    price: 3000.0,
    image: "/22-boho.jpg",
    description: "Beautiful deep wave boho style hair with natural texture",
    images: ["/22-boho.jpg", "/22-boho-1.jpg", "/22-boho-2.jpg", "/22-boho-3.jpg"],
    status: "available",
    specifications: {
      hairLength: "22 inches",
      laceSize: "Not Applicable",
      density: "200%",
      hairType: "100% Human Hair",
    },
  },
  {
    id: "wig-9",
    name: "12A Body Wave Bundles",
    category: "wigs",
    price: 3000.0,
    image: "/18-body-wave-bundles.jpg",
    description: "Beautiful Body Wave Bundles with Natural Shine and Soft Texture",
    images: [
      "/18-body-wave-bundles.jpg",
      "/18-body-wave-bundles-1.jpg",
      "/18-body-wave-bundles-2.jpg",
      "/18-body-wave-bundles-3.jpg",
    ],
    status: "available",
    specifications: {
      hairLength: "18, 20, 22 inches",
      laceSize: "Not Applicable",
      density: "200%",
      hairType: "100% Human Hair",
    },
  },
  {
    id: "swim-1",
    name: "Ring Linked Bikini",
    category: "swimsuits",
    price: 5500.0,
    image: "/yellow-back.jpg",
    description: "Vibrant Yellow bikini with adjustable rings for a perfect fit",
    images: ["/yellow-back.jpg", "/yellow-back-1.jpg", "/yellow-back-2.jpg", "/yellow-back-3.jpg"],
    status: "available",
    specifications: {
      sizes: ["XS", "S", "M", "L", "XL"],
      material: "82% Nylon, 18% Spandex",
      coverage: "Moderate Coverage",
      style: "Triangle Top with Adjustable Straps",
    },
  },
  {
    id: "swim-2",
    name: "Rose One-Piece",
    category: "swimsuits",
    price: 59.99,
    image: "/rose-pink-one-piece-swimsuit-on-model.jpg",
    description: "Elegant one-piece in beautiful rose pink",
    images: [
      "/rose-pink-one-piece-swimsuit-on-model.jpg",
      "/placeholder.svg?height=600&width=450",
      "/placeholder.svg?height=600&width=450",
      "/placeholder.svg?height=600&width=450",
    ],
    status: "available",
    specifications: {
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      material: "85% Polyester, 15% Elastane",
      coverage: "Full Coverage",
      style: "Scoop Neck with Open Back",
    },
  },
  {
    id: "swim-3",
    name: "Blush High-Waist Set",
    category: "swimsuits",
    price: 54.99,
    image: "/blush-pink-high-waist-bikini-on-model.jpg",
    description: "Retro-inspired high-waist bikini in blush pink",
    images: [
      "/blush-pink-high-waist-bikini-on-model.jpg",
      "/placeholder.svg?height=600&width=450",
      "/placeholder.svg?height=600&width=450",
      "/placeholder.svg?height=600&width=450",
    ],
    status: "available",
    specifications: {
      sizes: ["XS", "S", "M", "L", "XL"],
      material: "80% Nylon, 20% Spandex",
      coverage: "High Coverage",
      style: "High-Waisted Bottoms with Underwire Top",
    },
  },
  {
    id: "swim-4",
    name: "Coral Halter Bikini",
    category: "swimsuits",
    price: 44.99,
    image: "/coral-halter-bikini-swimsuit-on-model.jpg",
    description: "Flattering halter-style bikini in coral pink",
    images: [
      "/coral-halter-bikini-swimsuit-on-model.jpg",
      "/placeholder.svg?height=600&width=450",
      "/placeholder.svg?height=600&width=450",
      "/placeholder.svg?height=600&width=450",
    ],
    status: "available",
    specifications: {
      sizes: ["XS", "S", "M", "L", "XL"],
      material: "78% Polyamide, 22% Elastane",
      coverage: "Moderate Coverage",
      style: "Halter Neck with Tie Back",
    },
  },
  {
    id: "swim-5",
    name: "Mauve Cutout One-Piece",
    category: "swimsuits",
    price: 64.99,
    image: "/mauve-cutout-one-piece-swimsuit-on-model.jpg",
    description: "Trendy cutout design in sophisticated mauve",
    images: [
      "/mauve-cutout-one-piece-swimsuit-on-model.jpg",
      "/placeholder.svg?height=600&width=450",
      "/placeholder.svg?height=600&width=450",
      "/placeholder.svg?height=600&width=450",
    ],
    status: "available",
    specifications: {
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      material: "82% Polyester, 18% Spandex",
      coverage: "Moderate Coverage",
      style: "Side Cutouts with Adjustable Straps",
    },
  },
  {
    id: "swim-6",
    name: "Peach Ruffle Bikini",
    category: "swimsuits",
    price: 52.99,
    image: "/peach-ruffle-bikini-swimsuit-on-model.jpg",
    description: "Sweet ruffle details in soft peach tone",
    images: [
      "/peach-ruffle-bikini-swimsuit-on-model.jpg",
      "/placeholder.svg?height=600&width=450",
      "/placeholder.svg?height=600&width=450",
      "/placeholder.svg?height=600&width=450",
    ],
    status: "available",
    specifications: {
      sizes: ["XS", "S", "M", "L", "XL"],
      material: "80% Nylon, 20% Spandex",
      coverage: "Moderate Coverage",
      style: "Ruffle Trim with Brazilian Bottom",
    },
  },
]

async function seed() {
  console.log(`Seeding ${products.length} products to Firestore project: ${projectId}...`)
  
  for (const product of products) {
    try {
      await setDocument("products", product.id, {
        ...product,
        createdAt: new Date().toISOString(),
      })
      console.log(`  Seeded: ${product.id} - ${product.name}`)
    } catch (err) {
      console.error(`  Failed: ${product.id} - ${err.message}`)
    }
  }
  
  console.log("Done! All products seeded.")
}

seed().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
