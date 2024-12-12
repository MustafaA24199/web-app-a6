// ensureLogin.js
module.exports = function(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login'); // Redirect to login if not authenticated
    }
    next(); // Proceed to the next middleware/route handler
};
