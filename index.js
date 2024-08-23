import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import express from 'express';
import root from './src/root/root.js'; // Corrected import


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cookieParser());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

dotenv.config({ path: path.join(__dirname, './', '.env') });
const port = process.env.PORT;

app.use('/', root);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});