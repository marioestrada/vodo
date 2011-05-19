$(function()
{
	App.init();
});

var App = {
	jsonp_rss: 'http://pipes.yahoo.com/pipes/pipe.run?_id=f42c711ab0e64056fd200b38ad98e102&_render=json',
	jsonp_rss_test: 'http://10.0.1.2/mario2/static/vodo/test.json.php',
	rss: 'http://vodo.net/feeds/public',
	list: null, content: null, filter: null,
	
	TemplateHelper: {
		parseDate: function(date)
		{
			return prettyDate(this.getDate(date));
		},
		formatDate: function(date)
		{
			return dateFormat(this.getDate(date), 'mmmm dS, h:MM:ss TT');
		},
		getDate: function(date)
		{
			date = date.split(' ');
			date = date[0].split('-');
			time = date[3].split(':');
			
			return new Date(date[0], date[1] - 1, date[2], time[0], time[1], time[2]);
		},
		parseDuration: function(seconds)
		{
			if(!seconds)
				return false;
			
			seconds = Math.round(seconds);
			var res_seconds = (seconds % 60);
			res_seconds = res_seconds < 10 ? '0' + res_seconds : res_seconds;
			return Math.round(seconds / 60) + ':' + res_seconds;
		},
		capitalize: function(string)
		{
		    return string.charAt(0).toUpperCase() + string.slice(1);
		}
	},
	
	init: function()
	{
		this.list = $('#list');
		this.filter = $('#item_filter');
		this.content = $('#content');
		this.bindEvents();
		this.loadRss();
	},
	
	loadRss: function()
	{
		$.ajax(
			this.jsonp_rss,
			{
				dataType: 'jsonp',
				jsonp: '_callback',
				jsonpCallbackString: 'myfunction',
				beforeSend: function()
				{
					App.filter.attr('disabled', 'disabled');
				},
				success: function(data)
				{
					data = data.value.items[0] || null;
					
					App.list.html('');
					if(data)
					{
						App.filter.removeAttr('disabled');
						
						for(i = 0; i < data.entry.length; i++)
						{
							data.entry[i]._thumbnail = data.entry[i]['media:thumbnail'];
							data.entry[i].json_string = JSON.stringify(data.entry[i]);
						}
						
						$("#list_item_template").tmpl(data.entry, App.TemplateHelper).appendTo('#list');
						App.list.find('dl:first').trigger('click');
					}else{
						App.list.html('<p id="loading_list">Looks like the feed is down, you can try again&hellip;</p>');
					}
				},
				complete: function()
				{
					var now = new Date();
					$('#last_updated').html(now.format("mmmm dS, h:MM:ss TT"));
				}
			}
		);
	},
	
	bindEvents: function()
	{
		$('#item_filter').keyup(function(e)
		{
			if(e.keyCode == 27)
				$(this).val('');
			e.stopPropagation();
			
			var text = $(this).val().toLowerCase();
			var content;
			if(text == '')
			{
				$('dl', App.list).show();
			}else{
				$('dl', App.list).each(function()
				{
					content = $(this).text().toLowerCase();
					
					if(content.indexOf(text) >= 0)
						$(this).show();
					else
						$(this).hide();
				});
			}
		});
		
		$('html').keyup(function(e)
		{
			var selected = App.list.find('.selected');
			var elem;
			switch(e.keyCode)
			{
				case 74:
					elem = selected.next();
					break;
				case 75:
					elem = selected.prev();
			}
			if(elem)
				elem.trigger('click', [true]);
		});
		
		$(App.list).delegate('dl', 'click', function(e, do_animate)
		{
			var object = $(this).data('object');
			
			if(!$(this).hasClass('selected'))
			{
				$("#list_article_template").tmpl(object, App.TemplateHelper).appendTo('#content');
			
				App.list.find('.selected').removeClass('selected');
				$(this).addClass('selected');
				
				var old_article = App.content.find('article:not(.old):first');
				var new_article = App.content.find('article:last');
				
				$('html').css('overflow', 'hidden');
				old_article.addClass('old')
					.animate(
						{ 'margin-top': -(old_article.outerHeight() + 10)},
						500,
						function()
						{
							$(this).remove();
							$('html').css('overflow', 'auto');
						}
					);
				new_article.css('opacity', 0)
					.animate({ opacity: 1 }, 500);
				
				if(do_animate)
				{
					App.list.stop().animate({
						scrollTop: App.list.scrollTop() + $(this).offset().top - $(this).outerHeight() - 25
					}, 500);
				}
			}else{
				$('#article_' + object.id).shake(250);
			}
		});
		
		$(App.content).delegate('.next_article', 'click', function(e)
		{
			e.preventDefault();
			
			var selected = App.list.find('.selected');
				
			selected.next().trigger('click', [true]);
		});
	}
}

// Shake element
$.fn.shake = function(speed, callback) {
	if(!speed || speed <= 0){
		speed = 1000;
	}
	this.each(function(){
		$(this).css('width', $(this).width());
		var times = 2;
		var speed_iteration = speed/times;
		var property = 'marginLeft';
		var props = {one: {}, two: {}};
		props['one'][property] = '-=5';
		props['two'][property] = '+=10';
		for (var x=0; x < times; x++){
			$(this).animate(props['one'], speed_iteration/4)
				.animate(props['two'], speed_iteration/2)
				.animate(props['one'], speed_iteration/4);
		}
		
		if(typeof callback == 'function'){
			callback();
		}
	});
	return this;
};