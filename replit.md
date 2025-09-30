# Overview

This is an AI-Powered Interview Assistant application built for conducting technical interviews. The system allows candidates to upload their resumes, participate in timed AI-generated interviews, and enables interviewers to review candidate performance through a comprehensive dashboard. The application features real-time state synchronization between interviewee and interviewer views, with full session persistence to support pause/resume functionality.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The application uses a **React-based SPA** with the following architectural decisions:

**UI Framework**: Implements shadcn/ui component library built on Radix UI primitives with Tailwind CSS for styling. This provides accessible, customizable components with consistent design patterns.

**State Management**: Uses Redux Toolkit with redux-persist for global state management. This ensures interview state (candidate data, timers, progress) persists across browser sessions and page refreshes. Local storage is the persistence layer, enabling session recovery.

**Routing**: Implements wouter for lightweight client-side routing. The application is primarily single-page with tab-based navigation between Interviewee and Interviewer views.

**Data Fetching**: TanStack Query (React Query) handles server state management with automatic refetching intervals for real-time updates between tabs. The interviewer dashboard refetches every 10 seconds, stats every 30 seconds.

**Form Management**: Uses react-hook-form with Zod resolvers for type-safe form validation, particularly for collecting missing candidate information.

## Backend Architecture

**Server Framework**: Express.js serves both API endpoints and static assets. The server follows RESTful conventions for all API routes.

**Development Setup**: Vite dev server runs in middleware mode during development, providing HMR and fast refresh capabilities.

**Storage Layer**: Currently implements an in-memory storage solution (MemStorage class) that satisfies the IStorage interface. This abstraction allows for easy migration to a persistent database.

**File Processing**: Multer handles resume uploads with a 10MB file size limit. PDF parsing is handled by pdf-parse library to extract text content and candidate information.

**Interview Logic**: The interview flow is state-machine based with transitions between: pending → info_collection → interviewing → paused/completed. Each state determines available actions and UI presentation.

## Database Schema Design

The schema is defined using Drizzle ORM with PostgreSQL dialect, though currently using in-memory storage:

**Candidates Table**: Stores candidate profile (name, email, phone), resume text, interview status, current question index, final score, and AI-generated summary. Tracks timestamps for started, completed, and paused states.

**Questions Table**: Stores AI-generated questions with difficulty levels (easy/medium/hard), time limits (20s/60s/120s), and ordering index. References candidate via foreign key.

**Answers Table**: Stores candidate responses with AI-calculated scores, time spent, and submission timestamps. References both question and candidate.

**Chat Messages Table**: Stores the conversation history between AI and candidate. Supports different message types (text, question, answer, info_request) with metadata stored in JSONB for flexibility.

## External Dependencies

**OpenAI Integration**: Uses OpenAI's API (configured for GPT-5 model) for three core functions:
- Generating contextual interview questions based on resume content and difficulty progression
- Scoring candidate answers with detailed feedback
- Creating final interview summaries with strengths/weaknesses analysis

**Neon Database**: Configured to use @neondatabase/serverless for PostgreSQL connectivity when database is provisioned. Connection managed via DATABASE_URL environment variable.

**Resume Parsing**: pdf-parse library extracts text from PDF resumes. Uses regex patterns to identify name, email, and phone number. Missing fields trigger the info_collection flow.

**File Upload**: Multer middleware handles multipart/form-data uploads with memory storage (buffers) and size limits.

**Build Tools**: 
- Vite for frontend bundling and development server
- esbuild for backend compilation to ESM format
- TypeScript for type safety across full stack

**Development Tools**: Replit-specific plugins for runtime error overlays, cartographer (code mapping), and dev banners when running in Replit environment.