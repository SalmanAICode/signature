# MCA CRM API

A Merchant Cash Advance (MCA) Customer Relationship Management (CRM) API built with Node.js, Express, and MongoDB.

## Features

- Authentication for multiple user types (Admin, Bookkeeper, User, Contact, Representative)
- Access control based on user roles and permissions
- Complete data model for MCA industry
- RESTful API endpoints
- JWT-based authentication

## Prerequisites

- Node.js (v14+)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository:
```
git clone <repository-url>
cd mca-crm-api
```

2. Install dependencies:
```
npm install
```

3. Configure environment variables:
Create a `.env` file in the root directory with the following variables:
```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/mca-crm
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
```

4. Run the server:
```
npm run dev
```

## API Endpoints

### Authentication

- `POST /api/v1/admins/register` - Register a new admin
- `POST /api/v1/admins/login` - Login as admin
- `POST /api/v1/bookkeepers/login` - Login as bookkeeper
- `POST /api/v1/users/login` - Login as funder user
- `POST /api/v1/contacts/login` - Login as merchant contact
- `POST /api/v1/representatives/login` - Login as ISO representative

### Admin Management

- `GET /api/v1/admins/me` - Get current admin profile
- `PUT /api/v1/admins/updatedetails` - Update admin details
- `PUT /api/v1/admins/updatepassword` - Update admin password

### Funder Management

- `GET /api/v1/funders` - Get all funders
- `GET /api/v1/funders/:id` - Get specific funder
- `POST /api/v1/funders` - Create a new funder (admin only)
- `PUT /api/v1/funders/:id` - Update a funder (admin only)
- `GET /api/v1/funders/:id/users` - Get funder users
- `GET /api/v1/funders/:id/accounts` - Get funder accounts

## Data Models

The API includes comprehensive data models for:

- Admin & AdminAccessLog
- Bookkeeper & BookkeeperAccessLog
- User & UserAccessLog
- Funder & FunderAccount
- ISO & ISOAccount
- Representative & RepresentativeAccessLog
- Merchant & MerchantAccount
- Contact & ContactAccessLog
- Application & Funding

And many other related models.

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. To access protected routes, include the token in the Authorization header:

```
Authorization: Bearer <token>
```

## License

This project is licensed under the MIT License. 