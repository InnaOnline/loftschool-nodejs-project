const News = require('../../db/models/news');
const User = require('../../db/models/user');
const newsSerializer = (news, user) => ({
    id: news._id,
    created_at: news.date,
    text: news.text,
    title: news.title,
    user: {
        firstName: user.firstName || '',
        id: user._id,
        image: user.image || '',
        middleName: user.middleName || '',
        surName: user.surName || '',
        userName: user.userName
    }
})
const getNews = exports.getNews = () => new Promise(async (resolve, reject) => {
    try {
        // news
        allNews = await News.find();
        allUsers = await User.find();

        const resolvedResult = allNews.map((news) => {
            let user = allUsers.find((u) => u._id.toString() === news.userId);
            // all news
            if (!user) {
                user = {
                    firstName: 'Undefined',
                    id: null,
                    image: '',
                    middleName: 'Undefined',
                    surName: 'Undefined',
                    userName: 'Undefined'
                }
            }
            return newsSerializer(news, user)
        });

        resolve(resolvedResult);
    }
    catch (err) {
        reject(err);
    }
});

exports.newNews = ({text, title, user}) => new Promise(async (resolve, reject) => {
    try {

        // user news
        const newNews = new News({
            date: new Date(),
            text,
            title,
            userId: user.id
        });
        await newNews.save();

        // all user news
        const resolvedResult = await getNews();

        resolve(resolvedResult);

    }
    catch (err) {
        reject(err);
    }
});

exports.updateNews = ({user, id, text, title}) => new Promise(async (resolve, reject) => {
    try {

        // find news
        const existedNews = await News.findById(id);
        if (!existedNews) {
            resolve({
                success: false,
                message: 'News are not existed'
            });
            return;
        }

        // update news
        existedNews.set({ text, title });
        await existedNews.save();

        // all news
        const resolvedResult = await getNews();

        resolve(resolvedResult);
    }
    catch (err) {
        reject(err);
    }
});

exports.deleteNews = ({id}) => new Promise(async (resolve, reject) => {
    try {
        // delete news
        await News.findByIdAndRemove(id);

        // all news
        const resolvedResult = await getNews();

        resolve(resolvedResult);
    }
    catch (err) {
        reject(err);
    }
});
