import { Resend } from "resend"
import { NextResponse } from "next/server"

const resend = new Resend(process.env.RESEND_API_KEY)

const statusMessages: Record<string, { heading: string; message: string; color: string }> = {
  pending: {
    heading: "Order Received",
    message: "We have received your order and are reviewing it. You will be notified once it is confirmed.",
    color: "#d97706",
  },
  confirmed: {
    heading: "Order Confirmed",
    message: "Great news! Your order has been confirmed and is being prepared.",
    color: "#2563eb",
  },
  shipped: {
    heading: "Order Shipped",
    message: "Your order is on its way! See the delivery details below.",
    color: "#7c3aed",
  },
  delivered: {
    heading: "Order Delivered",
    message: "Your order has been delivered! We hope you love your new items. Thank you for shopping with AC Beauty Engine 876.",
    color: "#16a34a",
  },
  cancelled: {
    heading: "Order Cancelled",
    message: "Unfortunately, your order has been cancelled. If you believe this is an error, please contact us directly.",
    color: "#dc2626",
  },
}

const deliveryMethodNames: Record<string, string> = {
  knutsford: "Knutsford Express",
  zipmail: "Zip Mail",
  inperson: "In Person (Mandeville)",
  taximan: "Taxi Man",
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

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      receiptNumber,
      customerEmail,
      customerName,
      status,
      items,
      total,
      deliveryMethod,
      fulfillment,
    } = body as {
      receiptNumber: string
      customerEmail: string
      customerName?: string
      status: string
      items?: { name: string; quantity: number; price: number }[]
      total?: number
      deliveryMethod?: string
      fulfillment?: FulfillmentDetails
    }

    console.log("[v0] Status email request:", { receiptNumber, customerEmail, status, hasFulfillment: !!fulfillment })

    if (!customerEmail) {
      return NextResponse.json({ success: false, error: "No customer email provided" }, { status: 400 })
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ success: false, error: "RESEND_API_KEY is not configured" }, { status: 500 })
    }

    const statusInfo = statusMessages[status] || statusMessages.pending

    const itemsList = (items || [])
      .map(
        (item) =>
          `<tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #f0e8e4; color: #333; font-size: 14px;">${item.name}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #f0e8e4; color: #555; font-size: 14px; text-align: center;">x${item.quantity}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #f0e8e4; color: #333; font-size: 14px; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
          </tr>`
      )
      .join("")

    // Build fulfillment details section
    let fulfillmentHtml = ""
    if (fulfillment && Object.values(fulfillment).some((v) => v)) {
      const rows: string[] = []

      if (fulfillment.trackingNumber) {
        rows.push(`<tr><td style="padding: 8px 0; color: #888; font-size: 13px; width: 160px;">Tracking Number</td><td style="padding: 8px 0; color: #333; font-size: 14px; font-weight: bold;">${fulfillment.trackingNumber}</td></tr>`)
      }
      if (fulfillment.estimatedDelivery) {
        rows.push(`<tr><td style="padding: 8px 0; color: #888; font-size: 13px;">Estimated Delivery</td><td style="padding: 8px 0; color: #333; font-size: 14px; font-weight: bold;">${fulfillment.estimatedDelivery}</td></tr>`)
      }
      if (fulfillment.driverName) {
        rows.push(`<tr><td style="padding: 8px 0; color: #888; font-size: 13px;">Driver Name</td><td style="padding: 8px 0; color: #333; font-size: 14px;">${fulfillment.driverName}</td></tr>`)
      }
      if (fulfillment.driverPhone) {
        rows.push(`<tr><td style="padding: 8px 0; color: #888; font-size: 13px;">Driver Phone</td><td style="padding: 8px 0; color: #333; font-size: 14px;">${fulfillment.driverPhone}</td></tr>`)
      }
      if (fulfillment.meetupLocation) {
        rows.push(`<tr><td style="padding: 8px 0; color: #888; font-size: 13px;">Meet-up Location</td><td style="padding: 8px 0; color: #333; font-size: 14px;">${fulfillment.meetupLocation}</td></tr>`)
      }
      if (fulfillment.meetupDate) {
        rows.push(`<tr><td style="padding: 8px 0; color: #888; font-size: 13px;">Meet-up Date</td><td style="padding: 8px 0; color: #333; font-size: 14px;">${fulfillment.meetupDate}</td></tr>`)
      }
      if (fulfillment.meetupTime) {
        rows.push(`<tr><td style="padding: 8px 0; color: #888; font-size: 13px;">Meet-up Time</td><td style="padding: 8px 0; color: #333; font-size: 14px;">${fulfillment.meetupTime}</td></tr>`)
      }
      if (fulfillment.notes) {
        rows.push(`<tr><td style="padding: 8px 0; color: #888; font-size: 13px; vertical-align: top;">Notes</td><td style="padding: 8px 0; color: #333; font-size: 14px; line-height: 1.5;">${fulfillment.notes}</td></tr>`)
      }
      if (fulfillment.receiptUrl) {
        rows.push(`<tr><td style="padding: 8px 0; color: #888; font-size: 13px;">Receipt</td><td style="padding: 8px 0;"><a href="${fulfillment.receiptUrl}" style="color: #5c3a2e; font-weight: bold; text-decoration: underline;">View Receipt</a></td></tr>`)
      }

      fulfillmentHtml = `
        <div style="padding: 0 24px 24px;">
          <h3 style="color: #5c3a2e; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px; border-bottom: 1px solid #eee; padding-bottom: 8px;">
            ${deliveryMethod ? deliveryMethodNames[deliveryMethod] || deliveryMethod : "Delivery"} Details
          </h3>
          <table style="width: 100%;">${rows.join("")}</table>
        </div>
      `
    }

    // Send to customer AND admin (BCC admin so they have a copy)
    const result = await resend.emails.send({
      from: "AC Beauty Engine 876 <onboarding@resend.dev>",
      to: customerEmail,
      cc: "ac.swimwear876@gmail.com",
      subject: `Order ${statusInfo.heading} - #${receiptNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
          <div style="background: #5c3a2e; padding: 28px; text-align: center;">
            <h1 style="color: #fff; font-size: 18px; margin: 0; letter-spacing: 3px;">AC BEAUTY ENGINE 876</h1>
          </div>

          <div style="padding: 32px 24px; text-align: center;">
            <h2 style="color: ${statusInfo.color}; font-size: 22px; margin: 0 0 8px; font-weight: bold;">${statusInfo.heading}</h2>
            <p style="color: #666; font-size: 15px; line-height: 1.6; margin: 0;">${statusInfo.message}</p>
          </div>

          <div style="background: #faf5f3; padding: 20px 24px; margin: 0 24px; border-radius: 8px;">
            <table style="width: 100%;">
              <tr>
                <td style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Order Number</td>
                <td style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; text-align: right;">Status</td>
              </tr>
              <tr>
                <td style="color: #5c3a2e; font-size: 16px; font-weight: bold; padding-top: 4px;">${receiptNumber}</td>
                <td style="color: ${statusInfo.color}; font-size: 14px; font-weight: bold; text-align: right; padding-top: 4px;">${statusInfo.heading.toUpperCase()}</td>
              </tr>
            </table>
          </div>

          ${fulfillmentHtml}

          ${items && items.length > 0 ? `
          <div style="padding: 24px;">
            <h3 style="color: #5c3a2e; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px; border-bottom: 1px solid #eee; padding-bottom: 8px;">Your Items</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tbody>${itemsList}</tbody>
            </table>
            <div style="border-top: 2px solid #c9907d; margin-top: 12px; padding-top: 12px; text-align: right;">
              <span style="color: #5c3a2e; font-size: 18px; font-weight: bold;">Total: $${total?.toFixed(2) || "0.00"}</span>
            </div>
          </div>
          ` : ""}

          <div style="padding: 0 24px 24px; text-align: center;">
            <p style="color: #888; font-size: 13px; line-height: 1.5;">
              ${customerName ? `Hi ${customerName}, ` : ""}If you have any questions about your order, please contact us at
              <a href="mailto:ac.swimwear876@gmail.com" style="color: #5c3a2e; font-weight: bold;">ac.swimwear876@gmail.com</a>
            </p>
          </div>

          <div style="background: #5c3a2e; padding: 16px 24px; text-align: center;">
            <p style="color: #d4a89c; font-size: 11px; margin: 0;">Thank you for shopping with AC Beauty Engine 876</p>
          </div>
        </div>
      `,
    })

    console.log("[v0] Status email result:", JSON.stringify(result))

    if (result.error) {
      console.error("[v0] Resend API error:", result.error)
      return NextResponse.json({
        success: false,
        error: `Resend error: ${result.error.message}. Note: With the free 'onboarding@resend.dev' sender, emails can only be sent to the Resend account owner's email. To send to customers, add and verify your own domain in Resend.`,
      }, { status: 400 })
    }

    return NextResponse.json({ success: true, emailId: result.data?.id })
  } catch (error) {
    console.error("[v0] Status email error:", error)
    return NextResponse.json({ success: false, error: `Server error: ${String(error)}` }, { status: 500 })
  }
}
