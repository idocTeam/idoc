// src/templates/appointmentBooked.js

const appointmentBookedTemplate = (data = {}) => {
  const {
    patientName = "Patient",
    doctorName = "Doctor",
    appointmentDate = "",
    startTime = "",
    consultationType = "",
    appointmentId = ""
  } = data;

  const subject = "Appointment booked successfully";

  const text = `
Hello ${patientName},

Your appointment has been booked successfully.

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
        <div style="background-color: #00BFA6; height: 6px;"></div>

        <div style="padding: 30px; color: #333333;">
          <div style="margin-bottom: 25px;">
             <span style="color: #0086FF; font-size: 26px; font-weight: bold; display: flex; align-items: center;">
               <span style="margin-right: 8px;">💙</span> IDOC.
             </span>
          </div>

          <h2 style="color: #1a1a1a; margin-top: 0; font-size: 22px;">Appointment Booked!</h2>
          <p style="font-size: 16px;">Hello <strong>${patientName}</strong>,</p>
          <p style="font-size: 15px; color: #666666;">Great news! Your appointment has been successfully placed and is now awaiting confirmation from the doctor.</p>

          <div style="background-color: #f6fff9; border-left: 4px solid #00BFA6; padding: 20px; margin: 25px 0; border-radius: 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #666666; width: 40%; font-size: 14px;"><strong>Doctor</strong></td>
                <td style="padding: 10px 0; font-size: 14px; color: #1a1a1a;">${doctorName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #666666; font-size: 14px;"><strong>Requested Date</strong></td>
                <td style="padding: 10px 0; font-size: 14px; color: #1a1a1a;">${appointmentDate}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #666666; font-size: 14px;"><strong>Requested Time</strong></td>
                <td style="padding: 10px 0; font-size: 14px; color: #1a1a1a;">${startTime}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #666666; font-size: 14px;"><strong>Type</strong></td>
                <td style="padding: 10px 0;">
                  <span style="background: #e0f7f4; color: #00BFA6; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                    ${consultationType}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #666666; font-size: 14px;"><strong>Reference ID</strong></td>
                <td style="padding: 10px 0; font-family: monospace; font-size: 14px; color: #1a1a1a;">#${appointmentId}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background-color: #0086FF; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
              Manage Appointment
            </a>
          </div>

          <p style="font-size: 13px; color: #999999; margin-top: 30px; line-height: 1.5; text-align: center;">
            You will receive another email once the doctor confirms your time slot.<br/>
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

export default appointmentBookedTemplate;