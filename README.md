# OsmoMind

OsmoMind is a multi-API web app that brings multiple AI-powered tools into one simple interface. It was built to explore how different generation APIs can be combined behind a single product experience with authentication, trial access, subscriptions and parallel API calls.

## Overview

The app lets users access different AI tools from one dashboard instead of switching between separate platforms. It includes user authentication, trial access controls and subscription logic so the product can support both free and paid usage.

## Features

* User authentication with Clerk
* Trial access controls for new users
* Subscription logic with Stripe
* Multi-API aggregation behind one interface
* Parallel API calls for faster response handling
* Simple dashboard-style user experience

## Tech Stack

* Next.js
* React
* TypeScript
* Clerk
* Stripe
* API integrations
* Parallel async requests

## Why I Built It

I built OsmoMind to learn how to turn multiple AI APIs into a usable product experience. The goal was not just to call one model or one endpoint, but to design the basic structure around a real SaaS-style app with auth, access control, subscriptions and backend API logic.

## What I Learned

Through this project, I gained experience with:

* Connecting multiple external APIs into one product
* Managing authenticated user flows
* Building trial and subscription-based access logic
* Handling parallel API requests
* Structuring a small SaaS-style application
* Thinking through product flow, not just individual features

## Getting Started

Install dependencies:

```bash
npm install
```

Create an `.env.local` file and add the required environment variables:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Add any API keys used by the app
API_KEY=
```

Run the development server:

```bash
npm run dev
```

Open the app locally:

```bash
http://localhost:3000
```

## Notes

This project was built as an early AI product experiment. The main focus was learning how to combine authentication, payments and multiple AI APIs into a working full-stack application.

## Author

Built by Rami AlObaidy.
