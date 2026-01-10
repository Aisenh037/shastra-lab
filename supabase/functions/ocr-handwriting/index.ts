import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData } = await req.json();
    
    if (!imageData) {
      throw new Error("Image data is required");
    }

    const AZURE_ENDPOINT = Deno.env.get("AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT");
    const AZURE_API_KEY = Deno.env.get("AZURE_DOCUMENT_INTELLIGENCE_API_KEY");

    if (!AZURE_ENDPOINT || !AZURE_API_KEY) {
      throw new Error("Azure Document Intelligence credentials not configured");
    }

    console.log("Processing handwritten answer with Azure Document Intelligence");

    // Remove data URL prefix if present
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Use Azure Document Intelligence Read API
    const analyzeUrl = `${AZURE_ENDPOINT}documentintelligence/documentModels/prebuilt-read:analyze?api-version=2024-02-29-preview`;

    const analyzeResponse = await fetch(analyzeUrl, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": AZURE_API_KEY,
        "Content-Type": "application/octet-stream",
      },
      body: imageBuffer,
    });

    if (!analyzeResponse.ok) {
      const errorText = await analyzeResponse.text();
      console.error("Azure analyze error:", analyzeResponse.status, errorText);
      throw new Error(`Azure API error: ${analyzeResponse.status}`);
    }

    // Get the operation location for polling
    const operationLocation = analyzeResponse.headers.get("Operation-Location");
    if (!operationLocation) {
      throw new Error("No operation location returned");
    }

    console.log("Polling for OCR results...");

    // Poll for results
    let result = null;
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const resultResponse = await fetch(operationLocation, {
        headers: {
          "Ocp-Apim-Subscription-Key": AZURE_API_KEY,
        },
      });

      if (!resultResponse.ok) {
        const errorText = await resultResponse.text();
        console.error("Azure result error:", resultResponse.status, errorText);
        throw new Error(`Azure polling error: ${resultResponse.status}`);
      }

      result = await resultResponse.json();
      
      if (result.status === "succeeded") {
        break;
      } else if (result.status === "failed") {
        throw new Error("Azure OCR processing failed");
      }
      
      attempts++;
    }

    if (!result || result.status !== "succeeded") {
      throw new Error("OCR processing timed out");
    }

    // Extract text from result
    let extractedText = "";
    if (result.analyzeResult?.content) {
      extractedText = result.analyzeResult.content;
    } else if (result.analyzeResult?.paragraphs) {
      extractedText = result.analyzeResult.paragraphs
        .map((p: { content: string }) => p.content)
        .join("\n\n");
    }

    console.log("OCR successful, extracted", extractedText.length, "characters");

    return new Response(
      JSON.stringify({ text: extractedText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ocr-handwriting:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
