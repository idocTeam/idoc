// src/templates/appointmentRejected.js

const appointmentRejectedTemplate = (data = {}) => {
  const {
    patientName = "Patient",
    doctorName = "Doctor",
    appointmentDate = "",
    startTime = "",
    appointmentId = "",
    reason = "No reason provided"
  } = data;

  const subject = "Your appointment has been rejected";

  const text = `
Hello ${patientName},

We are sorry. Your appointment has been rejected.

Doctor: ${doctorName}
Date: ${appointmentDate}
Time: ${startTime}
Appointment ID: ${appointmentId}
Reason: ${reason}

Thank you,
iDoc Team
  `.trim();

  const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background-color: #FFB300; height: 6px;"></div>

        <div style="padding: 30px; color: #333333;">
          <div style="margin-bottom: 25px;">
             <span style="color: #0086FF; font-size: 26px; font-weight: bold; display: flex; align-items: center;">
               <span style="margin-right: 8px;">💙</span> IDOC.
             </span>
          </div>

          <h2 style="color: #1a1a1a; margin-top: 0; font-size: 22px;">Appointment Update</h2>
          <p style="font-size: 16px;">Hello <strong>${patientName}</strong>,</p>
          <p style="font-size: 15px; color: #666666;">We regret to inform you that your appointment request could not be confirmed for the following reason:</p>

          <div style="background-color: #FFFDE7; border: 1px dashed #FFB300; padding: 15px; border-radius: 8px; margin: 20px 0; color: #856404; font-size: 14px; text-align: center;">
            <strong>Reason:</strong> ${reason}
          </div>

          <div style="background-color: #f9f9f9; border-left: 4px solid #cccccc; padding: 20px; margin: 25px 0; border-radius: 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666666; width: 40%; font-size: 14px;"><strong>Doctor</strong></td>
                <td style="padding: 8px 0; font-size: 14px; color: #1a1a1a;">${doctorName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666666; font-size: 14px;"><strong>Requested Date</strong></td>
                <td style="padding: 8px 0; font-size: 14px; color: #1a1a1a;">${appointmentDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666666; font-size: 14px;"><strong>Requested Time</strong></td>
                <td style="padding: 8px 0; font-size: 14px; color: #1a1a1a;">${startTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666666; font-size: 14px;"><strong>Appointment ID</strong></td>
                <td style="padding: 8px 0; font-family: monospace; font-size: 14px; color: #1a1a1a;">#${appointmentId}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background-color: #0086FF; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
              Find Another Specialist
            </a>
          </div>

          <p style="font-size: 13px; color: #999999; margin-top: 30px; line-height: 1.5; text-align: center;">
            We apologize for any inconvenience. Please feel free to schedule a new session that works for you.<br/>
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

export default appointmentRejectedTemplate;