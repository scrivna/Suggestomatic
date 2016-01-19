var suggestions = [];
var unchecked = [];
var checked = [];

var max_words = 100;
var checkinterval = [];

var searchTerms = [];
var negatives = [];					// negative terms
var suggestions_negative = [];	// suggestions that have negative terms
var running = false;
var engines = {
	google_com: false,
	google_couk: false,
	google_fr: false,
	google_es: false,
	yahoo: false,
	bing: false,
	amazon: false,
	ebay: false,
	blekko: false,
	youtube: false
};


function jsonp(url){
	var script = document.createElement('script');
	script.src = url;
	document.getElementsByTagName('head')[0].appendChild(script);
}

function filter(keyword){
	if (keyword=='' || keyword==' ' || keyword.indexOf('http')>-1) return false;
	
	var res = keyword.match(/ /g);
	if (res && res.length > (max_words-1)) return false;
	
	var negatives = getNegatives();
	for (var i in negatives){
		if (keyword.indexOf(negatives[i])>-1) return false;
	}
	
	var searchterms = getSearchTerms();
	//console.log(searchterms);
	var hasOne = false;
	for (var i in searchterms){
		var str = searchterms[i].replace(/\*/, '');
		var words = str.split(' ');
		var count = 0;
		for (var j in words){
			if (keyword.indexOf(words[j])>-1) count++;
		}
		if (count==words.length) hasOne = true;
	}
	
	if (hasOne === false) return false;
	
	return true;
}

function addNewSuggestions(d){
	
	if (typeof d != 'object') return;
	
	for (var i in d){
		if (filter(d[i]) && checked.indexOf(d[i])==-1){
			checked.push(d[i]);
			suggestions.push(d[i]);
			unchecked.push([d[i],d[i].length+1]);
		}
	}
	
	for (var i in d){
		var charat = d[i].length;
		if (d[i].indexOf('*')>-1){
			charat = d[i].indexOf('*')-1;
		}
		
		var alpha = 'abcdefghijklmnopqrstuvwxyz'.split('');
		for (var j in alpha){
			var letter = ' ' + alpha[j];
			
			var newword = d[i].substr(0, charat) + letter + d[i].substr((charat+letter.length));
			newword = newword.replace(/ +/g, ' ');
			newword = newword.replace(/^\s+/,'');
			
			if (filter(newword) && checked.indexOf(newword)==-1){
				checked.push(newword);
				unchecked.push([newword,charat+2]);
			}
		}
	}
}

function getSearchTerms(){
	if (searchTerms.length==0){
		searchTerms = $('#seed_keywords').val().toLowerCase().split("\n").filter(function(el){return el.length>0});
		searchTerms = arrayDedupe(searchTerms);
	}
	return searchTerms;
}
function getNegatives(){
	if (negatives.length==0){
		negatives = $('#negative_keywords').val().toLowerCase().split("\n").filter(function(el){return el.length>0});
		negatives = arrayDedupe(negatives);
	}
	return negatives;
}

function loop(){
	if (unchecked.length <= 0) return;
	
	//console.log(unchecked);
	unchecked.sort(function(a, b){
		return a[0].length - b[0].length;
	});
	
	var keyword = unchecked.shift();
	var cursor = keyword[1];
	keyword = keyword[0];
	
	//console.log('Checking: '+keyword);
	
	if (engines.google_com) 	setTimeout(function(){ getSuggestionsGoogleWildcard(keyword, cursor, '.com');	}, 100);
	if (engines.google_couk) 	setTimeout(function(){ getSuggestionsGoogleWildcard(keyword, cursor, '.co.uk');	}, 100);
	if (engines.google_fr) 		setTimeout(function(){ getSuggestionsGoogleWildcard(keyword, cursor, '.fr');	}, 100);
	if (engines.google_es) 		setTimeout(function(){ getSuggestionsGoogleWildcard(keyword, cursor, '.es');	}, 100);
	
	if (engines.youtube) 	setTimeout(function(){ getSuggestionsGoogle(keyword, 'youtube', '.com'); }, 100);
	if (engines.yahoo) 		setTimeout(function(){ getSuggestionsYahoo(keyword);					 }, 300);
	if (engines.bing) 		setTimeout(function(){ getSuggestionsBing(keyword);						 }, 500);
	if (engines.amazon) 	setTimeout(function(){ getSuggestionsAmazon(keyword);					 }, 700);
	if (engines.ebay) 		setTimeout(function(){ getSuggestionsEbay(keyword);						 }, 900);
	if (engines.blekko) 	setTimeout(function(){ getSuggestionsBlekko(keyword);					 }, 900);
}


function start(){
	if (running===true) return;
	running = true;
	
	var num_engines = 0;
	$('input[data-engine]:checked').each(function(){
		engines[$(this).attr('data-engine')] = true;
		num_engines++;
	});
	
	var interval = ((num_engines+1)*1000);
	
	//console.log(engines);
	//console.log('Loop delay: '+interval);
	
	addNewSuggestions(getSearchTerms());
	
	loop();
	
	checkinterval.push(setInterval(loop, interval));
	checkinterval.push(setInterval(showSuggestionCounts, 1000));
	checkinterval.push(setInterval(showSuggestions, 5000));
}

function stop(){
	for (var i in checkinterval){
		clearInterval(checkinterval[i]);
	}
	running = false;
	
	showSuggestions();
}

function showSuggestionCounts(){
	document.title = suggestions.length + ' found by Suggest-o-Matic';
	animateNumber('#unchecked_keywords_count', unchecked.length);
	animateNumber('#result_keywords_count', suggestions.length);
}

function showSuggestions(){
	$('#result_keywords').val(suggestions.sort().join("\n"));
}


function animateNumber(el, num){
	// Animate the element's value from x to y:
	var $el = $(el);
	$({someValue: $el.text().replace(',', '')}).animate({someValue: num}, {
	   duration: 500,
	   easing:'swing', // can be anything
	   step: function() { // called on every step
	       $el.text(commaSeparateNumber(Math.round(this.someValue)));
	   }
	});
	
	function commaSeparateNumber(val){
		while (/(\d+)(\d{3})/.test(val.toString())){
			val = val.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
		}
		return val;
	}
}

function getSuggestionsGoogleWildcard(keyword, cursor, domain){
	var url = 'https://www.google'+domain+'/s?client=chrome-omni&gs_ri=chrome-ext&xhr=t&callback=googleCallback&cp='+cursor+'&q='+encodeURIComponent(keyword);
	jsonp(url);
}

function getSuggestionsGoogle(keyword, service, domain){
	var services = {
		youtube: { client: 'youtube', ds: 'yt' },
		books: { client: 'books', ds: 'bo' },
		products: { client: 'products-cc', ds: 'sh' },
		news: { client: 'news-cc', ds: 'n' },
		images: { client: 'img', ds: 'i' },
		web: { client: 'psy', ds: '' },
		recipes: { client: 'psy', ds: 'r' }
	}
	service = services[service].ds;
	
	var url = 'http://google'+domain+'/complete/search?client=chrome&ds='+service+'&callback=googleCallback&q='+encodeURIComponent(keyword);
	jsonp(url);
}

function getSuggestionsBlekko(keyword){
	jsonp('http://blekko.com/autocomplete?query='+encodeURIComponent(keyword)+'&callback=blekkoCallback');
}

function getSuggestionsAmazon(keyword){
	jsonp('http://completion.amazon.com/search/complete?search-alias=aps&mkt=1&q='+encodeURIComponent(keyword)+'&callback=amazonCallback');
}

function getSuggestionsEbay(keyword){
	var url = 'http://anywhere.ebay.com/services/suggest/?q='+encodeURIComponent(keyword);
	url = 'http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20json%20where%20url%3D%22'+encodeURIComponent(url)+'%22&format=json&callback=ebayCallback';
	jsonp(url);
}

function getSuggestionsBing(keyword){
	var url = 'http://api.bing.com/osjson.aspx?query='+encodeURIComponent(keyword);
	url = 'http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20json%20where%20url%3D%22'+encodeURIComponent(url)+'%22&format=json&callback=bingCallback';
	jsonp(url);
}

function getSuggestionsYahoo(keyword){
	var url = 'http://sugg.us.search.yahoo.net/gossip-us-ura?droprotated=0&output=sd1&nresults=100&command='+encodeURIComponent(keyword);
	url = 'http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20json%20where%20url%3D%22'+encodeURIComponent(url)+'%22&format=json&callback=yahooCallback';
	jsonp(url);
}

function googleCallback(d){
	addNewSuggestions(d[1]);
}
function amazonCallback(d){
	addNewSuggestions(d[1]);
}
function blekkoCallback(d){
	addNewSuggestions(d['suggestions']);
}
function ebayCallback(d){
	try {
		//console.log(typeof d.query.results.json.json[1].json);
		//console.log(d.query.results.json.json[1].json);
		// ebay returns 1 result not as an array
		if (typeof d.query.results.json.json[1].json === 'object'){
			addNewSuggestions(d.query.results.json.json[1].json);
		} else {
			addNewSuggestions([d.query.results.json.json[1].json]);
		}
	} catch (e){ /*console.log('ebay error:'); console.log(e); */ }
}
function bingCallback(d){
	try {
		//console.log(d);
		addNewSuggestions(d.query.results.json.json[1].json);
	} catch (e){ /*console.log('bing error:'); console.log(e);*/}
}
function yahooCallback(d){
	try {
		var results = d.query.results.json.r;
		var phrases = [];
		for (var i in results){
			phrases.push(results[i]['k']);
		}
		//console.log(phrases);
		addNewSuggestions(phrases);
	} catch (e){ /*console.log('yahoo error:'); console.log(e);*/ }
}

function arrayDedupe(a){
	// deduplicate
	var r = {};
	for (var i in a){
		r[a[i]] = 1;
	}
	return Object.keys(r);
}

function sortObject(obj, sort){
	var sortable = [];
	var result = {};
	for (var key in obj) sortable.push([key, obj[key]])
	sortable.sort(sort);
	for (var i in sortable){
		result[sortable[i][0]] = sortable[i][1];
	}
	return result;
}

$('#stopbutton').click(function(){
	stop();
	ga('send', 'event', 'button', 'click', 'start');
});
$('#gogobutton').click(function(){
	start();
	ga('send', 'event', 'button', 'click', 'stop', suggestions.length);
	$("html, body").animate({ scrollTop: ($('#results').offset().top-100) }, 300);
});
$('#resetbutton').click(function(){
	location.reload(true);
});
$('#seed_keywords').focus();