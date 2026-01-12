const mongoose = require('mongoose');
const { findByIdAndUpdate } = require('./product');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  resetToken: String,
  resetTokenExpiration: Date,
  cart: {
    items: [
      {productId: {type: Schema.Types.ObjectId, ref: 'Product', required: true}, 
      qty: {type: Number, required: true}}
    ]
  }
});

userSchema.methods.addToCart = function(product) {
  const cartProductIndex = this.cart.items.findIndex(cp => {
        return cp.productId.toString() === product._id.toString();
      });
      let newQty = 1;
      const updatedCartItems = [...this.cart.items];
  
      if (cartProductIndex >= 0) {
         newQty = this.cart.items[cartProductIndex].qty + 1;
         updatedCartItems[cartProductIndex].qty = newQty;
       } else {
         updatedCartItems.push({
           productId: product._id,
           qty: newQty
         });
       }
       const updatedCart = {
         items: updatedCartItems
       };
       this.cart = updatedCart;
       return this.save(); 
};

userSchema.methods.removeFromCart = function(productId) {
  const updatedCartItems = this.cart.items.filter(item => {
    return item.productId.toString() !== productId.toString();
  });
  this.cart.items = updatedCartItems;
  return this.save();
};

userSchema.methods.clearCart = function() {
  this.cart = {items: []};
  return this.save();
};

module.exports = mongoose.model('User', userSchema);

// const mongodb = require('mongodb');
// const getDb = require('../util/database').getDb;

// const ObjectId = mongodb.ObjectId;

// class User {
//   constructor(username, email, cart, id) {
//     this.name = username;
//     this.email = email;
//     this.cart = cart; // {items: []}
//     this._id = id;
//   }

//   save() {
//     const db = getDb();
//     return db.collection('users').insertOne(this);
//   }

//   //CART

//   addToCart(product) {
//     const cartProductIndex = this.cart.items.findIndex(cp => {
//       return cp.productId.toString() === product._id.toString();
//     });
//     let newQty = 1;
//     const updatedCartItems = [...this.cart.items];

//     if (cartProductIndex >= 0) {
//       newQty = this.cart.items[cartProductIndex].qty + 1;
//       updatedCartItems[cartProductIndex].qty = newQty;
//     } else {
//       updatedCartItems.push({
//         productId: new ObjectId(product._id),
//         qty: newQty
//       });
//     }
//     const updatedCart = {
//       items: updatedCartItems
//     };
//     const db = getDb();
//     return db
//       .collection('users')
//       .updateOne(
//         { _id: new ObjectId(this._id) },
//         { $set: { cart: updatedCart } }
//       );
//   }

//   getCart() {
//     const db = getDb();
    // const productIds = this.cart.items.map(i => {
    //   return i.productId;
    // });
    // return db
    //   .collection('products')
    //   .find({ _id: { $in: productIds } })
    //   .toArray()
    //   .then(products => {
    //     return products.map(p => {
    //       return {
    //         ...p,
    //         qty: this.cart.items.find(i => {
    //           return i.productId.toString() === p._id.toString();
    //         }).qty
    //       };
    //     });
    //   });
//   }

//   deleteCartItem(productId) {
    // const updatedCartItems = this.cart.items.filter(item => {
    //   return item.productId.toString() !== productId.toString();
    // });
//     const db = getDb();
//     return db
//       .collection('users')
//       .updateOne(
//         { _id: new ObjectId(this._id) },
//         { $set: { cart: {items: updatedCartItems} } }
//       );
//   }

//   //ORDERS

//   addOrder(){
    // const db = getDb();
    // return this.getCart()
    // .then(products => {
    //   const order = {
    //     items: products,
    //     user: {
    //       _id: new ObjectId(this._id),
    //       name: this.name || this.username
    //     }
    //   };
    //   return db
    //   .collection('orders')
    //   .insertOne(order)
    // })
    // .then(result => {
    //     this.cart = {items: []};
    //     return db.collection('users').updateOne(
    //       {_id: new ObjectId(this._id)},
    //       {$set: {cart: {items: []}}}
    //     );
    // });
//   }

//   getOrders(){
//     const db = getDb();
//     return db.collection('orders').find({'user._id': new ObjectId(this._id)})
//     .toArray(); 
//   }

//   static findById(userId) {
//     const db = getDb();
//     return db
//       .collection('users')
//       .findOne({ _id: new ObjectId(userId) })
//       .then(user => {
//         if (!user) return null;
//         const cart = user.cart && Array.isArray(user.cart.items)
//           ? user.cart
//           : { items: [] };
//         return new User(user.name || user.username, user.email, cart, user._id);
//       })
//       .catch(err => {
//         console.error(err);
//       });
//   }
  
// }

// module.exports = User;