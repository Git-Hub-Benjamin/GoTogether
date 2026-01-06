import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'go_together';
const USERS_COLLECTION = 'users';

let client = null;
let db = null;

/**
 * Connect to MongoDB
 */
export async function connectUserDb() {
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    
    // Create indexes
    const collection = db.collection(USERS_COLLECTION);
    await collection.createIndex({ email: 1 }, { unique: true });
    await collection.createIndex({ createdAt: 1 });
    
    console.log('✅ Connected to MongoDB user database');
    return db;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
}

/**
 * Create a new user account
 * @param {string} email - User email
 * @param {string} school - University name
 * @param {string} state - State
 * @param {string} name - User full name
 * @param {string} password - Optional password (hashed if provided)
 * @param {string} deviceToken - Optional hardware token from device
 * @param {string} platform - 'ios', 'android', or 'web'
 * @param {boolean} notificationsEnabled - Whether to enable notifications on account creation (default: true)
 */
export async function createUser(email, school, state, name, password = null, deviceToken = null, platform = 'web', notificationsEnabled = true) {
  try {
    const collection = db.collection(USERS_COLLECTION);
    
    // Check if user already exists
    const existing = await collection.findOne({ email });
    if (existing) {
      throw new Error('User already exists');
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const user = {
      email,
      school,
      state,
      name,
      passwordEnabled: !!password,
      password: hashedPassword,
      deviceTokens: deviceToken ? [{
        token: deviceToken,
        platform,
        registeredAt: new Date()
      }] : [],
      notificationSettings: {
        emailNotifications: notificationsEnabled,                // Shared: email updates on ride changes
        phoneNotifications: notificationsEnabled && deviceToken ? true : false,                // Mobile only: push notifications for ride updates
        nearbyRides: notificationsEnabled ? false : false,       // Mobile only: notifications for nearby rides (off by default)
        nearbyRidesLocation: null,               // Mobile only: preferred location for nearby rides
        notificationRadius: 50                   // Mobile only: radius in miles for nearby rides
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null
    };

    const result = await collection.insertOne(user);
    console.log(`✅ User created: ${email}`);
    return { ...user, _id: result.insertedId };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * Get user by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User object or null
 */
export async function getUserByEmail(email) {
  try {
    if (!db) {
      console.warn('Database not connected');
      return null;
    }
    const collection = db.collection(USERS_COLLECTION);
    const user = await collection.findOne({ email });
    return user;
  } catch (error) {
    console.error('Error retrieving user:', error);
    return null;
  }
}

/**
 * Verify user password
 * @param {string} email - User email
 * @param {string} password - Plain text password
 * @returns {Promise<boolean>} True if password matches
 */
export async function verifyUserPassword(email, password) {
  try {
    const user = await getUserByEmail(email);
    if (!user || !user.password) {
      return false;
    }
    const isValid = await bcrypt.compare(password, user.password);
    return isValid;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

/**
 * Store or update device token for a user
 * @param {string} email - User email
 * @param {string} deviceToken - Hardware token from device
 * @param {string} platform - 'ios', 'android', or 'web'
 */
export async function addDeviceToken(email, deviceToken, platform = 'web') {
  try {
    const collection = db.collection(USERS_COLLECTION);
    
    const result = await collection.updateOne(
      { email },
      {
        $addToSet: {
          deviceTokens: {
            token: deviceToken,
            platform,
            registeredAt: new Date()
          }
        },
        $set: { updatedAt: new Date() }
      }
    );

    if (result.matchedCount === 0) {
      throw new Error('User not found');
    }

    console.log(`✅ Device token added for ${email}`);
    return result;
  } catch (error) {
    console.error('Error adding device token:', error);
    throw error;
  }
}

/**
 * Get device tokens for a user
 * @param {string} email - User email
 * @returns {Promise<Object[]>} Array of device tokens
 */
export async function getDeviceTokens(email) {
  try {
    const user = await getUserByEmail(email);
    if (!user) {
      return [];
    }
    return user.deviceTokens || [];
  } catch (error) {
    console.error('Error retrieving device tokens:', error);
    return [];
  }
}

/**
 * Get device tokens for multiple users
 * @param {string[]} emails - Array of user emails
 * @returns {Promise<Array>} Array of user objects with device tokens
 */
export async function getMultipleUserDeviceTokens(emails) {
  try {
    const collection = db.collection(USERS_COLLECTION);
    const users = await collection.find({ email: { $in: emails } }).toArray();
    return users;
  } catch (error) {
    console.error('Error retrieving device tokens:', error);
    return [];
  }
}

/**
 * Remove device token for a user
 * @param {string} email - User email
 * @param {string} deviceToken - Token to remove
 */
export async function removeDeviceToken(email, deviceToken) {
  try {
    const collection = db.collection(USERS_COLLECTION);
    await collection.updateOne(
      { email },
      {
        $pull: { deviceTokens: { token: deviceToken } },
        $set: { updatedAt: new Date() }
      }
    );
    console.log(`✅ Device token removed for ${email}`);
  } catch (error) {
    console.error('Error removing device token:', error);
  }
}

/**
 * Update user last login
 * @param {string} email - User email
 */
export async function updateLastLogin(email) {
  try {
    const collection = db.collection(USERS_COLLECTION);
    await collection.updateOne(
      { email },
      { $set: { lastLogin: new Date() } }
    );
  } catch (error) {
    console.error('Error updating last login:', error);
  }
}

/**
 * Check if user exists
 * @param {string} email - User email
 * @returns {Promise<boolean>}
 */
export async function userExists(email) {
  try {
    const user = await getUserByEmail(email);
    return !!user;
  } catch (error) {
    console.error('Error checking if user exists:', error);
    return false;
  }
}

/**
 * Update user profile information (name, password, notification settings)
 * @param {string} email - User email
 * @param {object} updates - Object with fields to update (name, passwordEnabled, password, notificationSettings)
 * @returns {Promise<object>} - Updated user object or null if not found
 */
export async function updateUserProfile(email, updates = {}) {
  try {
    if (!db) throw new Error('Database not connected');
    
    const usersCollection = db.collection('users');
    
    // Prepare update object
    const updateDoc = { updatedAt: new Date() };
    
    if (updates.name !== undefined) {
      updateDoc.name = updates.name;
    }
    
    if (updates.passwordEnabled !== undefined) {
      updateDoc.passwordEnabled = updates.passwordEnabled;
    }
    
    if (updates.password !== undefined) {
      // Hash password with bcrypt if provided
      updateDoc.password = updates.password; // Already hashed by caller
    }
    
    // Handle notification settings updates
    if (updates.notificationSettings !== undefined) {
      // Merge with existing settings to preserve unmodified fields
      const currentUser = await usersCollection.findOne({ email });
      const existingSettings = currentUser?.notificationSettings || {};
      updateDoc.notificationSettings = {
        ...existingSettings,
        ...updates.notificationSettings
      };
    }
    
    const result = await usersCollection.findOneAndUpdate(
      { email },
      { $set: updateDoc },
      { returnDocument: 'after' }
    );
    
    const updatedUser = result.value || result;
    
    if (!updatedUser) {
      console.error('Update failed: no user returned', { email });
      return null;
    }
    
    // Return sanitized user object (without password)
    return {
      email: updatedUser.email,
      name: updatedUser.name,
      school: updatedUser.school,
      state: updatedUser.state,
      passwordEnabled: updatedUser.passwordEnabled,
      notificationSettings: updatedUser.notificationSettings,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    };
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

/**
 * Delete user account
 * @param {string} email - User's email
 * @returns {Promise<boolean>} - True if deleted, false otherwise
 */
export async function deleteUser(email) {
  try {
    if (!db) throw new Error('Database not connected');
    
    const usersCollection = db.collection('users');
    
    const result = await usersCollection.deleteOne({ email });
    
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

/**
 * Get user notification settings
 * @param {string} email - User email
 * @returns {Promise<object|null>} - Notification settings or null if not found
 */
export async function getNotificationSettings(email) {
  try {
    const user = await getUserByEmail(email);
    if (!user) {
      return null;
    }
    
    // Return settings with defaults if not set
    return {
      emailNotifications: user.notificationSettings?.emailNotifications ?? true,
      phoneNotifications: user.notificationSettings?.phoneNotifications ?? true,
      nearbyRides: user.notificationSettings?.nearbyRides ?? true,
      nearbyRidesLocation: user.notificationSettings?.nearbyRidesLocation ?? null,
      notificationRadius: user.notificationSettings?.notificationRadius ?? 50
    };
  } catch (error) {
    console.error('Error retrieving notification settings:', error);
    return null;
  }
}

/**
 * Update user notification settings
 * @param {string} email - User email
 * @param {object} settings - Notification settings to update
 * @returns {Promise<object|null>} - Updated notification settings or null if not found
 */
export async function updateNotificationSettings(email, settings = {}) {
  try {
    if (!db) throw new Error('Database not connected');
    
    const usersCollection = db.collection('users');
    
    // Get current settings
    const user = await usersCollection.findOne({ email });
    if (!user) {
      return null;
    }
    
    const currentSettings = user.notificationSettings || {};
    
    // Merge new settings with existing ones
    const updatedSettings = {
      ...currentSettings,
      ...settings
    };
    
    const result = await usersCollection.findOneAndUpdate(
      { email },
      {
        $set: {
          notificationSettings: updatedSettings,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );
    
    const updatedUser = result.value || result;
    return updatedUser?.notificationSettings || null;
  } catch (error) {
    console.error('Error updating notification settings:', error);
    throw error;
  }
}

/**
 * Close MongoDB connection
 */
export async function closeUserDb() {
  try {
    if (client) {
      await client.close();
      console.log('✅ Closed MongoDB connection');
    }
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
}
