# Semantic Search App

Semantic Search App is a Node.js application that provides semantic search capabilities using Cohere AI and a PostgreSQL database. The app is built with Express and includes features such as rate limiting, security headers, and environment variable management.

## Features

- Semantic search powered by Cohere AI
- RESTful API built with Express
- PostgreSQL integration via Kysely ORM
- Redis caching support
- Input validation with Joi
- Security enhancements using Helmet
- Rate limiting to prevent abuse

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- Redis server
- Cohere API key

### Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/pranay022/semantic_search_app.git
    cd semantic_search_app
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Create a `.env` file in the root directory and add your environment variables:
    ```
    COHERE_API_KEY=your_cohere_api_key
    DATABASE_URL=your_postgres_connection_string
    REDIS_URL=your_redis_connection_string
    ```

### Running the App

Start the development server:
```bash
npm run dev