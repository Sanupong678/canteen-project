# 2. Literature Review

## 2.1 Related Technology

### 2.1.1 Node.js

Node.js is an open-source, cross-platform, back-end JavaScript runtime environment that runs on the V8 engine and executes JavaScript code outside a web browser. Node.js lets developers use JavaScript to write command line tools and for server-side scripting—running scripts server-side to produce dynamic web page content before the page is sent to the user's web browser. Consequently, Node.js represents a "JavaScript everywhere" paradigm, unifying web-application development around a single programming language, rather than different languages for server-side and client-side scripts.

Node.js has an event-driven architecture capable of asynchronous I/O. These design choices aim to optimize throughput and scalability in web applications with many input/output operations, as well as for real-time web applications. The non-blocking I/O model makes Node.js particularly well-suited for building scalable network applications that can handle a large number of concurrent connections with minimal overhead.

**Relevance to the Project:**
- Provides the runtime environment for the backend server
- Enables efficient handling of multiple concurrent requests from users, store owners, and administrators
- Supports real-time features through event-driven architecture
- Allows code reuse between frontend and backend using JavaScript
- Facilitates integration with various npm packages for extended functionality

### 2.1.2 Express.js

Express.js is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications. It is one of the most popular frameworks for building RESTful APIs and web applications in Node.js. Express simplifies the process of writing server-side code by providing a simple API for routing, middleware, and HTTP utilities.

Express.js offers features such as routing, middleware support, template engines, and static file serving. It allows developers to create robust APIs quickly and efficiently, making it ideal for building scalable web applications.

**Relevance to the Project:**
- Serves as the web framework for the backend API
- Enables RESTful API design for all system endpoints
- Provides middleware support for authentication, file uploads, and error handling
- Facilitates route organization and modular code structure
- Supports integration with various middleware packages (authentication, validation, etc.)

### 2.1.3 MongoDB

MongoDB is a NoSQL document-oriented database program that uses JSON-like documents with optional schemas. MongoDB is classified as a NoSQL database program, and it stores data in flexible, JSON-like documents, meaning fields can vary from document to document and data structure can be changed over time. MongoDB Database Tools are a set of command-line utilities for managing and interacting with MongoDB databases. These tools help with backup, restore, import, export, monitoring, and performance analysis.

MongoDB's document model maps naturally to objects in application code, making it easy to work with data. It supports rich queries, indexing, and real-time aggregation, providing powerful ways to access and analyze data. MongoDB's horizontal scalability and high availability features make it suitable for applications that need to handle large amounts of data and traffic.

**Relevance to the Project:**
- Stores all system data including shops, evaluations, bills, users, and notifications
- Flexible schema allows for easy modification as requirements evolve
- Supports complex queries for filtering and searching across multiple collections
- Enables efficient indexing for fast data retrieval
- Provides aggregation framework for calculating rankings and statistics
- Supports horizontal scaling for future growth

### 2.1.4 Mongoose

Mongoose is an Object Data Modeling (ODM) library for MongoDB and Node.js. It provides a straightforward, schema-based solution to model application data. Mongoose includes built-in type casting, validation, query building, and business logic hooks. It manages relationships between data and provides schema validation at the application level.

Mongoose schemas define the structure of documents, default values, validators, and indexes. It provides middleware for pre and post hooks, allowing developers to execute code before or after certain operations like saving or removing documents.

**Relevance to the Project:**
- Provides schema definition for all database collections (Shops, Users, Evaluations, Bills, etc.)
- Enables data validation before database operations
- Simplifies database queries with a clean API
- Supports relationships between collections (references and population)
- Provides middleware for automatic operations (password hashing, timestamps, etc.)
- Ensures data consistency and integrity

### 2.1.5 JSON Web Token (JWT)

JSON Web Token (JWT) is an open standard (RFC 7519) that defines a compact and self-contained way for securely transmitting information between parties as a JSON object. This information can be verified and trusted because it is digitally signed. JWTs can be signed using a secret (with HMAC algorithm) or a public/private key pair using RSA or ECDSA.

JWTs consist of three parts: header, payload, and signature. They are commonly used for authentication and authorization in web applications. Once a user is logged in, each subsequent request will include the JWT, allowing the user to access routes, services, and resources that are permitted with that token.

**Relevance to the Project:**
- Implements secure authentication for all user types (Admin, Shop Owner, User)
- Enables stateless authentication, reducing server-side session storage
- Provides token-based access control for API endpoints
- Supports role-based authorization (admin, shop, user roles)
- Allows secure transmission of user identity and permissions

### 2.1.6 Socket.IO

Socket.IO is a JavaScript library for real-time web applications. It enables real-time, bidirectional, and event-based communication between the client and the server. Socket.IO consists of two parts: a client-side library that runs in the browser, and a server-side library for Node.js. Both components have a nearly identical API.

Socket.IO uses WebSockets as the primary transport mechanism, with automatic fallback to other methods (like polling) if WebSockets are not available. This ensures compatibility across different browsers and network conditions.

**Relevance to the Project:**
- Enables real-time notifications for all users
- Provides instant updates when evaluations are completed
- Sends immediate notifications when bills are verified
- Delivers real-time status updates for repair requests and leave applications
- Supports live communication between administrators and store owners
- Enhances user experience with instant feedback

### 2.1.7 Nuxt.js

Nuxt.js is a free and open-source web application framework based on Vue.js, Node.js, Express.js (or Fastify), and Babel. Nuxt.js is inspired by Next.js, a framework of similar purpose, based on React.js. Nuxt.js simplifies the development of universal or single-page Vue.js applications.

Nuxt.js provides features such as server-side rendering (SSR), automatic code splitting, static site generation, and a powerful routing system. It follows a convention-over-configuration approach, reducing the need for boilerplate code and configuration.

**Relevance to the Project:**
- Serves as the frontend framework for the web application
- Provides server-side rendering for better SEO and initial load performance
- Enables automatic code splitting for optimized bundle sizes
- Offers file-based routing for intuitive navigation structure
- Supports middleware for authentication and route protection
- Facilitates integration with Vue.js ecosystem and Vuetify

### 2.1.8 Vue.js

Vue.js is a progressive JavaScript framework for building user interfaces. Unlike other monolithic frameworks, Vue is designed from the ground up to be incrementally adoptable. The core library focuses only on the view layer, and it's easy to pick up and integrate with other libraries or existing projects.

Vue.js provides a reactive and composable data binding system, component-based architecture, and a simple yet powerful API. It offers excellent performance and a gentle learning curve, making it accessible to developers of all skill levels.

**Relevance to the Project:**
- Forms the foundation of the frontend application (through Nuxt.js)
- Enables reactive data binding for dynamic user interfaces
- Supports component-based development for reusable UI elements
- Provides efficient rendering and updates
- Facilitates state management and data flow

### 2.1.9 Vuetify

Vuetify is a Vue.js Material Design component framework. It provides a comprehensive collection of pre-built components following Google's Material Design guidelines. Vuetify includes over 80 components, including buttons, cards, data tables, forms, navigation drawers, and more.

Vuetify components are designed to be accessible, responsive, and customizable. The framework provides a consistent design language across the entire application, reducing development time and ensuring a professional appearance.

**Relevance to the Project:**
- Provides Material Design components for consistent UI/UX
- Offers responsive design components that work across all devices
- Includes data tables for displaying shops, evaluations, and rankings
- Provides form components for data input and validation
- Offers navigation components (drawers, toolbars, menus)
- Ensures accessibility compliance with ARIA attributes
- Reduces development time with pre-built, styled components

### 2.1.10 Multer

Multer is a Node.js middleware for handling `multipart/form-data`, which is primarily used for uploading files. It is written on top of `busboy` for maximum efficiency. Multer adds a `body` object and a `file` or `files` object to the `request` object. The `body` object contains the text fields of the form, while the `file`/`files` object contains the files uploaded via the form.

Multer supports various storage engines, including disk storage and memory storage. It provides options for file filtering, size limits, and custom file naming.

**Relevance to the Project:**
- Handles file uploads for bill slips (images)
- Manages repair request image uploads (up to 5 files)
- Processes shop and canteen image uploads
- Supports news and background image uploads
- Enables Excel file uploads for data import
- Provides file validation and size limits
- Organizes file storage by shop ID, year, month, and type

### 2.1.11 XLSX (SheetJS)

XLSX, also known as SheetJS, is a JavaScript library for parsing and writing various spreadsheet formats. It can read and write Excel files (.xlsx, .xls) and supports features like cell formatting, formulas, charts, and more. The library works in both Node.js and browser environments.

XLSX provides functions to convert between JSON and Excel formats, making it easy to import and export data. It supports reading from files, streams, and buffers, and can write to files or return buffers.

**Relevance to the Project:**
- Enables revenue data import from Excel files
- Supports bill data bulk import from Excel
- Facilitates ranking data import from Excel
- Allows data export to Excel format for reporting
- Parses multiple header sections in Excel files
- Validates and processes Excel data before database insertion

### 2.1.12 Visual Studio Code

Visual Studio Code, commonly referred to as VS Code, is an integrated development environment (IDE) developed by Microsoft for Windows, Linux, macOS, and web browsers. Features include support for debugging, syntax highlighting, intelligent code completion, snippets, code refactoring, and embedded version control with Git.

Users can change the theme, keyboard shortcuts, preferences, and install extensions that add functionality. Visual Studio Code is proprietary software released under the "Microsoft Software License", but based on the MIT licensed program named "Visual Studio Code — Open Source" (also known as "Code —OSS"), also created by Microsoft and available through GitHub.

**Relevance to the Project:**
- Primary development environment for both backend and frontend code
- Provides IntelliSense for JavaScript/TypeScript code completion
- Offers integrated Git support for version control
- Includes debugging tools for troubleshooting
- Supports extensions for MongoDB, ESLint, Prettier, and other tools
- Enables efficient code navigation and refactoring

### 2.1.13 Figma

Figma is a vector graphics editor and prototyping tool which is primarily web-based, with additional offline features enabled by desktop applications for macOS and Windows. The Figma mobile app for Android and iOS allows viewing and interacting with Figma prototypes in real-time on mobile devices. The feature set of Figma focuses on use in user interface and user experience design, with an emphasis on real-time collaboration.

Figma is a design platform for teams who build products together. Born on the Web, Figma helps teams create, share, test, and ship better designs from start to finish. Whether it's consolidating tools, simplifying workflows, or collaborating across teams and time zones, Figma makes the design process faster, more efficient, and fun while keeping everyone on the same page.

**Relevance to the Project:**
- Used for UI/UX design and prototyping
- Enables collaborative design process
- Creates wireframes and mockups for all system pages
- Designs user interface components and layouts
- Prototypes user interactions and workflows
- Facilitates design handoff to developers
- Supports responsive design planning

### 2.1.14 bcryptjs

bcryptjs is a JavaScript implementation of the bcrypt password hashing algorithm. Bcrypt is a password hashing function designed by Niels Provos and David Mazières, based on the Blowfish cipher. It incorporates a salt to protect against rainbow table attacks and is an adaptive function, meaning it can be made slower over time to resist brute-force attacks.

bcryptjs provides functions for hashing passwords and comparing hashed passwords with plain text passwords. It is widely used for secure password storage in web applications.

**Relevance to the Project:**
- Securely hashes user passwords before storage
- Protects against password attacks (rainbow tables, brute force)
- Validates passwords during login authentication
- Ensures password security for all user types
- Provides configurable hashing rounds for security vs. performance balance

### 2.1.15 Axios

Axios is a promise-based HTTP client for the browser and Node.js. It provides a simple API for making HTTP requests and handling responses. Axios supports request and response interceptors, automatic JSON data transformation, and request cancellation.

Axios is widely used in Vue.js and React applications for API communication. It provides better error handling and request/response transformation compared to the native Fetch API.

**Relevance to the Project:**
- Handles all HTTP requests from frontend to backend API
- Provides request/response interceptors for authentication tokens
- Enables error handling and retry logic
- Supports file uploads and downloads
- Facilitates API communication throughout the application

### 2.1.16 node-cron

node-cron is a task scheduler for Node.js that allows you to schedule jobs (arbitrary functions) to run at specific times or intervals. It uses the cron syntax for scheduling, which is a time-based job scheduler in Unix-like operating systems.

node-cron enables automated tasks such as sending scheduled notifications, cleaning up expired files, generating reports, and performing maintenance operations.

**Relevance to the Project:**
- Schedules automated monthly ranking notifications
- Sends evaluation notifications at specific times
- Performs automatic file cleanup (expired bill images)
- Executes scheduled data updates and maintenance tasks
- Automates repetitive administrative tasks

### 2.1.17 Nodemailer

Nodemailer is a module for Node.js applications to allow easy email sending. It supports various transport methods including SMTP, sendmail, and direct transport. Nodemailer provides a simple API for sending emails with attachments, HTML content, and custom headers.

**Relevance to the Project:**
- Sends email notifications to users (if implemented)
- Delivers system notifications via email
- Sends evaluation results and reports via email
- Provides alternative notification channel to real-time notifications

### 2.1.18 Git

Git is a distributed version control system designed to handle everything from small to very large projects with speed and efficiency. Git allows multiple developers to work on the same project simultaneously, tracks changes, and enables collaboration through branching and merging.

**Relevance to the Project:**
- Version control for all project code
- Enables collaboration between team members
- Tracks code changes and history
- Facilitates code review and quality assurance
- Supports branching for feature development
- Provides backup and recovery capabilities

---

## 2.2 Related Research and Studies

### 2.2.1 Web-Based Management Systems

Research in web-based management systems has shown significant improvements in operational efficiency, data accuracy, and user satisfaction compared to traditional manual systems. Studies indicate that digital transformation in facility management leads to better data organization, faster information retrieval, and improved decision-making processes.

### 2.2.2 Real-Time Notification Systems

Studies on real-time notification systems demonstrate their effectiveness in improving communication and user engagement. Research shows that instant notifications reduce response times, increase user awareness, and enhance overall system usability.

### 2.2.3 Evaluation and Ranking Systems

Academic research on evaluation and ranking systems highlights the importance of transparent, data-driven assessment methods. Studies show that automated ranking systems based on multiple evaluation criteria provide more objective and consistent results compared to manual evaluation processes.

### 2.2.4 Document Management Systems

Research on digital document management systems indicates significant benefits in terms of storage efficiency, retrieval speed, and document security. Studies show that organized digital storage reduces document loss and improves accessibility.

---

## 2.3 Technology Stack Summary

The selected technology stack for this project provides:

1. **Scalability**: Node.js and MongoDB enable horizontal scaling to handle growing user base and data volume
2. **Real-time Capabilities**: Socket.IO enables instant communication and updates
3. **Security**: JWT and bcryptjs provide robust authentication and password protection
4. **User Experience**: Nuxt.js and Vuetify deliver modern, responsive, and accessible interfaces
5. **Efficiency**: Express.js and Mongoose simplify development and database operations
6. **File Handling**: Multer and XLSX support comprehensive file upload and data import features
7. **Automation**: node-cron enables scheduled tasks and automated processes

---

**วันที่สร้างเอกสาร:** 31 ตุลาคม 2025  
**เวอร์ชัน:** 1.0.0





