import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function processImageWithAzure(imageData: string, apiKey: string, endpoint: string): Promise<string> {
  // Remove data URL prefix if present
  const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
  const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

  const analyzeUrl = `${endpoint}documentintelligence/documentModels/prebuilt-read:analyze?api-version=2024-02-29-preview`;

  const analyzeResponse = await fetch(analyzeUrl, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": apiKey,
      "Content-Type": "application/octet-stream",
    },
    body: imageBuffer,
  });

  if (!analyzeResponse.ok) {
    const errorText = await analyzeResponse.text();
    console.error("Azure analyze error:", analyzeResponse.status, errorText);
    throw new Error(`Azure API error: ${analyzeResponse.status}`);
  }

  const operationLocation = analyzeResponse.headers.get("Operation-Location");
  if (!operationLocation) {
    throw new Error("No operation location returned");
  }

  // Poll for results
  let result = null;
  let attempts = 0;
  const maxAttempts = 30;

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const resultResponse = await fetch(operationLocation, {
      headers: {
        "Ocp-Apim-Subscription-Key": apiKey,
      },
    });

    if (!resultResponse.ok) {
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
  if (result.analyzeResult?.content) {
    return result.analyzeResult.content;
  } else if (result.analyzeResult?.paragraphs) {
    return result.analyzeResult.paragraphs
      .map((p: { content: string }) => p.content)
      .join("\n\n");
  }
  
  return "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { images } = await req.json();
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      throw new Error("Images array is required");
    }

    const AZURE_ENDPOINT = Deno.env.get("AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT");
    const AZURE_API_KEY = Deno.env.get("AZURE_DOCUMENT_INTELLIGENCE_API_KEY");

    if (!AZURE_ENDPOINT || !AZURE_API_KEY) {
      throw new Error("Azure Document Intelligence credentials not configured");
    }

    console.log(`Processing ${images.length} pages with Azure Document Intelligence`);

    // Process each page
    const textParts: string[] = [];
    for (let i = 0; i < images.length; i++) {
      console.log(`Processing page ${i + 1}/${images.length}`);
      try {
        const pageText = await processImageWithAzure(images[i], AZURE_API_KEY, AZURE_ENDPOINT);
        if (pageText) {
          textParts.push(`--- Page ${i + 1} ---\n${pageText}`);
        }
      } catch (pageError) {
        console.error(`Error processing page ${i + 1}:`, pageError);
        textParts.push(`--- Page ${i + 1} ---\n[Error extracting text from this page]`);
      }
    }

    const combinedText = textParts.join("\n\n");
    console.log("OCR complete, extracted", combinedText.length, "characters");

    return new Response(
      JSON.stringify({ text: combinedText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ocr-pdf:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
