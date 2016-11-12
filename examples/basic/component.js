
// Dependencies =====================================================
var c = require('crazy-taxi')


// The component =====================================================
module.exports = {
   
   // This is the view. It renders hyperscript.
    view: function(vnode) {
        return c('h1', vnode.attrs.text)
    }
}
