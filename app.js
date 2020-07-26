//Require modules
var express=require("express"),
	app=express(),
    bodyparser=require("body-parser"),
	flash=require("connect-flash"),
	passport=require("passport"),
	LocalStratergy=require("passport-local"),
    mongoose=require("mongoose"),
	methodoverride=require("method-override"),
	User=require("./models/user")
	Item=require("./models/item")
require('dotenv').config();

app.set("view engine","ejs");
app.use(bodyparser.urlencoded({extended:true}));
app.use(express.static(__dirname+"/public"));
mongoose.connect("mongodb+srv://varun51:gotilla@123@cluster0-ovdbs.mongodb.net/Sustainability",{useNewUrlParser:true});
app.use(flash())
app.use(methodoverride("_method"));


var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});

var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'dzkqk6y2p', 
  api_key: 818758744624256, 
  api_secret: "ionm18OMZfQFvMamGrDsKIWZbJ4"
});

app.use(require("express-session")({
	secret:"mvarun51",
	resave:false,
	saveUninitialized:false	
}))
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStratergy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use((req,res,next)=>{
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error")
	res.locals.success = req.flash("success") 
	res.locals.info = req.flash("info") 
	next();
});
	

app.get("/",(req,res)=>{
	res.render("home");
});

//shows all the posts
app.get("/friendly",function(req,res){
	Item.find({},function(err,items){
	   if(err){
		   console.log("error!");
	   }else{
		   res.render("friendly",{items:items});
	   }
		   
   });
});

app.post("/friendly",isLoggedIn,upload.single('image'),function(req,res){
	cloudinary.uploader.upload(req.file.path, function(result) {
  		req.body.image = result.secure_url;
	var title=req.body.title;
	var image=req.body.image;
	var cost=req.body.cost;
	var shop=req.body.shop;
	var author = {
		id:req.user._id,
		username:req.user.fullname
	}
	var newitem={title:title,image:image,cost:cost,shop:shop,author:author};
	Item.create(newitem,function(err,newItem){
		if(err){
			res.render("new");
		}else{
			//redirect to the index
			res.redirect("/friendly");
		}
			
	});
	});
});



//shows all details of a particular post
app.get("/items/:id",function(req,res){
   Item.findById(req.params.id, function(err,foundItem){
	   if(err){
		   res.redirect("/friendly");
	   }else{
		   res.render("show",{item:foundItem});
	   }
   });
});

app.get("/friendly/new",isLoggedIn,function(req,res){
	res.render("new");
});


//edits a particular post (only the person who has uploaded it has access)
app.get("/friendly/:id/edit",function(req,res){
	console.log("in edit route")
	Item.findById(req.params.id,function(err,foundItem){
		if(err){
			res.redirect("/friendly");
		}else{
			res.render("edit",{item:foundItem});
		}
	});
	 
});


//updates a particular post
app.put("/friendly/:id",function(req,res){
	console.log("put")
	var title=req.body.title;
	var image=req.body.image;
	var cost=req.body.cost;
	var shop=req.body.shop;
	var author = {
		id:req.user._id,
		username:req.user.fullname
	}
	var newitem={title:title,image:image,cost:cost,shop:shop,author:author};
	Item.findByIdAndUpdate(req.params.id,newitem,function(err,updatedItem){
		if(err){
			res.redirect("/friendly");
		}else{
			res.redirect("/items/"+req.params.id);
		}
	});
});

//deletes a post (only the person who has uploaded the post has access)
app.delete("/friendly/:id",function(req,res){
	Item.findByIdAndRemove(req.params.id,function(err){
		if(err){
			res.redirect("/friendly");
		}else{
			res.redirect("/friendly");
		}
	});
});

app.get("/userinfo/:id",(req,res)=>{
	User.findById(req.params.id,(err,user)=>{
			if(err){
				console.log(err)
			}
			else{
				res.render("userinfo",{user:user});
			}
	});
});

//Autentication
app.get("/login",(req,res)=>{
	res.render("login")
});


app.post("/login",passport.authenticate("local",{
	successRedirect : "/friendly",
	failureRedirect : "/login",
	failureFlash: true,
    successFlash: 'Logged in successfully'
}),(req,res)=>{
	
});

app.get("/signup",(req,res)=>{
	res.render("signup")
});

//handling user sign up
app.post("/signup",upload.single('image'),(req,res)=>{
	cloudinary.uploader.upload(req.file.path, function(result) {
  		req.body.image = result.secure_url;
		var newuser=new User({
			username:req.body.username,
			fullname:req.body.fullname,
			image:req.body.image
		});
		User.register(newuser,req.body.password,(err,user)=>{
			if(err){
				req.flash('error', err.message);
				res.redirect("back")
			}
			passport.authenticate("local")(req,res,function(){
				req.flash('success',"Welcome "+user.username);
				res.redirect("/friendly")
			});
		});
	});
});

app.get("/logout",(req,res)=>{
	req.logout();
	res.redirect("/");
});


app.get("*",(req,res)=>{
	res.redirect("/")
});

function isLoggedIn(req,res,next){
	if(req.isAuthenticated()){
		return next()
	}
	req.flash("info","You need to be logged in to perform the action");
	res.redirect("/login")
}

function checkitemownership(req,res,next){
	if(req.isAuthenticated()){
			//Does the user own the post
			
		Item.findById(req.params.id,(err,tourspot)=>{
			if(err){
				req.flash("error","Item not found!")
				res.redirect("back");
			}	
			else{
				if(Item.author.id.equals(req.user._id)){
					next();
				}
				else{
					req.flash("error","You don't have permission")
					res.redirect("back")
				}
			}
		})
	}
	else{
			res.redirect("back");
	} 
}
app.listen(process.env.PORT||3001,()=>{
	console.log("Server started")
});