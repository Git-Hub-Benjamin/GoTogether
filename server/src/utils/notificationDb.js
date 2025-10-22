import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'go_together';
const NOTIFICATIONS_COLLECTION = 'deviceTokens';

let client = null;
let db = null;

/**
 * Connect to MongoDB
 */
export async function connectNotificationDb() {
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    
    // Create indexes
    const collection = db.collection(NOTIFICATIONS_COLLECTION);
    await collection.createIndex({ email: 1 }, { unique: true });
    
    console.log('✅ Connected to MongoDB notification database');
    return db;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
}

/**
 * Store or update device token for a user
 * @param {string} email - User email
 * @param {string} deviceToken - Hardware token from device
 * @param {string} platform - 'ios' or 'android'
 */
export async function storeDeviceToken(email, deviceToken, platform) {
  try {
    const collection = db.collection(NOTIFICATIONS_COLLECTION);
    const result = await collection.updateOne(
      { email },
      {
        $set: {
          email,
          deviceToken,
          platform,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
    console.log(`✅ Device token stored for ${email}`);
    return result;
  } catch (error) {
    console.error('Error storing device token:', error);
    throw error;
  }
}

/**
 * Get device token for a user
 * @param {string} email - User email
 * @returns {Promise<Object|null>} Device token object or null
 */
export async function getDeviceToken(email) {
  try {
    const collection = db.collection(NOTIFICATIONS_COLLECTION);
    const result = await collection.findOne({ email });
    return result;
  } catch (error) {
    console.error('Error retrieving device token:', error);
    return null;
  }
}

/**
 * Get device tokens for multiple users
 * @param {string[]} emails - Array of user emails
 * @returns {Promise<Object[]>} Array of device token objects
 */
export async function getDeviceTokens(emails) {
  try {
    const collection = db.collection(NOTIFICATIONS_COLLECTION);
    const results = await collection.find({ email: { $in: emails } }).toArray();
    return results;
  } catch (error) {
    console.error('Error retrieving device tokens:', error);
    return [];
  }
}

/**
 * Remove device token for a user
 * @param {string} email - User email
 */
export async function removeDeviceToken(email) {
  try {
    const collection = db.collection(NOTIFICATIONS_COLLECTION);
    await collection.deleteOne({ email });
    console.log(`✅ Device token removed for ${email}`);
  } catch (error) {
    console.error('Error removing device token:', error);
  }
}

/**
 * Check if an email has a registered device token
 * @param {string} email - User email
 * @returns {Promise<boolean>} True if email exists in database
 */
export async function emailHasDeviceToken(email) {
  try {
    if (!db) {
      console.warn('Notification database not connected');
      return false;
    }
    const collection = db.collection(NOTIFICATIONS_COLLECTION);
    const result = await collection.findOne({ email });
    return !!result;
  } catch (error) {
    console.error('Error checking if email has device token:', error);
    return false;
  }
}

/**
 * Close MongoDB connection
 */
export async function closeNotificationDb() {
  try {
    if (client) {
      await client.close();
      console.log('✅ Closed MongoDB connection');
    }
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
}
