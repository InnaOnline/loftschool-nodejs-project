var express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('./controllers/User');
const News = require('./controllers/News');
const _ = require('lodash');
const multer = require('multer');

const fileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
})
const upload = multer({ storage: fileStorage });

const isAuthentificated = permissionPath => (req, res, next) => {
    
    const token = req.headers['authorization']
    
    if (!token) return res.status(401).json({ status: 401, message: 'No token provided' })

    let decoded
    try {
        decoded = jwt.decode(token)
    } catch(e) {
        return res.status(403).json({ status: 403, message: 'Invalid token!' })
    }
    const isNotDenied = permissionPath ? _.get(decoded.permission, permissionPath, false) : true
    if (!isNotDenied) {
        return res.status(403).json({ status: 403, message: 'Access denied!' })
    }
    req.body.user = decoded;
    next()
}

//*user

router.post('/registration', async (req, res) => {
    try {
        const result = await User.registration(req.body);
        res.json(result);
    }
    catch (err) {
        console.error("err", err);
        res.status(err.status || 500).json(err);
    }
});

router.post('/login', async (req, res) => {
    try {
        const result = await User.login(req.body);
        res.status(200).json(result);
    }
    catch (err) {
        console.error("err", err);
        res.status(err.status || 500).json(err);
    }
});

router.get('/profile', isAuthentificated(null), async (req, res) => {
    try {
        const result = await User.getProfile(req.body);
        res.status(200).json(result);
    }
    catch (err) {
        console.error("err", err);
        res.status(err.status || 500).json(err);
    }
})

router.patch('/profile', upload.single('avatar'), isAuthentificated(null), async (req, res) => {
    try {
        const result = await User.updateUser({...req.body, ...req.params, avatar: req.file});
        res.json(result);
    }
    catch (err) {
        console.error("err", err);
        res.status(err.status || 500).json(err);
    }
});

router.post('/refresh-token', async (req, res) => {
    try {
        const result = await User.refreshTokens(req.headers['authorization']);
        res.status(200).json(result);
    }
    catch (err) {
        console.error("err", err);
        res.status(err.status || 500).json(err);
    }
})

router.delete('/users/:id', isAuthentificated('settings.D'), async (req, res) => {
    try {
        const result = await User.deleteUser(req.params);
        res.json(result);
    }
    catch (err) {
        console.error("err", err);
        res.status(500).send('Internal error');
    }
});

router.get('/users', isAuthentificated('settings.R'), async (req, res) => {
    try {
        const result = await User.getUsers();
        res.json(result);
    }
    catch (err) {
        console.error("err", err);
        res.status(err.status || 500).json(err);
    }
});

router.patch('/users/:id/permission', isAuthentificated('settings.U'), async (req, res) => {
    try {
        const result = await User.updateUserPermission({...req.body, ...req.params});
        res.json(result);
    }
    catch (err) {
        console.error("err", err);
        res.status(err.status || 500).json(err);
    }
});

//*news

router.get('/news', isAuthentificated('news.R'), async (req, res) => {
    try {
        const result = await News.getNews();
        res.json(result);
    }
    catch (err) {
        console.error("err", err);
        res.status(500).send('Internal error');
    }
});

router.post('/news', isAuthentificated('news.C'), async (req, res) => {
    try {
        const result = await News.newNews(req.body);
        res.json(result);
    }
    catch (err) {
        console.error("err", err);
        res.status(500).send('Internal error');
    }
});

router.patch('/news/:id', isAuthentificated('news.U'), async (req, res) => {
    try {
        const result = await News.updateNews({...req.body, ...req.params});
        res.json(result);
    }
    catch (err) {
        console.error("err", err);
        res.status(500).send('Internal error');
    }
});

router.delete('/news/:id', isAuthentificated('news.D'), async (req, res) => {
    try {
        const result = await News.deleteNews(req.params);
        res.json(result);
    }
    catch (err) {
        console.error("err", err);
        res.status(500).send('Internal error');
    }
});

module.exports = router;
