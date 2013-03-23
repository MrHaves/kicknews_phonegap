/*
	API connexion configuration
*/

// Development
var api_paths = {
	settings : "",
	//home : "http://localhost:8000/api/v1/category/1/?format=json",
	login : "http://localhost:8000/api/v1/user/login/", // don't forget the last "/"" here to avoid the 301 http response code and useless request
	register : "http://localhost:8000/api/v1/user/register/", // don't forget the last "/"" here to avoid the 301 http response code and useless request
	logout : "http://localhost:8000/api/v1/user/logout/", // don't forget the last "/"" here to avoid the 301 http response code and useless request
	writecomment : "http://localhost:8000/api/v1/comment/",
	categories : "http://localhost:8000/api/v1/category/?format=json",
};

// Production
// @todo : use ssl if possible. (check alwaysdata)
/*var api_paths = {
	settings : "",
	category : "http://localhost:8000/api/v1/category/home",
	login : "http://localhost:8000/api/v1/user/login",
	register : "http://localhost:8000/api/v1/user/register",
	logout : "http://localhost:8000/api/v1/user/logout",
};*/


/*
	Reader application will show a list of articles and categories in tabs and manage the interactions and updates	
*/

function Reader() {
	this.current_category;
	this.categories = [];

	if (typeof Reader.initialized == "undefined" ) {

		Reader.prototype.pushCategory = function (category) {
			this.categories.push(category);
		}

		// API fecth online via AJAX
		Reader.prototype.loadOnline = function () {

			var that = this;

			$.ajax(api_paths.categories, {
				dataType: 'json', // data will be parsed in json automagically
				type: "GET",
				cache: false,
				success: function(json) {
					category = null;
					$(json.objects).each(function(i, cat) {
						
						category = new Category();
						category.articles = [];
						category.articles_ids = [];
						
						category.id = cat.name;
						category.name = cat.name;
						category.fetch_url = "http://localhost:8000/api/v1/category/?format=json&name="+cat.name;

						article = null;
						$(cat.articles).each(function(i, art) {

							article = new Article();
							article.id = art.id;
							article.title = art.title;
							article.text = art.text;
							article.subhead = art.text; // @todo FIXME : Should be corrected immediately after reading this
							article.picture = art.picture;
							article.datetime = art.datetime;
							article.author = art.author;

							category.articles.push(article);
							category.articles_ids.push(article.id);
						});

						app.reader.pushCategory(category);
						category.saveLocal();
						category.showArticles();
					});

					that.rebuildMenu();
				},
				error: function() {
					app.errorOrNoInternet();
				}
			});

		};

		// Storage fetch
		Reader.prototype.loadLocal = function() {
			$(this.categories).each(function(i, cat) {
				cat.loadLocal();
			});
		};

		// Save in local storage for faster refresh
		Reader.prototype.saveLocal = function() {
			$(this.categories).each(function(i, cat) {
				cat.saveLocal();
			});
		};

		Reader.prototype.full_refresh = function () {
			this.loadLocal();
			if(app.is_connected()) {
				this.loadOnline();
			}
			this.saveLocal();
		};

		Reader.prototype.rebuildPage = function () {
			$('.article').remove();

			// @todo : Sort by weight
			/*$(this.categories).each(function (i, cat) {
			// @todo : FIXME : Normally we should loop on $(this.categories)
			// $(this.categories).each(function (i, cat) {
				// Add each category to the navbar
				var $link = $('<a>', {
					href: "read.html?category="+cat,
					class: "categoryBtn",
					text: cat
				});
				$link.appendTo('#categories_menu');
			});*/
		};

		Reader.prototype.rebuildMenu = function () {
			this.updateCategoriesMenu();
			$('.categoryBtn').remove();

			// @todo : Sort by weight
			$(this.categories).each(function (i, cat) {
				// Add each category to the navbar
				var $link = $('<a>', {
					href: "read.html?category="+cat.name,
					class: "categoryBtn",
					text: cat.name,
				});
				$link.attr('data-ajax', 'false');
				$link.appendTo('#categories_menu');
			});
		};

		Reader.prototype.setListeners = function () {
			$('#read .fetchBtn').click(this.refresh);
		};

		// Update the list of categories
		Reader.prototype.updateCategoriesMenu = function () {
			if(this.categories.size == 0) {
				this.categories = $.jStorage.get('categories');
			}
			$.jStorage.set('categories', this.categories);
		};

		/*
				MAIN for Reader
		*/

		this.loadOnline();

		/*var weight = 0;
		var _this = this;
		$(this.categories_menu).each(function(i, cat_key) {
			var category = new Category();
			category.id = cat_key;
			category.weight = ++weight;
			category.refresh();
			_this.rebuildMenu();
		});*/
		// Fetch categories name
		// Call buildCategoriesMenu
		// Refresh

		//@todo : Show Category (title + link seleted in menu + show articles)

		//this.rebuildCategories();
		this.setListeners();
		Reader.initialized = true;
	}
}


/*
	Custom objects used in the application and the reader : Category and Article.
*/

// Defines behavior and data of each category
function Category(){
	this.id; // eg "home"
	this.name; // eg "Accueil"
	this.articles_ids = [];
	this.articles = [];
	this.fetch_url;
	this.last_update;

	if (typeof Category.initialized == "undefined" ) {
		Category.prototype.loadOnline = function () {
			// Fetch 1 category and its articles
			// @todo : check timestamps
			var articles_ids = [];
			$(this.articles).each(function(i, art) {
				articles_ids.push(art.id);
			});

			var current_category = new Category();
			var that = this;

			$.ajax(this.fetch_url, {
				dataType: 'json', // data will be parsed in json automagically
				type: "GET",
				data: articles_ids,
				cache: false,
				success: function(json) {
					// update list for given category
					json = json.objects[0];
					if(json.name && that.id == json.name /*&& json.timestamp >= last_update*/) {
						// add current_category.* = *
						that.id = json.name; // @todo : Fix naming conventions for human-readable title (translated) and fixed id/name
						that.last_update = json.timestamp;
						//console.log(that);

						$(json.articles).each(function(i, art) {
							article = new Article();
							// @todo : check timestamp too (by the server, so we need to send it in the post data too)
							if(typeof art == "number") {
								article.load(art);
							} else {
								article.id = art.id;
								article.title = art.title;
								article.text = art.text;
								article.subhead = art.text; // @todo FIXME : Should be corrected immediately after reading this
								article.picture = art.picture;
								article.datetime = art.datetime;
								article.author = art.author;
							}

							that.articles.push(article);
							that.articles_ids.push(article.id);

							article.save(article.id);
						});

						// show articles
						that.showArticles();
						// update local data for category
						that.saveLocal();
					} else { 
						console.log("Error while loading category updates."); 
						app.errorOrNoInternet();
					}
				},
				error: function() {
					app.errorOrNoInternet();
				}
			});
		};

		// Storage fetch
		Category.prototype.loadLocal = function(id) {
			/*if (this.id == "home") {
				this.name = "Home";
				this.articles = [];
			} else {*/
				var category = $.jStorage.get('categories['+id+']');
				if(category) {
					this.name = category.name;
					this.articles = [];
					$(category.articles_ids).each(function(i, article_id) {
						article = new Article();
						article.load(article_id);
						this.articles.push(article);
						this.articles_ids.push(article.id);
					});
				}
			//}
			return this;
		};

		// Save in local storage for faster refresh
		Category.prototype.saveLocal = function() {
			//@TODO : if category already saved test 
			$(this.articles).each(function (i, art) {
				art.save();
			});

			$.jStorage.set('categories['+this.id+']', this);
		};

		// Linked to interface
		Category.prototype.refresh = function() {
			// First load the local copy if exists
			this.loadLocal();
			// Then try to update local with distant version
			if(app.is_connected()) {
				this.loadOnline();
			}
		};

		Category.prototype.showArticles = function () {
			category = this;
			$(this.articles).each(function (i, art) {
				art.showItem(category);
			});
		};

		Category.initialized = true;
	}
}

// Definition of an article
function Article(){
	var id;
	var title = "";
	var subhead = "";
	var picture;
	var datetime;
	var author;
	var text = "";
	var is_read = false;
	var status = "draft";
	// @todo : add an array "categories" to avoid deleting articles in all categories if not necessary.

	if(typeof Article.initialized == "undefined") {
		Article.initialized = true;

		Article.prototype.debug = function() {
			return " id: "+this.id+"\n title: "+this.title+"\n subhead: "+this.subhead+"\n picture: "+this.picture+"\n datetime: "+this.datetime+"\n author: "+this.author+"\n is_read: "+this.is_read+"\n status: "+this.status;
		};

		Article.prototype.refresh = function () {

		};

		Article.prototype.post = function () {

		};

		Article.prototype.share = function () {

		};

		Article.prototype.load = function (id) {
			if(article = $.jStorage.get('articles['+id+']')) {
				this.id = id;
				this.title = article.title;
				this.picture = article.picture;
				this.author = article.author;
				this.subhead = article.subhead;
				this.datetime = article.datetime;
			}
			return this;
		};

		// Save in local storage for faster refresh
		Article.prototype.save = function() {
			$.jStorage.set('articles['+this.id+']', this);
		};

		// Print article in html
		Article.prototype.show = function () {
			if(!this.picture) {
				$('#article .article_img').parent().hide();
			} else {
				$('#article .article_img').attr('href', this.picture);
			}
			$('#article .article_body').html(this.subhead);
			$('#article .article_title').text(this.title);
			$('#article .article_author').text(this.author);
		};

		Article.prototype.showItem = function(category) {
			$li = $('<li>');
			$a = $('<a>', {
				href: "article.html?id="+this.id+"&category=" + category.id,
				rel: "external",
				class: "articleBtn"
			});
			$h3 = $('<h3>', {
				text: this.title,
			});
			$div = $('<div>', {
				text: this.subhead
			});
			if(!!this.picture) {
				$img = $('<img>', {
					src: this.picture
				});
				$img.appendTo($a);
			}
			$h3.appendTo($a);
			//$div.appendTo($a);
			$a.appendTo($li);
			$li.appendTo('#reader #articles');

			$('#reader #articles:visible').listview('refresh');
		};

	}
}

// Definition of an user
function User() {
	var username = "anonymous";
	var email = null;
	var api_key = null;
	var auto_share;
	var geoloc;
	var max_article_number;
	var facebook;
	var gplus;
	var twitter;
	var country;
	var city;

	if (typeof User.initialized == "undefined") {
		// Save current user in storage.
		User.prototype.save = function() {
			$.jStorage.set('current_user', this);
		};

		// Load current user from storage if exists.
		User.prototype.load = function() {

		};

		// Register user distantly using API
		User.prototype.register = function(username, mail, password1, password2) {
			var data = JSON.stringify({
				"username": username,
				"email": mail,
				"password1": password1,
				"password2": password2
			});

			$.ajax({
				url: api_paths.register,
				type: 'POST',
				contentType: 'application/json',
				data: data,
				dataType: 'json',
				processData: false,
				success: function(json) {
					console.info(json);
					if(json.success) {
						//add username, api_key and other infos to current object User
						app.current_user.username = username;
						app.current_user.api_key = json.member.api_key;
						app.current_user.auto_share = json.member.autoShare;
						app.current_user.geoloc = json.member.geoloc;
						app.current_user.max_article_number = json.member.maxArticle;
						app.current_user.facebook = json.member.facebook;
						app.current_user.gplus = json.member.gplus;
						app.current_user.twitter = json.member.twitter;
						app.current_user.country = json.member.pays;
						app.current_user.city = json.member.ville;

						app.current_user.save();
					}
				},
				error: function(ts) {
					console.debug(ts.status);
					var error = jQuery.parseJSON(ts.responseText);
					if(error.reason == "passwords don't match") {
						$('p.error').text("Les mots de passe ne correspondent pas");
					}
				}
			});
		};

		// login with username or email (login) and password distantly via API.
		// @todo : ensure security
		User.prototype.login = function(login, pwd) {
			var data = JSON.stringify({
				"username": ''+login, // login is either username or email // @todo : make login
				"password": ''+pwd
			});

			$.ajax({
				url: api_paths.login,
				type: "post",
				contentType: 'application/json',
				data: data,
				dataType: 'json',
				success: function(json) {
					console.info(json);
					if(json.success) {
						// @ todo : Translate "pays" and "ville".
						// add username, api_key and other infos to current object User
						app.current_user.username = username;
						app.current_user.api_key = json.member.api_key;
						app.current_user.auto_share = json.member.autoShare;
						app.current_user.geoloc = json.member.geoloc;
						app.current_user.max_article_number = json.member.maxArticle;
						app.current_user.facebook = json.member.facebook;
						app.current_user.gplus = json.member.gplus;
						app.current_user.twitter = json.member.twitter;
						app.current_user.country = json.member.pays;
						app.current_user.city = json.member.ville;

						app.current_user.save();

						window.location.replace("read.html");
					}
				},
				error: function(ts) {
					console.debug(ts.responseText);
					var error = jQuery.parseJSON(ts.responseText);
					if(error.reason == "incorrect") {
						$('p.error').text("Le nom d'utilisateur ou le mot de passe est incorrect");
					}

					$("#login_user").val('');
					$("#login_password").val('');
				}
			});

			//@todo : reload settings ?
		};

		// Performs logout and ensure 
		User.prototype.logout = function() {
			// get the api_key of the current user
			api_key = $.jStorage.get('current_user').api_key;
			// logout the current user
			$.get(api_paths.logout, {'api_key': api_key, 'format': 'json'});
			// flush info about the current user
			$.jStorage.deleteKey('current_user');
			// Update current_user
			app.current_user = new User();
		};
		
		User.prototype.is_logged_in = function() {
			return (this.api_key == null);
		};

		// @move listeners in app since the current_user is there.
		User.prototype.setListeners = function() {
			$('#loginForm').submit(function() {
				var user = $("#login_user").val();
				var password = $("#login_password").val();
				app.current_user.login(user, password);
				return false;
			});

			$('#registerForm').submit(function() {
				var user = $("#register_user").val();
				var mail = $("#register_mail").val();
				var password1 = $("#register_password").val();
				var password2 = $("#register_password_confirm").val();
				app.current_user.register(user, mail, password1, password2);
				return false;
			});

		}

		User.initialized = true;
	}

	this.setListeners();
}

// Specific application for updating and syncing settings
function Settings(){
	if(typeof Settings.initialized == "undefined") {
		Settings.prototype.loadLocal = function () {
			$('#flip-1').slider(); 
			$('#flip-2').slider(); 
			$('#selectmenu1').selectmenu(); 

			if ($.jStorage.get('current_user').auto_share == true){
				$('#flip-1').val('on').slider('refresh');
			}
			if ($.jStorage.get('current_user').geoloc == true){
				$('#flip-2').val('on').slider('refresh');
			}
			// change select value from max_article_number
			$('#selectmenu1').val($.jStorage.get('current_user').max_article_number).selectmenu("refresh");
		}
		Settings.initialized = true;
	}
	this.loadLocal();
}

function updateFont(fontSize){
	var currentFontSize = parseInt(fontSize.replace(/px/, ""));
	if(currentFontSize == 23){
		fontSize = 14;
	}else{
		fontSize = currentFontSize + 3;
	}		
	return fontSize;
}


/*
	Definition of the application, used in every pages, and interfacing the different applications (Reader, Settings, ...) and objects (User, Article, ...)
*/

var app = {
	// @todo : Add a function to erase jStoraged data.
	page: null,
	user: null,
	current_user: new User(), // ensure anonymous user by default.
	last_update: -1,

	settings: {
		max_article_number: 10
	},

	categories: ['home'],

	initialize: function(page) {
		// init application
		// load User session from storage
		// load Settings
		// fetch config data from storage

		switch(page) {
			case 'read' :
				if(getQuerystring('category') == "") {
					this.reader = new Reader();
				}
				else {
					var current_cat = new Category();
					var current_cat_name = decodeURIComponent(getQuerystring('category'));
					var cat = $.jStorage.get('categories['+ current_cat_name +']');

					current_cat.id = cat.id;
					current_cat.name = cat.name;
					current_cat.fetch_url = cat.fetch_url;

					article = null;
					$(cat.articles).each(function(i, art) {

						article = new Article();
						article.id = art.id;
						article.title = art.title;
						article.text = art.text;
						article.subhead = art.text; // @todo FIXME : Should be corrected immediately after reading this
						article.picture = art.picture;
						article.datetime = art.datetime;
						article.author = art.author;

						current_cat.articles.push(article);
						current_cat.articles_ids.push(article.id);
					});

					current_cat.showArticles();
				}

				break;
			case 'article':
				var index = 0;
				var article = new Article();
				var category = new Category();
				article.id = getQuerystring('id');
				article.load(article.id);
				category.loadLocal(article.id);

				// What is the index of the article in its category ?
				// @ todo : find better and faster function with break-on-found like "$.inArray(value, array)" which cannot work due to type conflict (we need to check equality of object.id)
				$(category.articles_ids).each(function(i, article_id) {
					if(article.id == article_id)
						index = i;
				});
				// Displays it in html
				article.show();

				// Add events
				$(document).bind("swiperight", function() {
					//if(!!(category.articles_ids[index-1]) && category.articles_ids[index-1] >= 0) {
						index--;
						article.load(category.articles_ids[index]);
						article.show();
					//}
				});
				$(document).bind("swipeleft", function() {
					//if(!!(category.articles_ids[index+1]) && category.articles_ids[index+1] < category.articles_ids.size) {
						index++;
						article.load(category.articles_ids[index]);
						article.show();
					//}
				});

				$("#police").click(function(){
					var size = $("#article.ui-page").css("font-size");
					var newSize = updateFont(size);
					$("#article.ui-page").css("font-size", newSize + "px");
				});

				break;
			case 'write-comment' : 
				$("#writeComment").submit(function(){
					var text = $("#comment").val();
					var data = JSON.stringify({
						"text": text,
						"article_Id": article.id,
						"member_Id": app.current_user.id
					});

					$.ajax({
						url: api_paths.writecomment,
						type: 'POST',
						contentType: 'application/json',
						data: data,
						dataType: 'json',
						processData: false,
						success: function(json) {
							console.info(json);
							if(json.success) {
								//@TODO
							}
						},
						error: function(ts) {

						}
					});				
				});
				break;
			case 'write' : 
				//var writer = new Writer();
				break;
			case 'login' :
				break;
			case 'register' : 
				break;
			case 'logout' :
				app.current_user.logout();
				break;
			case 'settings' :
				var settings = new Settings();
				break;
			default: alert('no page initialized'); break;
		}

	},

	// @todo: should be use ton ensure Internet connexion
	is_connected: function () {
		return true;
	},
	
	// Returns an error
	// @todo : Show message in a little notification bar.
	errorOrNoInternet: function() {
		var message = "Unable to fetch fresh news.";
		console.log(message);
	},

	resetForms: function() {
		$('form').empty();
	},
};

/* Utility functions */

// Returns the GET parameters read from the URL.
var getQuerystring = function(key, default_) {
	if (default_==null) default_="";
	key = key.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	var regex = new RegExp("[\\?&]"+key+"=([^&#]*)");
	var qs = regex.exec(window.location.href);
	if(qs == null) return default_; else return qs[1];
}
