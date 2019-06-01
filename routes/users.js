const express = require('express');
const router = express.Router();
const Joi = require('joi');
const passport = require('passport');
const randomstring = require('randomstring');
const nodemailer = require('nodemailer');

const messagecontents = require('../models/messagecontents');

var mongo = require('mongodb');
var assert = require('assert');

const verificationtransport =  nodemailer.createTransport({
  service: 'gmail',
  port: 465,
  secure: true,
  auth: {
    user: 'YourId@gmail.com',
    pass: 'Your Gmail Password'
  },
  tls: {
    rejectUnauthorized: false
  }
});

const notetransport =  nodemailer.createTransport({
  service: 'gmail',
  port: 465,
  secure: true,
  auth: {
    user: 'YourId@gmail.com',
    pass: 'Your Gmail Password'
  },
  tls: {
    rejectUnauthorized: false
  }
});


const User = require('../models/user');

// Validation Schema
const userSchema = Joi.object().keys({
  email: Joi.string().email().required(),
  username: Joi.string().required(),
  password: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/).required(),
  confirmationPassword: Joi.any().valid(Joi.ref('password')).required()
});

// Authorization 
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  } else {
    req.flash('error', 'Sorry, but you must be registered/logged in first!!!!!');
    res.redirect('/');
  }
};

const isNotAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    req.flash('error', 'Sorry, but you are already logged in!!!!!');
    res.redirect('/');
  } else {
    return next();
  }
};

router.route('/register')
  .get(isNotAuthenticated, (req, res) => {
    res.render('register');
  })
  .post(async (req, res, next) => {
    try {
      const result = Joi.validate(req.body, userSchema);
      if (result.error) {
        req.flash('error', 'Data is not valid. Please try again.');
        res.redirect('/users/register');
        return;
      }

      // Checking if email is already taken
      const user = await User.findOne({ 'email': result.value.email });
      if (user) {
        req.flash('error', 'Email is already in use.');
        res.redirect('/users/register');
        return;
      }

      // Hash the password
      const hash = await User.hashPassword(result.value.password);

      // Generate secret token
      const secretToken = randomstring.generate();
      console.log('secretToken', secretToken);

      // Save secret token to the DB
      result.value.secretToken = secretToken;

      // Flag account as inactive
      result.value.active = false;

      // Save user to DB
      delete result.value.confirmationPassword;
      result.value.password = hash;

      const newUser = await new User(result.value); 
      console.log('newUser', newUser);
      await newUser.save(function(err, savedUser){

        if(err){
          console.log(err);
          return res.status(500).send();
    
        }
         console.log("User Created!")
           
      });
      
      

            // Compose email
      const html = `Hi there,
      <br/>
      Thank you for registering!
      <br/><br/>
      Please verify your email by typing the following token(In case you copy it , make sure that you remove the extra space added to the text before submitting):
      <br/>
      Token: <b>${secretToken}</b>
      <br/>
      On the following page:
      <a href="http://localhost:5000/users/verify">Click Here To Verify</a>
      <br/><br/>
      Have a pleasant day.
      <br/><br/>
      &copy; 2019 Note Maker (By Mohit Jindal)` 
      const from = 'do-not-reply@NoteMaker.com';
      let mailOptions = {
        from :from,
        to : result.value.email,
        subject : 'Please Verify Your Acoount',
        html : html
      };

      // Send email
     await verificationtransport.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);   
    });

      req.flash('success', 'Please check your email!!!!!');
      res.redirect('/users/login');
    } catch(error) {
      next(error);
    }
  });

router.route('/login')
  .get(isNotAuthenticated, (req, res) => {
    res.render('login');
  })
  .post(passport.authenticate('local', {
    successRedirect: '/users/dashboard',
    failureRedirect: '/users/login',
    failureFlash: true
  }));

router.route('/dashboard')
  .get(isAuthenticated, (req, res) => {
    res.render('dashboard', {
      username: req.user.username
    });
  });

  

router.route('/verify')
  .get(isNotAuthenticated, (req, res) => {
    res.render('verify');
  })
  .post(async (req, res, next) => {
    try {
      const { secretToken } = req.body;

      // Find account with matching secret token
      const user = await User.findOne({ 'secretToken': secretToken });
      if (!user) {
        req.flash('error', 'No user found!!!!!');
        res.redirect('/users/verify');
        return;
      }

      user.active = true;
      user.secretToken = '';
      await user.save();

      req.flash('success', 'Thank you! Now you may login.');
      res.redirect('/users/login');
    } catch(error) {
      next(error);
    }
  })

router.route('/logout')
  .get(isAuthenticated, (req, res) => {
    req.logout();
    req.flash('success', 'Successfully logged out. Hope to see you soon!!!!!');
    res.redirect('/');
  });

  router.route('/makenote')
  .get(isAuthenticated, (req, res) => {
    res.render('makenote', {
      username: req.user.username
    });
  });
  router.route('/newnote')
  .get(isAuthenticated, (req, res) => {
    res.render('newnote');
  });
  router.post('/newnote' ,async function(req,res,next){
   
   const text =`<br/><br/>
   Sent via Note Maker (By Mohit Jindal)
   <br/>
   Come Join Us At : 
   <a href="http://localhost:5000">Click Here To Join Us</a>
   <br/>
   Have a pleasant day.
   <br/><br/>
   &copy; 2019 Note Maker (By Mohit Jindal)` 
   const from = 'do-not-reply@NoteMaker.com';


  let mailOptions = {
    from :from,
    to : req.body.email,
    subject : req.user.username + ' Via Note Maker (By Mohit Jindal) ',
    html : req.body.message + text
  };

  // Send email
 await notetransport.sendMail(mailOptions, (error, info) => {
    if (error) {
        return console.log(error);
    }
    console.log('Message sent: %s', info.messageId);   
});

 var notebody = {
   username: req.user.username,
   to : req.body.to,
   html : req.body.message

 };

  mongo.connect('mongodb://localhost:27017/messagecontents',function(err,db){
   assert.equal(null,err);
   db.collection('messagecontents').insertOne(notebody , function (err,result){
     assert.equal(null,err);
     console.log('notemade');
     db.close();
   } )

  })


      req.flash('success', 'Note Sent!!!!!');
      res.redirect('/users/dashboard');

  
  });



  router.route('/getnotes')
  .get(isAuthenticated, (req, res , next) => {
    var notesarray =[];
     mongo.connect('mongodb://localhost:27017/messagecontents', function(err,db){
       assert.equal(null,err);
       var cursor = db.collection('messagecontents').find({username : req.user.username });
        cursor.forEach(function(doc,err){
           assert.equal(null,err);
           notesarray.push(doc);
        }, function () {
          db.close();
          console.log(notesarray);
          res.render('getnotes', {data : notesarray});
        });

     });
    
  });

  
module.exports = router;