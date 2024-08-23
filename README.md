# GradeYourTeacher RAG System

This project implements a Retrieval-Augmented Generation (RAG) system for a RateMyProfessor-like application using Express.js, OpenAI, Pinecone, and Firebase.

## Technical Stack

- **Backend**: Express.js
- **Vector Database**: Pinecone
- **Language Model**: OpenAI GPT-4
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Environment Variables**: dotenv

## Key Components

### 1. Vector Database (Pinecone)

- Used for storing and querying embeddings of professor reviews.
- Namespace: 'ns1'
- Index: 'rag'
- Dimension: 1536 (based on OpenAI's text-embedding-3-small model)

### 2. Language Model (OpenAI)

- Uses GPT-4-1106-preview for generating responses.
- Utilizes text-embedding-3-small for creating embeddings of queries and reviews.

### 3. Database (Firebase Firestore)

- Stores structured data about institutions, professors, and reviews.
- Collection structure:
  - institutions (collection)
    - [institution_name] (document)
      - professors (sub-collection)
        - [professor_name] (document)
          - reviews (sub-collection)
            - [review_id] (document)

### 4. API Endpoints

#### POST /query
- Processes user queries about professors.
- Performs vector similarity search in Pinecone.
- Generates a response using OpenAI's GPT-4.
- Implements server-sent events for streaming responses.

#### POST /create
- Adds new professor reviews to the system.
- Updates both Firestore and Pinecone (implied, not shown in the code snippet).

#### GET /institution/:institutionName
- Retrieves all professors and their reviews for a given institution.

#### GET /professor/:professorName
- Retrieves information about a specific professor across all institutions.

## Data Processing

1. **Embedding Creation**: 
   - Reviews are converted to embeddings using OpenAI's text-embedding-3-small model.
   - Embeddings are stored in Pinecone for efficient similarity search.

2. **Data Structure in Pinecone**:
   ```javascript
   {
     "values": [embedding],
     "id": professor_name,
     "metadata": {
       "review": review_text,
       "subject": subject,
       "stars": rating
     }
   }
   ```

3. **Query Processing**:
   - User queries are converted to embeddings.
   - Top 3 similar reviews are retrieved from Pinecone.
   - Retrieved data is appended to the user's query for context-aware response generation.

## System Prompt

The system uses a detailed prompt to guide the AI in providing professor recommendations. Key aspects include:
- Presenting top 3 suitable professors for each query.
- Providing a structured response format for consistency.
- Focusing on recent and relevant information.
- Maintaining objectivity and respecting privacy.

## Setup and Configuration

1. Install dependencies: `npm install`
2. Set up environment variables in a `.env` file:
   - PINECONE_API_KEY
   - OPENAI_API_KEY
   - Firebase configuration (not shown in the provided code)

## Running the Application

Start the server:
```
node server.js
```

## Future Improvements

1. Implement automatic updating of Pinecone when new reviews are added.
2. Add user authentication and authorization.
3. Implement caching to reduce API calls and improve performance.
4. Add more comprehensive error handling and logging.
5. Develop a front-end interface for better user interaction.
