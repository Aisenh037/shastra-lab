import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubmissionData {
  id: string;
  score: number | null;
  max_score: number | null;
  created_at: string;
  question_id: string | null;
  practice_questions?: {
    subject: string | null;
    topic: string | null;
    question_text: string;
  }[] | null;
}

interface ReportRequest {
  user_id?: string;
  report_type: 'weekly' | 'monthly' | 'manual';
  email?: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, report_type, email: requestEmail }: ReportRequest = await req.json();

    // Get auth header for manual reports
    const authHeader = req.headers.get("Authorization");
    let targetUserId = user_id;
    let targetEmail = requestEmail;

    if (authHeader && !user_id) {
      const token = authHeader.replace("Bearer ", "");
      const { data, error: authError } = await supabase.auth.getClaims(token);
      if (authError || !data?.claims) {
        console.error("Auth error:", authError);
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      targetUserId = data.claims.sub as string;
      targetEmail = requestEmail || (data.claims.email as string);
    }

    if (!targetUserId || !targetEmail) {
      return new Response(JSON.stringify({ error: "User ID and email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate date range based on report type
    const now = new Date();
    let startDate: Date;
    let periodLabel: string;

    if (report_type === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      periodLabel = 'Last 30 Days';
    } else {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      periodLabel = 'Last 7 Days';
    }

    console.log(`Generating ${report_type} report for user ${targetUserId} from ${startDate.toISOString()}`);

    // Fetch submissions for the period
    const { data: submissions, error: submissionsError } = await supabase
      .from('answer_submissions')
      .select(`
        id,
        score,
        max_score,
        created_at,
        question_id,
        practice_questions (
          subject,
          topic,
          question_text
        )
      `)
      .eq('user_id', targetUserId)
      .eq('status', 'evaluated')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (submissionsError) {
      console.error("Error fetching submissions:", submissionsError);
      throw submissionsError;
    }

    const typedSubmissions = submissions as SubmissionData[];

    // Calculate statistics
    const totalSubmissions = typedSubmissions.length;
    const scoredSubmissions = typedSubmissions.filter(s => s.score !== null && s.max_score !== null);
    
    let averageScore = 0;
    let highestScore = 0;
    let lowestScore = 100;
    
    if (scoredSubmissions.length > 0) {
      const percentages = scoredSubmissions.map(s => (s.score! / s.max_score!) * 100);
      averageScore = Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length);
      highestScore = Math.round(Math.max(...percentages));
      lowestScore = Math.round(Math.min(...percentages));
    }

    // Group by subject
    const subjectStats: Record<string, { count: number; totalScore: number; totalMax: number }> = {};
    typedSubmissions.forEach(s => {
      const pq = Array.isArray(s.practice_questions) ? s.practice_questions[0] : s.practice_questions;
      const subject = pq?.subject || 'General';
      if (!subjectStats[subject]) {
        subjectStats[subject] = { count: 0, totalScore: 0, totalMax: 0 };
      }
      subjectStats[subject].count++;
      if (s.score !== null && s.max_score !== null) {
        subjectStats[subject].totalScore += s.score;
        subjectStats[subject].totalMax += s.max_score;
      }
    });

    // Group by topic
    const topicStats: Record<string, number> = {};
    typedSubmissions.forEach(s => {
      const pq = Array.isArray(s.practice_questions) ? s.practice_questions[0] : s.practice_questions;
      const topic = pq?.topic || 'General';
      topicStats[topic] = (topicStats[topic] || 0) + 1;
    });

    const topTopics = Object.entries(topicStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Generate subject performance HTML
    const subjectRows = Object.entries(subjectStats)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([subject, stats]) => {
        const avgPercent = stats.totalMax > 0 
          ? Math.round((stats.totalScore / stats.totalMax) * 100) 
          : 0;
        return `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">${subject}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: center;">${stats.count}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: center;">${avgPercent}%</td>
          </tr>
        `;
      })
      .join('');

    // Generate topics HTML
    const topicsHtml = topTopics.map(([topic, count]) => 
      `<span style="display: inline-block; background: #f0f0f0; padding: 6px 12px; border-radius: 16px; margin: 4px; font-size: 14px;">${topic}: ${count}</span>`
    ).join('');

    // Improvement suggestions based on performance
    let improvementTips = '';
    if (averageScore < 50) {
      improvementTips = `
        <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 16px; margin-top: 20px;">
          <h3 style="color: #856404; margin: 0 0 10px 0;">💡 Improvement Tips</h3>
          <ul style="color: #856404; margin: 0; padding-left: 20px;">
            <li>Focus on understanding core concepts before attempting complex questions</li>
            <li>Review model answers after each practice session</li>
            <li>Try to practice consistently every day</li>
          </ul>
        </div>
      `;
    } else if (averageScore < 70) {
      improvementTips = `
        <div style="background: #cce5ff; border: 1px solid #0d6efd; border-radius: 8px; padding: 16px; margin-top: 20px;">
          <h3 style="color: #004085; margin: 0 0 10px 0;">💡 Growth Tips</h3>
          <ul style="color: #004085; margin: 0; padding-left: 20px;">
            <li>Work on structuring your answers better</li>
            <li>Include more specific examples and data points</li>
            <li>Practice time management with timed sessions</li>
          </ul>
        </div>
      `;
    } else {
      improvementTips = `
        <div style="background: #d4edda; border: 1px solid #28a745; border-radius: 8px; padding: 16px; margin-top: 20px;">
          <h3 style="color: #155724; margin: 0 0 10px 0;">🌟 Excellent Progress!</h3>
          <p style="color: #155724; margin: 0;">Keep up the great work! Consider challenging yourself with harder topics or mock tests.</p>
        </div>
      `;
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📊 Your ${periodLabel} Progress Report</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">ExamAnalyzer Performance Insights</p>
          </div>
          
          <!-- Summary Stats -->
          <div style="padding: 30px;">
            <div style="display: flex; justify-content: space-around; text-align: center; margin-bottom: 30px;">
              <div style="flex: 1; padding: 15px;">
                <div style="font-size: 36px; font-weight: bold; color: #667eea;">${totalSubmissions}</div>
                <div style="color: #666; font-size: 14px;">Submissions</div>
              </div>
              <div style="flex: 1; padding: 15px; border-left: 1px solid #e5e5e5; border-right: 1px solid #e5e5e5;">
                <div style="font-size: 36px; font-weight: bold; color: #28a745;">${averageScore}%</div>
                <div style="color: #666; font-size: 14px;">Avg Score</div>
              </div>
              <div style="flex: 1; padding: 15px;">
                <div style="font-size: 36px; font-weight: bold; color: #764ba2;">${Object.keys(subjectStats).length}</div>
                <div style="color: #666; font-size: 14px;">Subjects</div>
              </div>
            </div>

            ${scoredSubmissions.length > 0 ? `
            <!-- Score Range -->
            <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 10px 0; color: #333;">Score Range</h3>
              <p style="margin: 0; color: #666;">Highest: <strong style="color: #28a745;">${highestScore}%</strong> | Lowest: <strong style="color: #dc3545;">${lowestScore}%</strong></p>
            </div>
            ` : ''}

            ${Object.keys(subjectStats).length > 0 ? `
            <!-- Subject Performance -->
            <h3 style="color: #333; margin: 20px 0 10px 0;">Performance by Subject</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f8f9fa;">
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e5e5;">Subject</th>
                  <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e5e5;">Submissions</th>
                  <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e5e5;">Avg Score</th>
                </tr>
              </thead>
              <tbody>
                ${subjectRows}
              </tbody>
            </table>
            ` : ''}

            ${topTopics.length > 0 ? `
            <!-- Top Topics -->
            <h3 style="color: #333; margin: 20px 0 10px 0;">Topics Practiced</h3>
            <div>${topicsHtml}</div>
            ` : ''}

            ${improvementTips}

            ${totalSubmissions === 0 ? `
            <div style="text-align: center; padding: 40px 20px;">
              <p style="color: #666; font-size: 16px;">You haven't submitted any answers this period.</p>
              <p style="color: #888; font-size: 14px;">Start practicing to see your progress here!</p>
            </div>
            ` : ''}
          </div>

          <!-- Footer -->
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e5e5e5;">
            <p style="margin: 0; color: #666; font-size: 12px;">
              This report was generated automatically by ExamAnalyzer.<br>
              Keep practicing to improve your scores!
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "ExamAnalyzer <onboarding@resend.dev>",
      to: [targetEmail],
      subject: `📊 Your ${periodLabel} Progress Report - ExamAnalyzer`,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      throw emailError;
    }

    console.log("Email sent successfully:", emailData);

    // Update last_sent_at if preferences exist
    if (report_type !== 'manual') {
      await supabase
        .from('email_report_preferences')
        .update({ last_sent_at: new Date().toISOString() })
        .eq('user_id', targetUserId);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Report sent successfully",
        stats: { totalSubmissions, averageScore, subjectsCount: Object.keys(subjectStats).length }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-progress-report:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send report" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
