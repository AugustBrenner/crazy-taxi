var c = require('crazy-taxi')


module.exports = {
    view: function(vnode) {
        return c('h1', vnode.attrs.text)
    }
}
