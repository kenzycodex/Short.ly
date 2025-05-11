# Short.ly API Documentation

This comprehensive document provides detailed information about the Short.ly API endpoints, request/response formats, authentication, and usage examples.

## Table of Contents

- [API Overview](#api-overview)
- [Authentication](#authentication)
- [URL Endpoints](#url-endpoints)
- [Analytics Endpoints](#analytics-endpoints)
- [Redirect Endpoints](#redirect-endpoints)
- [Health Endpoints](#health-endpoints)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Webhooks](#webhooks)
- [API Versioning](#api-versioning)
- [Usage Examples](#usage-examples)
- [Client Libraries](#client-libraries)
- [Advanced Features](#advanced-features)
- [Real-time Events](#real-time-events)

## API Overview

The Short.ly API is a RESTful API that follows standard HTTP conventions:

- Uses HTTP verbs appropriately (GET, POST, PATCH, DELETE)
- Returns standard HTTP status codes
- Uses JSON for request and response bodies
- Supports pagination for list endpoints
- Includes comprehensive error information

### Base URLs

- Development: `http://localhost:3000/api/v1`
- MVP: `https://api-mvp.short.ly/api/v1`
- Production: `https://api.short.ly/api/v1`

### Response Format

All API responses follow a standard format:

```json
{
  "success": true,
  "data": {
    // Response data here
  }
}
```

For errors:

```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "status": 400,
    "errors": [
      {
        "param": "fieldName",
        "msg": "Validation error message",
        "location": "body"
      }
    ]
  }
}
```

## Authentication

Short.ly supports JWT-based authentication for protected endpoints.

### Authentication Headers

Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Token Acquisition

Tokens can be obtained through the authentication endpoints:

```
POST /api/v1/auth/login
POST /api/v1/auth/register
```

**Login Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Login Response:**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "60d21b4667d0d8992e610c85",
      "email": "user@example.com",
    "password": "securepassword123"
  }'
```

### Node.js Example

```javascript
const axios = require('axios');

async function createShortUrl(originalUrl, customAlias) {
  try {
    const response = await axios.post('https://api.short.ly/api/v1/urls', {
      originalUrl,
      customAlias
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error creating short URL:', error.response.data);
    throw error;
  }
}

// Usage
createShortUrl('https://example.com/page', 'my-page')
  .then(url => console.log('Short URL:', url.shortUrl))
  .catch(err => console.error('Failed to create URL'));
```

### Python Example

```python
import requests

def create_short_url(original_url, custom_alias=None):
    payload = {
        'originalUrl': original_url
    }
    
    if custom_alias:
        payload['customAlias'] = custom_alias
    
    response = requests.post(
        'https://api.short.ly/api/v1/urls',
        json=payload
    )
    
    if response.status_code == 201:
        return response.json()['data']
    else:
        raise Exception(f"Error: {response.json()['error']['message']}")

# Usage
try:
    url = create_short_url('https://example.com/page', 'my-page')
    print(f"Short URL: {url['shortUrl']}")
except Exception as e:
    print(f"Failed to create URL: {e}")
```

### Authentication Example (Node.js)

```javascript
const axios = require('axios');

async function authenticate(email, password) {
  try {
    const response = await axios.post('https://api.short.ly/api/v1/auth/login', {
      email,
      password
    });
    
    // Store the token for future requests
    const token = response.data.data.token;
    
    // Set up axios instance with authentication header
    const apiClient = axios.create({
      baseURL: 'https://api.short.ly/api/v1',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return apiClient;
  } catch (error) {
    console.error('Authentication failed:', error.response.data);
    throw error;
  }
}

// Usage
authenticate('user@example.com', 'securepassword123')
  .then(apiClient => {
    // Get user's URLs
    return apiClient.get('/urls/user/me');
  })
  .then(response => {
    console.log('User URLs:', response.data.data.urls);
  })
  .catch(err => console.error('Failed:', err));
```

## Client Libraries

Short.ly provides official client libraries for various programming languages:

### JavaScript/TypeScript

```bash
npm install shortly-client
```

```javascript
import { ShortlyClient } from 'shortly-client';

const client = new ShortlyClient({ apiKey: 'your_api_key' });

// Create a short URL
const url = await client.createUrl('https://example.com/page');
console.log(url.shortUrl);

// Get analytics
const analytics = await client.getAnalytics(url.shortCode);
console.log(analytics);
```

### Python

```bash
pip install shortly-client
```

```python
from shortly import ShortlyClient

client = ShortlyClient(api_key='your_api_key')

# Create a short URL
url = client.create_url('https://example.com/page')
print(url.short_url)

# Get analytics
analytics = client.get_analytics(url.short_code)
print(analytics)
```

### PHP

```bash
composer require shortly/shortly-client
```

```php
<?php
require_once 'vendor/autoload.php';

use Shortly\ShortlyClient;

$client = new ShortlyClient(['apiKey' => 'your_api_key']);

// Create a short URL
$url = $client->createUrl('https://example.com/page');
echo $url->shortUrl;

// Get analytics
$analytics = $client->getAnalytics($url->shortCode);
print_r($analytics);
```

### Go

```bash
go get github.com/shortly/shortly-go
```

```go
package main

import (
    "fmt"
    "github.com/shortly/shortly-go"
)

func main() {
    client := shortly.NewClient("your_api_key")
    
    // Create a short URL
    url, err := client.CreateURL("https://example.com/page")
    if err != nil {
        panic(err)
    }
    fmt.Println(url.ShortURL)
    
    // Get analytics
    analytics, err := client.GetAnalytics(url.ShortCode)
    if err != nil {
        panic(err)
    }
    fmt.Println(analytics)
}
```

## Advanced Features

### Custom Domains

Short.ly API supports custom domains for your short links. You can configure a custom domain through the API:

```
POST /api/v1/domains
```

**Request:**
```json
{
  "domain": "example.link",
  "isDefault": false
}
```

Once configured and DNS verified, you can specify the domain when creating URLs:

```json
{
  "originalUrl": "https://example.com/page",
  "domain": "example.link"
}
```

### QR Codes

Generate QR codes for short URLs:

```
GET /api/v1/urls/{shortCode}/qrcode
```

Query parameters:
- `size`: QR code size in pixels (default: 300)
- `format`: Image format (png, svg, default: png)
- `color`: Foreground color (hex code, default: #000000)
- `backgroundColor`: Background color (hex code, default: #FFFFFF)

### UTM Parameters

Automatically append UTM parameters to the original URL:

```json
{
  "originalUrl": "https://example.com/page",
  "utm": {
    "source": "twitter",
    "medium": "social",
    "campaign": "summer_sale"
  }
}
```

### Password Protection

Add password protection to sensitive URLs:

```json
{
  "originalUrl": "https://example.com/page",
  "protection": {
    "type": "password",
    "password": "securepassword123"
  }
}
```

### Geo-targeting

Create URLs that redirect to different destinations based on location:

```json
{
  "originalUrl": "https://example.com/global",
  "geoTargeting": {
    "default": "https://example.com/global",
    "rules": [
      {
        "countries": ["US", "CA"],
        "url": "https://example.com/north-america"
      },
      {
        "countries": ["GB", "FR", "DE"],
        "url": "https://example.com/europe"
      }
    ]
  }
}
```

## Real-time Events

Short.ly provides Server-Sent Events (SSE) for real-time analytics:

```
GET /api/v1/events
```

**Headers:**
```
Authorization: Bearer your_token
```

Each event is sent in the following format:

```
event: url.clicked
data: {"shortCode":"2g3ab7c","timestamp":"2023-07-15T10:30:00Z"}
```

Event types:
- `url.clicked`: When a URL is clicked
- `url.created`: When a new URL is created
- `url.updated`: When a URL is updated
- `url.deleted`: When a URL is deleted

### WebSocket API

For more interactive applications, Short.ly also provides a WebSocket API:

```
wss://api.short.ly/ws?token=your_token
```

Example messages:

```json
// Subscribe to events
{ "type": "subscribe", "channel": "urls" }

// Receive event notification
{ 
  "type": "event", 
  "event": "url.clicked", 
  "data": {
    "shortCode": "2g3ab7c",
    "timestamp": "2023-07-15T10:30:00Z"
  }
}
```

## Additional Resources

- [OpenAPI Specification](https://api.short.ly/swagger.json)
- [Postman Collection](https://api.short.ly/docs/short.ly-postman.json)
- [API Client Libraries](https://github.com/shortly/clients)
- [Webhook Integration Guide](WEBHOOKS.md)
- [Advanced Usage Guide](ADVANCED_USAGE.md)
- [Authentication Guide](AUTHENTICATION.md)
- [Rate Limiting Details](RATE_LIMITING.md)

For support or feature requests, please contact api-support@short.ly or open an issue on our [GitHub repository](https://github.com/shortly/shortly).
user@example.com",
      "name": "John Doe"
    }
  }
}
```

### User Types

- **Anonymous Users**: Can create and access short URLs
- **Registered Users**: Can manage their own URLs and view analytics
- **Admin Users**: Have full access to all URLs and analytics

### Token Refresh

To refresh an expired token:

```
POST /api/v1/auth/refresh
```

**Headers:**
```
Authorization: Bearer <your_expired_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## URL Endpoints

### Create a Short URL

Creates a new shortened URL.

**Endpoint:** `POST /api/v1/urls`

**Authentication:** Optional

**Request Body:**

```json
{
  "originalUrl": "https://example.com/very/long/path/to/page.html",
  "customAlias": "my-page",   // Optional
  "expiresAt": "2023-12-31T23:59:59Z",  // Optional
  "isPrivate": false,  // Optional, defaults to false
  "tags": ["marketing", "social"]  // Optional
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "60d21b4667d0d8992e610c85",
    "originalUrl": "https://example.com/very/long/path/to/page.html",
    "shortCode": "2g3ab7c",
    "shortUrl": "https://short.ly/2g3ab7c",
    "customAlias": "my-page",
    "createdAt": "2023-07-01T10:30:00Z",
    "expiresAt": "2023-12-31T23:59:59Z",
    "isActive": true,
    "isPrivate": false,
    "tags": ["marketing", "social"],
    "metadata": {
      "totalClicks": 0,
      "lastAccessed": null
    }
  }
}
```

**Status Codes:**

- `201`: Created successfully
- `400`: Validation error
- `409`: Custom alias already in use

### Get URL Details

Retrieves details of a specific URL.

**Endpoint:** `GET /api/v1/urls/{shortCode}`

**Authentication:** Optional (required for private URLs)

**Path Parameters:**

- `shortCode`: The short code or custom alias of the URL

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "60d21b4667d0d8992e610c85",
    "originalUrl": "https://example.com/very/long/path/to/page.html",
    "shortCode": "2g3ab7c",
    "shortUrl": "https://short.ly/2g3ab7c",
    "customAlias": "my-page",
    "createdAt": "2023-07-01T10:30:00Z",
    "expiresAt": "2023-12-31T23:59:59Z",
    "isActive": true,
    "isPrivate": false,
    "tags": ["marketing", "social"],
    "metadata": {
      "totalClicks": 42,
      "lastAccessed": "2023-07-15T08:45:30Z"
    }
  }
}
```

**Status Codes:**

- `200`: Success
- `403`: Access denied for private URL
- `404`: URL not found

### Update a URL

Updates a URL's properties.

**Endpoint:** `PATCH /api/v1/urls/{shortCode}`

**Authentication:** Required (owner or admin)

**Path Parameters:**

- `shortCode`: The short code or custom alias of the URL

**Request Body:**

```json
{
  "isActive": true,
  "expiresAt": "2024-12-31T23:59:59Z",
  "isPrivate": true,
  "tags": ["updated-tag", "private"]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "60d21b4667d0d8992e610c85",
    "originalUrl": "https://example.com/very/long/path/to/page.html",
    "shortCode": "2g3ab7c",
    "shortUrl": "https://short.ly/2g3ab7c",
    "customAlias": "my-page",
    "createdAt": "2023-07-01T10:30:00Z",
    "expiresAt": "2024-12-31T23:59:59Z",
    "isActive": true,
    "isPrivate": true,
    "tags": ["updated-tag", "private"],
    "metadata": {
      "totalClicks": 42,
      "lastAccessed": "2023-07-15T08:45:30Z"
    }
  }
}
```

**Status Codes:**

- `200`: Success
- `400`: Validation error
- `403`: Permission denied
- `404`: URL not found

### Delete a URL

Deletes a URL.

**Endpoint:** `DELETE /api/v1/urls/{shortCode}`

**Authentication:** Required (owner or admin)

**Path Parameters:**

- `shortCode`: The short code or custom alias of the URL

**Response:**

```json
{
  "success": true,
  "message": "URL deleted successfully"
}
```

**Status Codes:**

- `200`: Success
- `403`: Permission denied
- `404`: URL not found

### Get All URLs (Admin)

Retrieves all URLs with pagination.

**Endpoint:** `GET /api/v1/urls`

**Authentication:** Required (admin only)

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Results per page (default: 10, max: 100)
- `isActive`: Filter by active status (optional)
- `searchTerm`: Search in originalUrl, shortCode, and customAlias (optional)
- `tags`: Filter by tags, comma-separated (optional)
- `sortBy`: Field to sort by (default: "createdAt")
- `sortOrder`: Sort order, "asc" or "desc" (default: "desc")

**Response:**

```json
{
  "success": true,
  "data": {
    "urls": [
      {
        "id": "60d21b4667d0d8992e610c85",
        "originalUrl": "https://example.com/page1",
        "shortCode": "2g3ab7c",
        "shortUrl": "https://short.ly/2g3ab7c",
        "customAlias": "my-page",
        "createdAt": "2023-07-01T10:30:00Z",
        "expiresAt": "2023-12-31T23:59:59Z",
        "isActive": true,
        "isPrivate": false,
        "tags": ["marketing", "social"],
        "metadata": {
          "totalClicks": 42,
          "lastAccessed": "2023-07-15T08:45:30Z"
        }
      },
      // More URLs...
    ],
    "pagination": {
      "totalCount": 42,
      "page": 1,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

**Status Codes:**

- `200`: Success
- `403`: Admin access required

### Get User's URLs

Retrieves URLs created by the authenticated user.

**Endpoint:** `GET /api/v1/urls/user/me`

**Authentication:** Required

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Results per page (default: 10, max: 100)
- `isActive`: Filter by active status (optional)
- `searchTerm`: Search in originalUrl, shortCode, and customAlias (optional)
- `tags`: Filter by tags, comma-separated (optional)
- `sortBy`: Field to sort by (default: "createdAt")
- `sortOrder`: Sort order, "asc" or "desc" (default: "desc")

**Response:**

```json
{
  "success": true,
  "data": {
    "urls": [
      {
        "id": "60d21b4667d0d8992e610c85",
        "originalUrl": "https://example.com/page1",
        "shortCode": "2g3ab7c",
        "shortUrl": "https://short.ly/2g3ab7c",
        "customAlias": "my-page",
        "createdAt": "2023-07-01T10:30:00Z",
        "expiresAt": "2023-12-31T23:59:59Z",
        "isActive": true,
        "isPrivate": false,
        "tags": ["marketing", "social"],
        "metadata": {
          "totalClicks": 42,
          "lastAccessed": "2023-07-15T08:45:30Z"
        }
      },
      // More URLs...
    ],
    "pagination": {
      "totalCount": 12,
      "page": 1,
      "totalPages": 2,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

**Status Codes:**

- `200`: Success
- `401`: Authentication required

### Bulk URL Creation

Creates multiple short URLs in a single request.

**Endpoint:** `POST /api/v1/urls/bulk`

**Authentication:** Required

**Request Body:**

```json
{
  "urls": [
    {
      "originalUrl": "https://example.com/page1",
      "customAlias": "page1"
    },
    {
      "originalUrl": "https://example.com/page2",
      "tags": ["bulk", "test"]
    },
    {
      "originalUrl": "https://example.com/page3",
      "expiresAt": "2023-12-31T23:59:59Z"
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "created": [
      {
        "originalUrl": "https://example.com/page1",
        "shortCode": "page1",
        "shortUrl": "https://short.ly/page1"
      },
      {
        "originalUrl": "https://example.com/page2",
        "shortCode": "ab12cd",
        "shortUrl": "https://short.ly/ab12cd"
      },
      {
        "originalUrl": "https://example.com/page3",
        "shortCode": "xy45z9",
        "shortUrl": "https://short.ly/xy45z9"
      }
    ],
    "failed": []
  }
}
```

**Status Codes:**

- `201`: Created successfully
- `400`: Validation error
- `401`: Authentication required

### Check Alias Availability

Checks if a custom alias is available.

**Endpoint:** `GET /api/v1/urls/alias/{alias}/check`

**Authentication:** Not required

**Path Parameters:**

- `alias`: The custom alias to check

**Response:**

```json
{
  "success": true,
  "data": {
    "alias": "my-page",
    "isAvailable": true
  }
}
```

**Status Codes:**

- `200`: Success

## Analytics Endpoints

### Get URL Analytics

Retrieves analytics for a specific URL.

**Endpoint:** `GET /api/v1/analytics/{shortCode}`

**Authentication:** Required (owner or admin)

**Path Parameters:**

- `shortCode`: The short code or custom alias of the URL

**Query Parameters:**

- `view`: Analytics view type (default: "summary")
  - Options: "summary", "clicks", "referrers", "browsers", "devices", "os", "locations", "timeSeries"
- `from`: Start date filter (ISO string, optional)
- `to`: End date filter (ISO string, optional)
- `interval`: Time interval for time series (default: "day")
  - Options: "day", "hour"
- `limit`: Results per page (for "clicks" view, default: 100)
- `skip`: Number of results to skip (for "clicks" view, default: 0)

**Response (Summary View):**

```json
{
  "success": true,
  "data": {
    "url": {
      "id": "60d21b4667d0d8992e610c85",
      "shortCode": "2g3ab7c",
      "shortUrl": "https://short.ly/2g3ab7c",
      "originalUrl": "https://example.com/page"
    },
    "view": "summary",
    "analytics": {
      "totalClicks": 1024,
      "referrers": [
        { "referrer": "https://google.com", "count": 512 },
        { "referrer": "https://twitter.com", "count": 256 },
        { "referrer": "Direct/None", "count": 128 },
        { "referrer": "https://facebook.com", "count": 64 },
        { "referrer": "https://linkedin.com", "count": 64 }
      ],
      "browsers": [
        { "browser": "Chrome", "count": 768 },
        { "browser": "Firefox", "count": 128 },
        { "browser": "Safari", "count": 64 },
        { "browser": "Edge", "count": 32 },
        { "browser": "Other", "count": 32 }
      ],
      "devices": [
        { "device": "desktop", "count": 768 },
        { "device": "mobile", "count": 192 },
        { "device": "tablet", "count": 64 }
      ],
      "locations": [
        { "country": "US", "count": 512 },
        { "country": "GB", "count": 128 },
        { "country": "CA", "count": 96 },
        { "country": "DE", "count": 64 },
        { "country": "FR", "count": 48 }
      ],
      "clicksOverTime": [
        { "date": "2023-07-01", "count": 32 },
        { "date": "2023-07-02", "count": 48 },
        { "date": "2023-07-03", "count": 64 },
        // More data points...
      ]
    }
  }
}
```

**Response (Clicks View):**

```json
{
  "success": true,
  "data": {
    "url": {
      "id": "60d21b4667d0d8992e610c85",
      "shortCode": "2g3ab7c",
      "shortUrl": "https://short.ly/2g3ab7c",
      "originalUrl": "https://example.com/page"
    },
    "view": "clicks",
    "analytics": [
      {
        "ip": "192.168.xxx",
        "referrer": "https://google.com",
        "userAgent": "Mozilla/5.0...",
        "device": {
          "browser": {
            "name": "Chrome",
            "version": "91.0.4472.124"
          },
          "os": {
            "name": "Windows",
            "version": "10"
          },
          "type": "desktop"
        },
        "location": {
          "country": "US",
          "region": "California",
          "city": "San Francisco"
        },
        "timestamp": "2023-07-15T08:45:30Z"
      },
      // More click records...
    ]
  }
}
```

**Status Codes:**

- `200`: Success
- `403`: Permission denied
- `404`: URL not found

### Delete URL Analytics

Deletes analytics data for a specific URL.

**Endpoint:** `DELETE /api/v1/analytics/{shortCode}`

**Authentication:** Required (owner or admin)

**Path Parameters:**

- `shortCode`: The short code or custom alias of the URL

**Response:**

```json
{
  "success": true,
  "message": "Analytics deleted successfully"
}
```

**Status Codes:**

- `200`: Success
- `403`: Permission denied
- `404`: URL not found

### Record Click (API)

Manually records a click event for a URL.

**Endpoint:** `POST /api/v1/analytics/record`

**Authentication:** Not required

**Request Body:**

```json
{
  "shortCode": "2g3ab7c",
  "ip": "203.0.113.1",
  "userAgent": "Mozilla/5.0...",
  "referrer": "https://google.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Click recorded successfully"
}
```

**Status Codes:**

- `200`: Success
- `404`: URL not found

### Export Analytics

Exports analytics data in various formats.

**Endpoint:** `GET /api/v1/analytics/{shortCode}/export`

**Authentication:** Required (owner or admin)

**Path Parameters:**

- `shortCode`: The short code or custom alias of the URL

**Query Parameters:**

- `format`: Export format (default: "json")
  - Options: "json", "csv", "excel"
- `from`: Start date filter (ISO string, optional)
- `to`: End date filter (ISO string, optional)

**Response:**

For JSON format:
```json
{
  "success": true,
  "data": {
    "url": {
      "shortCode": "2g3ab7c",
      "originalUrl": "https://example.com/page"
    },
    "exportDate": "2023-07-15T10:30:00Z",
    "dateRange": {
      "from": "2023-07-01T00:00:00Z",
      "to": "2023-07-15T00:00:00Z"
    },
    "clicks": [
      {
        "timestamp": "2023-07-15T08:45:30Z",
        "referrer": "https://google.com",
        "browser": "Chrome",
        "os": "Windows",
        "device": "desktop",
        "country": "US"
      },
      // More click records...
    ]
  }
}
```

For CSV/Excel formats, the response will be a downloadable file.

**Status Codes:**

- `200`: Success
- `403`: Permission denied
- `404`: URL not found

### Get Dashboard Analytics

Retrieves overview analytics for all URLs.

**Endpoint:** `GET /api/v1/analytics/dashboard`

**Authentication:** Required (admin only)

**Query Parameters:**

- `period`: Time period (default: "week")
  - Options: "day", "week", "month", "year"

**Response:**

```json
{
  "success": true,
  "data": {
    "totalUrls": 1024,
    "recentClicks": 156,
    "topUrls": [
      {
        "shortCode": "2g3ab7c",
        "originalUrl": "https://example.com/page1",
        "totalClicks": 1024
      },
      // More top URLs...
    ],
    "clicksByDay": [
      { "date": "2023-07-15", "count": 156 },
      { "date": "2023-07-14", "count": 142 },
      // More days...
    ],
    "topReferrers": [
      { "referrer": "https://google.com", "count": 512 },
      { "referrer": "https://twitter.com", "count": 256 },
      // More referrers...
    ],
    "deviceDistribution": {
      "desktop": 768,
      "mobile": 192,
      "tablet": 64
    },
    "lastUpdated": "2023-07-15T10:30:00Z"
  }
}
```

**Status Codes:**

- `200`: Success
- `403`: Admin access required

## Redirect Endpoints

### Redirect to Original URL

Redirects to the original URL.

**Endpoint:** `GET /{shortCode}`

**Authentication:** Not required

**Path Parameters:**

- `shortCode`: The short code or custom alias of the URL

**Response:**

- Redirects to the original URL with status code 302
- Records analytics data asynchronously

**Status Codes:**

- `302`: Redirect
- `404`: URL not found
- `410`: URL has been deactivated or expired

### Resolve URL

Resolves a short URL without redirecting.

**Endpoint:** `GET /api/v1/resolve/{shortCode}`

**Authentication:** Not required

**Path Parameters:**

- `shortCode`: The short code or custom alias of the URL

**Response:**

```json
{
  "success": true,
  "data": {
    "originalUrl": "https://example.com/very/long/path/to/page.html",
    "shortCode": "2g3ab7c",
    "shortUrl": "https://short.ly/2g3ab7c"
  }
}
```

**Status Codes:**

- `200`: Success
- `404`: URL not found
- `410`: URL has been deactivated or expired

## Health Endpoints

### Get Health Status

Checks the health of the application.

**Endpoint:** `GET /api/v1/health`

**Authentication:** Not required

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2023-07-15T10:30:00Z",
  "environment": "production",
  "services": {
    "api": {
      "status": "running",
      "version": "1.0.0"
    },
    "mongo": {
      "status": "connected"
    },
    "redis": {
      "status": "connected"
    }
  },
  "uptime": 86400.123
}
```

**Status Codes:**

- `200`: Healthy
- `503`: Unhealthy

### Get Metrics

Retrieves system metrics.

**Endpoint:** `GET /api/v1/metrics`

**Authentication:** Required (admin only)

**Response:**

```json
{
  "success": true,
  "data": {
    "system": {
      "cpu": 12.5,
      "memory": {
        "total": 8192,
        "used": 4096,
        "free": 4096
      },
      "uptime": 86400.123
    },
    "requests": {
      "total": 1000000,
      "redirects": 980000,
      "api": 20000,
      "avgResponseTime": 45
    },
    "cache": {
      "hitRate": 0.95,
      "size": 1024,
      "items": 50000
    },
    "database": {
      "connections": 10,
      "avgQueryTime": 25
    }
  }
}
```

**Status Codes:**

- `200`: Success
- `403`: Admin access required

## Error Handling

Short.ly uses standard HTTP status codes and provides detailed error information.

### Common Error Codes

- `400`: Bad Request - Validation error
- `401`: Unauthorized - Authentication required
- `403`: Forbidden - Permission denied
- `404`: Not Found - Resource not found
- `409`: Conflict - Resource already exists
- `410`: Gone - Resource no longer available
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Server error

### Error Response Format

```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "status": 400,
    "errors": [
      {
        "param": "fieldName",
        "msg": "Validation error message",
        "location": "body"
      }
    ]
  }
}
```

### Handling Validation Errors

Validation errors include details about each invalid field:

```json
{
  "success": false,
  "error": {
    "message": "Validation error",
    "status": 400,
    "errors": [
      {
        "param": "originalUrl",
        "msg": "Invalid URL format",
        "location": "body",
        "value": "not-a-valid-url"
      },
      {
        "param": "expiresAt",
        "msg": "Expiration date must be in the future",
        "location": "body"
      }
    ]
  }
}
```

## Rate Limiting

Short.ly implements rate limiting to prevent abuse.

### Rate Limit Headers

- `X-RateLimit-Limit`: Maximum requests per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets (Unix timestamp)

### Rate Limit Status Code

When a rate limit is exceeded, the API returns:

- Status Code: `429 Too Many Requests`
- Response Body:
  ```json
  {
    "success": false,
    "error": {
      "message": "Too many requests, please try again later.",
      "status": 429
    }
  }
  ```

### Rate Limit Configuration

Rate limits vary by endpoint type:

- Redirect endpoint: 1000 requests per 15 minutes
- URL creation: 100 requests per 15 minutes
- API endpoints: 300 requests per 15 minutes

### IP-based vs. Token-based Rate Limiting

- Anonymous users: IP-based rate limiting
- Authenticated users: Token-based rate limiting with higher limits

## Webhooks

Short.ly supports webhooks for event notifications.

### Available Events

- `url.created`: A new URL is created
- `url.updated`: A URL is updated
- `url.deleted`: A URL is deleted
- `url.clicked`: A URL is accessed

### Webhook Registration

**Endpoint:** `POST /api/v1/webhooks`

**Authentication:** Required

**Request Body:**

```json
{
  "url": "https://your-server.com/webhook",
  "events": ["url.created", "url.clicked"],
  "secret": "your_webhook_secret"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "webhook_id",
    "url": "https://your-server.com/webhook",
    "events": ["url.created", "url.clicked"],
    "createdAt": "2023-07-15T10:30:00Z"
  }
}
```

### Webhook Payload

```json
{
  "event": "url.clicked",
  "timestamp": "2023-07-15T10:30:00Z",
  "data": {
    "shortCode": "2g3ab7c",
    "shortUrl": "https://short.ly/2g3ab7c",
    "originalUrl": "https://example.com/page",
    "metadata": {
      "totalClicks": 43,
      "lastAccessed": "2023-07-15T10:30:00Z"
    }
  }
}
```

### Webhook Security

Webhooks include a signature header for verification:

```
X-Shortl-Signature: sha256=5257a869e7bdf8196995a1ca7e88ebe5080f926a
```

To verify the signature:
1. Concatenate the timestamp header and JSON body
2. Create an HMAC using your webhook secret
3. Compare the result with the signature header value

### Managing Webhooks

**List Webhooks:**
```
GET /api/v1/webhooks
```

**Update Webhook:**
```
PATCH /api/v1/webhooks/{webhookId}
```

**Delete Webhook:**
```
DELETE /api/v1/webhooks/{webhookId}
```

## API Versioning

Short.ly uses URI-based versioning:

- Current version: `/api/v1/`
- Future versions: `/api/v2/`, etc.

### Version Lifecycle

- **Current Version**: v1 - Active development
- **Beta Versions**: Available at `/api/beta/` for preview
- **Deprecated Versions**: Announced 6 months before retirement

Version compatibility follows semantic versioning principles:
- Minor and patch updates maintain backward compatibility
- Major version changes may include breaking changes

## Usage Examples

### cURL Examples

#### Create a Short URL

```bash
curl -X POST "https://api.short.ly/api/v1/urls" \
  -H "Content-Type: application/json" \
  -d '{
    "originalUrl": "https://example.com/very/long/path/to/page.html",
    "customAlias": "my-page"
  }'
```

#### Get URL Analytics

```bash
curl -X GET "https://api.short.ly/api/v1/analytics/2g3ab7c?view=summary" \
  -H "Authorization: Bearer your_token"
```

#### Authentication

```bash
curl -X POST "https://api.short.ly/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "