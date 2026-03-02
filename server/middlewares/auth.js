const jwt = require('jsonwebtoken');

const authMiddleWare= (req, res, next) => {

    const token = req.header("Authorization")?.split(" ")[1];
    if(!token) return res.status(401).json({message: "Access Denied"});

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET); 
        req.user = verified; // contains id and role
        next();
    } catch(err) {
        return res.status(401).json({message: "Invalid token"});
    }
};

module.exports = authMiddleWare;
