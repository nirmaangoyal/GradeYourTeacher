
import express from 'express';

import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
import { firestore,storage } from '../../firebase/firebase-config.js';
dotenv.config();

const router = express.Router();

router.use(express.json());

const systemPrompt=`
# RateMyProfessor Agent System Prompt

You are an AI assistant designed to help students find professors based on their specific needs and preferences. Your primary function is to use a Retrieval-Augmented Generation (RAG) system to provide relevant information about professors in response to student queries.

## Core Responsibilities:
1. Interpret student queries about professors or courses.
2. Use the RAG system to retrieve information about relevant professors.
3. Present the top 3 most suitable professors for each query.
4. Provide a concise summary of each recommended professor.

## Response Format:
For each query, present your recommendations in the following format:

1. [Professor Name] - [Department]
   - Course(s): [Relevant courses taught]
   - Rating: [Overall rating] / 5.0
   - Key Strengths: [2-3 main positive attributes]
   - Student Comment: "[A representative positive comment]"

2. [Second Professor's information in the same format]

3. [Third Professor's information in the same format]

Additional Information: [Any relevant details or caveats about the recommendations]

## Guidelines:
- Always provide exactly 3 professor recommendations unless fewer are available.
- Focus on the most recent and relevant information available in the RAG system.
- If a student asks about a specific professor, include that professor in the recommendations if relevant.
- Be objective and balanced in your presentations, highlighting both strengths and potential areas of concern.
- If there's insufficient information to make a recommendation, clearly state this and suggest alternative approaches for the student.
- Respect privacy by not sharing personal information about professors beyond what's publicly available in typical course evaluations.
- If asked about sensitive topics or comparisons, provide factual, professional responses without bias.

## Interaction Style:
- Be friendly and supportive, understanding that choosing professors is important for students.
- Encourage students to consider multiple factors in their decision-making process.
- Be ready to answer follow-up questions or provide more details about specific professors or courses.
- If a student's query is vague, ask clarifying questions to provide more accurate recommendations.

Remember, your goal is to assist students in making informed decisions about their education while maintaining ethical standards and respect for both students and professors.`

 
router.post('/query', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Invalid input. Expected an array of messages.' });
        }

        const pc = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
        });
        const index = pc.index('rag').namespace('ns1');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const lastMessage = messages[messages.length - 1];
        const text = lastMessage.content;

        const embeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text,
            encoding_format: 'float'
        });

        const results = await index.query({
            vector: embeddingResponse.data[0].embedding,
            topK: 3,
            includeMetadata: true,
        });

        let resultString = '\n\nReturned results from vector db:\n';
        results.matches.forEach((match) => {
            resultString += `\n
            Professor: ${match.id}
            Reviews: ${match.metadata.reviews}
            Subject: ${match.metadata.subject}
            Stars: ${match.metadata.stars}
            \n\n`;
        });

        const lastMessageContent = text + resultString;
        const previousMessages = messages.slice(0, -1);

        const completion = await openai.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                ...previousMessages,
                { role: 'user', content: lastMessageContent }
            ],
            model: 'gpt-4-1106-preview',
            stream: true
        });

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
        }
        console.log(res)

        res.end();
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});


//create API to post college,professor,subject,stars,review

router.post('/create', async (req, res) => {
    try {
        // console.log(req.body)
        const { institution, professor, subject, stars, review } = req.body;
        if (!institution || !professor || !subject || !stars || !review) {
            return res.status(400).json({ error: 'Please provide all the required fields' });
        }

        const reviewData = {
            subject,
            stars,
            review,
        };

        const institutionRef = firestore.collection('institutions').doc(institution);
        const professorRef = institutionRef.collection('professors').doc(professor);

        // Perform operations in a transaction to ensure consistency
        await firestore.runTransaction(async (transaction) => {
            // Check if institution exists, if not create it
            const institutionDoc = await transaction.get(institutionRef);
            const professorDoc = await transaction.get(professorRef);
            if (!institutionDoc.exists) {
                transaction.set(institutionRef, { name: institution });
            }

            // Check if professor exists, if not create it
            if (!professorDoc.exists) {
                transaction.set(professorRef, { name: professor });
            }

            // Add the review
            const newReviewRef = professorRef.collection('reviews').doc();
            transaction.set(newReviewRef, reviewData);
        });

        res.status(200).json({ message: 'Review added successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});

router.get('/institution/:institutionName', async (req, res) => {
    try {
        console.log(req.params)
        const institutionName = req.params.institutionName;
        const institutionRef = firestore.collection('institutions').doc(institutionName);

        const institutionDoc = await institutionRef.get();
        if (!institutionDoc.exists) {
            return res.status(404).json({ error: 'Institution not found' });
        }

        const professorsSnapshot = await institutionRef.collection('professors').get();
        
        const institutionData = {
            institutionName: institutionName,
            professors: []
        };

        for (const professorDoc of professorsSnapshot.docs) {
            const professorData = professorDoc.data();
            const reviewsSnapshot = await professorDoc.ref.collection('reviews').get();
            
            const professorReviews = reviewsSnapshot.docs.map(reviewDoc => {
                const reviewData = reviewDoc.data();
                return {
                    subject: reviewData.subject,
                    stars: reviewData.stars,
                    review: reviewData.review
                };
            });

            institutionData.professors.push({
                professor: professorData.name,
                reviews: professorReviews
            });
        }

        res.status(200).json(institutionData);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});

router.get('/professor/:professorName', async (req, res) => {
    try {
        const professorName = req.params.professorName;
        const institutionsRef = firestore.collection('institutions');
        
        let professorInfo = null;

        // Query all institutions
        const institutionsSnapshot = await institutionsRef.get();

        for (const institutionDoc of institutionsSnapshot.docs) {
            const institutionName = institutionDoc.id;
            const professorsRef = institutionDoc.ref.collection('professors');
            
            // Query for the specific professor
            const professorQuery = await professorsRef.where('name', '==', professorName).get();

            if (!professorQuery.empty) {
                const professorDoc = professorQuery.docs[0];
                const reviewsSnapshot = await professorDoc.ref.collection('reviews').get();

                const reviews = reviewsSnapshot.docs.map(reviewDoc => {
                    const reviewData = reviewDoc.data();
                    return {
                        subject: reviewData.subject,
                        stars: reviewData.stars,
                        review: reviewData.review
                    };
                });

                professorInfo = {
                    institution_name: institutionName,
                    professor_name: professorName,
                    reviews: reviews
                };

                break; // Exit the loop once we find the professor
            }
        }

        if (professorInfo) {
            res.status(200).json(professorInfo);
        } else {
            res.status(404).json({ error: 'Professor not found' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});

export default router;