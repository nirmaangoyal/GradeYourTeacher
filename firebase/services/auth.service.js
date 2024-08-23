import { clientAuth } from "../firebase-config.js";
import { signInWithEmailAndPassword } from "firebase/auth";

const doSignInWithEmailAndPassword = async (email, password) => {
    return signInWithEmailAndPassword(clientAuth, email, password);
};

const getRefreshToken = async () => {
    console.log('getting the id token: ');
    return clientAuth.currentUser.refreshToken().then((refreshToken) => {
        return refreshToken;
    }).catch((error) => {
        console.log(error);
    });
};

export { doSignInWithEmailAndPassword, getRefreshToken };