declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    OWNER_PASSWORD_HASH?: string;
    BUCKET?: R2Bucket;
    GOOGLE_MAPS_BROWSER_KEY?: string;
    GOOGLE_MAPS_MAP_ID?: string;
    TELEGRAM_BOT_TOKEN?: string;
    TELEGRAM_CHAT_ID?: string;
  }
}
