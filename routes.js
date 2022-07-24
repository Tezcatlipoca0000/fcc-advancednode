const passport = require('passport');
const bcrypt = require('bcrypt'); // 11


module.exports = function (app, myDataBase) {
	
	// 7
  	function ensureAuthenticated(req, res, next) {
    	if (req.isAuthenticated()) return next();
    	res.redirect('/');
  	};

	app.route('/').get((req, res) => {
    	res.render(__dirname + '/views/pug/index', { title: 'Connected to Database', message: 'Please Login', showLogin: true, showRegistration: true, showSocialAuth: true });
  	});

  	// 6
  	app.route('/login')
  	.post(passport.authenticate('local', {failureRedirect: '/'}), (req, res) => {
    	res.redirect('/profile');
  	});

	// 6 & 7 & 8
  	app.route('/profile')
    	.get(ensureAuthenticated, (req, res) => {
      	res.render(__dirname + '/views/pug/profile', {username: req.user.username});
      	// the user object is saved in req.user
    	});

  	// 9
  	app.route('/logout')
    	.get((req, res, next) => {
      	req.logout(function(err) {
        	if (err) { return next(err); } 
        	res.redirect('/');
      		});
    	});

    // 10
  	app.route('/register')
    	.post((req, res,next) => {
      	myDataBase.findOne({username:req.body.username}, function(err, user) {
        	if (err) {
          	next(err);
        	} else if (user) {
          	res.redirect('/');
        	} else {
          	const hash = bcrypt.hashSync(req.body.password, 12);
          	myDataBase.insertOne({ 
            	username: req.body.username, password: hash  
          	}, (err, doc) => {
            	if (err) {
              	res.redirect('/');
            	} else {
              	// The inserted document is held within
              	// the ops property of the doc
              	next(null, doc.ops[0]);
            	}
          	});
        	}
      	});
    	}, 
      	passport.authenticate('local', {failureRedirect: '/'}), 
      	(req, res, next) => {
        	res.redirect('/profile');
      	}
    	);

    app.route('/auth/github')
    	.get(passport.authenticate('github'), (req, res) => {

    	});

    app.route('/auth/github/callback')
    	.get(passport.authenticate('github', {failureRedirect: '/'}), (req, res) => {
    		req.session.user_id = req.user.id; //dont understand
    		res.redirect('/chat');
    	});

    // 16
    app.route('/chat')
    	.get(ensureAuthenticated, (req, res) => {
    		res.render(`${__dirname}/views/pug/chat`, {user: req.user});
    	});

    // 9
  	app.use((req, res, next) => {
    	res.status(404)
    	  .type('text')
    	  .send('Not Found');
  	});  	
}