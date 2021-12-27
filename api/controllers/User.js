const User = require('../../db/models/user');
const jwt = require('jsonwebtoken');
const accessTokenLifeTime = 60 * 30 // 30 minutes
const refreshTokenLifeTime = 60 * 60 * 24 // 24 hours

const userSerializer = user => ({
    firstName: user.firstName || '',
    id: user._id,
    image: user.image || '',
    middleName: user.middleName || '',
    permission: user.permission,
    surName: user.surName || '',
    username: user.username,
});

exports.registration = ({ username, surName, firstName, middleName, password }) => new Promise(async (resolve, reject) => {
    try {
        if (!username || !password) {
            reject({
                status: 400,
                message: 'Username and password are required'
            });
            return;
        }

        let existedUser = await User.getUserByUsername(username);
        if (existedUser) {
            reject({
                status: 400,
                message: 'Username are already exist'
            });
            return;
        }

        let newUser = new User({
            username,
            surName,
            firstName,
            middleName,
            password,
            permission: {
                chat: {C: true, D: true, R: true, U: true},
                news: {C: true, D: true, R: true, U: true},
                settings: {C: true, D: true, R: true, U: true}
            }
        });

        let savedUser = await User.createUser(newUser);

        let resolvedUser = {
            firstName: savedUser.firstName || '',
            id: savedUser._id,
            image: savedUser.image || '',
            middleName: savedUser.middleName || '',
            password: password || '',
            permission: savedUser.permission,
            surName: savedUser.surName || '',
            username: savedUser.username
        }

        resolve(resolvedUser);

    }
    catch (err) {
        reject({ status: 500, message: err });
    }
});

exports.login = ({username, password}) => new Promise(async (resolve, reject) => {
    try {
        if (!username || !password) {
            return reject({
                status: 400,
                message: 'Username and password are required'
            });
        }

        let existedUser = await User.getUserByUsername(username);
        if (!existedUser) {
            return reject({
                status: 404,
                message: 'Username are not existed'
            });
        }

        const compareResult = await User.comparePassword(password, existedUser.password);
        if (!compareResult) {
            return reject({
                status: 401,
                message: 'Password are not correct'
            });
        }
       
        const serializedUser = userSerializer(existedUser)
        const accessToken = jwt.sign(JSON.parse(JSON.stringify(serializedUser)), 'secret', {expiresIn: accessTokenLifeTime});
        const refreshToken = jwt.sign({ isRefreshToken: true, userId: serializedUser.id, refreshTokenExpiredAt: Date.now() + refreshTokenLifeTime * 1000 }, 'secret', {expiresIn: refreshTokenLifeTime});
        
        let resolvedUser = {
            ...serializedUser,
            accessToken,
            refreshToken,
            accessTokenExpiredAt: Date.now() + accessTokenLifeTime * 1000,
            refreshTokenExpiredAt: Date.now() + refreshTokenLifeTime * 1000
        }

        resolve(resolvedUser);
    }
    catch (err) {
        reject({ status: 500, message: err });
    }
});

exports.refreshTokens = (token) => new Promise(async (resolve, reject) => {
    if (!token) return reject({ status: 401, message: 'No token provided' })

    let decoded
    try {
        decoded = jwt.decode(token)
    } catch(e) {
        return reject({ status: 403, message: 'Invalid token!' })
    }

    try {
        const user = await User.getUserById(decoded.userId)
        if (!user) return reject({ status: 403, message: 'User not found' })
        const accessToken = jwt.sign(JSON.parse(JSON.stringify(user)), 'secret', {expiresIn: accessTokenLifeTime});
        const tokenData = {
            accessToken,
            refreshToken: token,
            accessTokenExpiredAt: Date.now() + accessTokenLifeTime * 1000,
            refreshTokenExpiredAt: decoded.refreshTokenExpiredAt
        }
        resolve(tokenData)
    } catch(err) {
        reject({ status: 404, message: 'User not found' })
    }

});

module.exports.getProfile = ({ user }) => new Promise(async (resolve, reject) => {
    try {
        const userFromDB = await User.getUserById(user.id)

        resolve(userSerializer(userFromDB))
    } catch(err) {
        reject({ status: 404, message: 'User not found' })
    }
    
})

exports.updateUser = ({user, firstName, middleName, surName, oldPassword, newPassword, avatar }) => new Promise(async (resolve, reject) => {
    try {
        user = await User.getUserById(user.id);
        if (!user) {
            return reject({
                status: 404,
                message: 'User dosnt exist'
            });
        }

        if ((oldPassword && !newPassword) || (newPassword && !oldPassword)) {
            return reject({
                status: 400,
                message: 'You must provide password & oldPassword'
            });
        }
        if (oldPassword && newPassword) {
            let isPasswordEquals = await User.comparePassword(oldPassword, user.password);
            if (!isPasswordEquals) {
                return reject({
                    status: 400,
                    message: 'old password are invalid'
                });
            }

            user.password = newPassword;
            user = await User.updateUserPassword(user);

        }

        if (firstName) {
            user.set({firstName});
        }
        if (middleName) {
            user.set({middleName});
        }
        if (surName) {
            user.set({surName});
        }
        if (avatar) {
            user.set({image: '//localhost:3000/' + avatar.path })
        }

        const updatedUser = await User.updateUser(user);

        const resolvedUser = userSerializer(updatedUser)

        resolve(resolvedUser);
    }
    catch (err) {
        reject(err);
    }
});


exports.deleteUser = ({id}) => new Promise(async (resolve, reject) => {
    try {

        await User.removeById(id);
        resolve(null);
    }
    catch (err) {
        reject({ status: 400, message: err });
    }
});

exports.getUsers = () => new Promise(async (resolve, reject) => {
    try {
        const allUsers = await User.find();

        let resolvedResult = allUsers.map(userSerializer);

        resolve(resolvedResult);
    }
    catch (err) {
        reject(err);
    }
});

exports.updateUserPermission = ({ id, permission}) => new Promise(async (resolve, reject) => {
    try {
        if (!permission) {
            return reject({
                status: 400,
                message: 'permission are required'
            });
        }

        const existedUser = await User.getUserById(id);
        if (!existedUser) {
            return reject({
                status: 400,
                message: 'User dosnt exist'
            });
        }

        let existedPermission = existedUser.permission;

        Object.keys(permission).forEach((permissionGroup) => {
            Object.keys(permission[permissionGroup]).forEach((permissionKey) => {
                const newValue = permission[permissionGroup][permissionKey];
                existedPermission[permissionGroup][permissionKey] = newValue;
            });
        });

        existedUser.set({permission: existedPermission});
        await existedUser.save();

        resolve(true);
    }
    catch (err) {
        reject({ status: 500, message: err });
    }
});
