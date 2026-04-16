// src/templates/appointmentAccepted.js

const appointmentAcceptedTemplate = (data = {}) => {
  const {
    patientName = "Patient",
    doctorName = "Doctor",
    appointmentDate = "",
    startTime = "",
    consultationType = "",
    appointmentId = ""
  } = data;

  const subject = "Your appointment has been accepted";

  const text = `
Hello ${patientName},

Your appointment has been accepted.

Doctor: ${doctorName}
Date: ${appointmentDate}
Time: ${startTime}
Consultation Type: ${consultationType}
Appointment ID: ${appointmentId}

Thank you,
iDoc Team
  `.trim();

  const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #0086FF; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Appointment Confirmed</h1>
        </div>

        <div style="padding: 30px; color: #333333;">
          <p style="font-size: 16px;">Hello <strong>${patientName}</strong>,</p>
          <p style="font-size: 15px; color: #666666;">Your appointment request has been accepted. Here are your session details:</p>

          <div style="background-color: #f8fbff; border-left: 4px solid #0086FF; padding: 20px; margin: 25px 0; border-radius: 4px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666666; width: 40%;"><strong>Doctor</strong></td>
                <td style="padding: 8px 0;">${doctorName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666666;"><strong>Date & Time</strong></td>
                <td style="padding: 8px 0;">${appointmentDate} at ${startTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666666;"><strong>Type</strong></td>
                <td style="padding: 8px 0; display: inline-block; background: #e6f3ff; color: #0086FF; padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                  ${consultationType}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666666;"><strong>Appointment ID</strong></td>
                <td style="padding: 8px 0; font-family: monospace; color: #000;">#${appointmentId}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 14px; color: #999999; margin-top: 30px;">
            Thank you for choosing <strong>iDoc</strong>.<br/>
            <em>Helping you connect with experts, anywhere.</em>
          </p>
        </div>

        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #999999;">
          © ${new Date().getFullYear()} iDoc Health Services. All rights reserved.
        </div>
      </div>
    `;


  return { subject, text, html };
};

export default appointmentAcceptedTemplate;