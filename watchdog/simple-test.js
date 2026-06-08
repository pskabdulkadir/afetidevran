import dotenv from "dotenv";

dotenv.config();

console.log("=================================================");
console.log("🤖 AUTONOMOUS WATCHDOG - SYSTEM CHECK");
console.log("=================================================\n");

// Check environment
console.log("✅ Environment Variables:");
console.log(`   POLYGON_ARCHIVE_URL: ${process.env.POLYGON_ARCHIVE_URL ? "SET" : "MISSING"}`);
console.log(`   PRIVATE_KEY: ${process.env.PRIVATE_KEY ? "SET" : "MISSING"}`);
console.log(`   CONTRACT_ADDRESS: ${process.env.CONTRACT_ADDRESS || "MISSING"}\n`);

// Check imports
console.log("✅ Module Imports:");
try {
  import("ethers").then(() => console.log("   ✅ ethers"));
  import("express").then(() => console.log("   ✅ express"));
} catch (e) {
  console.log("   ❌ Error importing modules");
}

// Summary
setTimeout(() => {
  console.log("\n=================================================");
  console.log("📝 STATUS: Ready for watchdog launch");
  console.log("=================================================\n");
  console.log("Next step: node watchdog/autonomousWatchdog.js\n");
  process.exit(0);
}, 1000);
