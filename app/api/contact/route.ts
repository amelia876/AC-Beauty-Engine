import { Resend } from "resend"
import { NextResponse } from "next/server"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json()

    if (!name || !message) {
      return NextResponse.json(
        { error: "Name and message are required." },
        { status: 400 }
      )
    }

    const subjectLabels: Record<string, string> = {
      order: "Order Inquiry",
      product: "Product Question",
      custom: "Custom Order Request",
      delivery: "Delivery Information",
      other: "Other",
    }

    const emailSubject = `AC Beauty Engine 876 - ${subjectLabels[subject] || "New Message"} from ${name}`

    const isValidEmail = typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

    await resend.emails.send({
      from: "AC Beauty Engine 876 <onboarding@resend.dev>",
      to: "ac.swimwear876@gmail.com",
      ...(isValidEmail ? { replyTo: email.trim() } : {}),
      subject: emailSubject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="border-bottom: 2px solid #c9907d; padding-bottom: 16px; margin-bottom: 24px;">
            <h1 style="color: #5c3a2e; font-size: 22px; margin: 0;">New Contact Form Message</h1>
            <p style="color: #888; font-size: 13px; margin: 4px 0 0;">AC Beauty Engine 876 Website</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #888; font-size: 13px; width: 120px;">Name</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333; font-size: 14px;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #888; font-size: 13px;">Email</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333; font-size: 14px;">${email || "Not provided"}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #888; font-size: 13px;">Subject</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333; font-size: 14px;">${subjectLabels[subject] || "General"}</td>
            </tr>
          </table>

          <div style="background: #faf5f3; border-left: 3px solid #c9907d; padding: 16px 20px; margin-bottom: 24px;">
            <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Message</p>
            <p style="color: #333; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
          </div>

          <p style="color: #aaa; font-size: 11px; text-align: center; margin-top: 32px;">
            This email was sent from the contact form on your AC Beauty Engine 876 website.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Email send error:", error)
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 }
    )
  }
}
