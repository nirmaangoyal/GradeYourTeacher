import { firestore } from "../firebase-config.js";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function getVAuthors(email) {
  const docRef = firestore.collection(process.env.COLLECTION_ID).doc(process.env.DOCUMENT_ID);
  const docSnap = await docRef.get();

  const userEmail = email.replace(/\.(?=[^.]*$)/, '_');
  const emailObj = docSnap.data()[userEmail];
  let verifiedAuthors = emailObj ? emailObj.verified : false;

  if (verifiedAuthors) {
    await setLoginTrue(userEmail, emailObj);
    return emailObj;
  }

  return false;
}

async function setLoginTrue(email, emailObj) {
  const docRef = firestore.collection(process.env.COLLECTION_ID).doc(process.env.DOCUMENT_ID);
  if (docRef) {
    await docRef.update({
      [email]: {
        ...emailObj,
        loggedIn: true
      }
    });
    console.log('email: ', email);
    return true;
  }
  return false;
}

async function setLoginFalse(email, emailObj) {
  const docRef = firestore.collection(process.env.COLLECTION_ID).doc(process.env.DOCUMENT_ID);
  if (docRef) {
    await docRef.update({
      [email]: {
        ...emailObj,
        loggedIn: false
      }
    });
    return false;
  }
}

export { getVAuthors, setLoginTrue, setLoginFalse };