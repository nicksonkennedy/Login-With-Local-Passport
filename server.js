if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config()
}

const express = require('express')
const dotenv = require('dotenv')
const path = require('path')
const exphbs = require('express-handlebars')
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')

const initializePassport = require('./config/passport')
initializePassport(
  passport, 
  email =>users.find(user=>user.email === email),
  id =>users.find(user=>user.id === id)
)
//env config
dotenv.config({path:'./config/config.env'})

const app = express()

const users = []
//static folder
app.use(express.static(path.join(__dirname , 'public')))
//handle bars
app.engine('.hbs', exphbs.engine({defaultLayout: 'main', extname: '.hbs'}));
app.set('view engine', '.hbs')

//
app.use(express.urlencoded({extended: false}))
app.use(flash())
app.use(session({
  secret: process.env.SESSION_SECRET ,
  resave: false ,
  saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())

//
app.use(methodOverride('_method'))

const port = process.env.PORT || 8000

app.get('/', checkNotAuthenticated,(req, res)=>{
  res.render('login')
})
app.get('/dashboard', checkAuthenticated,(req, res)=>{
  res.render('dashboard', {name:req.body.email})
})

app.post('/login',checkNotAuthenticated,passport.authenticate('local', {
  successRedirect: '/dashboard',
  failureRedirect: '/',
  failureFlash: true
}))

app.get('/register',checkNotAuthenticated, (req, res)=>{
  res.render('register')
})

app.post('/register',checkNotAuthenticated , async (req, res)=>{
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10)
      users.push({
        id: Date.now().toString(),
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword
      })
      res.redirect('/')
    } catch (e) {
      res.redirect('/register')
  }
    console.log(users)
})
//logout
app.delete('/logout' , (req, res)=>{
  req.logOut()
  res.redirect('/')
})

//protecting Dashboard route when user is not logged in
function checkAuthenticated(req, res, next){
  if(req.isAuthenticated()){
    return next()
  }else{
   return  res.redirect('/')
  }
}

//protecting login and regsitration routes when user is already logged in
function checkNotAuthenticated (req ,res, next){
  if(req.isAuthenticated()){
   return res.redirect('/dashboard')
  }else{
   return next()
  }
}

app.listen(port ,()=>console.log( `Listening To Server On Port:${port}`))
