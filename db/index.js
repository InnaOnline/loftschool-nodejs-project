const mongoose = require('mongoose');

//*promises
mongoose.Promise = global.Promise; // es6 promise

const connectionURL = `mongodb://admin:admin123@ds213178.mlab.com:13178/loftschool-node`;

mongoose.connect(connectionURL, { useNewUrlParser: true })
.catch((e) => console.error(e));
const db = mongoose.connection;

//*check connection
db.on('connected', () => {
    console.log(`Mongoose connection open on ${connectionURL}`)
});

//*check for Db errors
db.on('error', (err) => console.error(err));

//*check for disconected
db.on('disconnected', () => {
    console.log('mongoose connection disconnected')
});

process.on('SIGINT', () => {
    db.close(() => {
        console.log('mongoose connection closed throw app terminatatnio');
        process.exit(0);
    });
});
