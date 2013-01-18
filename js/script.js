function Reader() {
	this.category = "";
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
		this.categories['home'].loadOnline();
		this.category = this.categories['home'].id;

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

		// show articles. @todo : Show Category (title + link seleted in menu + show articles)
		console.log(this.categories[this.category]);
		console.log(this.categories[this.category].fetch_url);
		this.categories[this.category].showArticles();

		//this.rebuildCategories();
		this.setListeners();
		Reader.initialized = true;
	}
	
}

function Category(){
	this.id;
	this.name;
	this.articles = [];
	this.fetch_url;
	//this.fetch_url = "offline_api/articles/home.json";

	if (typeof Category.initialized == "undefined" ) {
		Category.prototype.loadOnline = function () {
			// Fetch 1 category and its articles
			// @todo : check error like no connexion
			var articles_ids = [];
			$(this.articles).each(function(i, art) {
				articles_ids.push(art.id);
			});

			var currentCategory = this;

			$.ajax(this.fetch_url, {
				dataType: 'json', // data will be parsed in json automagically
				type: "GET",
				data: articles_ids,
				cache: false,
				success: function(json) {
					if(json.id) {
						// update list for given category
						/*console.log(this);
						$(this).each(function(i, cat) {
							//alert("cat.id : " + cat.id);
							if(cat.id == json.id) {
								if(json.name)
									cat.name = json.name;
								if(json.weight)
									cat.weight = json.weight;
								if(json.datetime)
									cat.datetime = json.datetime;*/

								// method updateArticles from the category
								/*$(json.articles).each(function(i, art) {
									articles[art.id] = new Article();
									articles[art.id].id = art.id;
									articles[art.id].title = art.title;
									articles[art.id].subhead = art.subhead;
									articles[art.id].picture = art.picture;
									articles[art.id].datetime = art.datetime;
									console.log(articles[art.id]);
								});*/
								currentCategory.articles = json.articles;
								//console.log(currentCategory.articles);	
								// Update page
								//app.updateHome();
							//} else { alert("error"); app.errorOrNoInternet(); }
						//});
						//app.last_update = Date.now();
					}
				},
				error: function() {
					app.errorOrNoInternet();
				}
			});
		};

		// Storage fetch
		Category.prototype.loadLocal = function() {
			if (this.id == "home") {
				this.name = "Home";
				this.articles = [];
			} else {
				var category = $.jStorage.get('categories['+this.id+']');
				if(category) {
					this.name = category.name;
					this.articles = category.articles;
				}
			}
		};

		// Save in local storage for faster refresh
		Category.prototype.saveLocal = function() {
			$.jStorage.set('categories['+this.id+']')
		};

		// Linked to interface
		Category.prototype.refresh = function() {
			this.loadLocal();
			if(app.is_connected()) {
				this.loadOnline();
			}
			this.saveLocal();
		};

		Category.prototype.showArticles = function () {
			//alert(this.articles);
			$(this.articles).each(function (i, art) {
				art.showItem();
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

	if(typeof Article.initialized == "undefined") {
		// Print article in html
		Article.prototype.show = function () {
			if(!this.picture) {
				$('#article .article_img').parent().hide();
			} else {
				$('#article .article_img').attr('href', this.picture);
			}
			$('#article .article_body').html(this.body);
			$('#article .article_title').text(this.title);
			$('#article .article_author').text(this.author);

		};

		Article.prototype.refresh = function () {

		};

		Article.prototype.post = function () {

		};

		Article.prototype.share = function () {

		};

		Article.prototype.loadLocal = function (id) {

			var fakeData = "{\"id\":"+id+", \"title\":\"Titre\", \"author\":\"Jean-Michel\", \"body\":\"<p>Do you see any Teletubbies in here? Do you see a slender plastic tag clipped to my shirt with my name printed on it? Do you see a little Asian child with a blank expression on his face sitting outside on a mechanical helicopter that shakes when you put quarters in it? No? Well, that's what you see at a toy store. And you must think you're in a toy store, because you're here shopping for an infant named Jeb. </p><p>Well, the way they make shows is, they make one show. That show's called a pilot. Then they show that show to the people who make shows, and on the strength of that one show they decide if they're going to make more shows. Some pilots get picked and become television programs. Some don't, become nothing. She starred in one of the ones that became nothing. </p><p>Look, just because I don't be givin' no man a foot massage don't make it right for Marsellus to throw Antwone into a glass motherfuckin' house, fuckin' up the way the nigger talks. Motherfucker do that shit to me, he better paralyze my ass, 'cause I'll kill the motherfucker, know what I'm sayin'? </p><p>You think water moves fast? You should see ice. It moves like it has a mind. Like it knows it killed the world once and got a taste for murder. After the avalanche, it took us a week to climb out. Now, I don't know exactly when we turned on each other, but I know that seven of us survived the slide... and only five made it out. Now we took an oath, that I'm breaking now. We said we'd say it was the snow that killed the other two, but it wasn't. Nature is lethal but it doesn't hold a candle to man. </p><p>Your bones don't break, mine do. That's clear. Your cells react to bacteria and viruses differently than mine. You don't get sick, I do. That's also clear. But for some reason, you and I react the exact same way to water. We swallow it too fast, we choke. We get some in our lungs, we drown. However unreal it may seem, we are connected, you and I. We're on the same curve, just on opposite ends. </p>\"}";
			$.jStorage.set('articles['+article_id+']', fakeData);

			// For Debug Use Only
			var article = $.jStorage.get('articles['+article_id+']');

			article = $.parseJSON(article);
			this.id = article.id;
			this.title = article.title;
			this.author = article.author;
			this.body = article.body;
		};

		Article.prototype.showItem = function() {
			alert("showItem : " + this);
			$li = $('<li>');
			$a = $('<a>', {
				href: "article.html?id="+this.id,
				class: "articleBtn",
				text: this.title
			});
			$a.appendTo($li);
			$li.appendTo('#reader #articles');
		};

		// ...

		Article.initialized = true;
	}
}

var app = {
	page: null,
	last_update: -1,

	settings: {
		max_article_number: 10
	},

	categories: ['home'],

	//settings: new Settings();

	initialize: function(page) {
		// init application
		// load Settings
		// fetch config data from storage

		switch(page) {
			case 'read' : var reader = new Reader(); break;
			case 'article':
				var article = new Article();
				article.loadLocal(213546);
				article.show(); break;
			case 'write' : var writer = new Writer(); break;
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

	// Login

	// Settings
};