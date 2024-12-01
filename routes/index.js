const UserRouter = require('./UserRouter')

const routes = (app) =>{
    app.use('/user', UserRouter)
}

module.exports = routes