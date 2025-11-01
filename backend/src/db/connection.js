const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// MongoDB connection state
let isConnected = false;

/**
 * Connect to MongoDB database
 * Database name "education" will be created automatically
 */
const connectDatabase = async () => {
  // If already connected, return
  if (isConnected) {
    return;
  }

  try {
    // Get MongoDB URI from environment variables based on NODE_ENV
    const isProduction = process.env.NODE_ENV === "production";
    const mongoURI = isProduction
      ? process.env.PROD_MONGODB_URI || "mongodb://localhost:27017/education"
      : process.env.DEV_MONGODB_URI || "mongodb://localhost:27017/education";

    console.log("Connecting to MongoDB...");

    // Connect to MongoDB
    const connection = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    console.log("MongoDB connected successfully");

    // Listen for connection events
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
      isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected");
      isConnected = false;
    });

    // Initialize database (create collections if needed)
    await initializeDatabase();

    return connection;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
    console.error("Make sure MongoDB is running and MONGODB_URI is correct");
    isConnected = false;
    // Don't exit process, continue with limited functionality
    // process.exit(1);
  }
};

/**
 * Initialize database collections and indexes
 */
const initializeDatabase = async () => {
  try {
    console.log("Initializing database...");
    const db = mongoose.connection.db;

    // Get list of existing collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    // Collections to create - only users collection needed for admin data
    const requiredCollections = ["users"];

    for (const collectionName of requiredCollections) {
      if (!collectionNames.includes(collectionName)) {
        await db.createCollection(collectionName);
      }
    }

    // Create indexes for better performance
    await createIndexes();

    // Create default admin user
    await createDefaultAdmin();

    console.log("Database initialization completed");
  } catch (error) {
    console.error("Database initialization error:", error.message);
  }
};

/**
 * Create database indexes for optimal performance
 */
const createIndexes = async () => {
  try {
    const db = mongoose.connection.db;

    // Users collection indexes only
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("users").createIndex({ username: 1 }, { unique: true });
    await db.collection("users").createIndex({ role: 1 });

    // Other collections (profiles, courses, materials) will be created when needed
    // and their indexes will be created by their respective model schemas
  } catch (error) {
    // Ignore duplicate key errors (indexes already exist)
    if (error.code !== 11000) {
      console.error("Index creation warning:", error.message);
    }
  }
};

/**
 * Create default admin user
 */
const createDefaultAdmin = async () => {
  try {
    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");

    // Admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL || "hayatenara8888@gmail.com";
    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    const adminRole = process.env.ADMIN_ROLE || "admin";

    // Check if admin user already exists
    const existingAdmin = await usersCollection.findOne({
      $or: [{ email: adminEmail }, { username: adminUsername }],
    });

    if (existingAdmin) {
      console.log("Admin user already exists");
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create admin user with simplified schema
    const adminUser = {
      email: adminEmail,
      password: hashedPassword,
      username: adminUsername,
      role: adminRole,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await usersCollection.insertOne(adminUser);
    console.log("Default admin user created");
  } catch (error) {
    console.error("Error creating admin user:", error.message);
  }
};

/**
 * Disconnect from MongoDB
 */
const disconnectDatabase = async () => {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log("MongoDB disconnected");
  }
};

/**
 * Get database statistics
 */
const getDatabaseStats = async () => {
  try {
    const db = mongoose.connection.db;
    const stats = await db.stats();

    return {
      database: db.databaseName,
      collections: stats.collections,
      dataSize: `${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`,
      indexSize: `${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`,
      totalSize: `${((stats.dataSize + stats.indexSize) / 1024 / 1024).toFixed(
        2
      )} MB`,
    };
  } catch (error) {
    console.error("Error getting database stats:", error);
    return null;
  }
};

module.exports = {
  connectDatabase,
  disconnectDatabase,
  getDatabaseStats,
  isConnected: () => isConnected,
};
