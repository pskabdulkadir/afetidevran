import winston from "winston";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Logs directory oluştur
const logsDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * 📝 WINSTON LOGGER CONFIGURATION
 * Hem Console'a hem Dosyaya log kaydı
 * 
 * Faydaları:
 * ✅ Internet kesilse bile loglar kayıt alınır
 * ✅ Terminal kapatsa bile loglar saklanır
 * ✅ Geçmiş verileri analiz edebilirsin
 * ✅ Error tracking ve debugging kolaylaşır
 */

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: "arbitrage-engine" },
  transports: [
    // 📄 FILE LOGGING - Dosyaya yazma
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true,
    }),
    // 📊 OPPORTUNITIES LOG - Fırsat ayrı dosyaya
    new winston.transports.File({
      filename: path.join(logsDir, "opportunities.log"),
      level: "info",
      format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.printf(({ timestamp, message }) => {
          return `[${timestamp}] ${message}`;
        })
      ),
    }),
  ],
});

// 🖥️ CONSOLE LOGGING - Console'a da yazma
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: "HH:mm:ss" }),
        winston.format.printf(({ level, message, timestamp }) => {
          return `[${timestamp}] ${level}: ${message}`;
        })
      ),
    })
  );
}

/**
 * 🔧 LOG ROTATION HELPER
 * Her gün yeni log dosyası başlat
 */
export function setupDailyRotation() {
  const DailyRotateFile = require("winston-daily-rotate-file");

  const dailyRotateTransport = new DailyRotateFile({
    filename: path.join(logsDir, "daily-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    maxSize: "20m",
    maxDays: "30",
  });

  logger.add(dailyRotateTransport);
}

/**
 * 📊 LOG STATISTICS
 * Log dosyası boyutlarını kontrol et
 */
export function getLogStats() {
  try {
    const files = fs.readdirSync(logsDir);
    const stats = {};

    files.forEach((file) => {
      const filepath = path.join(logsDir, file);
      const fileStats = fs.statSync(filepath);
      stats[file] = {
        size: `${(fileStats.size / 1024).toFixed(2)} KB`,
        created: fileStats.birthtime,
        modified: fileStats.mtime,
      };
    });

    return stats;
  } catch (error) {
    logger.error("Could not get log stats:", error);
    return {};
  }
}

/**
 * 🗑️ CLEANUP OLD LOGS
 * 30 günden eski logları sil
 */
export function cleanupOldLogs(daysToKeep = 30) {
  try {
    const files = fs.readdirSync(logsDir);
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;

    files.forEach((file) => {
      const filepath = path.join(logsDir, file);
      const fileStats = fs.statSync(filepath);
      const age = now - fileStats.mtime.getTime();

      if (age > daysToKeep * msPerDay) {
        fs.unlinkSync(filepath);
        logger.info(`Deleted old log file: ${file}`);
      }
    });
  } catch (error) {
    logger.error("Error during log cleanup:", error);
  }
}

export default logger;
