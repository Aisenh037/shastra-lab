import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TTSRequest {
  text: string;
  voice?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voice = "alloy" }: TTSRequest = await req.json();
    
    if (!text) {
      throw new Error("Text is required");
    }

    // Limit text length for TTS
    const truncatedText = text.slice(0, 4000);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Use Lovable AI to generate a summary for TTS (since direct TTS isn't available)
    // We'll generate a concise audio-friendly summary
    const summaryResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a friendly tutor summarizing evaluation feedback for a student. 
Convert the feedback into a natural, conversational summary that would sound good when read aloud.
Keep it concise (under 200 words), encouraging, and actionable.
Focus on: overall score, top strengths, key improvements needed.
Don't use bullet points or special formatting - write flowing prose.`,
          },
          {
            role: "user",
            content: `Summarize this evaluation feedback for audio playback:\n\n${truncatedText}`,
          },
        ],
      }),
    });

    if (!summaryResponse.ok) {
      if (summaryResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("Failed to generate summary");
    }

    const summaryData = await summaryResponse.json();
    const summary = summaryData.choices?.[0]?.message?.content || truncatedText;

    // Return the text summary (client will use Web Speech API for TTS)
    return new Response(
      JSON.stringify({ 
        summary,
        message: "Use Web Speech API on client to read this aloud" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in tts-feedback:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
