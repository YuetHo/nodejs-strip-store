// make sure we are not on prod because .env is no there during prod
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').load()  // so if in dev, then load the .env file
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY  // encrypt the key
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY

const express = require('express')  // says we require using express library
const app = express()  // create server
const fs = require('fs')
const stripe = require('stripe')(stripeSecretKey)

app.set('view engine', 'ejs')  // render front end using ejs
app.use(express.json())
app.use(express.static('public'))  // mark public folder files as static AKA available as stuff on frontend

app.get('/store', function(req, res) {  // whenever someone is at the /store url, read our json data (products being sold)
  fs.readFile('items.json', function(error, data) {
    if (error) {
      res.status(500).end()
    } else {
      res.render('store.ejs', {
        stripePublicKey: stripePublicKey,
        items: JSON.parse(data)
      })
    }
  })
})

app.post('/purchase', function(req, res) {
  fs.readFile('items.json', function(error, data) {
    if (error) {
      res.status(500).end()
    } else {
      const itemsJson = JSON.parse(data)
      const itemsArray = itemsJson.parts
      let total = 0
      req.body.items.forEach(function(item) {
        const itemJson = itemsArray.find(function(i) {
          return i.id == item.id
        })
        total = total + itemJson.price * item.quantity
      })

      stripe.charges.create({
        amount: total,
        source: req.body.stripeTokenId,
        currency: 'usd'
      }).then(function() {
        console.log('Charge Successful')
        res.json({ message: 'Successfully purchased items' })
      }).catch(function() {
        console.log('Charge Fail')
        res.status(500).end()
      })
    }
  })
})

app.listen(3000)
