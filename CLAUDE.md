# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production app (includes Prisma generation)
- `npm run lint` - Run ESLint
- `npm start` - Start production server

### Database Commands
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Run database seeding with sample data
- `npm run db:seed-simple` - Run simple database seeding
- `npm run db:reset` - Reset database and reseed with sample data

### Testing & Quality
Always run `npm run lint` after making changes to ensure code quality.

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15.3.3 with App Router
- **Language**: TypeScript 5 (strict mode)
- **Database**: PostgreSQL with Prisma ORM 6.9.0
- **API**: tRPC 11.4.1 for type-safe APIs
- **UI**: TailwindCSS 4 + Mantine UI 8.1.0
- **Web3**: Wagmi 2.15.6 + ConnectKit 1.9.1 + Viem 2.31.2
- **State**: React Query (@tanstack/react-query 5.80.7)

### Key Architectural Patterns

#### Authentication System
- Hybrid JWT + wallet signature authentication
- JWT tokens handled in TRPCProvider with localStorage
- Wallet authentication through ConnectKit/Wagmi
- Authentication middleware in `src/server/middleware.ts`

#### Database Design
- Multi-table relational schema with soft deletes (`deletedAt` field)
- Many-to-many contributor relationships via `ContributionContributor` junction table
- Peer validation system through `Vote` model (PASS/FAIL/SKIP)
- Project membership with array-based roles (`MemberRole[]`)

#### API Structure
- tRPC routers organized by domain: user, project, upload, contribution, vote
- All procedures use Zod validation schemas
- Consistent error handling with TRPCError
- Type-safe client-server communication

#### Component Architecture
- Mantine UI components as base with TailwindCSS extensions
- Client-side rendering handled through `ClientWrapper`
- Form handling with react-hook-form + Yup validation
- Web3 integration through custom hooks in `src/hooks/`

### Critical Business Logic

#### Contribution Management
- Contributions support multiple contributors with individual hour/point tracking
- Status flow: VALIDATING → PASSED/FAILED → ON_CHAIN
- Validation strategies configurable per project (SPECIFIC_MEMBERS/ALL_MEMBERS)

#### Project Structure
- Projects identified by human-readable keys (unique)
- Owner-based permission model with member roles
- Support for different submission strategies (EVERYONE/RESTRICTED)

#### Validation System
- Peer-based validation through voting mechanism
- Vote types: PASS, FAIL, SKIP
- Configurable approval strategies stored as JSON

## File Organization

```
src/
├── app/                 # Next.js App Router pages
│   ├── api/trpc/       # tRPC route handler
│   └── app/            # Application pages
├── components/         # Reusable UI components
├── server/             # tRPC server setup and routers
│   ├── routers/        # Domain-specific API routers
│   └── trpc.ts         # tRPC configuration
├── lib/                # Core utilities (auth, db, validations)
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
└── utils/              # Client-side utilities
```

## Development Guidelines

### Code Conventions
- Use TypeScript strictly - avoid `any` types
- Follow established naming: camelCase for variables/functions, PascalCase for components
- All APIs must be built with tRPC in appropriate router files
- Use Mantine components as base, extend with TailwindCSS
- Implement soft deletes instead of hard deletes

### Database Patterns
- Always include `createdAt`, `updatedAt`, `deletedAt` timestamps
- Use proper indexing for query performance
- Follow the junction table pattern for many-to-many relationships
- Implement cascading deletes with `onDelete: Cascade` where appropriate

### Authentication Requirements
- Validate wallet signatures server-side
- Use middleware pattern for protecting routes
- Handle token expiration gracefully
- Store sensitive data securely (no API keys in client code)

### Web3 Integration
- Use Wagmi hooks for wallet interactions
- Implement proper error handling for wallet operations
- Always validate signatures using viem on backend
- Handle network switching and connection states

## Important Notes

This is a Web3 DApp for contribution management and validation. The application focuses on:
- Recording and validating collaborative work contributions
- Peer-based validation systems
- Blockchain wallet authentication
- Fair reward distribution for team contributions

When making changes, always consider the decentralized nature of the application and maintain the integrity of the contribution validation system.