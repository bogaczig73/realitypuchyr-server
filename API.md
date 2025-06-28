# Reality Puchýř API Documentation

## Base URL
All API endpoints are prefixed with `/api`

## Language Support
The API supports multiple languages. You can specify the language in the URL path after `/api/`:
- Czech (cs) - default
- English (en)
- German (de)

Example: `/api/en/properties` for English content

## Authentication
Currently, most endpoints are public. Some endpoints may require authentication in the future.

## Endpoints

### Properties

#### Get Property Statistics
```
GET /properties/stats
```
Returns statistics about properties including:
- Number of active properties
- Number of sold properties
- Years of experience

#### Get Property Category Statistics
```
GET /properties/category-stats
```
Returns the count of active properties for each category.

#### Get All Properties
```
GET /properties
```
Returns paginated properties with search and filtering capabilities.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 12)
- `search`: Search term for name and description
- `status`: Filter by status (ACTIVE, SOLD, RENT)
- `categoryId`: Filter by category ID

#### Get Properties with Video Tours
```
GET /properties/video-tours
```
Returns up to 6 properties that have video tours for carousel display.

#### Get Property by ID
```
GET /properties/:id
```
Returns a single property with all details, supporting language translations.

#### Create Property (Internal/Admin)
```
POST /properties
```
Creates a new property with file uploads and comprehensive validation.

**Request Body:**
- Form data with property fields and file uploads
- Supports image and file uploads via multer middleware

#### Create Property (External Integration)
```
POST /properties/external
```
Creates a new property from external source (simplified version without file uploads).

**Request Body:**
```json
{
  "name": "string",           // Required
  "categoryId": "number",     // Required
  "status": "string",         // ACTIVE, SOLD, or RENT
  "ownershipType": "string",  // Required
  "description": "string",
  "city": "string",
  "street": "string",
  "country": "string",
  "latitude": "number",
  "longitude": "number",
  "virtualTour": "string",
  "videoUrl": "string",
  "size": "number",           // Required
  "beds": "number",
  "baths": "number",
  "price": "number",          // Required
  "discountedPrice": "number",
  // ... additional property fields
}
```

#### Sync Property Files from S3 (External Integration)
```
PUT /properties/:id/sync
```
Updates property images and files by syncing from S3 storage. This endpoint is designed for external integrations that upload files directly to S3.

**Response:**
Returns the updated property with synced images and files.

#### Update Property
```
PUT /properties/:id
```
Updates an existing property.

#### Update Property State
```
PATCH /properties/:id/state
```
Updates the status of a property.

**Request Body:**
```json
{
  "status": "string"  // ACTIVE, SOLD, or RENT
}
```

#### Delete Property
```
DELETE /properties/:id
```
Deletes a property and all associated files from S3.

#### Translate Property
```
POST /properties/:id/translate
```
Translates a property to the specified target language using DeepL API.

**Request Body:**
```json
{
  "targetLanguage": "string",  // Required: en, cs, de, ru, ua, vn, es, fr, it
  "sourceLanguage": "string"   // Optional: defaults to Czech (cs)
}
```

### Reviews

#### Get All Reviews
```
GET /reviews
```
Returns all reviews, sorted by creation date (newest first).

#### Create Review
```
POST /reviews
```
Creates a new review.

**Request Body:**
```json
{
  "name": "string",        // Required
  "description": "string", // Required
  "rating": "number",      // Required (1-5)
  "propertyId": "number"   // Optional
}
```

### Upload

#### Upload Single Image
```
POST /upload/image
```
Uploads a single image file.

**Request Body:**
- Form data with key `image`

#### Upload Multiple Images
```
POST /upload/images
```
Uploads multiple image files (up to 10).

**Request Body:**
- Form data with key `images`

#### Upload Single File
```
POST /upload/file
```
Uploads a single file.

**Request Body:**
- Form data with key `file`

#### Upload Multiple Files
```
POST /upload/files
```
Uploads multiple files (up to 10).

**Request Body:**
- Form data with key `files`

### Blog

#### Get All Blogs
```
GET /blogs
```
Returns paginated blog posts.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `truncate`: Number of characters to truncate content (default: 0)

#### Get Blog by Slug
```
GET /blogs/:slug
```
Returns a single blog post by its slug.

#### Translate Blog
```
POST /blogs/:id/translate
```
Translates a blog post to the specified target language using DeepL API. This includes translating the title, content, tags, meta information, and creating a localized slug.

**Request Body:**
```json
{
  "targetLanguage": "string",  // Required: en, cs, de, ru, ua, vn, es, fr, it
  "sourceLanguage": "string"   // Optional: defaults to Czech (cs)
}
```

**Response:**
Returns the created translation object with translated content and localized slug.

### Contact Form

#### Submit Contact Form
```
POST /contactform
```
Submits a contact form.

**Request Body:**
```json
{
  "name": "string",        // Required
  "email": "string",       // Required
  "subject": "string",     // Required
  "message": "string",     // Required
  "phoneNumber": "string"  // Optional
}
```

#### Get All Contact Form Submissions
```
GET /contactform
```
Returns all contact form submissions (admin only).

## Migration Notes

### External Integration Changes
If you were using the external property routes (`/api/external/properties`), you'll need to update your integration:

**Old endpoints:**
- `POST /api/external/properties` → `POST /api/properties/external`
- `PUT /api/external/properties/:id` → `PUT /api/properties/:id/sync`

**Benefits of consolidation:**
- Single source of truth for property operations
- Consistent error handling and validation
- Shared helper functions and utilities
- Easier maintenance and updates

## Error Responses

The API uses standard HTTP status codes:

- 200: Success
- 201: Created
- 400: Bad Request
- 404: Not Found
- 500: Internal Server Error

Error responses include a JSON object with an `error` field and optional `details`:

```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

## File Upload

All file uploads are handled through multipart/form-data requests. The files are stored in AWS S3 and served through CloudFront CDN.

## Health Check

```
GET /health
```
Returns the health status of the API.

**Response:**
```json
{
  "status": "healthy"
}
```