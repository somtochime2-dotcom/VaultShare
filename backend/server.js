const JWT_SECRET = "vaultshare-development-secret";
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("./db");
const authenticateToken = require("./middleware/auth");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = 5000;

//configuring secure storage for file system

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },

    filename: (req, file, cb) => {
        const randomName = crypto.randomBytes(16).toString("hex");
        const extension = path.extname(file.originalname);

        cb(null, randomName + extension);
    }
});

//adding file restrictions to the file upload

const upload = multer({
    storage: storage,

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "application/pdf",
            "text/plain"
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("File type not allowed"));
        }
    }
});

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        message: "VaultShare backend is running"
    });
});

app.post("/api/register", async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Hash the password before storing it
        const passwordHash = await bcrypt.hash(password, 12);

        const result = await pool.query(
            `INSERT INTO users (username, email, password_hash)
             VALUES ($1, $2, $3)
             RETURNING id, username, email, created_at`,
            [username, email, passwordHash]
        );

        res.status(201).json({
            message: "User created successfully",
            user: result.rows[0]
        });

    } catch (error) {
        console.error("REGISTRATION ERROR:", error);

        res.status(500).json({
            message: "Could not create user"
        });
    }
});

app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find the user by email
        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        // User doesn't exist
        if (result.rows.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const user = result.rows[0];
        console.log("USER FOUND:", user.email);
        console.log("HASH FOUND:", user.password_hash);

    // Compare submitted password with stored bcrypt hash
const passwordMatch = await bcrypt.compare(
    password,
    user.password_hash
);

console.log("PASSWORD MATCH:", passwordMatch);

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

const token = jwt.sign(
    {
        userId: user.id,
        username: user.username
    },
    JWT_SECRET,
    {
        expiresIn: "1h"
    }
);

res.json({
    message: "Login successful",
    token: token,
    user: {
        id: user.id,
        username: user.username,
        email: user.email
    }
});

    } catch (error) {
        console.error("LOGIN ERROR:", error);

        res.status(500).json({
            message: "Login failed"
        });
    }
});

app.get("/api/database-test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            status: "OK",
            message: "Database connection is working",
            time: result.rows[0].now
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            status: "ERROR",
            message: "Database connection failed"
        });
    }
});

app.get("/api/profile", authenticateToken, (req, res) => {
    res.json({
        message: "You are authenticated",
        user: req.user
    });
});


app.post("/api/files", authenticateToken, async (req, res) => {
    const { filename, storagePath } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO files (owner_id, filename, storage_path)
             VALUES ($1, $2, $3)
             RETURNING id, owner_id, filename, storage_path, created_at`,
            [
                req.user.userId,
                filename,
                storagePath
            ]
        );

        res.status(201).json({
            message: "File record created",
            file: result.rows[0]
        });

    } catch (error) {
        console.error("FILE CREATION ERROR:", error);

        res.status(500).json({
            message: "Could not create file record"
        });
    }
});

//adding the file-list route

app.get("/api/files", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, filename, storage_path, created_at
             FROM files
             WHERE owner_id = $1
             ORDER BY created_at DESC`,
            [req.user.userId]
        );

        res.json({
            files: result.rows
        });

    } catch (error) {
        console.error("FILE LIST ERROR:", error);

        res.status(500).json({
            message: "Could not retrieve files"
        });
    }
});

app.get("/api/files/:id", authenticateToken, async (req, res) => {
    try {
        const fileId = req.params.id;

        const result = await pool.query(
            `SELECT id, owner_id, filename, storage_path, created_at
             FROM files
             WHERE id = $1 AND owner_id = $2`,
            [fileId, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "File not found"
            });
        }

        res.json({
            file: result.rows[0]
        });

    } catch (error) {
        console.error("FILE RETRIEVAL ERROR:", error);

        res.status(500).json({
            message: "Could not retrieve file"
        });
    }
});

//adding the download endpoint 

app.get("/api/files/:id/download", authenticateToken, async (req, res) => {
    try {
        const fileId = req.params.id;

        const result = await pool.query(
            `SELECT id, owner_id, filename, storage_path
             FROM files
             WHERE id = $1 AND owner_id = $2`,
            [fileId, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "File not found"
            });
        }

        const file = result.rows[0];

        res.download(file.storage_path, file.filename);

    } catch (error) {
        console.error("FILE DOWNLOAD ERROR:", error);

        res.status(500).json({
            message: "Could not download file"
        });
    }
});

//adding the delete route
app.delete("/api/files/:id", authenticateToken, async (req, res) => {
    try {
        const fileId = req.params.id;

        // First find the file AND verify ownership
        const result = await pool.query(
            `SELECT id, owner_id, storage_path
             FROM files
             WHERE id = $1 AND owner_id = $2`,
            [fileId, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "File not found"
            });
        }

        const file = result.rows[0];

        // Delete the physical file
        const fs = require("fs");

        if (fs.existsSync(file.storage_path)) {
            fs.unlinkSync(file.storage_path);
        }

        // Delete the database record
        await pool.query(
            `DELETE FROM files
             WHERE id = $1 AND owner_id = $2`,
            [fileId, req.user.userId]
        );

        res.json({
            message: "File deleted successfully"
        });

    } catch (error) {
        console.error("FILE DELETE ERROR:", error);

        res.status(500).json({
            message: "Could not delete file"
        });
    }
});

//creating the upload endpoint

app.post(
    "/api/files/upload",
    authenticateToken,
    upload.single("file"),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    message: "No file uploaded"
                });
            }

            const result = await pool.query(
                `INSERT INTO files
                 (owner_id, filename, storage_path)
                 VALUES ($1, $2, $3)
                 RETURNING id, owner_id, filename, storage_path, created_at`,
                [
                    req.user.userId,
                    req.file.originalname,
                    req.file.path
                ]
            );

            res.status(201).json({
                message: "File uploaded successfully",
                file: result.rows[0]
            });

        } catch (error) {
            console.error("UPLOAD ERROR:", error);

            res.status(500).json({
                message: "Could not upload file"
            });
        }
    }
);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});