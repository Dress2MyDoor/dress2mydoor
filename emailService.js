import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configure email transporter
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Send booking confirmation email
export async function sendBookingConfirmation(bookingData) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: bookingData.email,
        subject: 'Booking Confirmation - Dress2MyDoor',
        html: `
            <h2>Booking Confirmation</h2>
            <p>Dear ${bookingData.name},</p>
            <p>Thank you for requesting a booking with Dress2MyDoor!</p>
            <h3>Booking Details:</h3>
            <ul>
                <li><strong>Date:</strong> ${new Date(bookingData.date).toLocaleDateString()}</li>
                <li><strong>Time:</strong> ${bookingData.time}</li>
                <li><strong>Phone:</strong> ${bookingData.phone}</li>
            </ul>
            <p>We will confirm your appointment shortly. If you have any questions, please don't hesitate to contact us.</p>
            <p>Best regards,<br/>Dress2MyDoor Team</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Booking confirmation email sent to:', bookingData.email);
    } catch (error) {
        console.error('Error sending booking email:', error);
        throw error;
    }
}

// Send contact form confirmation email
export async function sendContactConfirmation(contactData) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: contactData.email,
        subject: 'We Received Your Message - Dress2MyDoor',
        html: `
            <h2>Message Received</h2>
            <p>Dear ${contactData.name},</p>
            <p>Thank you for contacting Dress2MyDoor! We have received your message and will get back to you as soon as possible.</p>
            <h3>Your Message:</h3>
            <p>${contactData.message}</p>
            <p>We appreciate your interest and will respond within 24-48 hours.</p>
            <p>Best regards,<br/>Dress2MyDoor Team</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Contact confirmation email sent to:', contactData.email);
    } catch (error) {
        console.error('Error sending contact email:', error);
        throw error;
    }
}

// Send admin notification for new booking
export async function notifyAdminBooking(bookingData) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: 'New Booking Request - Dress2MyDoor',
        html: `
            <h2>New Booking Request</h2>
            <p><strong>Name:</strong> ${bookingData.name}</p>
            <p><strong>Email:</strong> ${bookingData.email}</p>
            <p><strong>Phone:</strong> ${bookingData.phone}</p>
            <p><strong>Date:</strong> ${new Date(bookingData.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${bookingData.time}</p>
            <p><strong>Message:</strong> ${bookingData.message || 'No additional notes'}</p>
            <p>Please log in to the admin panel to confirm or decline this booking.</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Admin notification sent for new booking');
    } catch (error) {
        console.error('Error sending admin notification:', error);
    }
}

// Send admin notification for new contact
export async function notifyAdminContact(contactData) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: 'New Contact Form Submission - Dress2MyDoor',
        html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${contactData.name}</p>
            <p><strong>Email:</strong> ${contactData.email}</p>
            <p><strong>Phone:</strong> ${contactData.phone || 'Not provided'}</p>
            <p><strong>Message:</strong></p>
            <p>${contactData.message}</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Admin notification sent for new contact submission');
    } catch (error) {
        console.error('Error sending admin notification:', error);
    }
}
