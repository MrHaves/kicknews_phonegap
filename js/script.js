function Reader() {
	this.categories = [];

	if (typeof Reader.initialized == "undefined" ) {
		// API fecth online via AJAX
		Reader.prototype.loadOnline = function () {
			$(this.categories).each(function(i, cat) {
				cat.loadOnline();
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

		Reader.prototype.refresh = function () {
			this.loadLocal();
			if(app.is_connected()) {
				this.loadOnline();
			}
			this.saveLocal();
			alert('fu');
		};

		Reader.prototype.buildCategoriesMenu = function () {

		};

		Reader.prototype.initialize = function () {
			this.setListeners();

			$(app.categories).each(function(i, cat) {
				// Add each category to the navbar
				var $link = $('<a>', {
					href: "#read?category="+cat.id,
					class: "categoryBtn",
					text: cat.name
				});
				var $li = $('<li>');
				$link.appendTo($li);
				$li.appendTo('#categories');
			});
			// Fetch categories name
			// Call buildCategoriesMenu
			// Refresh
		}

		Reader.prototype.setListeners = function () {
			$('#read .fetchBtn').click(this.refresh);
		}

		Reader.initialized = true;
	}

	alert('Reader instanciated');
	this.initialize();
	alert('Reader loaded');
}

function Category(){
	this.id;
	this.title;
	this.articles = [];
	this.fetchURL;

	if (typeof Category.initialized == "undefined" ) {
		Category.prototype.loadOnline = function () {
			// Fetch 1 category and its articles
			// @todo : check error like no connexion
			var articles_ids = [];
			$(this.articles).each(function(i, art) {
				articles_ids.push(art.id);
			});

			$.ajax(this.fetch_url, {
				dataType: 'json', // data will be parsed in json automagically
				type: "POST",
				data: articles_ids,
				cache: false,
				success: function(json) {
					if(json.id) {
						// update list for given category
						$(categories).each(function(i, cat) {
							if(cat.id == json.id) {
								if(json.name)
									cat.name = json.name;
								if(json.weight)
									cat.weight = json.weight;
								if(json.datetime)
									cat.datetime = json.datetime;
								// method updateArticles from the category
								cat.articles = json.articles;
								// Update page
								app.updateHome();
							} else { app.errorOrNoInternet(); }
						});
						app.last_update = Date.now();
					}
				},
				error: function() {
					app.errorOrNoInternet();
								app.updateHome();
				}
			});
		};

		// Storage fetch
		Category.prototype.loadLocal = function() {
		};

		// Save in local storage for faster refresh
		Category.prototype.saveLocal = function() {
		};

		// Linked to interface
		Category.prototype.refresh = function() {
			this.loadLocal();
			if(app.is_connected()) {
				this.loadOnline();
			}
			this.saveLocal();
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
	var is_read = false;
	var status = "draft";

	if(typeof Article.initialized == "undefined") {

		// Print article in html
		Article.prototype.show = function () {
			$('#article div[data-role="content"]').empty();
			if(this.picture == null) {
				$('<div style="width:100%; height:100px; position:relative; background-color:#fbfbfb; border:1px solid #b8b8b8;"><img src="http://codiqa.com/static/images/v2/image.png" alt="image" style="position:absolute; top:50%; left:50%; margin-left:-16px; margin-top:-18px"></div>').appendTo('#article div[data-role="content"]');
			}
			else{
				$('<img src="'+ article.picture +'" alt="image" style="position:absolute; top:50%; left:50%; margin-left:-16px; margin-top:-18px">').appendTo('#article div[data-role="content"]');
			}
		    
			$('<h2>'+ this.title +'</h2>').appendTo('#article div[data-role="content"]');
			$('<p>'+ this.subhead +'</p>').appendTo('#article div[data-role="content"]');
		};

		Article.prototype.refresh = function () {

		};

		Article.prototype.post = function () {

		};

		Article.prototype.share = function () {

		};

		Article.prototype.find_by_id = function (article_id) {
			//return ...
			var article = new Article();
			//data = $.jStorage.get('articles['+article_id+']');
			if(!data) { return null; }
			
			var data = "{}";
			data = $.parseJSON(data);
			article.id = article_id;
			article.title = data.title;
			return article;
		}

		// ...

		Article.initialized = true;
	}
}

var app = {
	page: "read",
	last_update: -1,

	categories: ['home'],


	settings: {
		max_article_number: 10,
		is_logged_in: false
	},

	//settings: new Settings();

	initialize: function(page) {
		// init application
		// load Settings
		// fetch config data from storage
		switch(page) {
			case 'read' : var reader = new Reader(); break;
			case 'article': Article.find_by_id(article_id).show(); break;
			case 'write' : var writer = new Writer(); break;
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


	// fetch api articles
	fetchApiArticles: function(category) {
	},

	// Login

	// Settings
};