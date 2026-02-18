import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface EmailRequest {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
            },
        });
    }

    try {
        if (!RESEND_API_KEY) {
            throw new Error("Missing RESEND_API_KEY");
        }

        const { to, subject, html, text } = await req.json() as EmailRequest;

        if (!to || !subject || !html) {
            throw new Error("Missing required fields: to, subject, html");
        }

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: "Lumina <onboarding@resend.dev>", // Change this to your verified domain later
                to: [to],
                subject: subject,
                html: html,
                text: text || "Email content not available in text format.",
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            console.error("Resend API Error:", data);
            throw new Error(data.message || "Failed to send email");
        }

        return new Response(JSON.stringify(data), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 400,
        });
    }
});
