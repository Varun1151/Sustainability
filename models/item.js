var mongoose=require("mongoose")
//SCHEMA SETUP
var itemSchema =new mongoose.Schema({
	title:String,
	image:String,
	cost:Number,
	shop:String,
	created: {type: Date, default: Date.now},
	author:{
		id:{
			type:mongoose.Schema.Types.ObjectId,
			ref:"User"
		},
		username:String
	}

	// likes:[
	// 	{
	// 		type:mongoose.Schema.Types.ObjectId,
	// 		ref:"User"
	// 	}
	// ],

	// likescount: { type: Number, default: 0 },

	// dislikes:[
	// 	{
	// 		type:mongoose.Schema.Types.ObjectId,
	// 		ref:"User"
	// 	}
	// ],

	// dislikescount:{ type: Number, default: 0 },
	// virtualcoins:{type:Number,default:0}
});


module.exports=mongoose.model("Item",itemSchema);
