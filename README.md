# Hinckley Medical Take Home Assignment

💻 Github Link: https://github.com/kailashcsk/EMS-Platform

📹 Video Link:

## QUESTION:

We are building tools to enable EMS professionals and clinicians to interact with data
(such as protocols, medications, and treatments) in natural and intelligent ways. 

You are provided with an Entity Relationship (ER) Diagram that defines the structure of
the data that we used in the interview.

Your task is to design and begin building an approach that enables AI to interpret and
respond to user prompts or commands based solely on that data.

The response can be in any format that is up to you.

**What We’re Evaluating**

a. How you interpret the diagram into a usable structure

b. How you think about enabling AI to work with structured data

c. How you prepare or organize the data for fast and accurate querying

d. Your ability to choose tools/frameworks that fit the problem

e. How you reason through ambiguity and communicate technical decisions

![Screenshot 2025-08-02 at 1.41.59 AM.png](Hinckley%20Medical%20Take%20Home%20Assignment%20243f7b0bc2bf807abddbe5e24d4d18ad/Screenshot_2025-08-02_at_1.41.59_AM.png)

## SOLUTION:

<aside>
<img src="https://www.notion.so/icons/help-alternate_yellow.svg" alt="https://www.notion.so/icons/help-alternate_yellow.svg" width="40px" />

How you interpret the diagram into a usable structure

</aside>

From the ER Diagram, we can identify **4 main entities**:

| Entity | Description |
| --- | --- |
| `Department` | EMS or clinical divisions |
| `Protocol` | Guidelines or treatment plans associated with a department |
| `Medication` | Drugs used in protocols and across departments |
| `MedicationDose` | A specific dosage of a medication, within the context of a protocol |

Its given from the question that:

1. A **Department** can have many **Protocols & Medications** in it. 
2. A **Protocol** can have many **MedicationDose’s.** 
3. A **MedicationDose** must belong to a **Protocol** and a **Medication**.

Let’s now decode each relationship and the cardinality between the 4 entities we identified:

1. **Department — Contains → Protocol:** 
    - One Department can contain many Protocols
    - Each Protocol belongs to exactly one Department
    
    Cardinality: `Department (1) ↔ Protocol (Many)`  So its a one to many relationship between Departments and Protocols entity
    
    ![Screenshot 2025-08-03 at 9.26.38 PM.png](Hinckley%20Medical%20Take%20Home%20Assignment%20243f7b0bc2bf807abddbe5e24d4d18ad/Screenshot_2025-08-03_at_9.26.38_PM.png)
    
    Implementation: The 3 tables i.e. the 2 entity and 1 relationship table can be combined together taking `department_id` as a foreign key reference into the `Protocol`  table thereby forming just 2 tables eliminating the need for contains table.
    

1. Department — Contains → Medication:
    - One Department can contain many Medications
    - Each Medication belongs to exactly one Department
    
    Cardinality: `Department (1) ↔ Medication (Many)`  So its a one to many relationship between Departments and Medications entity
    
    ![Screenshot 2025-08-03 at 9.33.14 PM.png](Hinckley%20Medical%20Take%20Home%20Assignment%20243f7b0bc2bf807abddbe5e24d4d18ad/Screenshot_2025-08-03_at_9.33.14_PM.png)
    
    Implementation: The 3 tables i.e. the 2 entity and 1 relationship table can be combined together taking `department_id` as a foreign key reference into the `Medications`  table thereby forming just 2 tables eliminating the need for contains table.
    

3. **Protocols — Belongs To → MedicationDose:**

- One Protocol can have many MedicationDoses
- Each MedicationDose belongs to exactly one Protocol

Cardinality: `Protocol (1) ↔ MedicationDose (Many)` So its a one to many relationship between Protocols and MedicationDose entity

![Screenshot 2025-08-03 at 9.39.38 PM.png](Hinckley%20Medical%20Take%20Home%20Assignment%20243f7b0bc2bf807abddbe5e24d4d18ad/Screenshot_2025-08-03_at_9.39.38_PM.png)

Implementation: The 3 tables i.e. the 2 entity and 1 relationship table can be combined together taking `protocol_id` as a foreign key reference into the `MedicationDose`  table thereby forming just 2 tables eliminating the need for belongs table.

1. Medication — Belongs To → MedicationDose
    - One Medication can have many MedicationDoses
    - Each MedicationDose belongs to exactly one Medication
    
    Cardinality: `Medication (1) ↔ MedicationDose (Many)` So its a one to many relationship between Medication and MedicationDose entity
    
    ![Screenshot 2025-08-03 at 9.41.12 PM.png](Hinckley%20Medical%20Take%20Home%20Assignment%20243f7b0bc2bf807abddbe5e24d4d18ad/Screenshot_2025-08-03_at_9.41.12_PM.png)
    
    Implementation: The 3 tables i.e. the 2 entity and 1 relationship table can be combined together taking `medication_id` as a foreign key reference into the `MedicationDose`  table thereby forming just 2 tables eliminating the need for belongs table.
    

From the above deep level architectural analysis we get the following tables and we can identify their attributes as follows. This is just an assumption and can be changed as per the client requirements/ Business needs.

## Schema

1. Departments Table: 
    
    Possible attributes:
    
    - id - Primary Key of this table
    - name
    - description
    - created_at
    - updated_at
    
    SQL Query To create Departments Table:
    
    ```sql
    CREATE TABLE departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    ```
    
    Implementation from Postgres PG Admin Screenshot:
    
    ```sql
    SELECT * FROM public.departments
    ORDER BY id ASC 
    ```
    
    ![Screenshot 2025-08-03 at 9.49.45 PM.png](Hinckley%20Medical%20Take%20Home%20Assignment%20243f7b0bc2bf807abddbe5e24d4d18ad/Screenshot_2025-08-03_at_9.49.45_PM.png)
    

1. Protocols Table:
    
    Possible attributes:
    
    - id - Primary Key of this table
    - department_id - Foreign Key resulting from combining the one to many relationship
    - name
    - description_summary
    - file_url
    - file_name
    - created_at
    - updated_at
    
    SQL Query To create Protocols Table:
    
    ```sql
    CREATE TABLE protocols (
        id SERIAL PRIMARY KEY,
        department_id INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        description_summary TEXT,
        file_url VARCHAR(500),
        file_name VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_protocol_department 
            FOREIGN KEY (department_id) 
            REFERENCES departments(id) 
            ON DELETE CASCADE
    );
    ```
    
    Implementation from Postgres PG Admin Screenshot:
    
    ```sql
    SELECT * FROM public.protocols
    ORDER BY id ASC 
    ```
    
    ![Screenshot 2025-08-03 at 9.57.49 PM.png](Hinckley%20Medical%20Take%20Home%20Assignment%20243f7b0bc2bf807abddbe5e24d4d18ad/Screenshot_2025-08-03_at_9.57.49_PM.png)
    
    ![Screenshot 2025-08-03 at 9.58.03 PM.png](Hinckley%20Medical%20Take%20Home%20Assignment%20243f7b0bc2bf807abddbe5e24d4d18ad/Screenshot_2025-08-03_at_9.58.03_PM.png)
    
2. Medications Table: 
    
    Possible attributes:
    
    - id - Primary Key of this table
    - department_id - Foreign Key resulting from combining the one to many relationship
    - name
    - use_case
    - description_summary
    - file_url
    - file_name
    - created_at
    - updated_at
    
    SQL Query To create Medications Table:
    
    ```sql
    CREATE TABLE medications (
        id SERIAL PRIMARY KEY,
        department_id INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        use_case TEXT,
        description_summary TEXT,
        file_url VARCHAR(500),
        file_name VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_medication_department 
            FOREIGN KEY (department_id) 
            REFERENCES departments(id) 
            ON DELETE CASCADE
    );
    ```
    
    Implementation from Postgres PG Admin Screenshot:
    
    ```sql
    SELECT * FROM public.medications
    ORDER BY id ASC 
    ```
    
    ![Screenshot 2025-08-03 at 10.01.24 PM.png](Hinckley%20Medical%20Take%20Home%20Assignment%20243f7b0bc2bf807abddbe5e24d4d18ad/Screenshot_2025-08-03_at_10.01.24_PM.png)
    
    ![Screenshot 2025-08-03 at 10.01.36 PM.png](Hinckley%20Medical%20Take%20Home%20Assignment%20243f7b0bc2bf807abddbe5e24d4d18ad/Screenshot_2025-08-03_at_10.01.36_PM.png)
    

1. Medication Doses Table: 
    
    Possible attributes:
    
    - id - Primary Key of this table
    - protocol_id - Foreign Key resulting from combining the one to many relationship
    - medication_id - Foreign Key resulting from combining the one to many relationship
    - amount
    - route
    - frequency
    - notes
    - created_at
    - updated_at
    
    SQL Query To create Medication Doses Table:
    
    ```sql
    CREATE TABLE medication_doses (
        id SERIAL PRIMARY KEY,
        protocol_id INTEGER NOT NULL,
        medication_id INTEGER NOT NULL,
        amount VARCHAR(100) NOT NULL,
        route VARCHAR(50),
        frequency VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
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
    
    Implementation from Postgres PG Admin Screenshot:
    
    ```sql
    SELECT * FROM public.medication_doses
    ORDER BY id ASC 
    ```
    
    ![Screenshot 2025-08-03 at 10.05.15 PM.png](Hinckley%20Medical%20Take%20Home%20Assignment%20243f7b0bc2bf807abddbe5e24d4d18ad/Screenshot_2025-08-03_at_10.05.15_PM.png)
    
    ![Screenshot 2025-08-03 at 10.05.26 PM.png](Hinckley%20Medical%20Take%20Home%20Assignment%20243f7b0bc2bf807abddbe5e24d4d18ad/Screenshot_2025-08-03_at_10.05.26_PM.png)
    
    Once This ER Diagram was converted into usable structure I had to decide on what architecture and Tools(Tech Stack) I would use to build this platform where AI could interact, interpret and respond to user prompts or commands based solely on that data.
    
    <aside>
    <img src="https://www.notion.so/icons/help-alternate_yellow.svg" alt="https://www.notion.so/icons/help-alternate_yellow.svg" width="40px" />
    
    Your ability to choose tools/frameworks that fit the problem
    
    </aside>
    
    ## Tech Stack Used
    
    ### Frontend:
    
    - React
    - Tailwind CSS with Shadcn UI
    - TypeScript
    
    ### Backend:
    
    - Express.js with Node.js
    - Firebase for auth and role based access
    - Open AI API to interpret the data from the database
    
    ### Database:
    
    - Postgres SQL for the relational part of schema
    
    ### Cloud:
    
    - EC2(Free Instance) - Used to deploy Both the Frontend and Backend
    - RDS - to use the migrated PostgresSQL DB on cloud
    - S3 - Used to store the unstructured Data like the files used in the Protocols and Medications table
    
    ### Backend Testing:
    
    - Postman
    
    ### Database query testing:
    
    - PgAdmin
    
    ## Architecture:
    
    ### Overall Big Picture View of Architecture:
    
    ![diagram-export-8-3-2025-11_09_02-PM.png](Hinckley%20Medical%20Take%20Home%20Assignment%20243f7b0bc2bf807abddbe5e24d4d18ad/diagram-export-8-3-2025-11_09_02-PM.png)
    
    The main components of this diagram and their significance is as follows:
    
    - RDS Postgres DB:
        
        The Schema that was designed in the earlier section was used to create the tables in RDS manually using PG admin locally. Dummy data was used to fill the rows of these tables to test the DB querying using SQL if our schema was designed perfectly.
        
    - S3 Bucket:
        
        S3 Bucket was used to store unstructured data like files(PDF, Image files etc.). The Link and file name thats generated from storing these files in the S3 bucket was stored in a separate column in the Protocols and Medications table called `file_name`  and `file_url` . The limit was set to 10 mb of uploads as a restrictive security measure.
        
    - EC2 Instance:
        
        The EC2 instance was used to run the Backend server built using Express.js that hosted a bunch of full stack features including the CRUD Operations with the 4 main tables and also certain REST API endpoints to interact with the Open AI API to generate super efficient SQL queries that was sent to the Backend. The Backend  further ran these SQL queries by making a call  to the Database which returned data that was specific to the natural language query that was fed as an input to these API endpoints. This data was then again interpreted by the AI which finally packaged the final response based on the retrieved data. A document parser service was built into the Backend that helped in parsing the documents that were present in the data that was retrieved from the SQL query generated by the AI. These parsed Documents were also interpreted by the AI to generate useful insights as well as present the Medical data to the users. This feature helped users to query directly to the documents attached in the S3 Bucket for the protocols and medication table.
        
    - AI:
        
        The REST API endpoints written in the Backend code was used to interact with the OPEN AI API where user generated Natural language was fed as a request, to generate efficient SQL query by the OPEN AI API that was used to retrieve the data that was closely associated with the Natural Language. This data was properly cleaned and formatted to be presented to the Users along with the AI driven insights related to the Users Natural Language Query. 
        
    - Firebase Auth:
        
        Firebase Auth was used as the main authentication service that internally used Googles OAuth. It was used to authenticate users based on mainly 2 roles.
        
        - Admin
        - Patients
        
        An Admin could be a doctor or organization that had the exclusive administrative rights(CRUD Operations) on the secure information that was stored in the database that was related to protocols, medications and Medication doses. This promoted secure access to the data as anyone with an account to the platform couldn’t modify or delete the information that was present. Patients could only access the information(GET Requests allowed) and interact with the AI to get Useful responses  
        
    - React:
        
        The Frontend was built using React. It had a signin page along with a dashboard that displayed important information about recently added Protocols and medications also had a metrics display showing useful information about the overall data. There was a Medications and Protocols Page that showed detailed information about the different protocols and medications. There was role based access that showed that role the user belonged to and accordingly the components were modified to fit their usecase. Finally there was an AI Query Page where users could use AI and natural language to interact with the OPEN AI API to interpret the existing medical data that is actually present in the database.
        
    - User:
        
        This is the Client side of the architecture. The two user groups had their own Use Cases. A patient could access all the data in the Database with a read only privilege and they could interact with the AI to ask useful questions about the Data. Admin Users have all the same privileges as the Patient with additional privilege to write (POST, PUT and DELETE) the data.
        
    
    ### Backend Architecture Deep Dive:
    
    ![diagram-export-8-4-2025-12_40_04-AM.png](Hinckley%20Medical%20Take%20Home%20Assignment%20243f7b0bc2bf807abddbe5e24d4d18ad/diagram-export-8-4-2025-12_40_04-AM.png)
    
    This diagram illustrates a **sophisticated EMS (Emergency Medical Services) backend system** deployed on AWS EC2, designed to enable medical professionals to interact with protocols, medications, and treatments through AI-powered natural language interfaces.
    
    The system follows a **modular, enterprise-grade architecture** with clear separation of concerns:
    
    1. Routers Layer:
        
        **Purpose**: API endpoint definition and request routing
        
        `departments.js` Router
        
        ```jsx
        GET    /api/departments              // List all departments
        GET    /api/departments/:id          // Get specific department
        GET    /api/departments/:id/overview // Get department with all protocols/medications
        POST   /api/departments              // Create new department
        PUT    /api/departments/:id          // Update department
        DELETE /api/departments/:id          // Delete department
        ```
        
        `medications.js` Router
        
        ```jsx
        GET    /api/medications                    // List all medications
        GET    /api/medications/:id                // Get specific medication
        GET    /api/medications/:id/protocols      // Get all protocols using this medication
        POST   /api/medications                    // Create medication (with file upload)
        PUT    /api/medications/:id                // Update medication (with file upload)
        DELETE /api/medications/:id                // Delete medication
        ```
        
        `protocols.js` Router
        
        ```jsx
        GET    /api/protocols                      // List all protocols
        GET    /api/protocols/:id                  // Get specific protocol
        GET    /api/protocols/:id/medications      // Get all medications for this protocol
        POST   /api/protocols                      // Create protocol (with file upload)
        PUT    /api/protocols/:id                  // Update protocol (with file upload)
        DELETE /api/protocols/:id                  // Delete protocol
        ```
        
        `medicationDoses.js` Router
        
        ```jsx
        GET    /api/medication-doses                           // List all doses
        GET    /api/medication-doses/:id                       // Get specific dose
        GET    /api/medication-doses/search?q=term            // Search doses
        GET    /api/medication-doses/analysis/routes          // Route analysis
        GET    /api/medication-doses/protocol/:protocol_id    // Protocol doses
        GET    /api/medication-doses/medication/:medication_id // Medication usage
        POST   /api/medication-doses                          // Create dose
        PUT    /api/medication-doses/:id                      // Update dose
        DELETE /api/medication-doses/:id                      // Delete dose
        ```
        
        `ai.js` Router
        
        ```jsx
        POST   /api/ai/query                   // Basic natural language query
        POST   /api/ai/query-with-docs         // Enhanced query with document parsing
        GET    /api/ai/samples                 // Get sample queries
        GET    /api/ai/health                  // AI service health check
        ```
        
        `relationships.js` Router
        
        ```jsx
        GET    /api/relationships/protocol-medications/:id    // Protocol with medications
        GET    /api/relationships/medication-protocols/:id    // Medication with protocols
        GET    /api/relationships/department-overview/:id     // Complete department view
        ```
        
        `admin.js` Router
        
        ```jsx
        GET    /api/admin/users              // List all users (admin only)
        POST   /api/admin/users/promote      // Promote user to admin/doctor role
        POST   /api/admin/users/revoke       // Revoke admin privileges, set to patient
        ```
        
    2. Controllers Layer:
        
        **Purpose**: Business logic implementation and request processing
        
        `departmentController.js` :
        
        - Responsible for the Department CRUD operations
        - Validates department creation/updates
        - Checks for related protocols/medications before deletion
        - Provides department overview with statistics
        
        `medicationController.js` :
        
        - Deals with Medication management with file handling
        - S3 file upload integration for medication documents
        - Cross-reference with protocols for usage analysis
        - File cleanup on medication deletion
        
        `protocolController.js` :
        
        - Used for Protocol management with document storage
        - PDF/document upload to S3
        - Protocol-medication relationship management
        - File versioning and replacement
        
        `medicationDoseController.js` :
        
        - Deals with Complex dosage data management and analytics
        - Advanced search across multiple fields
        - Route-based dosage analysis
        - Cross-protocol medication usage tracking
        - Data validation for medical accuracy
        
        `aiController.js` :
        
        - Uses Natural language processing and AI integration
        - OpenAI API integration
        - SQL query generation from natural language
        - Medical context and insights generation
        - Document content integration
        
        `relationshipController.js` :
        
        - Used in Complex multi-table queries and analytics
        - JSON aggregation for complex data structures
        - Cross-table relationship analysis
        - Performance-optimized queries
    3. Middlewares Layer:
        
        **Purpose**: Request processing, security, and file handling
        
        `auth.js` Middleware:
        
        - Role-based access control for medical data
        
        `Upload.js` Middleware:
        
        - **File Processing**: Multer integration for multipart/form-data
        - **Validation**: File type, size, and content validation
        - **Security**: Malicious file detection and sanitization
        - **Storage**: Memory storage for S3 upload pipeline
    4. Helper Modules (Services):
        
        **Purpose**: Reusable business logic and external service integration
        
        `aiService.js`:
        
        - **OpenAI Integration**: GPT-3.5-turbo for natural language processing
        - **Schema Awareness**: Database structure understanding for AI
        - **Query Generation**: Natural language to SQL conversion
        - **Medical Context**: Clinical insights and recommendations
        - **Document Analysis**: PDF content integration with AI responses
        
        `documentParserService.js` :
        
        - **PDF Parsing**: Extract text from medical protocol PDFs
        - **Word Document Processing**: Handle .docx and .doc files
        - **Medical Keyword Extraction**: Identify medications, dosages, procedures
        - **Content Analysis**: Structure medical information for AI processing
        - **AWS Textract Integration**: Advanced image and form processing
        
        `s3Service.js` :
        
        - **File Upload Management**: Secure S3 upload with unique naming
        - **File Organization**: Structured folder system (protocols/, medications/)
        - **Access Control**: Presigned URL generation for secure access
        - **Cleanup Operations**: Automatic file deletion on record removal
        - **Metadata Tracking**: File information and version management
        
        ### Data Flow Architecture:
        
        1. Standard CRUD Operations:
            
            ```jsx
            Client Request → Router → Controller → Database/S3 → Response
            ```
            
        2.  File Upload Flow:
            
            ```jsx
             Client (Multipart) → Upload Middleware → Controller → S3Service → Database URL Storage
            ```
            
        3. AI Query Processing Flow:
            
            ```jsx
            Natural Language → AI Router → AI Controller → AI Service → SQL Generation → Database Query → Document Parsing → Enhanced Response
            ```
            
        
        4. Document-Enhanced AI Flow
        
        ```jsx
        User Query → AI Service → SQL Generation → Database Results → Document Parser → Content Extraction → AI Insight Generation → Enhanced Response
        ```
        

Now that the we have the deeper level understanding of the architecture of the application lets try to answer some of the Questions that require still deeper implementation level details.

<aside>
<img src="https://www.notion.so/icons/help-alternate_yellow.svg" alt="https://www.notion.so/icons/help-alternate_yellow.svg" width="40px" />

How you think about enabling AI to work with structured data

</aside>

### Schema-Aware Prompt Engineering:

To enable AI to interact meaningfully with structured data, I implemented **schema context injection** directly into every LLM prompt. This ensures the model has full awareness of the database structure, entity relationships, and domain language (e.g., "IV medications" → `route = 'IV'`).
Sample Code used in the actual implementation:

```jsx
this.schemaContext = `
  You are an EMS (Emergency Medical Services) database assistant. You have access to a PostgreSQL database with the following schema:

  TABLES:
  1. departments (id, name, description, created_at, updated_at)
  2. protocols (id, department_id, name, description_summary, file_url, file_name, created_at, updated_at)
  3. medications (id, department_id, name, use_case, description_summary, file_url, file_name, created_at, updated_at)
  4. medication_doses (id, protocol_id, medication_id, amount, route, frequency, notes, created_at, updated_at)

  IMPORTANT: 
  - protocols.file_url contains attached protocol documents (PDFs, etc.)
  - medications.file_url contains attached medication information documents
  - When looking for protocol documents, SELECT p.file_url from protocols table
  - When looking for medication documents, SELECT m.file_url from medications table

  RELATIONSHIPS:
  - departments contain protocols and medications (1:many)
  - protocols have many medication_doses (1:many)
  - medications have many medication_doses (1:many)
  - medication_doses connect protocols and medications with specific dosage info

  SAMPLE DATA CONTEXT:
  Departments: Emergency Medicine, Cardiology, Pediatrics
  Common Protocols: Adult Cardiac Arrest, Anaphylaxis Treatment, STEMI Protocol, Advanced Cardiac Life Support Protocol
  Common Medications: Epinephrine, Atropine, Aspirin, Midazolam
  Routes: IV (intravenous), IM (intramuscular), PO (oral), SL (sublingual)
  
  When generating SQL queries:
  1. Always SELECT file_url when querying protocols or medications to check for attached documents
  2. Use proper JOINs to get related data
  3. Include meaningful column aliases
  4. Use ILIKE with % wildcards for flexible text searches
  5. Order results logically
  `;
```

This context is prepended to every OpenAI prompt to generate accurate, safe SQL queries tailored to our EMS schema.

### AI Pipeline: Natural Language → Query → Document → Insight

The `processNaturalLanguageQuery()` and `processQueryWithDocuments()` methods form the backbone of a modular, multi-stage AI pipeline:

```jsx
const sqlQuery = await this.generateSQLFromQuery(userQuery);  // Stage 1
const queryResults = await this.executeQuery(sqlQuery);       // Stage 2
const insight = await this.generateInsight(queryResults);     // Stage 3
```

For document-based queries:

```jsx
const parsedDocument = await documentParserService.parseDocument(file_url);
const enhancedInsight = await this.generateEnhancedInsight(queryResults, documentText);
```

This design ensures that:

- Plain SQL-only queries still return valuable insights
- If file URLs are present, parsed content is injected into the AI prompt for more context

### Structured + Unstructured Data Integration

The system intelligently merges **structured DB data** (e.g., protocol name, medication dosage) with **unstructured document context** (e.g., PDF from S3). This hybrid insight is handled in:

```jsx
generateEnhancedInsight(queryDataWithDocs, originalQuery);
```

The AI is guided to synthesize results from both sources and produce a rich, medically accurate insight that includes relevant contraindications, treatment windows, and more.

### AI Safeguards:

- Queries are validated as `SELECT`-only through prompt instruction
- Query input is string-checked and size-limited to 500 chars in the controller
- Errors in document parsing fall back gracefully to SQL-only mode

### Sample Postman Response Captured:

I created a sample document using Open AI which mimicked an actual Protocol document. and the following screenshots were the request, query and responses captured from Postman. From the AI response we can see that the Document was accurately parsed for the medical information in it and then the data was returned.
The Sample document was : 

[bTOFFnorNH.pdf](Hinckley%20Medical%20Take%20Home%20Assignment%20243f7b0bc2bf807abddbe5e24d4d18ad/bTOFFnorNH.pdf)

![Screenshot 2025-08-04 at 2.04.33 AM.png](Hinckley%20Medical%20Take%20Home%20Assignment%20243f7b0bc2bf807abddbe5e24d4d18ad/Screenshot_2025-08-04_at_2.04.33_AM.png)

![Screenshot 2025-08-04 at 2.04.23 AM.png](Hinckley%20Medical%20Take%20Home%20Assignment%20243f7b0bc2bf807abddbe5e24d4d18ad/Screenshot_2025-08-04_at_2.04.23_AM.png)

![Screenshot 2025-08-04 at 2.04.11 AM.png](Hinckley%20Medical%20Take%20Home%20Assignment%20243f7b0bc2bf807abddbe5e24d4d18ad/Screenshot_2025-08-04_at_2.04.11_AM.png)

<aside>
<img src="https://www.notion.so/icons/help-alternate_yellow.svg" alt="https://www.notion.so/icons/help-alternate_yellow.svg" width="40px" />

How you prepare or organize the data for fast and accurate querying

</aside>

### Normalized Schema for Complex Relationships:

The PostgreSQL schema is normalized and mirrors the real-world structure of EMS data:

- `departments` contain `protocols` and `medications`
- `medication_doses` acts as a relational entity, not just a join table, with clinical attributes like `amount`, `route`, `frequency`

Example from my schema implementation:

```sql
CREATE TABLE medication_doses (
  id SERIAL PRIMARY KEY,
  protocol_id INTEGER REFERENCES protocols(id),
  medication_id INTEGER REFERENCES medications(id),
  amount VARCHAR(100),
  route VARCHAR(50),
  ...
);
```

### Anticipated AI Query Patterns → Index Optimization

Common queries like “show me all IV medications” or “find protocols for cardiac arrest” were used to derive suggested indexes:

```sql
CREATE INDEX idx_doses_route ON medication_doses(route);
CREATE INDEX idx_protocols_name ON protocols(name);
CREATE INDEX idx_medications_use_case ON medications USING gin(to_tsvector('english', use_case));
```

These indexes are tuned for full-text search and fast joins, minimizing latency in AI response times.

### File-Driven Insights:

Instead of storing heavy document content in the DB, the system stores file metadata and S3 URLs, and parses files only when necessary:

```jsx
if (row.file_url) {
  const parsed = await documentParserService.parseDocument(row.file_url);
}
```

This helps maintain performance and scalability. The AI prompt generation also includes document text (trimmed to 1000 characters) and detected keywords, improving clinical accuracy.

### Future Caching Strategy:

The architecture is ready for a Redis-based caching layer to store:

- Schema context
- Frequently used AI responses
- Parsed document output (based on file hash)

```jsx
{
  sql: `query_hash_${hash}`,
  document: `parsed_doc_${url_hash}`,
  insight: `insight_${query}_${result_hash}`
}
```

<aside>
<img src="https://www.notion.so/icons/help-alternate_yellow.svg" alt="https://www.notion.so/icons/help-alternate_yellow.svg" width="40px" />

**How You Reason Through Ambiguity and Communicate Technical Decisions**

</aside>

### Decision-Making via Trade-offs:

| Choice | Rationale |
| --- | --- |
| **Express.js** | Matches frontend (React), supports Node SDK for S3, mature ecosystem |
| **PostgreSQL** | ACID-compliant, supports complex joins, audit-ready |
| **S3 + file_url** | Keeps DB lean, scalable document access |
| **OpenAI API** | Allows sophisticated reasoning without custom LLM training |
| **PDF parsing on demand** | Avoids unnecessary processing and keeps responses focused |

These decisions are documented and traceable through the code itself.

### Communication to Stakeholders:

I have structured the system so it can be clearly explained to various roles:

- **To Engineers**:
    
    > "The AI controller maps natural language to SQL using a schema-aware prompt. Results are post-processed with optional document parsing and clinical insight generation."
    > 
- **To Medical Professionals**:
    
    > "You can ask questions like 'What’s the adult epinephrine dose for cardiac arrest?', and the system gives the dosage plus additional context from attached protocols."
    > 
- **To Business/Leadership**:
    
    > "This system enables EMS teams to get medically reliable answers in seconds — combining structured data, clinical documentation, and AI reasoning.
    > 

### Risk Mitigation in Practice:

| Risk | Mitigation |
| --- | --- |
| SQL injection | Read-only prompt design, controller-level query validation |
| AI hallucination | Strict schema context, fallback logic |
| Slow response | Indexing + caching plan, lightweight prompt design |
| Missing file data | Document parser wrapped in try/catch with fallback |
| Abuse / load | Query length throttled, optional rate limiting planned |