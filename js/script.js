function Reader() {
	this.current_category;
	this.categories_menu = [];
	this.categories = [];

	if (typeof Reader.initialized == "undefined" ) {
		// API fecth online via AJAX
		Reader.prototype.loadOnline = function () {
			alert("loadOnline Reader");
			$(this.categories).each(function(i, cat) {
				cat.loadOnline();
			});
		};

		// Storage fetch
		Reader.prototype.loadLocal = function() {
			alert("loadLocal Reader");
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
			$(this.categories_menu).each(function (i, cat) {
			// @todo : FIXME : Normally we should loop on $(this.categories)
			// $(this.categories).each(function (i, cat) {
				// Add each category to the navbar
				var $link = $('<a>', {
					href: "read.html?category="+cat,
					class: "categoryBtn",
					text: cat
				});
				$link.appendTo('#categories_menu');
			});
		};

		Reader.prototype.setListeners = function () {
			$('#read .fetchBtn').click(this.refresh);
		};

		// Update the list of categories
		Reader.prototype.updateCategoriesMenu = function () {
			this.categories_menu = ['Home']; // @todo : Init with a parameter from the settings loaded with the app (app.settings.categories_menu ?)
			if(this.categories_menu.size == 0) {
				this.categories_menu = $.jStorage.get('categories_menu');
			}
			$.jStorage.set('categories_menu', this.categories_menu);
		};

		/*
				MAIN for Reader
		*/


		// DEFAULT : Adding home to the pages
		// @todo : Skip this part
		this.categories['home'] = new Category();
		this.categories['home'].id = 'home';
		this.categories['home'].fetch_url = "offline_api/articles/home.json";
		this.categories['home'].articles = [];
		this.categories['home'].loadOnline();
		this.current_category = this.categories['home'];

		this.rebuildMenu();

		
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

function Category(){
	this.id;
	this.name;
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
			var current_category_id = this.id;
			var current_category = new Category();
			var last_update = this.last_update;

			$.ajax(this.fetch_url, {
				dataType: 'json', // data will be parsed in json automagically
				type: "GET",
				data: articles_ids,
				cache: false,
				success: function(json) {
					// update list for given category
					if(!!json.id && current_category_id == json.id /*&& json.timestamp >= last_update*/) {
						var category = new Category();
						// add current_category.* = *
						category.id = json.id;
						category.last_update = json.timestamp;

						$(json.articles).each(function(i, art) {
							article = new Article();
							// @todo : check timestamp too (by the server, so we need to send it in the post data too)
							if(typeof art == "number") {
								article.loadLocal(art);
							} else {
								article.id = art.id;
								article.title = art.title;
								article.subhead = art.subhead;
								article.picture = art.picture;
								article.datetime = art.datetime;
								article.author = art.author;
							}
							category.articles.push(article);
							category.articles_ids.push(article.id);
						});

						// show articles
						category.showArticles();
						// update local data for category
						category.saveLocal();
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
			category = this;
			category.articles = null;
			categories.articles_ids = [];
			$(this.articles).each(function (i, art) {
				categories.articles_ids[i] = art.id;
			});
			$.jStorage.set('categories['+this.id+']', category);
			$(this.articles).each(function (i, art) {
				art.save();
			});
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

function Article(){
	var id;
	var title;
	var subhead;
	var picture;
	var datetime;
	var author;
	var is_read = false;
	var status = "draft";
	// @todo : add an array "categories" to avoid deleting articles in all categories if not necessary.

	if(typeof Article.initialized == "undefined") {
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
				class: "articleBtn",
				text: this.title
			});
			$a.appendTo($li);
			$li.appendTo('#reader #articles');
		};

		Article.initialized = true;
	}
}

var app = {
	page: null,
	user: null,
	last_update: -1,

	settings: {
		max_article_number: 10
	},

	categories: ['home'],

	//settings: new Settings();

	initialize: function(page) {
		// init application
		// load Settings
		// load User session
		// fetch config data from storage

		switch(page) {
			case 'read' :
				var reader = new Reader();
				break;
			case 'article':
				var index = 0;
				var article = new Article();
				var category = new Category();
				article.id = app.getQuerystring('id');
				article.load(article.id);
				category.loadLocal(app.getQuerystring('category'));

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
				break;
			case 'write' : 
				//var writer = new Writer();
				break;
			case 'login' : break;
			case 'settings' : break;
			default: alert('no page initialized'); break;
		}

	},

	is_connected: function () {
		return true;
	},
	
	errorOrNoInternet: function() {
		var message = "Unable to fetch fresh news.";
		console.log(message);
	},

	/**
		Articles
	*/
	loadArticles: function(event) {
		// load from storage
		var last_update = app.last_update;
		// fetch category by category
		$(categories).each(function(i, cat) {
			// fetch from server, sending the current list of articles for limiting the weight of the data sent back ?
			app.fetchApiArticles(cat);
		});
	},

	updateHome: function() {
		$(categories).each(function(i, cat) {
			if(app.nextCategory == cat.id) {
				// clear the list
				$('#articles').empty();
				// Update the title
				$('#app_title').text("Kicknews: " + cat.name);
				// Add the articles
				if(cat.articles.length == 0) {
					var $li = $('<li>');
					var $link = $('<a>', {
						href: "#",
						class: "fetchBtn",
						text: "Fetch !"
					});

					$link.attr("data-transition", "slide");
					$li.attr("data-theme", "c");
					$link.appendTo($li);
					$li.appendTo('#articles');

					app.setListeners();
				} else {
					$(cat.articles).each(function(i, article) {
						var $element = $('<li class="article" data-theme="c"><a href="#" data-transition="slide" class="article_title">' + article.title + '</a></li>');
						$element.hide();
						$element.appendTo('#articles');
						$element.show();
					});
				}
				
				app.last_update = Date.now();
				app.currentCategory = app.nextCategory;
				$('#articles').listview('refresh');
				console.log('Articles updated !');
			}
		});
	},

	getQuerystring: function(key, default_) {
       if (default_==null) default_="";
       key = key.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
       var regex = new RegExp("[\\?&]"+key+"=([^&#]*)");
       var qs = regex.exec(window.location.href);
       if(qs == null) return default_; else return qs[1];
   }

	// Login

	// Settings
};