# ProofCV

ProofCV is an AI job application agent. Tell it the role you want, add a job post and your career background, and it creates a tailored application pack around you.

Core workflow:

- Target role or job post input
- CV/profile upload or paste
- Career Vault creation
- Embedding-based Career Vault retrieval
- Match score, strengths, gaps, and ATS keywords
- Tailored CV, cover letter, recruiter message, and interview prep
- Saved application tracker entry

## Stack

- Next.js App Router
- Clerk authentication
- Stripe subscriptions
- Prisma and PostgreSQL
- OpenAI server-side API calls
- Tailwind CSS

## Environment

Use `.env.example` as the source of required variables. OpenAI, Clerk, Stripe, and database values must stay server-side unless explicitly prefixed with `NEXT_PUBLIC_`.

## Safety

ProofCV drafts and tailors application materials. It does not submit applications, guarantee interviews, or fabricate experience. Missing evidence is treated as a gap.
