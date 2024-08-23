import jwt from 'jsonwebtoken';

function createJWT(uid) {
    return jwt.sign(uid, process.env.TOKEN_SECRET, { expiresIn: '1800s' });
}

export { createJWT };