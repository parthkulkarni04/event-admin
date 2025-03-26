import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { volunteers, subject, htmlContent, eventId } = await request.json();

    if (!volunteers || !subject || !htmlContent || !eventId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Configure Gmail transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',  // Using Gmail service
      auth: {
        user: process.env.EMAIL_USER,  // Your Gmail address
        pass: process.env.EMAIL_APP_PASSWORD,  // Your Gmail app password (not your regular password)
      },
    });

    // Send emails to all volunteers
    const emailPromises = volunteers.map(async (volunteer: { email: string }) => {
      try {
        await transporter.sendMail({
          from: `"Volunteer Events" <${process.env.EMAIL_USER}>`,  // Using your Gmail address as sender
          to: volunteer.email,
          subject: subject,
          html: htmlContent,
        });
        
        // Check if volunteer_notifications table exists before inserting
        try {
          // Record that an email was sent to this volunteer for this event
          await supabase
            .from('volunteer_notifications')
            .insert({
              volunteer_email: volunteer.email,
              event_id: eventId,
              notification_type: 'new_event',
              sent_at: new Date().toISOString(),
            });
        } catch (dbError) {
          console.warn("Could not record notification in database:", dbError);
          // Continue execution even if the notification recording fails
        }
          
        return { success: true, email: volunteer.email };
      } catch (error) {
        console.error(`Failed to send email to ${volunteer.email}:`, error);
        return { success: false, email: volunteer.email, error };
      }
    });

    // Wait for all emails to be sent
    const results = await Promise.all(emailPromises);
    
    // Update the event record to mark emails as sent
    const { error: updateError } = await supabase
      .from('events')
      .update({ email_sent: true })
      .eq('id', eventId);
    
    if (updateError) {
      console.error('Error updating event email_sent status:', updateError);
    }

    // Count successes and failures
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    return NextResponse.json({
      message: `Emails sent to volunteers: ${successful} successful, ${failed} failed`,
      results
    });
  } catch (error) {
    console.error('Error in send-event-emails API route:', error);
    return NextResponse.json(
      { error: 'Failed to send emails' },
      { status: 500 }
    );
  }
} 