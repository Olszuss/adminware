const express = require('express');
const ejs = require('ejs');
const passport = require("passport");
const LocalStrategy = require("passport-local");
const passportLocalMongoose = require("passport-local-mongoose");
const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");
const _ = require("lodash");
const mongoose = require("mongoose");
const User = require("./model/User");


const app = express();

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(fileUpload());
app.use(bodyParser.urlencoded({extended: true}));
app.use(require("express-session")({
  secret: "28f8fe418b8479f90ef1ec89dc989e04",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

mongoose.connect("mongodb://127.0.0.1:27017/adminware");
const postSchema = {
    title: String,
    content: String,
    imageUrl: String,
    date: Date
  }  
const Post = mongoose.model("Post", postSchema);
const requireAuth = (req, res, next) => {
  if (req.session.userId) {
      next(); // User is authenticated, continue to next middleware
  } else {
      res.redirect('/login'); // User is not authenticated, redirect to login page
  }
}
//home page
app.get("/", (req,res)=>{ 
    Post.find({})
    .then((foundPost)=>{
      res.render("index", {
        posts: foundPost,
        title: "Strona główna"
      });
    });
  });

  //contact page
app.get('/contact', (req, res) => {
    res.render('contact', {title:"Kontakt"});
});
//Post page
app.get("/posts/:postId", (req,res)=>{

    const requestedPostId = req.params.postId;
    Post.findOne({_id: requestedPostId})
    .then((post)=>{
      res.render("post", {
        title: post.title,
        content: post.content,
        image: post.imageUrl
      });
    })

  });

  //Admin page
  app.get("/admin", requireAuth, (req,res)=>{
    res.render("admin" , {title:"Admin"});
  });
//Compose page
  app.get('/admin/compose', requireAuth,  (req,res)=>{
    res.render('compose' , {title:"Utwórz"});
  });
  app.post("/compose", requireAuth, (req,res)=>{
      const { image } = req.files;
      if (!image) return res.sendStatus(400);
      image.mv(__dirname + '/public/' + '/upload/' + image.name);
    const post = new Post({
      title: req.body.postTitle,
      content: req.body.postArea,
      date: Date.now(),
      imageUrl: ('/upload/' + image.name)
    });
    post.save();
    res.render('admin', {warning: "Pomyślnie dodałeś post."})
  });
//Delete page
app.get('/admin/deletepost' , requireAuth ,(req,res)=>{ 
  Post.find({})
  .then((foundPost)=>{
    res.render("delete", {
      posts: foundPost,
      title: "Delete"
    });
  });
});
app.post('/admin/deletepost', requireAuth ,async (req,res)=>{
   try {
    await Post.deleteOne({ _id : req.body.postId })
    .then(()=> {
      res.render("admin", {
        warning: "Pomyślnie usunąłeś post!"
      })
    })
    }
    catch (e) {
    console.log(e);
 }
});
//Edit page 
app.get('/admin/editpost', requireAuth ,(req,res)=>{
  Post.find({})
  .then((foundPost)=>{
    res.render("edit", {
      posts: foundPost,
      title: "Edit"
    });
  });
});
app.get("/admin/:postId", requireAuth, (req,res)=>{

  const requestedPostId = req.params.postId;
  Post.findOne({_id: requestedPostId})
  .then((post)=>{
    res.render("editpost", {
      title: post.title,
      content: post.content,
      image: post.imageUrl,
      postId: post._id
    });
  })
});
app.post('/admin/editpost', requireAuth ,async (req,res)=>{
  try {
   await Post.updateOne({ _id : req.body.postId },
    {title: req.body.postTitle, content: req.body.postArea})
   .then(()=> {
     res.render("admin", {
       warning: "Pomyślnie edytowałeś post!"
     })
   })
   }
   catch (e) {
   console.log(e);
}
});

//Login page
app.get("/login", function (req, res) {
  res.render("login");
});
app.post("/login", async function(req, res){
    try {
        const user = await User.findOne({ username: req.body.username });
        if (user) {
          const result = req.body.password === user.password;
          if (result) {
            req.session.userId = user;
            res.render("admin");
          } else {
            res.status(400).json({ error: "Hasło nieprawidłowe!" });
          }
        } else {
          res.status(400).json({ error: "Użytkownik nie istnieje!" });
        }
      } catch (error) {
        res.status(400).json({ error });
      }
});
//Logout page
app.get("/logout", function (req, res) {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
});

app.listen(5050, function() {
    console.log("Server started on port 5050");
  });
  