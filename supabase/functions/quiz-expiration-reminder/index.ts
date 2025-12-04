import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const now = new Date()
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
    const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000)

    // Get quizzes expiring in 2 days
    const { data: twoDayQuizzes, error: twoDayError } = await supabaseClient
      .from('quizzes')
      .select('id, title, due_date, classroom_id')
      .gte('due_date', now.toISOString())
      .lte('due_date', twoDaysFromNow.toISOString())

    if (twoDayError) throw twoDayError

    // Get quizzes expiring in 3 hours
    const { data: threeHourQuizzes, error: threeHourError } = await supabaseClient
      .from('quizzes')
      .select('id, title, due_date, classroom_id')
      .gte('due_date', now.toISOString())
      .lte('due_date', threeHoursFromNow.toISOString())

    if (threeHourError) throw threeHourError

    const notifications: any[] = []

    // Process 2-day reminders
    for (const quiz of twoDayQuizzes || []) {
      const { data: members } = await supabaseClient
        .from('classroom_members')
        .select('student_id')
        .eq('classroom_id', quiz.classroom_id)

      // Check if notification already sent
      const { data: existingNotif } = await supabaseClient
        .from('notifications')
        .select('id')
        .eq('type', 'quiz_reminder_2days')
        .contains('message', quiz.title)
        .limit(1)

      if (!existingNotif || existingNotif.length === 0) {
        members?.forEach(member => {
          notifications.push({
            user_id: member.student_id,
            title: 'Quiz Reminder',
            message: `The quiz "${quiz.title}" is due in 2 days`,
            type: 'quiz_reminder_2days',
            link: `/student/classroom/${quiz.classroom_id}`,
          })
        })
      }
    }

    // Process 3-hour reminders
    for (const quiz of threeHourQuizzes || []) {
      const { data: members } = await supabaseClient
        .from('classroom_members')
        .select('student_id')
        .eq('classroom_id', quiz.classroom_id)

      // Check if notification already sent
      const { data: existingNotif } = await supabaseClient
        .from('notifications')
        .select('id')
        .eq('type', 'quiz_reminder_3hours')
        .contains('message', quiz.title)
        .limit(1)

      if (!existingNotif || existingNotif.length === 0) {
        members?.forEach(member => {
          notifications.push({
            user_id: member.student_id,
            title: '⚠️ Quiz Due Soon',
            message: `The quiz "${quiz.title}" is due in 3 hours! Complete it now!`,
            type: 'quiz_reminder_3hours',
            link: `/student/classroom/${quiz.classroom_id}`,
          })
        })
      }
    }

    // Insert all notifications
    if (notifications.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('notifications')
        .insert(notifications)

      if (insertError) throw insertError
    }

    return new Response(
      JSON.stringify({
        success: true,
        notificationsSent: notifications.length,
        twoDayQuizzes: twoDayQuizzes?.length || 0,
        threeHourQuizzes: threeHourQuizzes?.length || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
