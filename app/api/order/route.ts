import { Resend } from "resend"
import { NextResponse } from "next/server"

const resend = new Resend(process.env.RESEND_API_KEY)

const deliveryMethodNames: Record<string, string> = {
  knutsford: "Knutsford Express",
  zipmail: "Zip Mail",
  inperson: "In Person (Mandeville)",
  taximan: "Taxi Man",
}

const paymentMethodNames: Record<string, string> = {
  paypal: "PayPal",
  zelle: "Zelle",
  cashapp: "Cash App",
  scotia: "Scotia Bank",
  cibc: "CIBC Cross Banking",
  cod: "Cash on Delivery",
  card: "Credit / Debit Card",
}

export async function POST(request: Request) {
  try {
    const order = await request.json()
    console.log("[v0] Order API called for receipt:", order.receiptNumber)
    console.log("[v0] RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY)
    console.log("[v0] Items count:", order.items?.length, "Total:", order.total)

    const itemRows = order.items
      .map(
        (item: { name: string; quantity: number; price: number }) => `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #f0e8e4; color: #333; font-size: 14px;">${item.name}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #f0e8e4; color: #555; font-size: 14px; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #f0e8e4; color: #333; font-size: 14px; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
        </tr>`
      )
      .join("")

    const deliveryDetailRows = Object.entries(order.deliveryDetails || {})
      .map(
        ([key, value]) => `
        <tr>
          <td style="padding: 6px 0; color: #888; font-size: 13px; text-transform: capitalize; width: 140px;">${key.replace(/([A-Z])/g, " $1").trim()}</td>
          <td style="padding: 6px 0; color: #333; font-size: 13px;">${value}</td>
        </tr>`
      )
      .join("")

    const result = await resend.emails.send({
      from: "AC Beauty Engine 876 <onboarding@resend.dev>",
      to: "ac.swimwear876@gmail.com",
      subject: `NEW ORDER #${order.receiptNumber} - $${order.total.toFixed(2)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 20px; background: #fff;">
          <div style="background: #5c3a2e; padding: 24px; text-align: center;">
            <h1 style="color: #fff; font-size: 20px; margin: 0; letter-spacing: 2px;">NEW ORDER RECEIVED</h1>
            <p style="color: #d4a89c; font-size: 13px; margin: 8px 0 0; letter-spacing: 1px;">AC BEAUTY ENGINE 876</p>
          </div>
          <div style="background: #faf5f3; padding: 16px 24px; border-bottom: 2px solid #c9907d;">
            <table style="width: 100%;"><tr>
              <td style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Receipt Number</td>
              <td style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; text-align: right;">Date</td>
            </tr><tr>
              <td style="color: #5c3a2e; font-size: 18px; font-weight: bold; padding-top: 4px;">${order.receiptNumber}</td>
              <td style="color: #333; font-size: 14px; text-align: right; padding-top: 4px;">${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</td>
            </tr></table>
          </div>
          ${order.customerName || order.customerPhone ? `
          <div style="padding: 24px 24px 0;">
            <h2 style="color: #5c3a2e; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px; border-bottom: 1px solid #eee; padding-bottom: 8px;">Customer Information</h2>
            <table style="width: 100%;">
              ${order.customerName ? `<tr><td style="padding: 6px 0; color: #888; font-size: 13px; width: 140px;">Name</td><td style="padding: 6px 0; color: #333; font-size: 13px; font-weight: bold;">${order.customerName}</td></tr>` : ""}
              ${order.customerPhone ? `<tr><td style="padding: 6px 0; color: #888; font-size: 13px; width: 140px;">Phone</td><td style="padding: 6px 0; color: #333; font-size: 13px; font-weight: bold;">${order.customerPhone}</td></tr>` : ""}
            </table>
          </div>
          ` : ""}
          <div style="padding: 24px;">
            <h2 style="color: #5c3a2e; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px; border-bottom: 1px solid #eee; padding-bottom: 8px;">Items Ordered</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <thead><tr style="background: #faf5f3;">
                <th style="padding: 8px 12px; text-align: left; color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Product</th>
                <th style="padding: 8px 12px; text-align: center; color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Qty</th>
                <th style="padding: 8px 12px; text-align: right; color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Total</th>
              </tr></thead>
              <tbody>${itemRows}</tbody>
            </table>
            <table style="width: 100%; margin-top: 16px;">
              <tr><td style="padding: 6px 0; color: #888; font-size: 13px;">Subtotal</td><td style="padding: 6px 0; color: #333; font-size: 13px; text-align: right;">$${order.subtotal.toFixed(2)}</td></tr>
              <tr><td style="padding: 6px 0; color: #888; font-size: 13px;">Delivery Fee</td><td style="padding: 6px 0; color: ${order.deliveryFee === 0 ? "#16a34a" : "#333"}; font-size: 13px; text-align: right;">${order.deliveryFee === 0 ? "FREE" : "$" + order.deliveryFee.toFixed(2) + " JMD"}</td></tr>
              <tr><td style="padding: 10px 0; color: #5c3a2e; font-size: 18px; font-weight: bold; border-top: 2px solid #c9907d;">TOTAL</td><td style="padding: 10px 0; color: #5c3a2e; font-size: 18px; font-weight: bold; border-top: 2px solid #c9907d; text-align: right;">$${order.total.toFixed(2)}</td></tr>
            </table>
          </div>
          <div style="padding: 0 24px 24px;">
            <h2 style="color: #5c3a2e; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px; border-bottom: 1px solid #eee; padding-bottom: 8px;">Delivery Details</h2>
            <table style="width: 100%;">
              <tr><td style="padding: 6px 0; color: #888; font-size: 13px; width: 140px;">Method</td><td style="padding: 6px 0; color: #333; font-size: 13px; font-weight: bold;">${deliveryMethodNames[order.deliveryMethod] || order.deliveryMethod}</td></tr>
              ${deliveryDetailRows}
            </table>
          </div>
          <div style="padding: 0 24px 24px;">
            <h2 style="color: #5c3a2e; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px; border-bottom: 1px solid #eee; padding-bottom: 8px;">Payment</h2>
            <table style="width: 100%;">
              <tr><td style="padding: 6px 0; color: #888; font-size: 13px; width: 140px;">Method</td><td style="padding: 6px 0; color: #333; font-size: 13px; font-weight: bold;">${paymentMethodNames[order.paymentMethod] || order.paymentMethod}</td></tr>
              <tr><td style="padding: 6px 0; color: #888; font-size: 13px;">Receipt Uploaded</td><td style="padding: 6px 0; color: ${order.hasReceiptUpload ? "#16a34a" : "#dc2626"}; font-size: 13px; font-weight: bold;">${order.hasReceiptUpload ? "Yes" : "No"}</td></tr>
            </table>
          </div>
          <div style="background: #faf5f3; padding: 16px 24px; text-align: center;">
            <p style="color: #888; font-size: 11px; margin: 0;">This is an automated notification from your AC Beauty Engine 876 website.</p>
          </div>
        </div>
      `,
    })

    console.log("[v0] Resend result:", JSON.stringify(result))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Order email error:", error)
    return NextResponse.json(
      { error: "Email notification failed" },
      { status: 500 }
    )
  }
}
