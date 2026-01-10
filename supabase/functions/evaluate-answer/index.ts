import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EvaluationRequest {
  questionText: string;
  questionType: string;
  maxMarks: number;
  wordLimit?: number;
  modelAnswer?: string;
  keyPoints?: string[];
  studentAnswer: string;
  subject?: string;
  topic?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      questionText,
      questionType,
      maxMarks,
      wordLimit,
      modelAnswer,
      keyPoints,
      studentAnswer,
      subject,
      topic,
    }: EvaluationRequest = await req.json();

    const AZURE_ENDPOINT = Deno.env.get("AZURE_OPENAI_ENDPOINT");
    const AZURE_API_KEY = Deno.env.get("AZURE_OPENAI_API_KEY");

    if (!AZURE_ENDPOINT || !AZURE_API_KEY) {
      throw new Error("Azure OpenAI credentials not configured");
    }

    const systemPrompt = `You are an expert UPSC Mains answer evaluator and mentor. Your role is to evaluate written answers and provide constructive, detailed feedback to help aspirants improve their answer writing skills.

Evaluation criteria for UPSC Mains:
1. **Content Quality (40%)**: Accuracy, relevance, depth of analysis, use of facts/data/examples
2. **Structure & Format (25%)**: Introduction, body paragraphs, conclusion, logical flow
3. **Answer Writing Technique (20%)**: Clarity, conciseness, proper headings/subheadings, diagrams if applicable
4. **Language & Presentation (15%)**: Grammar, vocabulary, readability

You must respond with a valid JSON object (no markdown, no code blocks).`;

    const userPrompt = `Evaluate this UPSC Mains answer:

**Question:** ${questionText}
**Question Type:** ${questionType}
**Maximum Marks:** ${maxMarks}
${wordLimit ? `**Word Limit:** ${wordLimit} words` : ""}
${subject ? `**Subject:** ${subject}` : ""}
${topic ? `**Topic:** ${topic}` : ""}
${modelAnswer ? `\n**Model Answer (for reference):**\n${modelAnswer}` : ""}
${keyPoints && keyPoints.length > 0 ? `\n**Key Points Expected:**\n${keyPoints.join("\n")}` : ""}

**Student's Answer:**
${studentAnswer}

Provide your evaluation as a JSON object with this exact structure:
{
  "score": <number between 0 and ${maxMarks}>,
  "percentage": <number 0-100>,
  "overallFeedback": "<2-3 sentence summary of the answer quality>",
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "improvements": ["<specific improvement 1>", "<specific improvement 2>", ...],
  "paragraphAnalysis": [
    {
      "paragraphNumber": 1,
      "content": "<first 50 chars of paragraph>...",
      "feedback": "<specific feedback for this paragraph>",
      "rating": "<good|average|needs_improvement>"
    }
  ],
  "formatSuggestions": "<suggestions for better UPSC answer format, structure, and presentation>",
  "modelComparison": "<if model answer provided, explain gaps and how to bridge them; otherwise suggest ideal answer structure>"
}`;

    console.log("Sending evaluation request to Azure OpenAI...");

    // Azure OpenAI API call - using the configured deployment
    const deploymentName = "gpt-5.2-chat";
    const apiUrl = `${AZURE_ENDPOINT}openai/deployments/${deploymentName}/chat/completions?api-version=2025-04-01-preview`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "api-key": AZURE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_completion_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Azure OpenAI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Azure OpenAI error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response content from AI");
    }

    console.log("Raw AI response received, parsing...");

    // Parse the JSON response
    let evaluation;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        evaluation = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Return a structured error response
      evaluation = {
        score: 0,
        percentage: 0,
        overallFeedback: "Unable to evaluate the answer. Please try again.",
        strengths: [],
        improvements: ["Could not process the evaluation"],
        paragraphAnalysis: [],
        formatSuggestions: "",
        modelComparison: "",
      };
    }

    console.log("Evaluation completed successfully, score:", evaluation.score);

    return new Response(JSON.stringify(evaluation), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in evaluate-answer:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
