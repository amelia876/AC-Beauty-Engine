import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  updateDoc,
  setDoc,
} from "firebase/firestore"
import type { ProductStatus } from "./products"
import { db } from "./firebase"
import type { Product } from "./products"
import { products as localProducts, getProductsByCategory as getLocalByCategory, getProductById as getLocalById } from "./products"

const COLLECTION = "products"

export async function getAllProducts(): Promise<Product[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTION))
    if (snap.empty) return localProducts
    return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Product)
  } catch {
    return localProducts
  }
}

export async function getProductsByCategory(
  category: "wigs" | "swimsuits"
): Promise<Product[]> {
  try {
    const q = query(
      collection(db, COLLECTION),
      where("category", "==", category)
    )
    const snap = await getDocs(q)
    if (snap.empty) return getLocalByCategory(category)
    return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Product)
  } catch {
    return getLocalByCategory(category)
  }
}

export async function getProductById(
  id: string
): Promise<Product | undefined> {
  try {
    const snap = await getDoc(doc(db, COLLECTION, id))
    if (!snap.exists()) return getLocalById(id)
    return { ...snap.data(), id: snap.id } as Product
  } catch {
    return getLocalById(id)
  }
}

export async function markProductSoldOut(productId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION, productId)
    await updateDoc(docRef, { status: "sold_out" as ProductStatus })
  } catch (err) {
    console.error("Failed to mark product as sold out:", productId, err)
  }
}

export async function updateProductStatus(productId: string, status: ProductStatus): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION, productId)
    await updateDoc(docRef, { status })
  } catch (err) {
    console.error("Failed to update product status:", productId, err)
  }
}

export async function updateProduct(productId: string, data: Partial<Product>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION, productId)
    // Remove undefined values
    const cleanData: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) cleanData[key] = val
    }
    await updateDoc(docRef, cleanData)
  } catch (err) {
    console.error("Failed to update product:", productId, err)
    throw err
  }
}

export async function addProduct(product: Omit<Product, "id"> & { id?: string }): Promise<string> {
  const id = product.id || `product-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const docRef = doc(db, COLLECTION, id)
  await setDoc(docRef, { ...product, id })
  return id
}

export async function searchProducts(term: string): Promise<Product[]> {
  const all = await getAllProducts()
  const lower = term.toLowerCase()
  return all.filter(
    (p) =>
      p.name.toLowerCase().includes(lower) ||
      p.description.toLowerCase().includes(lower) ||
      p.category.toLowerCase().includes(lower)
  )
}
