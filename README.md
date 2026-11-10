# Cafe & Cloth

Cloudflare build and deployment setup: see [DEPLOYMENT.md](./DEPLOYMENT.md).

Public hosted demo of a cafe and clothing shop. Customers share a cart across
cafe products and clothing variants. Orders reserve stock and offer self-pickup
with the existing collection code, or delivery with address search and a Leaflet map pin.
Phnom Penh delivery offers COD or ABA/KHQR ($1.50 delivery). Province delivery requires prepaid ABA/KHQR bank payment ($2.00 delivery); cash is unavailable.
Drinks support Phnom Penh delivery or self-pickup only; province delivery is for clothing-only carts.
Invoices show the full total; bank payments accept transaction screenshots for owner review.
Bank payment invoices generate a USD KHQR containing the confirmed total, including
delivery and birthday discounts. Scanning fills the amount in a compatible banking
app. Saved QR images contain the same amount, and ABA's same-phone link carries it
too. Codes expire after 15 minutes; use Refresh payment QR to generate a fresh one.
Owner Studio manages products, available stock, payments, preparation and
completion; it reports paid cafe and clothing revenue in Phnom Penh time.
The Cloth-themed Owner Studio has separate dashboard, orders, payments, inventory,
customer inbox, and settings sections. Its dashboard includes daily metrics,
interactive 7/30-day sales trends, order progress, recent orders, and stock alerts.
The selected report date is remembered in the browser so daily figures remain visible after reopening.
Orders open in a Needs attention queue, with separate in-progress, completed,
cancelled, and all-order views. Payment filters are separate from order status,
and delivery, payment, and receipt details can be expanded when needed.
Product photos and names open a detail view with size/drink options, quantity,
zoomable galleries, and similar products. In Owner Studio, edit a product to set
one showcase photo, up to eight extra photos, and longer product details. Extra
photos can be reordered, removed, or promoted to the showcase. The compact shop
header keeps account, Owner Studio, and bag controls at the top while scrolling.
Below the logo, centered All products, Cafe, and Cloth buttons select products.
Selecting a collection reveals an animated arrow beside it. Only clicking the
arrow opens its optional type and style filters; collection clicks keep them closed.
Use Owner Studio → Categories → Clothing → New clothing type to add a type,
assign products, or edit, reorder, and delete existing types. Product editing
also groups clothing types and styles separately. Saved changes update the menu.

The hosted preview uses React + a JavaScript Cloudflare Worker + D1. The actual Python
course version is in `python/`, with the same interface and Flask/SQLite business logic.
Download `public/cafe-cloth-python.zip` to run without Node.js.
Read `python/README.md` for setup, concepts, sample data and AI disclosure.

Hosted state is a compact shop-state record with optimistic revision checks. A stock
reservation and order are saved together. This is suitable for the small course demo;
a larger shop should normalize product/variant/order tables and add operational flows.
Public visitors can browse and place orders. Hosted customers can create an account
with email or phone and a password, view their own order history and inbox, claim
birthday gifts, and chat privately with the shop. Owner Studio uses a separate
owner password with a server-side session; ChatGPT sign-in is no longer required.
Set the hosted owner password with `npm run owner:setup` in an interactive terminal.
Passwords are hashed; session cookies are HttpOnly. Public shop responses omit
order history and birthday reward records. Customer accounts cannot change
products, stock, or order status. Local Python accounts and hosted D1 accounts
remain in separate databases.

Photos are generated illustrative assets; all names, prices and initial stock are samples.
KHQR transfers are verified manually by the owner; there is no automatic payment
gateway, refund flow, or reservation expiry. Owner Studio separates COD cash, bank
receipts, pickup cash, and outstanding COD; delivery fees are included in totals.
See `python/COD-GUIDE.md` for the single-owner workflow and daily CSV reports.

Checkout validation: Python tests, hosted business logic checks, scoped TypeScript
checks, Flask UI rebuild, and local Edge browser checks at 320–1366px, including
invoice printing, amount-filled KHQR generation and owner payment-proof review.
The Python and hosted versions use separate databases. Test orders and validations
use isolated databases rather than the shop's persistent data.

## Free delivery maps

Delivery uses React Leaflet, free OpenStreetMap tiles, and Nominatim search/reverse
lookup. No API keys, billing account, or credit card are required. Customers search
with the Search button (or Enter), pick a result, move the pin to their entrance,
and confirm the pin. Address / building details are optional. Use my location is available on HTTPS or localhost.

Both `/api/locations` implementations validate requests, cache lookups for 24 hours,
and share a database-backed rate gate across visitors: at most one upstream request
at a time with at least 1.1 seconds between requests. Searches target Cambodia.
Map/address service failures still allow confirmation of a selected pin. Optional
building details are saved separately from the selected address.
New order map links open OpenStreetMap; existing invoices remain readable.

The public OSM services have usage limits and best-effort availability. See the
[Nominatim policy](https://operations.osmfoundation.org/policies/nominatim/) and
[tile policy](https://operations.osmfoundation.org/policies/tiles/). Search is
explicitly submitted, without autocomplete. Search for public streets/places; add
private entrance details in the address field, which is saved only to the shop.
The server-only `NOMINATIM_BASE_URL` environment variable can point to a self-hosted
Nominatim instance without changing frontend code; the default is
`https://nominatim.openstreetmap.org`. Google Maps environment settings are obsolete.

Local validation: `cd python` then `python -m unittest test_app.py test_locations.py -v`.
For frontend rebuilds, install the project dependencies then run
`node scripts/rebuild-python-ui.mjs` from the repository root.

Delivery invoices display the included bank KHQR directly, with a prominent scan
instruction, recipient, USD amount, save-image link, and ABA button. Payment appears
only on the invoice after customers submit their order details. Customers must send
their transaction screenshot before closing the invoice or returning to the shop.
Unfinished bank-payment invoices reopen after refresh. Owner-uploaded QR images are still supported.
After code updates, stop the old Flask process and run `python app.py` again, then
refresh the browser. Flask must restart to load newly added API routes. HTML or
malformed location responses now show a helpful map fallback instead of a JSON error.
