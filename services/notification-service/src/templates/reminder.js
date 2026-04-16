// src/templates/reminder.js

const reminderTemplate = (data = {}) => {
  const {
    patientName = "Patient",
    doctorName = "Doctor",
    appointmentDate = "",
    startTime = "",
    consultationType = "",
    appointmentId = ""
  } = data;

  const subject = "Appointment reminder";

  const text = `
Hello ${patientName},

This is a reminder for your upcoming appointment.

Doctor: ${doctorName}
Date: ${appointmentDate}
Time: ${startTime}
Consultation Type: ${consultationType}
Appointment ID: ${appointmentId}

Thank you,
iDoc Team
  `.trim();

  const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background-color: #0086FF; height: 6px;"></div>

        <div style="padding: 30px; color: #333333;">
          <div style="margin-bottom: 25px;">
             <span style="color: #0086FF; font-size: 26px; font-weight: bold; display: flex; align-items: center;">
               <span style="margin-right: 8px;">💙</span> IDOC.
             </span>
          </div>

          <h2 style="color: #1a1a1a; margin-top: 0; font-size: 22px;">Appointment Reminder</h2>
          <p style="font-size: 16px;">Hello <strong>${patientName}</strong>,</p>
          <p style="font-size: 15px; color: #666666;">This is a friendly reminder of your upcoming consultation. We've reserved this time specifically for you.</p>

          <div style="background-color: #f8fbff; border: 1px solid #e6f3ff; padding: 20px; margin: 25px 0; border-radius: 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666666; width: 40%; font-size: 14px;"><strong>Doctor</strong></td>
                <td style="padding: 8px 0; font-size: 14px; color: #1a1a1a;">${doctorName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666666; font-size: 14px;"><strong>Date</strong></td>
                <td style="padding: 8px 0; font-size: 14px; color: #1a1a1a;">${appointmentDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666666; font-size: 14px;"><strong>Time</strong></td>
                <td style="padding: 8px 0; font-size: 14px; color: #1a1a1a;">${startTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666666; font-size: 14px;"><strong>Type</strong></td>
                <td style="padding: 8px 0;">
                  <span style="background: #e6f3ff; color: #0086FF; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase;">
                    ${consultationType}
                  </span>
                </td>
              </tr>
            </table>
          </div>

          <div style="padding: 15px; background-color: #fff9eb; border-radius: 8px; font-size: 13px; color: #856404; margin-bottom: 30px;">
            <strong>Quick Tip:</strong> ${consultationType.toLowerCase().includes('tele')
              ? 'Ensure you have a stable internet connection and are in a quiet room 5 minutes before your video call.'
              : 'Please arrive at the clinic 10 minutes early to complete any necessary check-in procedures.'}
          </div>

          <div style="text-align: center; margin: 20px 0;">
            <a href="#" style="background-color: #0086FF; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
              Join / View Session
            </a>
          </div>

          <p style="font-size: 13px; color: #999999; margin-top: 30px; line-height: 1.5; text-align: center;">
            Need to reschedule? Log in to your dashboard at least 4 hours before your slot.<br/>
            <span style="color: #0086FF; font-weight: bold;">iDoc Team 💙</span>
          </p>
        </div>

        <div style="background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999999; border-top: 1px solid #eeeeee;">
          © ${new Date().getFullYear()} iDoc Health Services. All rights reserved.
        </div>
      </div>
    `;

  return { subject, text, html };
};

export default reminderTemplate;