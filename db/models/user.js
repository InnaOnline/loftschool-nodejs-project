const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const schema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    surName: {
        type: String
    },
    firstName: {
        type: String
    },
    middleName: {
        type: String
    },
    password: {
        type: String,
        required: true
    },
    image: {
        type: String
    },
    permission: {
        chat: {
            C: {type: Boolean, required: true},
            D: {type: Boolean, required: true},
            R: {type: Boolean, required: true},
            U: {type: Boolean, required: true},
        },
        news: {
            C: {type: Boolean, required: true},
            D: {type: Boolean, required: true},
            R: {type: Boolean, required: true},
            U: {type: Boolean, required: true},
        },
        settings: {
            C: {type: Boolean, required: true},
            D: {type: Boolean, required: true},
            R: {type: Boolean, required: true},
            U: {type: Boolean, required: true},
        }
    }

});

const User = module.exports = mongoose.model('User', schema);

module.exports.generateNewPassword = (password) => {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    return hash;
}

module.exports.createUser = (newUser) => new Promise((resolve, reject) => {
    newUser.password = User.generateNewPassword(newUser.password);

    newUser.save()
    .then(resolve)
    .catch(reject);
});

module.exports.updateUserPassword = (user) => new Promise((resolve, reject) => {
    user.password = User.generateNewPassword(user.password);

    user.save()
    .then(resolve)
    .catch(reject);
});

module.exports.getUserByUsername = (username, callback) => new Promise((resolve, reject) => {
    User.findOne({username})
    .then(resolve)
    .catch(reject);
});

module.exports.comparePassword = (password, hash) => new Promise((resolve) => {
    resolve(bcrypt.compareSync(password, hash));
});

module.exports.updateUser = (updatedUser) => new Promise((resolve, reject) => {
    updatedUser.save()
    .then(resolve)
    .catch(reject);
});

module.exports.getUserById = (id) => new Promise((resolve, reject) => {
    User.findById(id)
    .then(resolve)
    .catch(reject);
});

module.exports.removeById = (id) => new Promise((resolve, reject) => {
    User.findByIdAndRemove(id)
    .then(resolve)
    .catch(reject);
})
