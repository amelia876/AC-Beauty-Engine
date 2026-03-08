"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, orderBy, doc, updateDoc, addDoc, deleteDoc, Timestamp } from "firebase/firestore"
import { getAllProducts, updateProduct, addProduct } from "@/lib/firebase-products"
import type { Product, ProductStatus } from "@/lib/products"
import { Loader2, Package, ShoppingCart, Users, ChevronDown, Eye, X, Plus, Upload, RefreshCw, Send, ImageIcon, Trash2, MessageCircle, Star, Archive, ArchiveRestore, DollarSign, BarChart3, Instagram } from "lucide-react"

/* ─── Types ─── */
interface OrderItem { name: string; quantity: number; price: number }
interface Order {
  id?: string
  receiptNumber: string
  userId?: string
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  deliveryMethod: string
  paymentMethod: string
  hasReceiptUpload?: boolean
  receiptImage?: string
  deliveryDetails?: Record<string, string>
  status: string
  createdAt: string
  fulfillment?: FulfillmentDetails
  adminNote?: string
}
interface FulfillmentDetails {
  trackingNumber?: string
  receiptUrl?: string
  notes?: string
  estimatedDelivery?: string
  driverName?: string
  driverPhone?: string
  meetupLocation?: string
  meetupDate?: string
  meetupTime?: string
}
interface FirebaseUser {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  lastSignIn?: { seconds: number }
}
interface AdminReview {
  id: string
  authorName: string
  authorEmail: string
  rating: number
  product: string
  text: string
  date: string
  archived: boolean
  replies: AdminReply[]
}
interface AdminReply {
  id: string
  reviewId: string
  authorName: string
  isAdmin: boolean
  text: string
  createdAt: string
}
// Wig Collaboration Tracker
interface WigCollab {
  id?: string
  vendorUsername: string
  vendorLink: string
  itemLink: string
  policy: string
  firstRefundAmount: number
  firstRefundReceived: boolean
  secondRefundAmount: number
  secondRefundReceived: boolean
  hairDetails: {
    type: 'wig' | 'bundle' | 'both'
    length?: string
    density?: string
    notes?: string
  }
  status: 'active' | 'completed'
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

const statusColors: Record<string, string> = {
  available: "bg-green-100 text-green-800",
  sold_out: "bg-red-100 text-red-800",
  coming_soon: "bg-yellow-100 text-yellow-800",
}
const orderStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
}
const deliveryMethodNames: Record<string, string> = {
  knutsford: "Knutsford Express",
  zipmail: "Zip Mail",
  inperson: "In Person (Mandeville)",
  taximan: "Taxi Man",
}

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()

  // Existing state
  const [activeTab, setActiveTab] = useState<"inventory" | "orders" | "users" | "reviews" | "wigtracker">("inventory")
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [users, setUsers] = useState<FirebaseUser[]>([])
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [reviewFilter, setReviewFilter] = useState<"active" | "archived">("active")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [replyingSending, setReplyingSending] = useState(false)
  const [receiptModalImage, setReceiptModalImage] = useState<string | null>(null)

  // Inventory
  const [categoryFilter, setCategoryFilter] = useState<"all" | "wigs" | "swimsuits">("all")
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)

  // Bulk discount state
  const [bulkUpdating, setBulkUpdating] = useState(false)

  // Orders
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [fulfillmentInputs, setFulfillmentInputs] = useState<Record<string, FulfillmentDetails>>({})
  const [sendingEmail, setSendingEmail] = useState<string | null>(null)
  const [uploadingFulfillmentReceipt, setUploadingFulfillmentReceipt] = useState<string | null>(null)

  // Seeding
  const [seeding, setSeeding] = useState(false)
  const [seedMessage, setSeedMessage] = useState<string | null>(null)
  useEffect(() => { setSeedMessage(null) }, [activeTab])
  const [firestoreStatus, setFirestoreStatus] = useState<"checking" | "ok" | "blocked" | null>(null)

  // Add product form
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "wigs" as "wigs" | "swimsuits",
    price: 0,
    salePrice: undefined as number | undefined,
    description: "",
    image: "",
    images: [] as string[],
    status: "available" as ProductStatus,
    specifications: {} as Record<string, string | string[]>,
    quantity: undefined as number | undefined,
    sizeQuantities: {} as Record<string, number>,
  })
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // Wig Collaboration state
  const [wigCollabs, setWigCollabs] = useState<WigCollab[]>([])
  const [showAddWigCollab, setShowAddWigCollab] = useState(false)
  const [editingWigCollab, setEditingWigCollab] = useState<WigCollab | null>(null)
  const [wigCollabForm, setWigCollabForm] = useState<Partial<WigCollab>>({
    vendorUsername: '',
    vendorLink: '',
    itemLink: '',
    policy: '',
    firstRefundAmount: 0,
    firstRefundReceived: false,
    secondRefundAmount: 0,
    secondRefundReceived: false,
    hairDetails: { type: 'wig', length: '', density: '', notes: '' },
    status: 'active',
  })

  useEffect(() => {
    if (!authLoading && !isAdmin) router.push("/")
  }, [authLoading, isAdmin, router])

  useEffect(() => {
    if (isAdmin) { checkFirestoreAccess(); loadData() }
  }, [isAdmin])

  async function checkFirestoreAccess() {
    setFirestoreStatus("checking")
    try {
      await getDocs(collection(db, "products"))
      await getDocs(collection(db, "orders"))
      setFirestoreStatus("ok")
    } catch {
      setFirestoreStatus("blocked")
    }
  }

  async function loadData() {
    setLoading(true)
    try {
      const prodSnap = await getDocs(collection(db, "products"))
      let prods: Product[]
      if (prodSnap.empty) {
        setSeedMessage("No products found. Click Sync Inventory to populate.")
        prods = await getAllProducts()
      } else {
        prods = prodSnap.docs.map((d) => ({ ...d.data(), id: d.id }) as Product)
      }

      let ordersList: Order[] = []
      try {
        const orderSnap = await getDocs(query(collection(db, "orders"), orderBy("createdAt", "asc")))
        ordersList = orderSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Order))
      } catch { /* rules may block */ }

      let usersList: FirebaseUser[] = []
      try {
        const usersSnap = await getDocs(collection(db, "users"))
        usersList = usersSnap.docs.map((d) => d.data() as FirebaseUser)
      } catch { /* rules may block */ }

      // Load reviews + replies
      let reviewsList: AdminReview[] = []
      try {
        const revSnap = await getDocs(query(collection(db, "reviews"), orderBy("createdAt", "desc")))
        const repSnap = await getDocs(query(collection(db, "reviewReplies"), orderBy("createdAt", "asc")))
        const allReplies: AdminReply[] = repSnap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            reviewId: data.reviewId,
            authorName: data.authorName || "",
            isAdmin: data.isAdmin || false,
            text: data.text || "",
            createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toLocaleDateString() : "",
          }
        })
        reviewsList = revSnap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            authorName: data.authorName || data.name || "Anonymous",
            authorEmail: data.authorEmail || "",
            rating: data.rating || 5,
            product: data.product || "",
            text: data.text || "",
            date: data.date || "",
            archived: data.archived || false,
            replies: allReplies.filter((r) => r.reviewId === d.id),
          }
        })
      } catch { /* rules may block */ }

      // Load wig collabs
      let wigList: WigCollab[] = []
      try {
        const wigSnap = await getDocs(query(collection(db, "wigCollabs"), orderBy("createdAt", "desc")))
        wigList = wigSnap.docs.map((d) => ({ ...d.data(), id: d.id } as WigCollab))
      } catch (err) {
        console.warn("Could not load wig collabs:", err)
      }

      setProducts(prods)
      setOrders(ordersList)
      setUsers(usersList)
      setReviews(reviewsList)
      setWigCollabs(wigList)
    } catch {
      const prods = await getAllProducts()
      setProducts(prods)
    } finally { setLoading(false) }
  }

  async function seedProducts() {
    setSeeding(true); setSeedMessage(null)
    try {
      const res = await fetch("/api/admin/seed-products", { method: "POST" })
      const data = await res.json()
      setSeedMessage(data.success ? data.message : data.error || "Failed")
      if (data.success) await loadData()
    } catch { setSeedMessage("Seed error.") }
    finally { setSeeding(false) }
  }

  /* ─── Upload photo via Blob ─── */
  async function uploadPhoto(file: File, folder: string): Promise<string> {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", folder)
    const res = await fetch("/api/upload", { method: "POST", body: formData })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Upload failed")
    return data.url
  }

  /* ─── Save edited product ─── */
  async function saveEditProduct() {
    if (!editingProduct) return
    setSaving(true)
    try {
      const updateData: any = {
        name: editingProduct.name,
        description: editingProduct.description,
        price: editingProduct.price,
        salePrice: editingProduct.salePrice,
        status: editingProduct.status,
        image: editingProduct.image,
        images: editingProduct.images,
        category: editingProduct.category,
        specifications: editingProduct.specifications,
      }
      if (editingProduct.category === "wigs") {
        updateData.quantity = editingProduct.quantity
        updateData.sizeQuantities = undefined
      } else {
        updateData.sizeQuantities = editingProduct.sizeQuantities
        updateData.quantity = undefined
      }

      await updateProduct(editingProduct.id, updateData)
      setEditingProduct(null)
      await loadData()
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string }
      alert(e.code === "permission-denied"
        ? "PERMISSION DENIED: Update your Firestore rules to allow writes."
        : `Save failed: ${e.message || "Unknown error"}`)
    } finally { setSaving(false) }
  }

  /* ─── Add new product ─── */
  async function saveNewProduct() {
    if (!newProduct.name || !newProduct.image) { 
      alert("Name and at least one photo are required."); 
      return; 
    }
    setSaving(true);
    try {
      const productData: any = {
        name: newProduct.name,
        category: newProduct.category,
        price: newProduct.price,
        description: newProduct.description,
        image: newProduct.image,
        images: newProduct.images.length > 0 ? newProduct.images : [newProduct.image],
        status: newProduct.status,
        specifications: newProduct.specifications,
      };
      
      if (newProduct.salePrice !== undefined && !isNaN(newProduct.salePrice)) {
        productData.salePrice = newProduct.salePrice;
      }
      
      if (newProduct.category === "wigs") {
        if (newProduct.quantity !== undefined) {
          productData.quantity = newProduct.quantity;
        }
      } else {
        if (Object.keys(newProduct.sizeQuantities || {}).length > 0) {
          productData.sizeQuantities = newProduct.sizeQuantities;
        }
      }

      await addProduct(productData);
      setShowAddProduct(false);
      setNewProduct({
        name: "", category: "wigs", price: 0, salePrice: undefined,
        description: "", image: "", images: [], status: "available",
        specifications: {}, quantity: undefined, sizeQuantities: {},
      });
      await loadData();
    } catch (err: unknown) {
      const e = err as { message?: string }
      alert(`Failed to add product: ${e.message || "Unknown error"}`)
    } finally { setSaving(false) }
  }

  /* ─── Delete product ─── */
  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to permanently delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', productId));
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (err) {
      alert('Failed to delete product. Check Firestore rules.');
      console.error(err);
    }
  };

  /* ─── Delete order ─── */
  const deleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to permanently delete this order?')) return;
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      setOrders(prev => prev.filter(o => o.id !== orderId));
      if (expandedOrder === orderId) setExpandedOrder(null);
    } catch (err) {
      console.error('Delete error:', err);
      alert(`Delete failed: ${err.message || 'Check console for details'}`);
    }
  };

  /* ─── Handle product photo upload ─── */
  async function handleProductPhotoUpload(e: React.ChangeEvent<HTMLInputElement>, mode: "add" | "edit", isMain?: boolean) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    try {
      const url = await uploadPhoto(file, "products")
      if (mode === "add") {
        if (isMain || newProduct.images.length === 0) {
          setNewProduct((p) => ({ ...p, image: url, images: [url, ...p.images.filter((i) => i !== p.image)] }))
        } else {
          setNewProduct((p) => ({ ...p, images: [...p.images, url] }))
        }
      } else if (editingProduct) {
        if (isMain) {
          setEditingProduct({ ...editingProduct, image: url, images: [url, ...editingProduct.images.filter((i) => i !== editingProduct.image)] })
        } else {
          setEditingProduct({ ...editingProduct, images: [...editingProduct.images, url] })
        }
      }
    } catch (err: unknown) {
      alert(`Upload failed: ${(err as { message?: string }).message || "Unknown error"}`)
    } finally { setUploadingPhoto(false); e.target.value = "" }
  }

  function removePhoto(index: number, mode: "add" | "edit") {
    if (mode === "add") {
      const updated = newProduct.images.filter((_, i) => i !== index)
      setNewProduct((p) => ({ ...p, images: updated, image: updated[0] || "" }))
    } else if (editingProduct) {
      const updated = editingProduct.images.filter((_, i) => i !== index)
      setEditingProduct({ ...editingProduct, images: updated, image: updated[0] || editingProduct.image })
    }
  }

  /* ─── Manual Sale Recording ─── */
  async function recordManualSale(product: Product) {
    if (!confirm(`Record a sale for "${product.name}"? This will create an order with quantity 1.`)) return;

    const receiptNumber = `MANUAL-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const price = product.salePrice ?? product.price ?? 0;
    const item = {
      name: product.name,
      quantity: 1,
      price: price,
    };

    const newOrder = {
      receiptNumber,
      userId: user?.uid,
      items: [item],
      subtotal: price,
      deliveryFee: 0,
      total: price,
      deliveryMethod: 'inperson',
      paymentMethod: 'cash',
      status: 'delivered',
      createdAt: new Date().toISOString(),
      customerName: 'Admin Manual Sale',
      customerEmail: '',
      adminNote: 'Manually recorded by admin via "Sold Out" action',
    };

    try {
      await addDoc(collection(db, 'orders'), newOrder);
      await loadData();
      alert('Sale recorded and order created.');
    } catch (err) {
      alert('Failed to record sale. Check Firestore rules.');
      console.error(err);
    }
  }

  /* ─── Update order status ─── */
  async function updateOrderStatus(orderId: string, newStatus: string) {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus })
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o))
    } catch (err) {
      console.error(err);
      alert("Failed to update order status.");
    }
  }

  /* ─── Upload fulfillment receipt ─── */
  async function handleFulfillmentReceiptUpload(e: React.ChangeEvent<HTMLInputElement>, receiptNumber: string) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingFulfillmentReceipt(receiptNumber)
    try {
      const url = await uploadPhoto(file, "fulfillment-receipts")
      setFulfillmentInputs((prev) => ({ ...prev, [receiptNumber]: { ...prev[receiptNumber], receiptUrl: url } }))
    } catch { alert("Failed to upload receipt.") }
    finally { setUploadingFulfillmentReceipt(null); e.target.value = "" }
  }

  /* ─── Save fulfillment + send email ─── */
  async function saveFulfillmentAndSendEmail(order: Order) {
    if (!order.id) return;
    const fulfillment = fulfillmentInputs[order.receiptNumber] || {}
    setSendingEmail(order.receiptNumber)
    try {
      await updateDoc(doc(db, "orders", order.id), { fulfillment })

      const res = await fetch("/api/admin/order-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptNumber: order.receiptNumber,
          customerEmail: order.customerEmail,
          customerName: order.customerName,
          status: order.status,
          items: order.items,
          total: order.total,
          deliveryMethod: order.deliveryMethod,
          fulfillment,
        }),
      })
      const data = await res.json()
      if (data.success) {
        alert("Fulfillment saved and status email sent to customer!")
        setOrders((prev) => prev.map((o) => o.receiptNumber === order.receiptNumber ? { ...o, fulfillment } : o))
      } else {
        alert(`Email failed: ${data.error || "Unknown error"}`)
      }
    } catch {
      alert("Failed to save fulfillment or send email.")
    } finally { setSendingEmail(null) }
  }

  /* ─── Helper to update fulfillment field ─── */
  function setFulfillmentField(receiptNumber: string, field: keyof FulfillmentDetails, value: string) {
    setFulfillmentInputs((prev) => ({
      ...prev,
      [receiptNumber]: { ...prev[receiptNumber], [field]: value },
    }))
  }

  /* ─── Review admin actions ─── */
  async function toggleArchiveReview(reviewId: string, archived: boolean) {
    try {
      await updateDoc(doc(db, "reviews", reviewId), { archived })
      setReviews((prev) => prev.map((r) => r.id === reviewId ? { ...r, archived } : r))
    } catch { alert("Failed to update review.") }
  }

  async function deleteReview(reviewId: string) {
    if (!confirm("Permanently delete this review and all its replies?")) return
    try {
      const reps = reviews.find((r) => r.id === reviewId)?.replies || []
      for (const rep of reps) { await deleteDoc(doc(db, "reviewReplies", rep.id)) }
      await deleteDoc(doc(db, "reviews", reviewId))
      setReviews((prev) => prev.filter((r) => r.id !== reviewId))
    } catch { alert("Failed to delete review.") }
  }

  async function postAdminReply(reviewId: string) {
    if (!replyText.trim()) return
    setReplyingSending(true)
    try {
      await addDoc(collection(db, "reviewReplies"), {
        reviewId, authorName: user?.displayName || "Admin",
        authorEmail: user?.email || "", authorPhoto: user?.photoURL || "",
        isAdmin: true, text: replyText.trim(), createdAt: Timestamp.now(),
      })
      setReplyText("")
      setReplyingTo(null)
      await loadData()
    } catch { alert("Failed to post reply.") }
    finally { setReplyingSending(false) }
  }

  async function deleteReply(replyId: string) {
    if (!confirm("Delete this reply?")) return
    try {
      await deleteDoc(doc(db, "reviewReplies", replyId))
      await loadData()
    } catch { alert("Failed to delete reply.") }
  }

  // Wig Collaboration functions
  async function saveWigCollab() {
    if (!wigCollabForm.vendorUsername || !wigCollabForm.vendorLink || !wigCollabForm.itemLink) {
      alert("Vendor username, vendor link, and item link are required.");
      return;
    }
    setSaving(true);
    try {
      const data = {
        ...wigCollabForm,
        firstRefundAmount: wigCollabForm.firstRefundAmount || 0,
        firstRefundReceived: wigCollabForm.firstRefundReceived || false,
        secondRefundAmount: wigCollabForm.secondRefundAmount || 0,
        secondRefundReceived: wigCollabForm.secondRefundReceived || false,
        hairDetails: wigCollabForm.hairDetails || { type: 'wig' },
        status: wigCollabForm.status || 'active',
        updatedAt: Timestamp.now(),
      };

      if (editingWigCollab?.id) {
        await updateDoc(doc(db, "wigCollabs", editingWigCollab.id), data);
      } else {
        await addDoc(collection(db, "wigCollabs"), {
          ...data,
          createdAt: Timestamp.now(),
        });
      }
      setShowAddWigCollab(false);
      setEditingWigCollab(null);
      setWigCollabForm({
        vendorUsername: '', vendorLink: '', itemLink: '', policy: '',
        firstRefundAmount: 0, firstRefundReceived: false,
        secondRefundAmount: 0, secondRefundReceived: false,
        hairDetails: { type: 'wig', length: '', density: '', notes: '' },
        status: 'active',
      });
      await loadData();
    } catch (err) {
      alert("Failed to save collaboration.");
      console.error(err);
    } finally { setSaving(false); }
  }

  async function deleteWigCollab(id: string) {
    if (!confirm("Delete this collaboration?")) return;
    try {
      await deleteDoc(doc(db, "wigCollabs", id));
      setWigCollabs(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert("Failed to delete.");
      console.error(err);
    }
  }

  function editWigCollab(collab: WigCollab) {
    setEditingWigCollab(collab);
    setWigCollabForm(collab);
    setShowAddWigCollab(true);
  }

  // Computed stats for wig tracker
  const wigStats = {
    total: wigCollabs.length,
    active: wigCollabs.filter(c => c.status === 'active').length,
    outstanding: wigCollabs.reduce((sum, c) => {
      if (c.status === 'active' && !c.secondRefundReceived) {
        return sum + (c.secondRefundAmount || 0);
      }
      return sum;
    }, 0),
    received: wigCollabs.reduce((sum, c) => {
      let total = 0;
      if (c.firstRefundReceived) total += (c.firstRefundAmount || 0);
      if (c.secondRefundReceived) total += (c.secondRefundAmount || 0);
      return sum + total;
    }, 0),
  };

  const filteredProducts = categoryFilter === "all" ? products : products.filter((p) => p.category === categoryFilter)
  const filteredReviews = reviews.filter((r) => reviewFilter === "active" ? !r.archived : r.archived)

  // Summary statistics for main dashboard
  const totalOrders = orders.length
  const revenueOrders = orders.filter(o => ['confirmed', 'shipped', 'delivered'].includes(o.status));
  const totalRevenue = revenueOrders.reduce((sum, order) => sum + (order.subtotal || 0), 0)
  const inventoryValue = products.reduce((sum, product) => {
    const price = product.salePrice ?? product.price ?? 0
    if (product.category === "wigs") {
      if (product.quantity != null && product.quantity > 0) {
        return sum + price * product.quantity
      }
      return sum
    } else {
      if (product.sizeQuantities) {
        const totalQty = Object.values(product.sizeQuantities).reduce((a, b) => a + (b || 0), 0)
        return sum + price * totalQty
      }
      return sum
    }
  }, 0)
  const totalProducts = products.length
  const totalUsers = users.length

  /* ===== BULK DISCOUNT FUNCTIONS ===== */
  async function applyDiscountToWigs() {
    const amountStr = window.prompt("Enter discount amount to subtract from original price (e.g., 500):");
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid positive number.");
      return;
    }
    if (!confirm(`Apply $${amount} discount to all wigs? This will set sale prices for all wigs.`)) return;
    setBulkUpdating(true);
    try {
      const wigs = products.filter(p => p.category === "wigs");
      for (const product of wigs) {
        const newSalePrice = Math.max(0, (product.price || 0) - amount);
        await updateProduct(product.id, { salePrice: newSalePrice });
      }
      await loadData();
      alert(`Discount applied to ${wigs.length} wigs.`);
    } catch (err) {
      alert("Failed to apply discount.");
      console.error(err);
    } finally {
      setBulkUpdating(false);
    }
  }

  async function applyDiscountToSwimsuits() {
    const amountStr = window.prompt("Enter discount amount to subtract from original price (e.g., 500):");
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid positive number.");
      return;
    }
    if (!confirm(`Apply $${amount} discount to all swimsuits? This will set sale prices for all swimsuits.`)) return;
    setBulkUpdating(true);
    try {
      const swimsuits = products.filter(p => p.category === "swimsuits");
      for (const product of swimsuits) {
        const newSalePrice = Math.max(0, (product.price || 0) - amount);
        await updateProduct(product.id, { salePrice: newSalePrice });
      }
      await loadData();
      alert(`Discount applied to ${swimsuits.length} swimsuits.`);
    } catch (err) {
      alert("Failed to apply discount.");
      console.error(err);
    } finally {
      setBulkUpdating(false);
    }
  }

  async function applyDiscountToAll() {
    const amountStr = window.prompt("Enter discount amount to subtract from original price (e.g., 500):");
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid positive number.");
      return;
    }
    if (!confirm(`Apply $${amount} discount to all products?`)) return;
    setBulkUpdating(true);
    try {
      for (const product of products) {
        const newSalePrice = Math.max(0, (product.price || 0) - amount);
        await updateProduct(product.id, { salePrice: newSalePrice });
      }
      await loadData();
      alert(`Discount applied to ${products.length} products.`);
    } catch (err) {
      alert("Failed to apply discount.");
      console.error(err);
    } finally {
      setBulkUpdating(false);
    }
  }

  async function removeAllSalePrices() {
    if (!confirm("Remove sale prices from all products?")) return;
    setBulkUpdating(true);
    try {
      for (const product of products) {
        // Use null to explicitly remove the salePrice field
        await updateProduct(product.id, { salePrice: null });
      }
      await loadData();
      alert("All sale prices removed.");
    } catch (err) {
      alert("Failed to remove sale prices.");
      console.error(err);
    } finally {
      setBulkUpdating(false);
    }
  }
  /* ===== END BULK DISCOUNT ===== */

  if (authLoading || (!isAdmin && !authLoading)) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground break-words">Signed in as {user?.email}</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button onClick={() => loadData()} disabled={loading}
              className="flex items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <button onClick={seedProducts} disabled={seeding}
              className="flex items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2 text-xs font-medium text-background hover:bg-foreground/90 disabled:opacity-50">
              {seeding && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {seeding ? "Syncing..." : "Sync Inventory"}
            </button>
          </div>
        </div>

        {/* Diagnostics */}
        {firestoreStatus === "blocked" && (
          <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-4">
            <h3 className="text-sm font-bold text-red-800">Firestore Rules Blocking Access</h3>
            <p className="mt-1 text-sm text-red-700">Update your Firestore rules to allow reads/writes on products, orders, and users.</p>
            <button onClick={checkFirestoreAccess} className="mt-3 rounded-md bg-red-800 px-4 py-2 text-xs font-medium text-white hover:bg-red-700">Re-check</button>
          </div>
        )}
        {firestoreStatus === "ok" && !seedMessage && (
          <div className="mb-6 rounded-md border border-green-200 bg-green-50 px-4 py-3">
            <p className="text-sm text-green-800">Firestore access confirmed.</p>
          </div>
        )}
        {seedMessage && (
          <div className="mb-6 rounded-md border border-border bg-muted/50 px-4 py-3">
            <p className="text-sm text-foreground break-words">{seedMessage}</p>
          </div>
        )}

        {/* Summary Cards */}
        {activeTab !== 'wigtracker' && (
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold text-foreground">{totalOrders}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-100 p-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-foreground">${totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-100 p-2">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Inventory Value</p>
                  <p className="text-2xl font-bold text-foreground">${inventoryValue.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-purple-100 p-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold text-foreground">{totalProducts}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-amber-100 p-2">
                  <Users className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold text-foreground">{totalUsers}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-1 rounded-lg border border-border bg-background p-1">
          {([
            { id: "inventory" as const, label: "Inventory", icon: Package, count: products.length },
            { id: "orders" as const, label: "Orders", icon: ShoppingCart, count: orders.length },
            { id: "reviews" as const, label: "Reviews", icon: MessageCircle, count: reviews.filter((r) => !r.archived).length },
            { id: "users" as const, label: "Users", icon: Users, count: users.length },
            { id: "wigtracker" as const, label: "Wig Tracker", icon: Instagram, count: wigCollabs.length },
          ]).map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors min-w-[80px] ${
                activeTab === tab.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}>
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs ${
                activeTab === tab.id ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"
              }`}>{tab.count}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            {/* INVENTORY TAB */}
            {activeTab === "inventory" && (
              <div className="space-y-4">
                {/* Category filters and bulk actions */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-2">
                    {(["all", "wigs", "swimsuits"] as const).map((cat) => (
                      <button key={cat} onClick={() => setCategoryFilter(cat)}
                        className={`rounded-md px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${
                          categoryFilter === cat ? "bg-foreground text-background" : "border border-border bg-background text-muted-foreground hover:text-foreground"
                        }`}>
                        {cat === "all" ? "All" : cat} ({cat === "all" ? products.length : products.filter((p) => p.category === cat).length})
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={applyDiscountToWigs}
                      disabled={bulkUpdating}
                      className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
                    >
                      {bulkUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <DollarSign className="h-3 w-3" />}
                      Discount All Wigs
                    </button>
                    <button
                      onClick={applyDiscountToSwimsuits}
                      disabled={bulkUpdating}
                      className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
                    >
                      {bulkUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <DollarSign className="h-3 w-3" />}
                      Discount All Swimsuits
                    </button>
                    <button
                      onClick={applyDiscountToAll}
                      disabled={bulkUpdating}
                      className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
                    >
                      {bulkUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <DollarSign className="h-3 w-3" />}
                      Discount All Products
                    </button>
                    <button
                      onClick={removeAllSalePrices}
                      disabled={bulkUpdating}
                      className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {bulkUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                      Remove All Sales
                    </button>
                    <button onClick={() => setShowAddProduct(true)}
                      className="flex items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2 text-xs font-medium text-background hover:bg-foreground/90">
                      <Plus className="h-4 w-4" /> Add New Product
                    </button>
                  </div>
                </div>

                {filteredProducts.length === 0 && (
                  <div className="rounded-lg border border-border bg-background p-12 text-center">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-semibold text-foreground">No products found</h3>
                  </div>
                )}

                {filteredProducts.map((product) => (
                  <div key={product.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-lg border border-border bg-background p-4">
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                      <Image src={product.image} alt={product.name} fill className="object-cover" sizes="64px" />
                    </div>
                    <div className="min-w-0 flex-1 w-full">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-medium text-foreground">{product.name}</h3>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{product.category}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
                        {product.salePrice ? (
                          <><span className="font-semibold text-red-600">${product.salePrice.toFixed(2)}</span><span className="text-muted-foreground line-through">${product.price.toFixed(2)}</span></>
                        ) : (
                          <span className="font-semibold text-foreground">${product.price.toFixed(2)}</span>
                        )}
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${statusColors[product.status || "available"]}`}>
                          {(product.status || "available").replace("_", " ")}
                        </span>
                        <span className={`text-xs ${
                          product.category === "wigs"
                            ? product.quantity !== undefined && product.quantity !== null
                              ? product.quantity <= 0
                                ? "font-semibold text-red-600"
                                : product.quantity <= 3
                                ? "font-semibold text-amber-600"
                                : "text-muted-foreground"
                              : "text-muted-foreground"
                            : product.sizeQuantities
                            ? Object.values(product.sizeQuantities).every(q => q === 0)
                              ? "font-semibold text-red-600"
                              : Object.values(product.sizeQuantities).some(q => q <= 3)
                              ? "font-semibold text-amber-600"
                              : "text-muted-foreground"
                            : "text-muted-foreground"
                        }`}>
                          {product.category === "wigs"
                            ? product.quantity !== undefined && product.quantity !== null
                              ? `${product.quantity} in stock`
                              : "Unlimited"
                            : product.sizeQuantities
                            ? Object.entries(product.sizeQuantities)
                                .filter(([_, qty]) => qty > 0)
                                .map(([size, qty]) => `${size}:${qty}`)
                                .join(', ') || "Out of stock"
                            : "No stock info"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <select
                        value={product.status || "available"}
                        onChange={async (e) => {
                          const newStatus = e.target.value as ProductStatus;
                          if (newStatus === "sold_out") {
                            await recordManualSale(product);
                          }
                          await updateProduct(product.id, { status: newStatus });
                          await loadData();
                        }}
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
                      >
                        <option value="available">Available</option>
                        <option value="sold_out">Sold Out</option>
                        <option value="coming_soon">Coming Soon</option>
                      </select>
                      <button onClick={() => setEditingProduct({ ...product })}
                        className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted">Edit</button>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                        title="Delete product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ORDERS TAB */}
            {activeTab === "orders" && (
              <div className="space-y-3">
                {orders.length === 0 && (
                  <div className="rounded-lg border border-border bg-background p-12 text-center">
                    <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-semibold text-foreground">No orders yet</h3>
                  </div>
                )}
                {orders.map((order, idx) => (
                  <div key={order.id} className="rounded-lg border border-border bg-background">
                    <button onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id!)}
                      className="flex w-full items-center gap-4 p-4 text-left">
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">{idx + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-foreground">#{order.receiptNumber}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${orderStatusColors[order.status] || orderStatusColors.pending}`}>{order.status}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground break-words">
                          {order.customerName || "Unknown"} &middot; {order.customerEmail || "No email"} &middot; ${order.total?.toFixed(2)} &middot; {new Date(order.createdAt).toLocaleDateString()}
                          {order.adminNote && <span className="ml-2 italic text-blue-600">({order.adminNote})</span>}
                        </p>
                      </div>
                      <ChevronDown className={`h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform ${expandedOrder === order.id ? "rotate-180" : ""}`} />
                    </button>

                    {expandedOrder === order.id && (
                      <div className="border-t border-border px-4 pb-4">
                        <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2">
                          <div>
                            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer</h4>
                            <p className="text-sm text-foreground break-words">{order.customerName || "N/A"}</p>
                            <p className="text-sm text-muted-foreground break-words">{order.customerEmail || "No email"}</p>
                            <p className="text-sm text-muted-foreground break-words">{order.customerPhone || "No phone"}</p>
                          </div>
                          <div>
                            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Delivery</h4>
                            <p className="text-sm font-medium text-foreground">{deliveryMethodNames[order.deliveryMethod] || order.deliveryMethod}</p>
                            <p className="text-sm text-muted-foreground">Payment: {order.paymentMethod}</p>
                            {order.deliveryDetails && Object.entries(order.deliveryDetails).map(([k, v]) => (
                              <p key={k} className="text-xs text-muted-foreground break-words"><span className="capitalize">{k.replace(/([A-Z])/g, " $1")}:</span> {v}</p>
                            ))}
                          </div>
                        </div>

                        <div className="mt-4">
                          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Items</h4>
                          {order.items.map((item, i) => (
                            <div key={i} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                              <span className="text-sm text-foreground break-words pr-2">{item.name} x{item.quantity}</span>
                              <span className="text-sm font-medium text-foreground whitespace-nowrap">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                          <div className="mt-2 flex justify-between border-t-2 border-border pt-2">
                            <span className="text-sm font-semibold text-foreground">Total</span>
                            <span className="text-sm font-bold text-foreground">${order.total?.toFixed(2)}</span>
                          </div>
                        </div>

                        {order.receiptImage && (
                          <div className="mt-4">
                            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer Receipt</h4>
                            <button onClick={() => setReceiptModalImage(order.receiptImage!)}
                              className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                              <Eye className="h-4 w-4" /> View Receipt Image
                            </button>
                          </div>
                        )}

                        <div className="mt-4 flex items-center gap-4">
                          <div>
                            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Update Status</h4>
                            <select value={order.status} onChange={(e) => updateOrderStatus(order.id!, e.target.value)}
                              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                          <button
                            onClick={() => deleteOrder(order.id!)}
                            className="rounded-md border border-border p-2 text-red-600 hover:bg-red-50"
                            title="Delete order permanently"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-4 rounded-md border border-border bg-muted/30 p-4">
                          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Fulfillment Details (sent to customer via email)
                          </h4>
                          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                            {(order.deliveryMethod === "knutsford" || order.deliveryMethod === "zipmail") && (
                              <>
                                <div>
                                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Tracking Number</label>
                                  <input type="text"
                                    value={fulfillmentInputs[order.receiptNumber]?.trackingNumber ?? order.fulfillment?.trackingNumber ?? ""}
                                    onChange={(e) => setFulfillmentField(order.receiptNumber, "trackingNumber", e.target.value)}
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="Enter tracking number" />
                                </div>
                                <div>
                                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Estimated Delivery</label>
                                  <input type="text"
                                    value={fulfillmentInputs[order.receiptNumber]?.estimatedDelivery ?? order.fulfillment?.estimatedDelivery ?? ""}
                                    onChange={(e) => setFulfillmentField(order.receiptNumber, "estimatedDelivery", e.target.value)}
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="e.g. 2-3 business days" />
                                </div>
                              </>
                            )}

                            {order.deliveryMethod === "taximan" && (
                              <>
                                <div>
                                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Driver Name</label>
                                  <input type="text"
                                    value={fulfillmentInputs[order.receiptNumber]?.driverName ?? order.fulfillment?.driverName ?? ""}
                                    onChange={(e) => setFulfillmentField(order.receiptNumber, "driverName", e.target.value)}
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="Driver name" />
                                </div>
                                <div>
                                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Driver Phone</label>
                                  <input type="text"
                                    value={fulfillmentInputs[order.receiptNumber]?.driverPhone ?? order.fulfillment?.driverPhone ?? ""}
                                    onChange={(e) => setFulfillmentField(order.receiptNumber, "driverPhone", e.target.value)}
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="876-XXX-XXXX" />
                                </div>
                              </>
                            )}

                            {order.deliveryMethod === "inperson" && (
                              <>
                                <div>
                                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Meet-up Location</label>
                                  <input type="text"
                                    value={fulfillmentInputs[order.receiptNumber]?.meetupLocation ?? order.fulfillment?.meetupLocation ?? ""}
                                    onChange={(e) => setFulfillmentField(order.receiptNumber, "meetupLocation", e.target.value)}
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="Meet-up location" />
                                </div>
                                <div>
                                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Meet-up Date</label>
                                  <input type="date"
                                    value={fulfillmentInputs[order.receiptNumber]?.meetupDate ?? order.fulfillment?.meetupDate ?? ""}
                                    onChange={(e) => setFulfillmentField(order.receiptNumber, "meetupDate", e.target.value)}
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
                                </div>
                                <div>
                                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Meet-up Time</label>
                                  <input type="time"
                                    value={fulfillmentInputs[order.receiptNumber]?.meetupTime ?? order.fulfillment?.meetupTime ?? ""}
                                    onChange={(e) => setFulfillmentField(order.receiptNumber, "meetupTime", e.target.value)}
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
                                </div>
                              </>
                            )}

                            <div className="sm:col-span-2">
                              <label className="mb-1 block text-xs font-medium text-muted-foreground">Notes to Customer</label>
                              <textarea
                                value={fulfillmentInputs[order.receiptNumber]?.notes ?? order.fulfillment?.notes ?? ""}
                                onChange={(e) => setFulfillmentField(order.receiptNumber, "notes", e.target.value)}
                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" rows={2}
                                placeholder="Any additional notes for the customer..." />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="mb-1 block text-xs font-medium text-muted-foreground">Upload Fulfillment Receipt / Proof</label>
                              <div className="flex flex-wrap items-center gap-3">
                                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted">
                                  <Upload className="h-3.5 w-3.5" />
                                  {uploadingFulfillmentReceipt === order.receiptNumber ? "Uploading..." : "Upload Receipt"}
                                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                                    onChange={(e) => handleFulfillmentReceiptUpload(e, order.receiptNumber)} />
                                </label>
                                {(fulfillmentInputs[order.receiptNumber]?.receiptUrl || order.fulfillment?.receiptUrl) && (
                                  <a href={fulfillmentInputs[order.receiptNumber]?.receiptUrl || order.fulfillment?.receiptUrl}
                                    target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-primary hover:underline break-all">
                                    <Eye className="h-3.5 w-3.5" /> View uploaded receipt
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>

                          <button onClick={() => saveFulfillmentAndSendEmail(order)}
                            disabled={sendingEmail === order.receiptNumber || !order.customerEmail}
                            className="mt-4 flex w-full sm:w-auto items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2 text-xs font-medium text-background hover:bg-foreground/90 disabled:opacity-50">
                            {sendingEmail === order.receiptNumber ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                            {sendingEmail === order.receiptNumber ? "Sending..." : "Save & Send Status Email to Customer"}
                          </button>
                          {!order.customerEmail && (
                            <p className="mt-2 text-xs text-red-600">No customer email on file. Email cannot be sent.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* REVIEWS TAB */}
            {activeTab === "reviews" && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {(["active", "archived"] as const).map((f) => (
                    <button key={f} onClick={() => setReviewFilter(f)}
                      className={`rounded-md px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${
                        reviewFilter === f ? "bg-foreground text-background" : "border border-border bg-background text-muted-foreground hover:text-foreground"
                      }`}>
                      {f} ({f === "active" ? reviews.filter((r) => !r.archived).length : reviews.filter((r) => r.archived).length})
                    </button>
                  ))}
                </div>

                {filteredReviews.length === 0 && (
                  <div className="rounded-lg border border-border bg-background p-12 text-center">
                    <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-semibold text-foreground">No {reviewFilter} reviews</h3>
                  </div>
                )}

                {filteredReviews.map((review) => (
                  <div key={review.id} className="rounded-lg border border-border bg-background p-4">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="flex-1 w-full">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="font-medium text-foreground">{review.authorName}</p>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={`h-3.5 w-3.5 ${
                                s <= review.rating ? "fill-amber-400 text-amber-400" : "fill-transparent text-border"
                              }`} />
                            ))}
                          </div>
                          {review.product && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{review.product}</span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground break-words">{review.authorEmail} -- {review.date}</p>
                        <p className="mt-2 text-sm leading-relaxed text-foreground/80 break-words">{review.text}</p>
                      </div>
                      <div className="flex items-center gap-1 self-end sm:self-start">
                        <button onClick={() => toggleArchiveReview(review.id, !review.archived)}
                          title={review.archived ? "Restore" : "Archive"}
                          className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                          {review.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                        </button>
                        <button onClick={() => deleteReview(review.id)}
                          title="Delete permanently"
                          className="rounded-md p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {review.replies.length > 0 && (
                      <div className="mt-4 space-y-3 border-l-2 border-border/60 pl-4">
                        {review.replies.map((reply) => (
                          <div key={reply.id} className="flex flex-col sm:flex-row items-start justify-between gap-2">
                            <div className="w-full">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-medium text-foreground">{reply.authorName}</span>
                                {reply.isAdmin && (
                                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">Admin</span>
                                )}
                                <span className="text-xs text-muted-foreground">{reply.createdAt}</span>
                              </div>
                              <p className="mt-1 text-sm text-foreground/80 break-words">{reply.text}</p>
                            </div>
                            <button onClick={() => deleteReply(reply.id)}
                              className="rounded-md p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600 self-end sm:self-center">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {replyingTo === review.id ? (
                      <div className="mt-4 border-l-2 border-primary/40 pl-4">
                        <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)}
                          rows={2} placeholder="Write an admin reply..."
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button onClick={() => postAdminReply(review.id)} disabled={replyingSending || !replyText.trim()}
                            className="flex items-center gap-2 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background disabled:opacity-50">
                            {replyingSending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                            Post Reply
                          </button>
                          <button onClick={() => { setReplyingTo(null); setReplyText("") }}
                            className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setReplyingTo(review.id)}
                        className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                        <MessageCircle className="h-3.5 w-3.5" /> Reply as Admin
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* USERS TAB */}
            {activeTab === "users" && (
              <div className="space-y-3">
                {users.length === 0 && (
                  <div className="rounded-lg border border-border bg-background p-12 text-center">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-semibold text-foreground">No users yet</h3>
                  </div>
                )}
                {users.map((u) => {
                  const userOrders = orders.filter((o) => o.customerEmail === u.email)
                  return (
                    <div key={u.uid} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-lg border border-border bg-background p-4">
                      {u.photoURL ? (
                        <Image src={u.photoURL} alt="" width={40} height={40} className="rounded-full flex-shrink-0" />
                      ) : (
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                          {(u.displayName || u.email || "?")[0].toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground break-words">{u.displayName || "Unnamed"}</p>
                        <p className="text-sm text-muted-foreground break-words">{u.email}</p>
                      </div>
                      <div className="text-left sm:text-right w-full sm:w-auto">
                        <p className="text-sm font-medium text-foreground">{userOrders.length} order{userOrders.length !== 1 ? "s" : ""}</p>
                        <p className="text-xs text-muted-foreground">${userOrders.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2)} total</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* WIG TRACKER TAB */}
            {activeTab === "wigtracker" && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-border bg-background p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <Instagram className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Total Collabs</p>
                        <p className="text-2xl font-bold text-foreground">{wigStats.total}</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-green-100 p-2">
                        <Users className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Active Vendors</p>
                        <p className="text-2xl font-bold text-foreground">{wigStats.active}</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-amber-100 p-2">
                        <DollarSign className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Outstanding Refunds</p>
                        <p className="text-2xl font-bold text-foreground">${wigStats.outstanding.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-blue-100 p-2">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Total Received</p>
                        <p className="text-2xl font-bold text-foreground">${wigStats.received.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Add Button */}
                <div className="flex justify-end">
                  <button onClick={() => { setEditingWigCollab(null); setWigCollabForm({ vendorUsername: '', vendorLink: '', itemLink: '', policy: '', firstRefundAmount: 0, firstRefundReceived: false, secondRefundAmount: 0, secondRefundReceived: false, hairDetails: { type: 'wig', length: '', density: '', notes: '' }, status: 'active' }); setShowAddWigCollab(true); }}
                    className="flex items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2 text-xs font-medium text-background hover:bg-foreground/90">
                    <Plus className="h-4 w-4" /> Add Collaboration
                  </button>
                </div>

                {/* List */}
                {wigCollabs.length === 0 ? (
                  <div className="rounded-lg border border-border bg-background p-12 text-center">
                    <Instagram className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-semibold text-foreground">No collaborations yet</h3>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {wigCollabs.map((collab) => {
                      const outstanding = collab.status === 'active' && !collab.secondRefundReceived ? collab.secondRefundAmount || 0 : 0;
                      return (
                        <div key={collab.id} className="rounded-lg border border-border bg-background p-4">
                          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                            <div className="flex-1 w-full min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium text-foreground">{collab.vendorUsername}</span>
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${collab.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                  {collab.status}
                                </span>
                                {outstanding > 0 && (
                                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                                    ${outstanding} outstanding
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                {/* Vendor link – added break-all to wrap long URLs */}
                                <p className="text-muted-foreground break-words">
                                  <span className="font-medium text-foreground">Vendor:</span>{' '}
                                  <a
                                    href={collab.vendorLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline break-all"
                                  >
                                    {collab.vendorLink}
                                  </a>
                                </p>
                                {/* Item link – also add break-all for safety (though it's just "Link") */}
                                <p className="text-muted-foreground break-words">
                                  <span className="font-medium text-foreground">Item:</span>{' '}
                                  <a
                                    href={collab.itemLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline break-all"
                                  >
                                    Link
                                  </a>
                                </p>
                                <p className="text-muted-foreground break-words col-span-2">
                                  <span className="font-medium text-foreground">Policy:</span> {collab.policy || '—'}
                                </p>
                                <p className="text-muted-foreground break-words">
                                  <span className="font-medium text-foreground">Hair:</span> {collab.hairDetails.type}
                                  {collab.hairDetails.length && `, ${collab.hairDetails.length}`}
                                  {collab.hairDetails.density && `, ${collab.hairDetails.density}`}
                                  {collab.hairDetails.notes && ` — ${collab.hairDetails.notes}`}
                                </p>
                                {/* Refunds split into two lines on mobile for better readability */}
                                <p className="text-muted-foreground break-words sm:col-span-1">
                                  <span className="font-medium text-foreground">First:</span> ${collab.firstRefundAmount?.toFixed(2) ?? '0'} {collab.firstRefundReceived ? '✓' : '⏳'}
                                </p>
                                <p className="text-muted-foreground break-words sm:col-span-1">
                                  <span className="font-medium text-foreground">Second:</span> ${collab.secondRefundAmount?.toFixed(2) ?? '0'} {collab.secondRefundReceived ? '✓' : '⏳'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 self-end sm:self-start flex-shrink-0">
                              <button onClick={() => editWigCollab(collab)}
                                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted">Edit</button>
                              <button onClick={() => deleteWigCollab(collab.id!)}
                                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* MODALS - Add/Edit Wig Collaboration */}
      {showAddWigCollab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-background p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-foreground">{editingWigCollab ? 'Edit' : 'Add'} Collaboration</h2>
              <button onClick={() => setShowAddWigCollab(false)} className="rounded-md p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Vendor Username *</label>
                  <input type="text" value={wigCollabForm.vendorUsername || ''} onChange={(e) => setWigCollabForm({ ...wigCollabForm, vendorUsername: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="@vendor" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Vendor Profile Link *</label>
                  <input type="url" value={wigCollabForm.vendorLink || ''} onChange={(e) => setWigCollabForm({ ...wigCollabForm, vendorLink: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="https://instagram.com/..." />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Item Link *</label>
                  <input type="url" value={wigCollabForm.itemLink || ''} onChange={(e) => setWigCollabForm({ ...wigCollabForm, itemLink: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="https://..." />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Policy (free text)</label>
                  <textarea value={wigCollabForm.policy || ''} onChange={(e) => setWigCollabForm({ ...wigCollabForm, policy: e.target.value })}
                    rows={2} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="e.g. 50% after shipping, 50% after review" />
                </div>
              </div>

              {/* Hair Details */}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hair Details</h4>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Type</label>
                    <select value={wigCollabForm.hairDetails?.type || 'wig'} onChange={(e) => setWigCollabForm({ ...wigCollabForm, hairDetails: { ...wigCollabForm.hairDetails, type: e.target.value as 'wig'|'bundle'|'both' } })}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
                      <option value="wig">Wig</option>
                      <option value="bundle">Bundle</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Length</label>
                    <input type="text" value={wigCollabForm.hairDetails?.length || ''} onChange={(e) => setWigCollabForm({ ...wigCollabForm, hairDetails: { ...wigCollabForm.hairDetails, length: e.target.value } })}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="e.g. 20 inch" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Density</label>
                    <input type="text" value={wigCollabForm.hairDetails?.density || ''} onChange={(e) => setWigCollabForm({ ...wigCollabForm, hairDetails: { ...wigCollabForm.hairDetails, density: e.target.value } })}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="e.g. 180%" />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Notes</label>
                    <input type="text" value={wigCollabForm.hairDetails?.notes || ''} onChange={(e) => setWigCollabForm({ ...wigCollabForm, hairDetails: { ...wigCollabForm.hairDetails, notes: e.target.value } })}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="optional" />
                  </div>
                </div>
              </div>

              {/* Refund Amounts with First Payment Checkbox */}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Refund Tracking</h4>
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-5 items-center">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">First Refund ($)</label>
                    <input type="number" min="0" step="0.01" value={wigCollabForm.firstRefundAmount || 0}
                      onChange={(e) => setWigCollabForm({ ...wigCollabForm, firstRefundAmount: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input type="checkbox" id="firstReceived" checked={wigCollabForm.firstRefundReceived || false}
                      onChange={(e) => setWigCollabForm({ ...wigCollabForm, firstRefundReceived: e.target.checked })} />
                    <label htmlFor="firstReceived" className="text-xs font-medium text-muted-foreground">First received?</label>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Second Refund ($)</label>
                    <input type="number" min="0" step="0.01" value={wigCollabForm.secondRefundAmount || 0}
                      onChange={(e) => setWigCollabForm({ ...wigCollabForm, secondRefundAmount: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input type="checkbox" id="secondReceived" checked={wigCollabForm.secondRefundReceived || false}
                      onChange={(e) => setWigCollabForm({ ...wigCollabForm, secondRefundReceived: e.target.checked })} />
                    <label htmlFor="secondReceived" className="text-xs font-medium text-muted-foreground">Second received?</label>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
                    <select value={wigCollabForm.status || 'active'} onChange={(e) => setWigCollabForm({ ...wigCollabForm, status: e.target.value as 'active'|'completed' })}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button onClick={() => setShowAddWigCollab(false)} className="flex-1 rounded-md border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted">Cancel</button>
                <button onClick={saveWigCollab} disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-50">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? "Saving..." : (editingWigCollab ? "Update" : "Add")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT IMAGE MODAL */}
      {receiptModalImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setReceiptModalImage(null)}>
          <div className="relative max-h-[90vh] max-w-3xl overflow-auto rounded-lg bg-background p-2" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setReceiptModalImage(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-foreground/80 p-1.5 text-background hover:bg-foreground">
              <X className="h-4 w-4" />
            </button>
            <img src={receiptModalImage} alt="Customer receipt" className="max-h-[85vh] w-auto rounded-md" />
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-background p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-foreground">Edit: {editingProduct.name}</h2>
              <button onClick={() => setEditingProduct(null)} className="rounded-md p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Product Name</label>
                  <input type="text" value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Category</label>
                  <select value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value as "wigs" | "swimsuits" })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
                    <option value="wigs">Wigs</option>
                    <option value="swimsuits">Swimsuits</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Description</label>
                <textarea value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" rows={3} />
              </div>
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Price (JMD)</label>
                  <input type="number" value={editingProduct.price || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Sale Price</label>
                  <input type="number" value={editingProduct.salePrice || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, salePrice: parseFloat(e.target.value) || undefined })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
                  <select value={editingProduct.status || "available"}
                    onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value as ProductStatus })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
                    <option value="available">Available</option>
                    <option value="sold_out">Sold Out</option>
                    <option value="coming_soon">Coming Soon</option>
                  </select>
                </div>
              </div>

              {/* Specifications */}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Specifications</h4>
                {editingProduct.category === "wigs" ? (
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                    {(["hairLength", "laceSize", "density", "hairType"] as const).map((spec) => (
                      <div key={spec}>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground capitalize">{spec.replace(/([A-Z])/g, " $1")}</label>
                        <input type="text" value={(editingProduct.specifications?.[spec] as string) || ""}
                          onChange={(e) => setEditingProduct({ ...editingProduct, specifications: { ...editingProduct.specifications, [spec]: e.target.value } })}
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                    {(["material", "coverage", "style"] as const).map((spec) => (
                      <div key={spec}>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground capitalize">{spec}</label>
                        <input type="text" value={(editingProduct.specifications?.[spec] as string) || ""}
                          onChange={(e) => setEditingProduct({ ...editingProduct, specifications: { ...editingProduct.specifications, [spec]: e.target.value } })}
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
                      </div>
                    ))}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">Sizes (comma-separated)</label>
                      <input type="text" value={Array.isArray(editingProduct.specifications?.sizes) ? (editingProduct.specifications.sizes as string[]).join(", ") : ""}
                        onChange={(e) => setEditingProduct({ ...editingProduct, specifications: { ...editingProduct.specifications, sizes: e.target.value.split(",").map((s) => s.trim()) } })}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="S, M, L" />
                    </div>
                  </div>
                )}
              </div>

              {/* Stock */}
              {editingProduct.category === "wigs" ? (
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Stock Quantity</label>
                  <input type="number" min="0" value={editingProduct.quantity ?? ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, quantity: e.target.value === "" ? undefined : parseInt(e.target.value) || 0 })}
                    placeholder="Unlimited"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
                  <p className="mt-1 text-[10px] text-muted-foreground">Leave empty for unlimited stock</p>
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Stock per Size</label>
                  {(() => {
                    const sizes = Array.isArray(editingProduct.specifications?.sizes)
                      ? (editingProduct.specifications.sizes as string[])
                      : [];
                    if (sizes.length === 0) {
                      return (
                        <p className="text-xs text-amber-600">
                          No sizes defined in specifications. Edit specifications first.
                        </p>
                      );
                    }
                    return (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {sizes.map((size) => (
                          <div key={size}>
                            <label className="mb-1 block text-[10px] font-medium text-muted-foreground">
                              Size {size}
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={editingProduct.sizeQuantities?.[size] ?? ''}
                              onChange={(e) => {
                                const qty = e.target.value === '' ? undefined : parseInt(e.target.value) || 0;
                                setEditingProduct({
                                  ...editingProduct,
                                  sizeQuantities: {
                                    ...(editingProduct.sizeQuantities || {}),
                                    [size]: qty,
                                  },
                                });
                              }}
                              placeholder="0"
                              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                            />
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Photos */}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Photos</h4>
                <div className="flex flex-wrap gap-3">
                  {editingProduct.images.map((img, i) => (
                    <div key={i} className="group relative h-24 w-24 overflow-hidden rounded-md border border-border">
                      <Image src={img} alt="" fill className="object-cover" sizes="96px" />
                      {img === editingProduct.image && <span className="absolute left-1 top-1 rounded bg-foreground/80 px-1 py-0.5 text-[9px] font-bold text-background">MAIN</span>}
                      <div className="absolute inset-0 hidden items-end justify-between bg-gradient-to-t from-black/60 p-1 group-hover:flex">
                        {img !== editingProduct.image && (
                          <button onClick={() => setEditingProduct({ ...editingProduct, image: img })}
                            className="rounded bg-white/90 px-1 py-0.5 text-[9px] font-bold text-foreground">Set Main</button>
                        )}
                        <button onClick={() => removePhoto(i, "edit")}
                          className="ml-auto rounded-full bg-red-600 p-0.5 text-white"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    </div>
                  ))}
                  <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-border hover:border-primary hover:bg-primary/5">
                    {uploadingPhoto ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <><ImageIcon className="h-5 w-5 text-muted-foreground" /><span className="mt-1 text-[10px] text-muted-foreground">Add photo</span></>}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                      onChange={(e) => handleProductPhotoUpload(e, "edit", false)} />
                  </label>
                </div>
                <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-xs text-primary hover:underline">
                  <Upload className="h-3.5 w-3.5" /> Replace main photo
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                    onChange={(e) => handleProductPhotoUpload(e, "edit", true)} />
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button onClick={() => setEditingProduct(null)} className="flex-1 rounded-md border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted">Cancel</button>
                <button onClick={saveEditProduct} disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-50">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD PRODUCT MODAL */}
      {showAddProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="maxh-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-background p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-foreground">Add New Product</h2>
              <button onClick={() => setShowAddProduct(false)} className="rounded-md p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Product Name *</label>
                  <input type="text" value={newProduct.name} onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="e.g. Natural Wave Wig" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Category *</label>
                  <select value={newProduct.category} onChange={(e) => setNewProduct((p) => ({ ...p, category: e.target.value as "wigs" | "swimsuits" }))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
                    <option value="wigs">Wigs</option>
                    <option value="swimsuits">Swimsuits</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Description</label>
                <textarea value={newProduct.description} onChange={(e) => setNewProduct((p) => ({ ...p, description: e.target.value }))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" rows={3} placeholder="Product description..." />
              </div>
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Price (JMD) *</label>
                  <input type="number" value={newProduct.price || ""} onChange={(e) => setNewProduct((p) => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="0.00" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Sale Price (optional)</label>
                  <input type="number" value={newProduct.salePrice || ""} onChange={(e) => setNewProduct((p) => ({ ...p, salePrice: parseFloat(e.target.value) || undefined }))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="0.00" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
                  <select value={newProduct.status} onChange={(e) => setNewProduct((p) => ({ ...p, status: e.target.value as ProductStatus }))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
                    <option value="available">Available</option>
                    <option value="sold_out">Sold Out</option>
                    <option value="coming_soon">Coming Soon</option>
                  </select>
                </div>
              </div>

              {/* Specifications */}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Specifications</h4>
                {newProduct.category === "wigs" ? (
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                    {(["hairLength", "laceSize", "density", "hairType"] as const).map((spec) => (
                      <div key={spec}>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground capitalize">{spec.replace(/([A-Z])/g, " $1")}</label>
                        <input type="text" value={(newProduct.specifications[spec] as string) || ""}
                          onChange={(e) => setNewProduct((p) => ({ ...p, specifications: { ...p.specifications, [spec]: e.target.value } }))}
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                    {(["material", "coverage", "style"] as const).map((spec) => (
                      <div key={spec}>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground capitalize">{spec}</label>
                        <input type="text" value={(newProduct.specifications[spec] as string) || ""}
                          onChange={(e) => setNewProduct((p) => ({ ...p, specifications: { ...p.specifications, [spec]: e.target.value } }))}
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
                      </div>
                    ))}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">Sizes (comma-separated)</label>
                      <input type="text" value={Array.isArray(newProduct.specifications.sizes) ? (newProduct.specifications.sizes as string[]).join(", ") : ""}
                        onChange={(e) => setNewProduct((p) => ({ ...p, specifications: { ...p.specifications, sizes: e.target.value.split(",").map((s) => s.trim()) } }))}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="S, M, L" />
                    </div>
                  </div>
                )}
              </div>

              {/* Stock */}
              {newProduct.category === "wigs" ? (
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Stock Quantity</label>
                  <input type="number" min="0" value={newProduct.quantity ?? ""}
                    onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value === "" ? undefined : parseInt(e.target.value) || 0 })}
                    placeholder="Unlimited"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
                  <p className="mt-1 text-[10px] text-muted-foreground">Leave empty for unlimited</p>
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Stock per Size</label>
                  {(() => {
                    const sizes = Array.isArray(newProduct.specifications.sizes)
                      ? (newProduct.specifications.sizes as string[])
                      : [];
                    if (sizes.length === 0) {
                      return (
                        <p className="text-xs text-amber-600">
                          Please enter sizes (comma‑separated) in the Specifications section first.
                        </p>
                      );
                    }
                    return (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {sizes.map((size) => (
                          <div key={size}>
                            <label className="mb-1 block text-[10px] font-medium text-muted-foreground">
                              Size {size}
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={newProduct.sizeQuantities?.[size] ?? ''}
                              onChange={(e) => {
                                const qty = e.target.value === '' ? undefined : parseInt(e.target.value) || 0;
                                setNewProduct({
                                  ...newProduct,
                                  sizeQuantities: {
                                    ...(newProduct.sizeQuantities || {}),
                                    [size]: qty,
                                  },
                                });
                              }}
                              placeholder="0"
                              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                            />
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Photos */}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Photos *</h4>
                <div className="flex flex-wrap gap-3">
                  {newProduct.images.map((img, i) => (
                    <div key={i} className="group relative h-24 w-24 overflow-hidden rounded-md border border-border">
                      <Image src={img} alt="" fill className="object-cover" sizes="96px" />
                      {i === 0 && <span className="absolute left-1 top-1 rounded bg-foreground/80 px-1 py-0.5 text-[9px] font-bold text-background">MAIN</span>}
                      <button onClick={() => removePhoto(i, "add")}
                        className="absolute right-1 top-1 hidden rounded-full bg-red-600 p-0.5 text-white group-hover:block"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  ))}
                  <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-border hover:border-primary hover:bg-primary/5">
                    {uploadingPhoto ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <><ImageIcon className="h-5 w-5 text-muted-foreground" /><span className="mt-1 text-[10px] text-muted-foreground">{newProduct.images.length === 0 ? "Main photo" : "Add more"}</span></>}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                      onChange={(e) => handleProductPhotoUpload(e, "add", newProduct.images.length === 0)} />
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button onClick={() => setShowAddProduct(false)} className="flex-1 rounded-md border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted">Cancel</button>
                <button onClick={saveNewProduct} disabled={saving || !newProduct.name || !newProduct.image}
                  className="flex flex-1 items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-50">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? "Adding..." : "Add Product"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}