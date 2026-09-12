# VaultShare

VaultShare is a full-stack file-sharing web application built to allow authenticated users to upload, manage, download, and delete their files.

The project was built as a practical full-stack development and cybersecurity learning project, with particular attention to authentication, authorization, and user-owned resources.

## Features

- User registration and login
- Password hashing with bcrypt
- JWT-based authentication
- Protected API routes
- File upload
- User-specific file management
- File download
- File deletion
- PostgreSQL database
- User ownership and access control
- React-based frontend
- Express.js backend

## Technology Stack

### Frontend
- React
- JavaScript
- CSS
- Vite

### Backend
- Node.js
- Express.js
- JWT
- bcrypt
- Multer

### Database
- PostgreSQL

## Project Structure

```text
VaultShare/
├── backend/
│   ├── middleware/
│   ├── server.js
│   ├── package.json
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
└── README.md

## How It Works
A user creates an account.
The user's password is securely hashed before being stored.
The user logs in and receives an authentication token.
Protected requests use the token to authenticate the user.
Authenticated users can upload files.
Files are associated with their respective owners.
Users can view, download, and delete their own files.
Security Considerations

Security was considered during the development of the application, particularly around:

Password hashing
Authentication
Protected routes
JWT validation
User authorization
File ownership
Access control

The application was also used as a practical environment for testing common web application security concepts.

Project Purpose

VaultShare was developed as a hands-on project to strengthen my understanding of:

Full-stack web development
REST APIs
Authentication and authorization
Database integration
File handling
Access control
Web application security testing
Current Status

The core application functionality has been implemented and tested locally.

Future improvements will include additional security hardening, expanded validation, improved file handling, and further security testing.

Disclaimer

This project is intended for educational and portfolio purposes.
