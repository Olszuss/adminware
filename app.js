require('dotenv').config()
const express = require("express");
const ejs = require("ejs");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const fileUpload = require("express-fileupload");
const fs = require("fs")
const bodyParser = require("body-parser");
const _ = require("lodash");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const User = require("./model/user");



const app = express();
const path = require("path");

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(fileUpload());
app.use(bodyParser.urlencoded({extended: true}));
app.use(require("express-session")({
  secret: process.env.SECRET,
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
  } ;
const announceSchema = {
  title: String,
  content: String,
  date: Date,
  active: Boolean
}
const Post = mongoose.model("Post", postSchema);
const Announce = mongoose.model("Announcement", announceSchema);
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
      return post = foundPost
    })
    Announce.find({ active: true })
    .then((foundAnnouncement)=>{
      
      res.render('index', {
        title: "Strona główna",
        posts: post,
        announce: foundAnnouncement
      })
    })
  });

//contact page
app.get('/contact', (req, res) => {
    res.render('contact', {title:"Kontakt"});
});
app.post('/contact', (req, res)=>{
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  const mail_option = {
    from: process.env.EMAIL_USERNAME,
    to: process.env.EMAIL_RECEIVES,
    subject: req.body.subject,
    html: 
    `
    <img src="">
    <div style="text-align: center;">
    <h1>Otrzymano nową wiadomość z formularza kontaktowego!</h1>
    </div>
    <h2>Wiadomość od ${req.body.first} ${req.body.last} </h2>
    <h3>Mail: ${req.body.email}</h3>
    <h3>Telefon: ${req.body.phone}</h3>
    <h3>Temat: ${req.body.subject}
    <h3>Wiadomość: </h3>
    <p>${req.body.message}</p>
    `,
  };
  transporter.sendMail(mail_option, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      res.render("contact", {
        title: "Kontakt",
        message: "Wysłano wiadomość"
      });
    }
  });
});
//blog page 
app.get('/blog', (req, res) => {
  Post.find({ deleted: false })
    .then((foundPost)=>{
      res.render('blog', {
        title:"Blog",
        posts: foundPost
      });
  })

});
//Post page
app.get("/posts/:postId", (req,res)=>{

    const requestedPostId = req.params.postId;
    Post.findOne({_id: requestedPostId})
    .then((post)=>{
      res.render("post", {
        title: post.title,
        content: post.content,
        image: post.imageUrl,
        date: post.date
      });
    })

  });
//////////////////////////////////////////////////////////////////
  //Admin page
  app.get("/admin", requireAuth, (req,res)=>{
    res.render("admin/admin" , {title:"Admin"});
  });
//Anouncement page
app.get('/admin/announcements', requireAuth, (req,res)=>{
  Announce.find({active:true})
  .then((announcement)=>{
  res.render('admin/announcements', {
    title: "Ogłoszenia",
    announce: announcement
  });
});
});
app.get('/admin/announcements/new', requireAuth, (req,res)=>{
  res.render('admin/newannouncements', {
    title: "Ogłoszenia"
  });
});
app.post('/admin/announcements/new', requireAuth, async (req,res)=>{
  let announceActive;
  if (req.body.announceActive === "yes" ){
    announceActive = true;
    await Announce.updateMany({active: true}, {active: false});
  }else{
    announceActive= false;
  }
  const announce = new Announce({
    title: req.body.announceTitle,
    content: req.body.announceArea,
    date: Date.now(),
    active: announceActive
  });

  announce.save();
  res.render('admin/admin', {warning: "Pomyślnie dodałeś ogłoszenie."})
});
app.get('/admin/announcements/history', requireAuth, (req,res)=>{
    Announce.find()
    .then((announcement)=>{
      res.render('admin/historyannouncements', {
        title: "Historia",
        announce: announcement
      });
    });
});
app.post('/admin/announcements/history', requireAuth, async (req,res)=>{
  await Announce.updateMany({active: true}, {active: false});
  await Announce.updateOne({ _id : req.body.announceId },{active: true});
  res.render('admin/admin', {warning: "Pomyślnie przywróciłeś ogłoszenie."})
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
    let content = req.body.postArea;
      if (req.files == null) {
        const post = new Post({
          title: req.body.postTitle,
          content: content,
          date: Date.now(),
          imageUrl: "https://www.e-kern.com/fileadmin/user_upload/Images_Allgemein/Slider/kern_it_85103537_1920x1080px.jpg",
          deleted: false
        });
        post.save();
        res.render('admin/admin', {warning: "Pomyślnie dodałeś post."})
      } else {
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
      }}

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
            req.session.userId = user;
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
//register page 
app.get("/register", function (req, res) {
  res.render('register')
});
app.post("/register", function (req,res) {
  let newUser = new User({
    username: req.body.username,
    password: req.body.password
  });
  User.register(newUser, req.body.password, function(err, user) {
    if (err) {
        console.log(err);
    }
    passport.authenticate("local")(req, res, function() {
        res.redirect('admin/login');
    });
 });
});
app.get('/robots.txt', function (req, res) {
  res.sendFile(path.join(__dirname, "/robots.txt"));
});
app.get("/sitemap.xml", function (req, res) {
  res.sendFile(path.join(__dirname, "/sitemap.xml"));
});
//404 
app.get('*', function(req, res){
  res.render('404', {title: "Not Found"});
});



app.listen(process.env.PORT, function() {
    console.log("Server started on port 8080");
  });
  