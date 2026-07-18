import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import { Auth } from "../model/auth.model.js";
import { sendMail } from "../helpers/mailsend.js";

// Set the DNS servers immediately before any other execution
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

const createDefaultAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL!);
    console.log("Connected to database");

    const adminData = {
      name: process.env.ADMIN_NAME || "Super Admin",
      email: process.env.ADMIN_EMAIL!,
      password: process.env.ADMIN_PASSWORD!,
      role: "admin",
      isActive: true,
      isVerified: true,
    };

    if (!adminData.email || !adminData.password) {
      console.error("ADMIN_EMAIL or ADMIN_PASSWORD not set in .env");
      process.exit(1);
    }

    // Check if admin exists
    const existingAdmin = await Auth.findOne({
      $or: [
        { email: adminData.email },
        { role: "admin" }
      ]
    });

    let adminUser;

    if (existingAdmin) {
      // Update existing user to admin if they exist but aren't admin
      if (existingAdmin.role !== "admin") {
        existingAdmin.role = "admin";
        existingAdmin.isActive = true;
        await existingAdmin.save();
        console.log(" Existing user updated to admin");
        
        adminUser = await Auth.findOne({ email: adminData.email })
          .select("-password -refresh_token");
      } else {
        console.log("Admin account already exists");
        adminUser = existingAdmin;
      }
    } else {
      // Create new admin
      const newAdmin = new Auth(adminData);
      await newAdmin.save();
      console.log("ew admin created");
      
      adminUser = await Auth.findOne({ email: adminData.email })
        .select("-password -refresh_token");
    }

    console.log("Admin details:", adminUser);

    // Send welcome email
    try {
      await sendMail({
        to: process.env.ADMIN_EMAIL!,
        subject: "Admin Account Created Successfully",
        html: `<h1>Welcome ${adminData.name}</h1>
              <p>Your admin account has been successfully created.</p>
              <p><strong>Email:</strong> ${adminData.email}</p>
              <p><strong>Role:</strong> Admin</p>
              <p>You can now login to the admin panel.</p>`
      });
      console.log("Welcome email sent successfully");
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }

  } catch (error) {
    console.error("Error creating admin:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database");
  }
};

createDefaultAdmin();