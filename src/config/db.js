import mongoose from "mongoose";

export const connectDB = async () => {
  if (!process.env.DB_URI) {
    throw new Error("DB_URI is not configured");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  await mongoose.connect(process.env.DB_URI);
  console.log("MongoDB connected");
  return mongoose.connection;
};

