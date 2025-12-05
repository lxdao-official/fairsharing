# FairSharing

A decentralized Web3 application for collaborative contribution management and peer-based validation. FairSharing enables teams to transparently track, validate, and fairly distribute rewards for collaborative work contributions through blockchain-based authentication and democratic voting mechanisms.

## 🌟 Key Features

### Contribution Management

- **Multi-Contributor Support**: Track contributions from multiple team members with individual hour/point allocation
- **Rich Content Support**: Comprehensive contribution descriptions with file attachments
- **Versioned History**: Soft-delete architecture preserves complete contribution history
- **Flexible Tracking**: Support for time-based and point-based contribution metrics

### Peer Validation System

- **Democratic Voting**: Peer-based validation through PASS/FAIL/SKIP voting mechanisms
- **Configurable Strategies**: Project-specific validation rules (specific members vs. all members)
- **Transparent Process**: Complete audit trail of validation decisions
- **Anti-Gaming Measures**: Built-in safeguards against validation manipulation

### Web3 Integration

- **Hybrid Authentication**: Combined JWT and wallet signature authentication
- **Multi-Wallet Support**: ConnectKit integration for seamless wallet connectivity
- **Blockchain Security**: Server-side signature validation using Viem
- **Decentralized Identity**: ENS name resolution and wallet-based profiles

### Project Management

- **Role-Based Access**: Configurable member roles and permissions
- **Submission Control**: Flexible contribution submission strategies
- **Team Collaboration**: Member invitation and management system
- **Project Analytics**: Contribution tracking and validation metrics

## 🚀 Tech Stack

### Core Framework

- **Next.js 15.3.3** - React framework with App Router
- **TypeScript 5** - Strict type safety throughout
- **Mantine UI 8.1.0** - Component library

### Backend & Database

- **PostgreSQL** - Primary database
- **Prisma ORM 6.9.0** - Type-safe database access
- **tRPC 11.4.1** - End-to-end type-safe APIs
- **React Query 5.80.7** - Server state management

### Web3 Infrastructure

- **Wagmi 2.15.6** - React hooks for Ethereum
- **ConnectKit 1.9.1** - Wallet connection UI
- **Viem 2.31.2** - Ethereum interactions
- **Ethers 6.14.4** - Blockchain utilities

### Additional Tools

- **JSON Web Tokens** - Session management
- **Cloudflare R2** - File storage and uploads
- **Zod** - Runtime type validation
- **React Hook Form** - Form state management

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 12+ database
- **Web3 Wallet** (MetaMask, WalletConnect, etc.)
- **Cloudflare R2** (for file uploads)
- **WalletConnect Project ID** (for wallet connectivity)

## ⚡ Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd fairsharing
npm install
```

### 2. Environment Setup

Create `.env.local` with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/fairsharing"

# Authentication
JWT_SECRET="your-jwt-secret-key"

# Cloudflare R2 (for file uploads)
CLOUDFLARE_R2_ENDPOINT="your-r2-endpoint-url"
CLOUDFLARE_R2_ACCESS_KEY_ID="your-r2-access-key"
CLOUDFLARE_R2_SECRET_ACCESS_KEY="your-r2-secret-key"

# Web3 Configuration
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your-walletconnect-project-id"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3100"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with sample data
npm run db:seed
```

### 4. Start Development

```bash
npm run dev
```

Visit [http://localhost:3100](http://localhost:3100) to access the application.

## 🛠️ Development Commands

### Core Commands

- `npm run dev` - Start development server with Turbopack on port 3100
- `npm run build` - Build production app (includes Prisma generation)
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality

### Database Management

- `npm run db:generate` - Generate Prisma client after schema changes
- `npm run db:push` - Push schema changes to database in development phase
- `npm run db:studio` - Open Prisma Studio for database GUI
- `npm run db:seed` - Populate database with comprehensive sample data
- `npm run db:seed-simple` - Run minimal database seeding
- `npm run db:reset` - Reset database and reseed with sample data

TODO add commands for production env

## 🏗️ Architecture Overview

### Authentication Flow

FairSharing implements a hybrid authentication system combining traditional JWT tokens with Web3 wallet signatures:

1. **Wallet Connection**: Users connect via ConnectKit/Wagmi
2. **Signature Request**: Backend generates a nonce for signing
3. **Signature Verification**: Server validates signature using Viem
4. **JWT Issuance**: Successful validation issues JWT for session management
5. **Protected Routes**: Middleware validates JWT for API access

### Data Architecture

The application uses a sophisticated relational schema with soft deletes:

- **Users**: Wallet-based identity with ENS integration
- **Projects**: Team workspaces with configurable validation rules
- **Contributions**: Multi-contributor work records with versioning
- **Votes**: Peer validation records (PASS/FAIL/SKIP)
- **Junction Tables**: Many-to-many relationships for contributors and project members

### API Structure

tRPC provides end-to-end type safety with domain-organized routers:

- **User Router**: Profile management and authentication
- **Project Router**: Project CRUD and member management
- **Contribution Router**: Contribution tracking and updates
- **Vote Router**: Validation and voting mechanisms
- **Upload Router**: File handling and Cloudflare R2 integration

## 🔄 Contribution Workflow

### 1. Contribution Submission

- Contributors create detailed work records with comprehensive descriptions
- Multiple contributors can be assigned with individual hour/point allocations
- Files and supporting documentation can be attached
- Submissions support date ranges and categorization

### 2. Validation Process

- Eligible validators receive notifications for new contributions
- Validators review contributions and cast PASS/FAIL/SKIP votes
- Configurable approval thresholds determine validation outcomes
- Complete audit trail maintains transparency

### 3. Status Progression

```
VALIDATING → PASSED/FAILED → ON_CHAIN
```

- **VALIDATING**: Under peer review
- **PASSED/FAILED**: Validation complete
- **ON_CHAIN**: Ready for blockchain rewards distribution

## 🚀 Deployment

### Environment Configuration

Ensure all environment variables are configured for production:

- Database connection strings
- JWT secrets with strong entropy
- Cloudflare R2 credentials for file storage
- WalletConnect Project ID for wallet connectivity
- Proper CORS and security headers

### Build Process

```bash
npm run build
npm start
```

### Web3 Considerations

- Configure supported networks and RPC endpoints
- Ensure wallet connection works across target networks
- Test signature validation with production wallet providers
- Implement proper error handling for Web3 interactions

## 🤝 Contributing

1. **Study the Codebase**: Review CLAUDE.md for development guidelines
2. **Follow Conventions**: Use existing patterns for components and APIs
3. **Test Thoroughly**: Ensure all builds pass and tests succeed
4. **Lint Clean**: Run `npm run lint` before submitting changes
5. **Type Safety**: Maintain strict TypeScript compliance

### Development Guidelines

- Implement soft deletes instead of hard deletes
- Use tRPC for all API endpoints
- Follow the established authentication patterns
- Maintain database referential integrity
- Document any new Web3 integration patterns

## 📄 License

TODO

## 🔗 Links

- [Database Schema](./prisma/schema.prisma)

---

**FairSharing** - Building transparent, fair collaboration through Web3 technology.
