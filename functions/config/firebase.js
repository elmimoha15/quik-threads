const admin = require('firebase-admin');
const functions = require('firebase-functions');
const path = require('path');

// Initialize Firebase Admin SDK with service account
if (!admin.apps.length) {
  const serviceAccount = require('../quik-threads-5f5e9-firebase-adminsdk-fbsvc-6815bd9c29.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'quik-threads-5f5e9',
    storageBucket: 'quik-threads-5f5e9.appspot.com'
  });
}

// Get Firestore database instance
const db = admin.firestore();

// Get Firebase Storage instance
const storage = admin.storage();

// Get Firebase Auth instance
const auth = admin.auth();

// Helper function to get server timestamp
const getTimestamp = () => admin.firestore.FieldValue.serverTimestamp();

// Server timestamp alias for consistency
const serverTimestamp = () => admin.firestore.FieldValue.serverTimestamp();

// Helper function to generate unique ID
const generateId = () => db.collection('temp').doc().id;

// Helper function to get current time as Date object
const getCurrentTime = () => new Date();

// Helper function to add time to current date
const addTimeToDate = (date, amount, unit) => {
  const newDate = new Date(date);
  switch (unit) {
    case 'minutes':
      newDate.setMinutes(newDate.getMinutes() + amount);
      break;
    case 'hours':
      newDate.setHours(newDate.getHours() + amount);
      break;
    case 'days':
      newDate.setDate(newDate.getDate() + amount);
      break;
    case 'months':
      newDate.setMonth(newDate.getMonth() + amount);
      break;
    default:
      throw new Error(`Unsupported time unit: ${unit}`);
  }
  return newDate;
};

module.exports = {
  admin,
  db,
  storage,
  auth,
  getTimestamp,
  serverTimestamp,
  generateId,
  getCurrentTime,
  addTimeToDate
};
