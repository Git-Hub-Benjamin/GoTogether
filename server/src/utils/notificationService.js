import { getDeviceTokens } from './userDb.js';
import { sendEmail } from './emailService.js';

/**
 * Check if current time is within notification window
 * @param {string} departureTime - Time in HH:mm format
 * @param {string} departureDate - Date in YYYY-MM-DD format
 * @param {number} hoursWindow - Hours after departure to allow notifications
 * @returns {boolean}
 */
export function isWithinNotificationWindow(departureTime, departureDate, hoursWindow = 1) {
  try {
    const [hours, minutes] = departureTime.split(':').map(Number);
    const departureDateTime = new Date(departureDate);
    departureDateTime.setHours(hours, minutes, 0, 0);
    
    const now = new Date();
    const timeUntilDeparture = departureDateTime - now;
    const windowMillis = hoursWindow * 60 * 60 * 1000;
    
    // Returns true if we're within the window (before departure + hoursWindow after)
    return timeUntilDeparture <= windowMillis && now <= departureDateTime;
  } catch (error) {
    console.error('Error calculating notification window:', error);
    return false;
  }
}

/**
 * Send notification to users
 * Sends both email and push notification if user has device token
 * @param {string[]} emails - Recipient emails
 * @param {string} subject - Email subject
 * @param {string} htmlContent - Email HTML content
 * @param {Object} pushData - Push notification data { title, body, data? }
 */
export async function sendNotifications(emails, subject, htmlContent, pushData) {
  if (!Array.isArray(emails)) {
    emails = [emails];
  }

  const validEmails = emails.filter(email => email && typeof email === 'string');
  if (validEmails.length === 0) {
    console.warn('No valid emails to send notifications to');
    return;
  }

  // Send emails
  for (const email of validEmails) {
    try {
      await sendEmail(email, subject, htmlContent);
      console.log(`✅ Email sent to ${email}`);
    } catch (error) {
      console.error(`Error sending email to ${email}:`, error);
    }
  }
  
  // Send push notifications
  const usersWithTokens = await getDeviceTokens(validEmails);
  for (const user of usersWithTokens) {
    try {
      if (user.deviceTokens && Array.isArray(user.deviceTokens)) {
        for (const deviceTokenObj of user.deviceTokens) {
          console.log(`📱 Push notification queued for ${user.email} on ${deviceTokenObj.platform}`);
          // TODO: Integrate with Firebase Cloud Messaging
          // await sendPushNotification(deviceTokenObj.token, deviceTokenObj.platform, pushData);
        }
      }
    } catch (error) {
      console.error(`Error sending push notification to ${user.email}:`, error);
    }
  }
}

/**
 * Send ride deletion notifications
 */
export async function notifyRideDeletion(affectedUsers, ride) {
  const isTimeValid = isWithinNotificationWindow(ride.departureTime, ride.departureDate);
  
  if (!isTimeValid) {
    console.log('ℹ️ Ride deletion outside notification window, skipping notifications');
    return;
  }

  const subject = '🚗 Ride Cancelled';
  const htmlContent = `
    <h2>Ride Cancelled</h2>
    <p>The following ride has been cancelled:</p>
    <ul>
      <li><strong>From:</strong> ${ride.from}</li>
      <li><strong>To:</strong> ${ride.destination}</li>
      <li><strong>Date:</strong> ${ride.departureDate}</li>
      <li><strong>Time:</strong> ${ride.departureTime}</li>
      <li><strong>Distance:</strong> ${ride.distance} miles</li>
    </ul>
  `;

  const pushData = {
    title: 'Ride Cancelled',
    body: `${ride.from} → ${ride.destination}`,
    rideId: ride.id,
  };

  await sendNotifications(affectedUsers, subject, htmlContent, pushData);
}

/**
 * Send join request approval notification
 */
export async function notifyJoinApproved(requesterEmail, ride) {
  const subject = '✅ Your Join Request Was Approved';
  const htmlContent = `
    <h2>You've Been Approved!</h2>
    <p>Your request to join a ride has been approved.</p>
    <ul>
      <li><strong>From:</strong> ${ride.from}</li>
      <li><strong>To:</strong> ${ride.destination}</li>
      <li><strong>Date:</strong> ${ride.departureDate}</li>
      <li><strong>Time:</strong> ${ride.departureTime}</li>
      <li><strong>Driver:</strong> ${ride.driverEmail}</li>
    </ul>
  `;

  const pushData = {
    title: 'Request Approved',
    body: `Join ${ride.from} → ${ride.destination}`,
    rideId: ride.id,
  };

  await sendNotifications(requesterEmail, subject, htmlContent, pushData);
}

/**
 * Send join request rejection notification
 */
export async function notifyJoinRejected(requesterEmail, ride) {
  const subject = '❌ Your Join Request Was Rejected';
  const htmlContent = `
    <h2>Request Not Approved</h2>
    <p>Unfortunately, your request to join the following ride was rejected:</p>
    <ul>
      <li><strong>From:</strong> ${ride.from}</li>
      <li><strong>To:</strong> ${ride.destination}</li>
      <li><strong>Date:</strong> ${ride.departureDate}</li>
      <li><strong>Time:</strong> ${ride.departureTime}</li>
    </ul>
  `;

  const pushData = {
    title: 'Request Rejected',
    body: `${ride.from} → ${ride.destination}`,
    rideId: ride.id,
  };

  await sendNotifications(requesterEmail, subject, htmlContent, pushData);
}

/**
 * Send passenger removed notification
 */
export async function notifyPassengerRemoved(passengerEmail, ride, driverEmail) {
  const subject = '🚗 You Were Removed From a Ride';
  const htmlContent = `
    <h2>Removed From Ride</h2>
    <p>You have been removed from the following ride:</p>
    <ul>
      <li><strong>From:</strong> ${ride.from}</li>
      <li><strong>To:</strong> ${ride.destination}</li>
      <li><strong>Date:</strong> ${ride.departureDate}</li>
      <li><strong>Time:</strong> ${ride.departureTime}</li>
      <li><strong>Driver:</strong> ${driverEmail}</li>
    </ul>
  `;

  const pushData = {
    title: 'Removed From Ride',
    body: `${ride.from} → ${ride.destination}`,
    rideId: ride.id,
  };

  await sendNotifications(passengerEmail, subject, htmlContent, pushData);
}

/**
 * Send passenger left notification to driver
 */
export async function notifyPassengerLeft(driverEmail, ride, passengerEmail) {
  const subject = '👋 A Passenger Left Your Ride';
  const htmlContent = `
    <h2>Passenger Left</h2>
    <p>A passenger has left your ride:</p>
    <ul>
      <li><strong>Passenger:</strong> ${passengerEmail}</li>
      <li><strong>From:</strong> ${ride.from}</li>
      <li><strong>To:</strong> ${ride.destination}</li>
      <li><strong>Date:</strong> ${ride.departureDate}</li>
      <li><strong>Time:</strong> ${ride.departureTime}</li>
      <li><strong>Remaining Passengers:</strong> ${ride.passengers?.length || 0}</li>
    </ul>
  `;

  const pushData = {
    title: 'Passenger Left',
    body: `${passengerEmail} left ${ride.from} → ${ride.destination}`,
    rideId: ride.id,
  };

  await sendNotifications(driverEmail, subject, htmlContent, pushData);
}
