// https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
	var urlParams;
	(window.onpopstate = function () {
		var match,
			pl     = /\+/g,  // Regex for replacing addition symbol with a space
			search = /([^&=]+)=?([^&]*)/g,
			decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
			query  = window.location.search.substring(1);

		urlParams = {};
		while (match = search.exec(query))
			urlParams[decode(match[1])] = decode(match[2]);
	})();

// https://stackoverflow.com/questions/12460378/how-to-get-json-from-url-in-javascript
	var getJSON = function(url, callback) {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', url, true);
		xhr.responseType = 'json';
		xhr.onload = function() {
			var status = xhr.status;
			if (status === 200) {
				callback(null, xhr.response);
			} else {
				callback(status, xhr.response);
			}
		};
		xhr.send();
	};

// https://stackoverflow.com/questions/1573053/javascript-function-to-convert-color-names-to-hex-codes
	function namedColorToColor(color){
		var ctx = document.createElement('canvas').getContext('2d');
		ctx.fillStyle = color;
		if(ctx.fillStyle === "#000000" && color.toLowerCase() !== "black"){
			return false;
		}else{
			return ctx.fillStyle;
		}
	}

// mine
	build_tpl = function(templateid, replacerules = {}){
		// create a wrapper element so we can do a replace on innerHTML
		var temp = document.createElement("div");
		temp.append(document.importNode(document.getElementById(templateid).content, true));

		// replace instances of ::replacetarget:: by replacerule
		for(let target in replacerules){

			temp.innerHTML = temp.innerHTML.replace("[["+target+"]]", replacerules[target]);

		};

		// loop through subtemplates and also build them
		for(let subtemplate of temp.querySelectorAll("subtpl")){

			subtemplate.parentNode.replaceChild( build_tpl(subtemplate.getAttribute("tplid"), replacerules), subtemplate);

		}

		// 
		return temp.firstElementChild;
	}
