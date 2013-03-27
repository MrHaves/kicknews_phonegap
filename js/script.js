/*
	API connexion configuration
*/

var DOMAIN_WEBSITE = "http://localhost:8000/";

// Development
var api_paths = {
	login : DOMAIN_WEBSITE + "api/v1/user/login/", // don't forget the last "/"" here to avoid the 301 http response code and useless request
	register : DOMAIN_WEBSITE + "api/v1/user/register/", // don't forget the last "/"" here to avoid the 301 http response code and useless request
	logout : DOMAIN_WEBSITE + "api/v1/user/logout/", // don't forget the last "/"" here to avoid the 301 http response code and useless request
	comment : DOMAIN_WEBSITE + "api/v1/comment/?format=json",
	writecomment : DOMAIN_WEBSITE + "api/v1/comment/post_comment/",
	categories : DOMAIN_WEBSITE + "api/v1/category/?format=json",
	postarticle : DOMAIN_WEBSITE + "api/v1/articles/post_article/",
	preferences : DOMAIN_WEBSITE + "api/v1/preferences/?format=json",
	settings : DOMAIN_WEBSITE + "api/v1/user/save_settings/",
	aroundme : DOMAIN_WEBSITE + "api/v1/aroundme/?format=json";
};

// Production
// @todo : use ssl if possible. (check alwaysdata)

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
						category.fetch_url = api_paths.categories+"&name="+cat.name;

						article = null;
						$(cat.articles).each(function(i, art) {

							console.log(cat);

							article = new Article();
							article.id = art.id;
							article.title = art.title;
							article.text = art.text;
							article.subhead = art.text; // @todo FIXME : Should be corrected immediately after reading this
							article.picture = art.media;
							article.date = art.date;
							article.author = art.author;
							article.quality = art.quality;
							article.fiability = art.fiability;

							category.articles.push(article);
							category.articles_ids.push(article.id);
						});

						app.reader.pushCategory(category);
						category.saveLocal();
						category.showArticles();
					});

					var cat  = new Category();
					cat.id = "aroundme";
					cat.name = "aroundme";
					cat.fetch_url = api_paths.categories+"&name="+cat.name;
					app.reader.pushCategory(cat);
					cat.saveLocal();
					//category.showArticles();

					$.jStorage.set('categories', app.reader.categories);
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
			console.log('full_refresh');
			this.loadLocal();
			if(app.is_connected()) {
				this.loadOnline();
			}
			this.saveLocal();
		};

		Reader.prototype.rebuildPage = function () {
			$('.article').remove();
		};

		Reader.prototype.rebuildMenu = function () {
			this.updateCategoriesMenu();
			$('.categoryBtn').remove();

			var categories = $.jStorage.get('categories');

			// @todo : Sort by weight
			$(categories).each(function (i, cat) {
				// Add each category to the navbar
				var $li = $('<li>');
				var $link = $('<a>', {
					href: "read.html?category="+cat.name,
					class: "categoryBtn",
					text: cat.name,
				});
				$link.attr('data-ajax', 'false');
				$link.appendTo($li);
				$li.appendTo('#categories_menu');

				$('#categories_menu:visible').listview('refresh');
			});
		};

		Reader.prototype.setListeners = function () {
			console.log('setListeners');
			$('#reader .fetchBtn').click(this.full_refresh);
		};

		// Update the list of categories
		Reader.prototype.updateCategoriesMenu = function () {
			this.categories = $.jStorage.get('categories');
		};

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
								article.date = art.date;
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
	var picture = "";
	var date;
	var author;
	var fiability;
	var quality;
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
				this.picture = article.media;
				this.author = article.author;
				this.subhead = article.subhead;
				this.date = article.date;
				this.quality = article.quality;
				this.fiability = article.fiability;
			}
			return this;
		};

		// Save in local storage for faster refresh
		Article.prototype.save = function() {
			$.jStorage.set('articles['+this.id+']', this);
		};

		// Print article in html
		Article.prototype.show = function (id) {
			var article = $.jStorage.get('articles['+id+']');
			console.log(article.picture);
			if(!!article.picture) {	
				var $img = $('<img>', {
					src: DOMAIN_WEBSITE + "media/" + article.picture,
					alt: article.title,
				});
				$img.appendTo('#img-article');
			}

			$('#article .article_body').html(article.subhead);
			$('#article .article_title').text(article.title);
			$('#article .article_author').text(article.author);

			var timestamp = article.date;
			var date = new Date(timestamp * 1000);
			var datevalues = [
			         date.getFullYear()
			        ,date.getMonth()+1
			        ,date.getDate()
			        ,date.getHours()
			        ,date.getMinutes()
			        ,date.getSeconds()
			     ];

			if(datevalues[1]<10){
				month = '0' + datevalues[1];
				datevalues[1] = month;
			}

			$('#article .date').text(datevalues[2]+'/'+datevalues[1]+'/'+datevalues[0]);

			$('#article .fiability').html("<b>Fiabilité</b> : " + article.fiability);
			$('#article .quality').html("<b>Qualité</b> : " + article.quality);

			var $link_write = $('<a>', {
					href: "write-comment.html?id="+article.id,
					id: "write-comment-button",
					text: "Ecrire un commentaire",
					id: "write-comment-button"
			});
			$link_write.attr('data-ajax', 'false');
			$link_write.attr('data-role', 'button');
			$link_write.appendTo('#comment');

			var $link_read = $('<a>', {
					href: "read-comment.html?id="+article.id,
					id: "read-comment-button",
					text: "Lire les commentaires",
					id: "read-comment-button"
			});
			$link_read.attr('data-ajax', 'false');
			$link_read.attr('data-role', 'button');
			$link_read.appendTo('#comment');

			var current_user = $.jStorage.get('current_user');
			if(current_user == null){
				$('#write-comment-button').addClass('ui-disabled');
			}

		};

		Article.prototype.showItem = function(category) {

			var article = $.jStorage.get('articles['+this.id+']');

			var timestamp = article.date;
			var date = new Date(timestamp * 1000);
			var datevalues = [
			         date.getFullYear()
			        ,date.getMonth()+1
			        ,date.getDate()
			        ,date.getHours()
			        ,date.getMinutes()
			        ,date.getSeconds()
			     ];

			if(datevalues[1]<10){
				month = '0' + datevalues[1];
				datevalues[1] = month;
			}

			$li = $('<li>');
			$a = $('<a>', {
				href: "article.html?id="+this.id+"&category=" + category.id,
				rel: "external",
				class: "articleBtn"
			});

			$p = $('<p>', {
				text: 'écrit le '+datevalues[2]+' / '+datevalues[1]+' / '+datevalues[0],
			});

			$h3 = $('<h3>', {
				text: this.title,
			});
			$div = $('<div>', {
				text: this.subhead
			});

			if(!!article.picture) { 
				$div = $('<div>', {
					class: "thumb"
				});	

				$img = $('<img>', {
					src: DOMAIN_WEBSITE + "media/" + article.picture
				});
			}
			else {
				$div = $('<div>', {
					class: "no-thumb"
				});

				$img = $('<img>', {
					src: "css/icons/42-photos.png"
				});
			}


			$img.appendTo($div);

			$div.appendTo($a);
			$h3.appendTo($a);
			$p.appendTo($a);

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

	$(document).bind('deviceready', function(){
        onDeviceReady();
    });

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
						app.current_user.id = json.member.id;
						app.current_user.username = username;
						app.current_user.api_key = json.member.api_key;
						app.current_user.auto_share = json.member.autoShare;
						app.current_user.geoloc = json.member.geoloc;
						app.current_user.facebook = json.member.facebook;
						app.current_user.gplus = json.member.gplus;
						app.current_user.twitter = json.member.twitter;
						app.current_user.country = json.member.pays;
						app.current_user.city = json.member.ville;

						app.current_user.save();
						
						$("#member_register").popup( "open", {});
						
					}
					else{
						if(json.reason == "username is empty") {
							$("#username_null").popup( "open", {});
						}else if(json.reason == "email is empty"){
							$("#email_null").popup( "open", {});
						}else if(json.reason == "user already exist"){
							$("#error_user").popup( "open", {});
						}else if(json.reason == "email already in use"){
							$("#error_email").popup( "open", {});
						}else if(json.reason == "passwords don't match"){
							$("#error_password").popup( "open", {});
						}else if(json.reason == "passwords don't exist"){
							$("#password_null").popup( "open", {});
						}else if(json.reason == "email empty"){
							$("#email_null").popup( "open", {});
						}else if(json.reason == "email not valid"){
							$("#email_not_valid").popup( "open", {});
						}
					}
				},
				error: function(ts) {
					console.debug(ts.responseText);
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
				type: "POST",
				contentType: 'application/json',
				data: data,
				dataType: 'json',
				success: function(json) {
					console.info(json);
					if(json.success) {
						// @ todo : Translate "pays" and "ville".
						// add username, api_key and other infos to current object User
						app.current_user.id = json.member.id;
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

						window.location.replace("settings.html");
					}
				},
				error: function(ts) {
					//console.debug(ts.responseText);
					var error = jQuery.parseJSON(ts.responseText);
					if(error.reason == "incorrect") {
						$("#error_identification").popup( "open", {});
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
			window.location.replace("login.html");
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

		Settings.prototype.setListeners = function () {
			$('#settingsForm').submit(function() {

				var autoShare = $("#flip-1").val();
				var geoloc = $("#flip-2").val();
				var maxArticle = parseInt($("#selectmenu1").val());

				var data = JSON.stringify({
					"autoShare": autoShare,
					"geoloc": geoloc,
					"maxArticle": maxArticle,
					"facebook": $.jStorage.get('current_user').facebook,
					"gplus": $.jStorage.get('current_user').gplus,
					"twitter": $.jStorage.get('current_user').twitter,
					"pays": $.jStorage.get('current_user').country,
					"ville": $.jStorage.get('current_user').city,
					"userId": $.jStorage.get('current_user').id,
				});

				//@TODO : send preferences to server
				$.ajax({
					url: api_paths.settings,
					type: 'POST',
					contentType: 'application/json',
					data: data,
					dataType: 'json',
					success: function(json) {
						$("#confirm").popup( "open", {} );
					},
					error: function(ts) {
						$("#error").popup( "open", {} );
					}
				});

				return false;
			});
		};

		Settings.initialized = true;
	}

	var current_user = $.jStorage.get('current_user');
	if(current_user != null){
		this.loadLocal();
		this.setListeners();	
	}

}

function updateFont(fontSize){
	var currentFontSize = parseInt(fontSize.replace(/px/, ""));
	if(currentFontSize == 23){
		fontSize = 14;
	} else {
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

		var current_user = $.jStorage.get('current_user');
		if(current_user != null){
			if(page == 'read'){
				$('#login-button').empty();
				$('#login-button').html('<span class="ui-btn-inner"><span class="ui-btn-text">Se déconnecter</span><span class="ui-icon ui-icon-app-logout ui-icon-shadow">&nbsp;</span></span>');
			}
			else{
				$('#login-button').text("Se déconnecter");
				$('#login-button').attr('href', 'logout.html');
				$('#login-button').attr('data-icon', 'app-logout');
			}
		}
		else{
			$('#write-button').addClass('ui-disabled');
			$('#settings-button').addClass('ui-disabled');
		}

		switch(page) {
			case 'read' :
				this.reader = new Reader();
				if(getQuerystring('category') == "") {
					//this.reader = new Reader();
					this.reader.loadOnline();
					this.reader.setListeners();
				}
				else {
					var current_cat = new Category();
					var current_cat_name = decodeURIComponent(getQuerystring('category'));
					var cat = $.jStorage.get('categories['+ current_cat_name +']');

					current_cat.id = cat.id;
					current_cat.name = cat.name;
					current_cat.fetch_url = cat.fetch_url;

					if(current_cat.name == "aroundme"){
						var latitude = $.jStorage.get('latitude');
						var longitude = $.jStorage.get('longitude');
						$("#geolocalisation").html('Latitude: ' + latitude + '<br/>' + 'Longitude: '+ longitude);

						var url = api_paths.aroundme + "&lat="+latitude+"&long="+longitude;


						$.ajax(api_paths.aroundme, {
							dataType: 'json', // data will be parsed in json automagically
							type: "GET",
							cache: false,
							success: function(json) {

								category = null;
								$(json.objects).each(function(i, art) {

									article = new Article();
									article.id = art.id;
									article.title = art.title;
									article.text = art.text;
									article.subhead = art.text; // @todo FIXME : Should be corrected immediately after reading this
									article.picture = art.media;
									article.date = art.date;
									article.author = art.author;
									//article.quality = art.quality;
									//article.fiability = art.fiability;

									category.showItem();
								});
							},
							error: function() {
								app.errorOrNoInternet();
							}
						});

						

					}
					else {
						article = null;
						$(cat.articles).each(function(i, art) {

							article = new Article();
							article.id = art.id;
							article.title = art.title;
							article.text = art.text;
							article.subhead = art.text; // @todo FIXME : Should be corrected immediately after reading this
							article.picture = art.media;
							article.date = art.date;
							article.author = art.author;

							current_cat.articles.push(article);
							current_cat.articles_ids.push(article.id);
						});

						current_cat.showArticles();
					}

					this.reader.rebuildMenu();

					$('#header h3').text(current_cat_name);

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
				article.show(article.id);

				var nb_comment = 0;
				$.ajax(api_paths.comment,{
					dataType: 'json', // data will be parsed in json automagically
					type: "GET",
					cache: false,
					success: function(json) {
						$(json.objects).each(function(i, comment) {

							var article_id = getQuerystring('id');
							if(comment.articleId.id == parseInt(article_id)){
								++nb_comment;
							}

						});	

						$('#nb_comment').text(nb_comment);

						if(nb_comment == 0){
							$('#read-comment-button').addClass('ui-disabled');
						}
					},
					error: function(ts) {
					}
				});


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
					$('#popupBasic').css("font-size", "14px");
					$('#popupBasic2').css("font-size", "14px");
				});

				break;
			case 'write-comment' : 
				$("#writeComment").submit(function(){
					var article_id = getQuerystring('id');
					var current_user = $.jStorage.get('current_user');

					var text = $("#comment").val();
					var data = JSON.stringify({
						"text": text,
						"articleId": parseInt(article_id),
						"memberId": current_user.id
					});

					$.ajax({
						url: api_paths.writecomment,
						type: 'POST',
						contentType: 'application/json',
						data: data,
						dataType: 'json',
						success: function(json) {
							window.location.replace("read-comment.html?id="+article_id);
						},
						error: function(ts) {

						}
					});	

				});
				break;
			case 'read-comment' : 
				$.ajax(api_paths.comment,{
					dataType: 'json', // data will be parsed in json automagically
					type: "GET",
					cache: false,
					success: function(json) {
						console.log(json);

						$(json.objects).each(function(i, comment) {

							var article_id = getQuerystring('id');

							if(comment.articleId.id == parseInt(article_id)){

								var date = comment.date.split('T');
								var date_elements = date[0].split('-');

								$li = $('<li>');
								$p1 = $('<p>', {
									text: 'écrit le '+date_elements[2]+' / '+date_elements[1] +' / '+date_elements[0] ,
									class: 'ui-li-aside',
								});
								$h3 = $('<h3>', {
									text: comment.username,
								});
								$p2 = $('<p>', {
									text: comment.text,
								});
								$p1.appendTo($li);
								$h3.appendTo($li);
								$p2.appendTo($li);
								$li.appendTo('#comments ul');
							};
						});

						$('#comments ul:visible').listview('refresh');

					},
					error: function(ts) {
					}
				});	
				break;
			case 'write' : 

				var categories = $.jStorage.get('categories');

				for(var i=0; i<categories.length; ++i){

					if(categories[i].name != "aroundme") {
						$option = $('<option>', {
							value: categories[i].name,
							text: categories[i].name
						});

						$option.appendTo('#select_category');
					}
				}

		        $('#writeform').submit(function(event){
		            //event.preventDefault();
					var current_user = $.jStorage.get('current_user');
		            var article_title = $("#article_title").val();
		            var article_content = $("#article_content").val();
		            var article_content = $("#article_content").val();
					var article_category = $("#select_category").val();

		            var picture = $.jStorage.get('picture');

		            var data = JSON.stringify({
		                "title" : article_title,
		                "text" : article_content,
		                "memberId": current_user.id,
		                "category" : article_category,
		                "media" : picture
		            });

		            console.log(data);
		            //Need to add the category data
		            $.ajax({
		                url: api_paths.postarticle,
		                type:"POST", 
		                contentType: 'application/json',
		                data: data, 
		                dataType: 'json',
		                success: function(json) {
		                    console.info(json);
		                },
		                error: function(ts) {
							console.log('erreur');
		                }
		            });
		        });
				break;
			case 'share' :
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
