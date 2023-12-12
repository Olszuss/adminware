require('dotenv').config()
const express = require("express");
const ejs = require("ejs");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const passportLocalMongoose = require("passport-local-mongoose");
const fileUpload = require("express-fileupload");
const fs = require("fs")
const bodyParser = require("body-parser");
const _ = require("lodash");
const mongoose = require("mongoose");
const User = require("./model/user");


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

mongoose.connect(process.env.DB_CONNECT);
const postSchema = {
    title: String,
    content: String,
    imageUrl: String,
    date: Date,
    deleted: Boolean
  }  
const Post = mongoose.model("Post", postSchema);
const requireAuth = (req, res, next) => {
  if (req.session.userId) {
      next();
  } else {
      res.redirect('/login');
  }
}
//home page
app.get("/", (req,res)=>{ 
    Post.find({ deleted: false })
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
//////////////////////////////////////////////////////////////////
  //Admin page
  app.get("/admin", requireAuth, (req,res)=>{
    res.render("admin/admin" , {title:"Admin"});
  });
//Compose page
  app.get('/admin/compose', requireAuth,  (req,res)=>{
    res.render('admin/compose' , {
      title:"Utwórz",
      formTitle: req.body.postTitle,
      content: req.body.postArea
    });
  });
  app.post("/compose", requireAuth, (req,res)=>{
      const { image } = req.files;
      const post = new Post({
        title: req.body.postTitle,
        content: req.body.postArea,
        date: Date.now(),
        imageUrl: ('/upload/' + image.name),
        deleted: false
      });
      if (!image) return res.render('admin/admin',{warning: 'Nie dodałeś zdjęcia!'});
      if (fs.existsSync(__dirname + '/public/' + '/upload/' + image.name)){
        res.render('admin/compose', {
          warning: "Plik o takiej nazwie już istnieje!",
          formTitle: req.body.postTitle,
          content: req.body.postArea
        })
      } else {
        image.mv(__dirname + '/public/' + '/upload/' + image.name);
        post.save();
        res.render('admin/admin', {warning: "Pomyślnie dodałeś post."})
      }

  });
//Delete page
app.get('/admin/deletepost' , requireAuth ,(req,res)=>{ 
  Post.find({})
  .then((foundPost)=>{
    res.render("admin/delete", {
      posts: foundPost,
      title: "Usuń"
    });
  });
});
app.post('/admin/deletepost', requireAuth ,(req,res)=>{
if( req.body.postDelete === "true" ) {
       Post.updateOne({ _id : req.body.postId },
        {deleted: false})
       .then(()=> {
         res.render("admin/admin", {
          title: "Admin",
          warning: "Pomyślnie przywróciłeś post!"
         })
       })
    } else{
       Post.updateOne({ _id : req.body.postId },
        {deleted: true})
       .then(()=> {
         res.render("admin/admin", {
          title: "Admin",
          warning: "Pomyślnie usunąłeś post!"
         })
       })
    }});
//Edit page 
app.get('/admin/editpost', requireAuth ,(req,res)=>{
  Post.find({})
  .then((foundPost)=>{
    res.render("admin/edit", {
      posts: foundPost,
      title: "Edytuj"
    });
  });
});
app.get("/admin/:postId", requireAuth, (req,res)=>{

  const requestedPostId = req.params.postId;
  Post.findOne({_id: requestedPostId})
  .then((post)=>{
    res.render("admin/editpost", {
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
     res.render("admin/admin", {
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
  res.render("admin/login");
});
app.post("/login", async function(req, res){
    try {
        const user = await User.findOne({ username: req.body.username });
        if (user) {
          const result = req.body.password === user.password;
          if (result) {
            req.session.userId = user;;
            res.render("admin/admin");
          } else {
            res.send("Invalid password")
          }
        } else {
          res.send("Invalid username")
        }
      } catch (error) {
        res.render("admin/admin");
      }
});
//Logout page
app.get("/logout", function (req, res) {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
});
//404 
app.get('*', function(req, res){
  res.render('404', {title: "Not Found"});
});


app.listen(8080, function() {
    console.log("Server started on port 8080");
  });
  