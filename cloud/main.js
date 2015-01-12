// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
var name = require('cloud/name.js');
require('cloud/app.js')
AV.Cloud.define("hello", function(request, response) {
    console.log(request.user);
	response.success("Hello world," + request.params.name);
});

AV.Cloud.define("cool", function(request, response) {
	response.success(name.isACoolName(request.params.name));
});

AV.Cloud.define('testBuffer', function(request, response){
	var buf = new Buffer('hello');
	response.success(buf);
});

AV.Cloud.beforeSave("TestReview", function(request, response){
	if (request.object.get("stars") < 1) {
		response.error("you cannot give less than one star");
	} else if (request.object.get("stars") > 5) {
		response.error("you cannot give more than five stars");
	} else {
		var comment = request.object.get("comment");
		if (comment && comment.length > 140) {
			// Truncate and add a ...
			request.object.set("comment", comment.substring(0, 137) + "...");
		}
		response.success();
	}
});

AV.Cloud.afterSave("TestReview", function(request) {
	var testAfterSave = new AV.Object("testAfterSave");
	var review  = new AV.Object('TestReview');
	review.id = request.object.Id;
	testAfterSave.set("review", review);
	testAfterSave.save();
	var query = new AV.Query("TestPost");
	query.get(request.object.get("post").id, {
		success: function(post) {
			post.increment("comments");
			post.save();
		},
		error: function(error) {
			throw "Got an error " + error.code + " : " + error.message;
		}
	});
});
var util = require('util');
AV.Cloud.beforeDelete("Album", function(request, response) {
  query = new AV.Query("Photo");
  var album = new AV.Object('Album');
  album.id = request.object.id;
  query.equalTo("album", album);
  query.count({
    success: function(count) {
		console.log("count:"+count);
      if (count > 0) {
        response.error("Can't delete album if it still has photos.");
      } else {
        response.success();
      }
    },
    error: function(error) {
      response.error("Error " + error.code + " : " + error.message + " when getting photo count.");
    }
  });
});
AV.Cloud.afterDelete("Album", function(request) {
  query = new AV.Query("Photo");
  var album = new AV.Object('Album');
  album.id = request.object.id;
  query.equalTo("album", album);
  query.find({
    success: function(posts) {
		console.log('posts:'+posts);
		posts.forEach(function(post){
			post.destroy();
		});
    },
    error: function(error) {
      console.error("Error finding related comments " + error.code + ": " + error.message);
    }
  });
});

AV.Cloud.onVerified('sms', function(req, res){
   console.log(req.object);
   res.success('ok');
});
