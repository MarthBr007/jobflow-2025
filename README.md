# JobFlow 2025 - Professional HR & Planning System

<!-- Deployment update: Complete Role System & Electronic Signatures - 2025-01-18 -->

An advanced employee management and planning system built with Next.js, featuring comprehensive HR management, smart scheduling, professional contract handling with electronic signatures, and enhanced role-based permissions.

## 🚀 Key Features

### 🔐 Advanced Role-Based Permissions
- ✅ **6-Tier Role System** - Admin, Manager, HR Manager, Planner, Employee, Freelancer
- ✅ **Granular Permissions** - 25+ specific permission levels
- ✅ **Smart Access Control** - Context-aware UI based on user role
- ✅ **Role Management Interface** - Admin page for managing user permissions
- ✅ **Specialized Roles** - HR specialists and Planning specialists with focused access

### 📋 Professional Contract Management
- ✅ **Contract PDF Generation** - Professional Dutch contract templates with company branding
- ✅ **Electronic Signatures** - Digital signature capture with eIDAS compliance
- ✅ **Dynamic Contract Types** - Employee, Freelancer, Flex-worker specific templates
- ✅ **Wet DBA Compliance** - Automated DBA-compliant freelance contracts
- ✅ **Contract Workflow** - Create, edit, send, sign, and manage complete lifecycle
- ✅ **PDF Enhancement** - Company logos, professional layouts, automatic document numbering

### 📧 Enhanced Email & Communication System
- ✅ **Rich Text Email Composer** - Professional email editor with formatting toolbar
- ✅ **Dynamic Email Templates** - Context-aware email content generation
- ✅ **PDF Auto-Attachment** - Contracts automatically attached to emails
- ✅ **Email Type Selection** - New contract, reminder, signed confirmation emails
- ✅ **Professional Email Design** - HTML templates with company branding

### 🗓️ Smart Scheduling & Planning
- ✅ **Intelligent Roster Management** - Automatic scheduling for permanent employees
- ✅ **Flex Worker Optimization** - Manual assignment only when needed for efficiency
- ✅ **Schedule Templates** - Reusable shift patterns and workflows
- ✅ **Capacity Planning** - Resource optimization and workload balancing
- ✅ **Employee Type Management** - Different workflows for different contract types

### 👥 Comprehensive HR Management
- ✅ **Personnel Management** - Complete employee lifecycle management
- ✅ **Dynamic Financial Fields** - Smart salary fields based on employee type
- ✅ **Personal Data Management** - GDPR-compliant data handling
- ✅ **Employee Types** - Permanent, Freelancer, Flex-worker specific features
- ✅ **Work Type Management** - Skill-based task assignment

### 🔧 Electronic Document System
- ✅ **Digital Signatures** - Signature pad with timestamp verification
- ✅ **Document Hashing** - SHA-256 document integrity verification
- ✅ **Audit Trails** - Complete signature verification and legal compliance
- ✅ **Electronic Verification** - IP tracking, device fingerprinting, session management

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS 3.x with custom design system
- **Database**: MySQL with Prisma ORM
- **Authentication**: NextAuth.js with role-based access
- **PDF Generation**: Enhanced jsPDF with professional templates
- **Email Service**: Nodemailer with HTML template engine
- **Electronic Signatures**: Canvas-based signature capture with js-sha256
- **File Handling**: Base64 storage with database integration
- **Deployment**: Vercel with optimized build pipeline

## 🎯 Role System

JobFlow uses a sophisticated 6-tier role hierarchy:

### 👑 Administrator (Level 6)
- Complete system access and configuration
- User role management and system settings
- All HR, planning, and operational functions
- Security and audit capabilities

### 👨‍💼 Manager (Level 5) 
- Operational management of personnel and projects
- Schedule and resource planning
- Contract and financial data access
- Team performance monitoring

### 👥 HR Manager (Level 4)
- **Specialized HR Role** for personnel specialists
- Employee management and contract handling
- Salary information and personal data access
- HR reporting and compliance management
- *Limited project/schedule access for focused workflow*

### 📅 Planner (Level 3)
- **Specialized Planning Role** for scheduling specialists  
- Advanced schedule and resource management
- Project coordination and capacity planning
- Workforce optimization tools
- *Limited HR access for focused workflow*

### 👨‍💻 Employee (Level 2)
- Personal time tracking and availability management
- Own project view and schedule access
- Basic self-service HR functions

### 🎯 Freelancer (Level 1) 
- Project-based access and time registration
- Limited company data visibility
- Contract and payment tracking

## 📋 Contract System Features

### Professional Contract Types
- **Permanent Employees** - Standard employment contracts (Dutch law)
- **Flex Workers** - Oproepovereenkomsten (Article 7:628a BW)
- **Freelancers** - Wet DBA compliant contracts

### Electronic Signature Features
- **Digital Signature Capture** - Touch/mouse signature pad
- **Legal Compliance** - eIDAS framework compliance
- **Verification System** - Document hashing and timestamp verification  
- **Audit Trail** - Complete signature metadata tracking
- **Multi-party Signing** - Employer, employee, witness support

### Enhanced PDF Generation
- **Company Branding** - Custom logos and corporate styling
- **Professional Layouts** - Industry-standard document design
- **Dynamic Content** - Role-based field mapping
- **Document Security** - Watermarks and verification codes

## 🗓️ Smart Scheduling System

### Intelligent Workflow
- **Permanent Employees** - Automatically appear on daily rosters based on availability
- **Flex Workers** - Manual assignment only for fixed patterns (efficiency-focused)
- **Freelancers** - Project-based scheduling with availability matching

### Advanced Features
- **Auto-Generation** - Smart roster creation based on employee types
- **Template System** - Reusable shift patterns and workflows
- **Capacity Planning** - Resource optimization algorithms
- **Conflict Detection** - Automatic scheduling conflict prevention

## 📧 Email System Features

### Rich Text Composer
- **Professional Editor** - Formatting toolbar with style options
- **Auto-height Adjustment** - Dynamic content sizing
- **Template Integration** - Pre-filled content based on context
- **Real-time Preview** - WYSIWYG email composition

### Email Templates
1. **New Contract** - Professional introduction with contract attachment
2. **Reminder** - Polite follow-up for pending signatures  
3. **Signed Confirmation** - Completion notification with final documents
4. **Custom** - Fully customizable with rich text editor

## 🔐 Security & Compliance

- **Role-Based Access Control** - 25+ granular permissions
- **eIDAS Compliance** - Electronic signature legal framework
- **GDPR Compliance** - EU data protection regulation adherence
- **Wet DBA Compliance** - Dutch freelancer legislation compliance
- **Document Integrity** - SHA-256 hashing and verification
- **Audit Trails** - Complete action logging and verification

## 📱 Responsive Design

Fully responsive design optimized for:
- Desktop workstations (HR/Admin interfaces)
- Tablets (Management dashboards)
- Mobile devices (Employee self-service)
- Dark/Light mode support with system preference detection

---

**🌐 Live Demo**: [https://jobflow-2025.vercel.app/](https://jobflow-2025.vercel.app/)

**📈 Latest Update**: Complete role system overhaul with specialized HR/Planning roles, electronic signatures, and smart scheduling optimization

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- MySQL database
- npm or yarn

### 1. Clone & Install
```bash
git clone [repository-url]
cd jobflow-2025
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
```

Configure the following environment variables in `.env`:

```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/jobflow"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Email Configuration  
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# WebSocket Server
NEXT_PUBLIC_WS_URL="ws://localhost:3001"

# VAPID Keys for Push Notifications
VAPID_PUBLIC_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-vapid-public-key"
```

### 3. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Optional: Add test data
npx prisma db seed
```

### 4. Install Additional Dependencies
```bash
# For electronic signatures
npm install js-sha256

# Verify installation
npm run build
```

## 🚀 Development

### Start Development Environment:
```bash
# Start Next.js + WebSocket server
npm run dev:full
```

Or separately:
```bash
# Next.js development server (port 3000)
npm run dev

# WebSocket server (port 3001)  
npm run socket
```

## 📱 Usage Guide

### Initial Setup
1. **Access**: http://localhost:3000
2. **Register**: Create admin account via registration page
3. **Configure**: Set user role to "ADMIN" in database for full access

### Core Workflows

#### 👥 HR Management (HR Managers)
- **Personnel Management**: `/dashboard/personnel`
- **Contract Creation**: Person-specific contract generation
- **Employee Onboarding**: Complete lifecycle management
- **Salary & Personal Data**: Secure financial information handling

#### 📅 Planning & Scheduling (Planners)
- **Schedule Management**: `/dashboard/schedule`
- **Resource Planning**: Capacity optimization tools
- **Project Coordination**: Team assignment and workflow management
- **Automatic Roster Generation**: Smart scheduling for permanent staff

#### 📋 Contract Management (All Authorized Roles)
- **Create Contracts**: Role-specific contract templates
- **Electronic Signing**: Digital signature capture and verification
- **Document Management**: PDF generation with company branding
- **Email Distribution**: Professional email templates with attachments

#### 🔐 Role Administration (Admins Only)
- **User Roles**: `/dashboard/admin/user-roles`
- **Permission Management**: Granular access control
- **System Configuration**: Advanced settings and security

### Smart Features

#### 🚀 Efficiency Optimizations
- **Permanent Employees**: Automatically scheduled (no manual work)
- **Flex Workers**: Manual scheduling only for fixed patterns
- **Dynamic Forms**: Fields adapt to employee type and context
- **Template System**: Reusable patterns for common workflows

#### 📧 Professional Communication
- **Rich Email Composer**: Professional email creation
- **Auto-PDF Attachment**: Contracts automatically included
- **Template Selection**: Context-aware email templates
- **Legal Compliance**: Professional language and formatting

## 🔧 Architecture

### Role-Based Architecture
```
Frontend (React/Next.js) ←→ Permission Layer ←→ Backend APIs
                ↕                    ↕               ↕
         UI Components         Role Validation    Database
    (Conditional Rendering)   (Server & Client)   (MySQL)
```

### Document Workflow
```
Contract Creation → PDF Generation → Email Composer → Digital Signature → Archive
        ↓                ↓              ↓              ↓             ↓
   Template Engine   Company Branding  Rich Editor   SHA-256 Hash   Audit Trail
```

### Real-time Communication
```
Browser (Client) ←→ Next.js (Port 3000) ←→ WebSocket Server (Port 3001)
                                     ↕
                               Database (MySQL)
                                     ↕
                            Permission Validation
```

## 🎯 Performance Optimizations

- **Role-Based Rendering** - UI components only load for authorized users
- **Lazy Loading** - Admin interfaces load on-demand
- **Smart Caching** - Permission checks cached per session
- **Optimized Builds** - Specialized builds: 19.8 kB contracts page
- **Progressive Enhancement** - Core features work without JavaScript

## 🔍 Monitoring & Analytics

- **User Activity Tracking** - Role-based usage analytics
- **Contract Lifecycle Monitoring** - Complete document audit trails
- **Email Delivery Tracking** - Success/failure logging
- **Signature Verification** - Document integrity monitoring
- **Performance Metrics** - Load times and user experience tracking

## 🚀 Deployment

### Production Deployment
```bash
# Build application
npm run build

# Deploy to Vercel
vercel --prod
```

### Environment Configuration
- **Database**: Production MySQL instance
- **Email**: SMTP service configuration  
- **Certificates**: SSL/TLS for electronic signatures
- **Performance**: CDN and optimization settings

---

**📊 Project Status**: Production Ready  
**👥 Target Users**: HR Departments, Planning Teams, Management  
**🏢 Industry**: Employee Management, HR Technology, Workforce Planning  
**📈 Scalability**: Multi-tenant ready, role-based scalability

**🔄 Version**: 2.0.0 - Professional HR & Planning System 