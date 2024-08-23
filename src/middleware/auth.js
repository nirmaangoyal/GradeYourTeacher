import jwt from 'jsonwebtoken';

const authcookie = async (req, res, next) => {
  console.log(req.cookies);
  const userToken = req.cookies.token;

  if (!userToken) {
    return res.status(401).json("Please logout of all devices and try to login again!");
  }

  try {
    jwt.verify(userToken, process.env.TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return res.sendStatus(403);
      }

      req.uid = decoded.userUID; // Directly set req.uid to userUID

      next();
    });
  } catch (err) {
    res.clearCookie('token');
    res.status(404).json("Authentication failed, please Login!");
  }
};

export { authcookie };