const express = require('express');
const ejs = require('ejs');
const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");
const _ = require("lodash");
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(fileUpload());
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect("mongodb://127.0.0.1:27017/adminware");
const postSchema = {
    title: String,
    content: String,
    imageUrl: String,
    date: Date
  }  
const Post = mongoose.model("Post", postSchema);

app.get("/", (req,res)=>{ 
    Post.find({})
    .then((foundPost)=>{
      res.render("index", {
        posts: foundPost,
        title: "Strona główna"
      });
    });
  });
app.get('/contact', (req, res) => {
    res.render('contact', {title:"Kontakt"});
});
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
  app.get("/compose", (req,res)=>{
    res.render("compose");
  });
  
  app.post("/compose", (req,res)=>{
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
    console.log("Sucessfully composed blog post")
    res.redirect("/");
  });

app.listen(5050, function() {
    console.log("Server started on port 5050");
  });
  