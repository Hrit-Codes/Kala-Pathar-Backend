import mongoose from "mongoose";
import { loadEnv } from "./config/env";  
import { Auth } from "./model/auth.model";

const createDefaultAdmin = async () => {
    try {
        console.log("🔌 Connecting to MongoDB...");
        console.log(`📡 Using: ${loadEnv.MONGO_URL.replace(/\/\/[^@]+@/, '//<hidden>@')}`);
        
        await mongoose.connect(loadEnv.MONGO_URL);
        console.log("✅ Connected to MongoDB");

        const existingAdmin = await Auth.findOne({ role: "admin" });
        
        if (existingAdmin) {
            console.log(`⚠️ Admin already exists: ${existingAdmin.email}`);
            process.exit(0);
        }

        const admin = await Auth.create({
            name: loadEnv.ADMIN_NAME || "Super Admin",
            email: loadEnv.ADMIN_EMAIL || "admin@kalapatthar.com",
            password: loadEnv.ADMIN_PASSWORD || "Admin@1234",
            role: "admin",
            isActive: true,
        });

        console.log("✅ Default admin created successfully!");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(`📧 Email    : ${admin.email}`);
        console.log(`🔑 Password : ${loadEnv.ADMIN_PASSWORD || "Admin@1234"}`);
        console.log(`👤 Role     : ${admin.role}`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("⚠️  Please change password after first login!");

        process.exit(0);
    } catch (error: any) {
        console.error("❌ Failed to create admin:", error.message);
        process.exit(1);
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
            console.log("🔌 Disconnected from MongoDB");
        }
    }
};

createDefaultAdmin();