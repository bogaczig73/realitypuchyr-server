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

#### Create Property
```
POST /properties
```
Creates a new property.

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
  "language": "string",       // Default: "cs"
  "latitude": "number",
  "longitude": "number",
  "virtualTour": "string",
  "videoUrl": "string",
  "size": "number",
  "beds": "number",
  "baths": "number",
  "price": "number",          // Required
  "discountedPrice": "number",
  // ... additional property fields
}
```

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

### External Properties

#### Create External Property
```
POST /external/properties
```
Creates a new property from an external source.

**Request Body:**
```json
{
  "name": "string",           // Required
  "categoryId": "number",     // Required
  "ownershipType": "string",  // Required
  "size": "number",           // Required
  "price": "number",          // Required
  // ... additional property fields
}
```

#### Update External Property
```
PUT /external/properties/:id
```
Updates property images and files from S3.

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