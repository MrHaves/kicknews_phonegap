function Categorie(){

	var id;
	var title;
	var articles = [];
	var fetchURL;

}

function Article(){

	var id;
	var title;
	var subhead;
	var picture;
	var datetime;

}

function Settings(){
	var max_article_number = 10;
	var is_logged_in = false;

}

var app = {
	is_connected: false,
	currentCategory: "home",
	nextCategory: "home",
	last_update: -1,

	//settings: new Settings();

	initialize: function() {
		// init application
		// fetch config data from storage

		// init page
		this.loadArticles();

		$(categories).each(function(i, cat) {
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
		//$('#categories').listview('refresh');

		this.setListeners();
	},

	setListeners: function() {
		// home

		$('#read .fetchBtn').click(this.loadArticles);
		$(document).bind('pagechange', function(event, data){
			if(data.toPage.attr('id') == "article")
				app.showArticle(event);
		});

		// for each page, connect interface to interactivity
	},

	showArticle: function(event) {
		var article = categories[0].articles[0];
		$('#article div[data-role="content"]').empty();

		if(article.picture == null) {
			$('<div style="width:100%; height:100px; position:relative; background-color:#fbfbfb; border:1px solid #b8b8b8;"><img src="http://codiqa.com/static/images/v2/image.png" alt="image" style="position:absolute; top:50%; left:50%; margin-left:-16px; margin-top:-18px"></div>').appendTo('#article div[data-role="content"]');
		}
		else{
			$('<img src="'+ article.picture +'" alt="image" style="position:absolute; top:50%; left:50%; margin-left:-16px; margin-top:-18px">').appendTo('#article div[data-role="content"]');
		}
	    
		$('<h2>'+ article.title +'</h2>').appendTo('#article div[data-role="content"]');
		$('<p>'+ article.subhead +'</p>').appendTo('#article div[data-role="content"]');
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
		// @todo : check error like no connexion
		$.ajax(category.fetch_url, {
			dataType: 'json', // data will be parsed in json automagically
			type: "GET",
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
	},

	// Login

	// Settings
};