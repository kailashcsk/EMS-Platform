# EMS Backend - Medical Data AI Assistant

A comprehensive backend system for EMS professionals to interact with medical protocols, medications, and treatments through AI-powered natural language interfaces.

## 🏗️ Project Structure

```
ems-backend/
├── src/
│   ├── config/
│   │   ├── database.js          # PostgreSQL connection setup
│   │   └── aws.js               # AWS S3 configuration
│   ├── controllers/
│   │   ├── departmentController.js      # Department CRUD operations
│   │   ├── protocolController.js        # Protocol management + file upload
│   │   ├── medicationController.js      # Medication management + file upload
│   │   ├── medicationDoseController.js  # Dose management + analytics
│   │   ├── aiController.js              # AI query processing
│   │   ├── relationshipController.js    # Complex data relationships
│   │   └── testController.js            # Testing endpoints
│   ├── middleware/
│   │   ├── auth.js              # Firebase authentication
│   │   └── upload.js            # File upload handling (Multer)
│   ├── routes/
│   │   ├── departments.js       # Department API routes
│   │   ├── protocols.js         # Protocol API routes
│   │   ├── medications.js       # Medication API routes
│   │   ├── medicationDoses.js   # Medication dose API routes
│   │   ├── ai.js               # AI query API routes
│   │   ├── admin.js            # User management routes
│   │   └── test.js             # Testing routes
│   └── services/
│       ├── aiService.js         # OpenAI integration & SQL generation
│       ├── documentParserService.js  # PDF/document parsing
│       └── s3Service.js         # AWS S3 file operations
├── .env                         # Environment variables (create this)
├── .gitignore                   # Git ignore rules
├── package.json                 # Dependencies and scripts
├── server.js                    # Main application entry point
└── README.md                    # This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** (local installation or AWS RDS)
- **AWS Account** (for S3 storage)
- **OpenAI API Key**
- **Firebase Project** (for authentication)

### 1. Clone the Repository

```bash
git clone https://github.com/kailashcsk/EMS-Platform.git
cd ems-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory with the following structure:

```env
# Database Configuration (PostgreSQL)
DB_HOST=localhost                    # For local DB or RDS endpoint
DB_PORT=5432
DB_NAME=ems_database
DB_USER=your_database_user
DB_PASSWORD=your_database_password

# AWS Configuration
AWS_ACCESS_KEY_ID=AKIA...           # Your AWS Access Key
AWS_SECRET_ACCESS_KEY=abc123...     # Your AWS Secret Key
AWS_REGION=us-east-1                # Your preferred AWS region
AWS_S3_BUCKET=ems-medical-files     # Your S3 bucket name

# OpenAI Configuration
OPENAI_API_KEY=sk-...               # Your OpenAI API key

# Server Configuration
PORT=3000
NODE_ENV=development

# Firebase Configuration (Optional - for authentication)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
```

### 4. Database Setup

#### Option A: Local PostgreSQL
```bash
# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Create database
createdb ems_database

# Create user (optional)
psql -d ems_database
CREATE USER ems_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ems_database TO ems_user;
```

#### Option B: AWS RDS
1. Create RDS PostgreSQL instance in AWS Console
2. Configure security groups to allow your IP
3. Update `.env` with RDS endpoint

### 5. Database Schema Setup

Run the database schema creation scripts using pgAdmin or psql:

```sql
-- Connect to your database and run these commands:

-- Create departments table
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create protocols table
CREATE TABLE protocols (
    id SERIAL PRIMARY KEY,
    department_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description_summary TEXT,
    file_url VARCHAR(500),
    file_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_protocol_department 
        FOREIGN KEY (department_id) 
        REFERENCES departments(id) 
        ON DELETE CASCADE
);

-- Create medications table
CREATE TABLE medications (
    id SERIAL PRIMARY KEY,
    department_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    use_case TEXT,
    description_summary TEXT,
    file_url VARCHAR(500),
    file_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_medication_department 
        FOREIGN KEY (department_id) 
        REFERENCES departments(id) 
        ON DELETE CASCADE
);

-- Create medication_doses table
CREATE TABLE medication_doses (
    id SERIAL PRIMARY KEY,
    protocol_id INTEGER NOT NULL,
    medication_id INTEGER NOT NULL,
    amount VARCHAR(100) NOT NULL,
    route VARCHAR(50),
    frequency VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dose_protocol 
        FOREIGN KEY (protocol_id) 
        REFERENCES protocols(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_dose_medication 
        FOREIGN KEY (medication_id) 
        REFERENCES medications(id) 
        ON DELETE CASCADE,
    UNIQUE(protocol_id, medication_id, route)
);
```

### 6. AWS S3 Setup

1. Create an S3 bucket in AWS Console
2. Create IAM user with S3 permissions:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:GetObject",
           "s3:PutObject",
           "s3:DeleteObject"
         ],
         "Resource": "arn:aws:s3:::your-bucket-name/*"
       }
     ]
   }
   ```
3. Add access keys to `.env` file

### 7. Start the Development Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## 📡 API Endpoints

### Health Check
- `GET /health` - Server health status

### Departments
- `GET /api/departments` - List all departments
- `GET /api/departments/:id` - Get specific department
- `POST /api/departments` - Create new department
- `PUT /api/departments/:id` - Update department
- `DELETE /api/departments/:id` - Delete department

### Protocols
- `GET /api/protocols` - List all protocols
- `GET /api/protocols/:id` - Get specific protocol
- `POST /api/protocols` - Create protocol (with file upload)
- `PUT /api/protocols/:id` - Update protocol
- `DELETE /api/protocols/:id` - Delete protocol

### Medications
- `GET /api/medications` - List all medications
- `GET /api/medications/:id` - Get specific medication
- `POST /api/medications` - Create medication (with file upload)
- `PUT /api/medications/:id` - Update medication
- `DELETE /api/medications/:id` - Delete medication

### Medication Doses
- `GET /api/medication-doses` - List all doses
- `GET /api/medication-doses/search?q=term` - Search doses
- `GET /api/medication-doses/analysis/routes` - Route analysis
- `POST /api/medication-doses` - Create dose
- `PUT /api/medication-doses/:id` - Update dose
- `DELETE /api/medication-doses/:id` - Delete dose

### AI Queries
- `POST /api/ai/query` - Basic natural language query
- `POST /api/ai/query-with-docs` - Enhanced query with document parsing
- `GET /api/ai/samples` - Get sample queries
- `GET /api/ai/health` - AI service health check

## 🧪 Testing

### Using Postman
1. Import the provided Postman collection (if available)
2. Test basic endpoints:
   ```bash
   GET http://localhost:3000/health
   GET http://localhost:3000/api/departments
   ```

### Manual Testing
```bash
# Test AI query
curl -X POST http://localhost:3000/api/ai/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the epinephrine dose for cardiac arrest?"}'

# Test file upload
curl -X POST http://localhost:3000/api/protocols \
  -F "name=Test Protocol" \
  -F "department_id=1" \
  -F "description_summary=Test protocol" \
  -F "file=@test.pdf"
```

## 🛠️ Development

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (if configured)

### Code Structure Guidelines
- **Controllers**: Handle HTTP requests/responses and business logic
- **Services**: Reusable business logic and external API integration
- **Routes**: Define API endpoints and middleware
- **Middleware**: Authentication, file upload, error handling
- **Config**: Database and external service configurations

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```
   Solution: Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD in .env
   Verify PostgreSQL is running and accessible
   ```

2. **S3 Upload Fails**
   ```
   Solution: Verify AWS credentials and bucket permissions
   Check if bucket exists and is in the correct region
   ```

3. **AI Queries Not Working**
   ```
   Solution: Verify OPENAI_API_KEY is valid
   Check OpenAI API quota and billing status
   ```

4. **File Upload Issues**
   ```
   Solution: Check file size (max 10MB)
   Verify supported file types (PDF, DOC, images)
   ```

### Debug Mode
Enable detailed logging by setting:
```env
NODE_ENV=development
```

## 🚀 Deployment

### AWS EC2 Deployment
1. Launch EC2 instance (t2.micro for free tier)
2. Install Node.js and PM2
3. Clone repository and install dependencies
4. Configure environment variables
5. Start with PM2: `pm2 start server.js`

### Environment Variables for Production
```env
NODE_ENV=production
PORT=80
# Update database and AWS configurations for production
```


**Note**: Make sure to never commit your `.env` file to version control. It contains sensitive information like API keys and database credentials.