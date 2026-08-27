# Enterprise Agent Platform

Enterprise AI Agent platform based on Next.js, NestJS and LangGraph.

## Architecture

- `apps/web` - Next.js frontend
- `apps/api` - NestJS backend
- `apps/agent` - LangGraph Agent
- `packages` - Shared packages
- `docker` - Local infrastructure

## Development

Install dependencies:

pnpm install

Start all applications:

pnpm dev

## Applications

Web:
http://localhost:3000

API:
http://localhost:3001

API Health:
http://localhost:3001/health
