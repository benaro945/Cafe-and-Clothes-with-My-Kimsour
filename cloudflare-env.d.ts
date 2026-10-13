declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    GOOGLE_MAPS_BROWSER_KEY?: string;
    GOOGLE_MAPS_MAP_ID?: string;
  }
}
