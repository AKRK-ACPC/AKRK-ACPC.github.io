// sort functions
	function sort_by_weight(a,b){
		if(a[1] < b[1]){
			return 1;
		}
		if(a[1] > b[1]){
			return -1;
		}
		return 0;
	}

	function sort__flowers__by_price_then_az(a,b){
		if(a.bells < b.bells){
			return -1;
		}
		if(a.bells > b.bells){
			return 1;
		}
		if(a.name < b.name){
			return -1;
		}
		if(a.ame > b.name){
			return 1;
		}
		return 0;
	}
	function sort__genepairs__by_dominance_then_depth(a,b){
		var a_dom = a.gene1.dominance + a.gene2.dominance;
		var b_dom = b.gene1.dominance + b.gene2.dominance;
		if(a_dom < b_dom){
			return 1;
		}
		if(a_dom > b_dom){
			return -1;
		}
		if(a.depth < b.depth){
			return -1;
		}
		if(a.depth > b.depth){
			return 1;
		}
		return 0;
	}

// helper functions


	// This checks, for a list of objects in set_match, whether or not result_map has a matching key.
		function checkBPResultMapForSetMatch(result_map, set_match){
			for(let match_item of set_match){
				if(result_map.has(match_item)){
					return true;
				}
			}
			return false;
		}

// hash management functions

	function toShortcode(opt,obj){
		if(opt === "selectedpairs"){
			var out = "";
			for(let [bp, numTimes] in obj){

			}
		}
	}

	function fromShortcode(opt,shortcode){

		if(opt === "selectedpairs"){
			//selectedpairs:(r/y)+(y/b)=30,(y/b)+(b/b)=50;
			var pair_list = shortcode.split(",");
			var bp_qty_map = new Map();
			for(let pair of pair_list){
				pair = pair.split("=");
				var numTimes = parseInt(pair[1]);
				pair = pair[0].split("+");
				var bp = [];

				for(let gp of pair){
					gp = gp.replace(/[\(\)]/g,"").split("/");
					gp = genepair(parseColor(gp[0]),parseColor(gp[1]));
					bp.push(gp);
				}

				bp = breedpair(bp[0],bp[1]);
				bp_qty_map.set(bp,numTimes);
			}
			console.log(bp_qty_map);
		}
		if(opt === "searchoption"){

		}
	}

	function parseHash(){
		var optlist = {};
		for(let opt of window.location.hash.substr(1).split(";")){
			opt = opt.split(":");

			optlist[opt[0]] = opt[1];
		}
		if(last_urlhash.mode !== optlist.mode){
			activeplant = optlist.mode;
			document.getElementById("set_active_plant").value = activeplant;
			// clear page, reload everything
			buildSearchOptionHtml();
			console.log("changed");
		}
		if(last_urlhash.selectedpairs !== last_urlhash.selectedpairs){
			// up
		}
		console.log(optlist);
	};


	function setHash(mode = false,selectedpairs = false,searchoption = false){
		var output = "mode:";
		if(mode === false){
			output += last_urlhash.mode;
		}
		else{
			output += mode;
			last_urlhash.mode = mode;
		}
		output += ";selectedpairs=";
		if(selectedpairs === false){
			output += last_urlhash.selectedpairs;
		}
		else{
			output += selectedpairs;
			last_urlhash.selectedpairs = selectedpairs;
		}
		output += ";searchoption=";
		if(searchoption === false){
			output += last_urlhash.searchoption;
		}
		else{
			output += searchoption;
			last_urlhash.searchoption = searchoption;
		}
		window.location.hash = output;
	}

// render functions

	function buildSearchOptionHtml(){
		var target = document.getElementById("search_options_flower_table");
		target.innerHTML = "";
		for(let f_obj of Object.values(DB[activeplant].flower).sort(sort__flowers__by_price_then_az)){

			var flower_group = build_tpl("tpl_flower_group",{flower_color:f_obj.color});
			flower_group.querySelector(".flower_group_label").addEventListener("click",function(){
				var active_count = 0;
				for(let elem of this.nextElementSibling.children){
					if(elem.classList.contains("active_filter")){
						active_count++;
					}
				}
				if(active_count < this.nextElementSibling.children.length){
					for(let elem of this.nextElementSibling.children){
						SearchOption.results.require_genepair.add(elem.linked_object);
						elem.classList.add("active_filter");
					}
				}
				else{
					for(let elem of this.nextElementSibling.children){
						SearchOption.results.require_genepair.delete(elem.linked_object);
						elem.classList.remove("active_filter");
					}
				}
				if(SearchOption.results.require_genepair.size === 0){
					document.getElementById("search_options_flower_table").classList.remove("filter_enabled");
				}else{
					document.getElementById("search_options_flower_table").classList.add("filter_enabled");
				}
				applySearchOptions();
			});
			for(let gp of [...f_obj.genepair_list].sort(sort__genepairs__by_dominance_then_depth)){
				var group_child = build_tpl(
					"tpl_flower_group_child",
					{
						gene_1_color: gp.gene1.color,
						gene_2_color: gp.gene2.color,
						gene_1_name: gp.gene1.name,
						gene_2_name: gp.gene2.name
					}
				);
				group_child.linked_object = gp;
				group_child.addEventListener("click",function(){
					if(!SearchOption.results.require_genepair.has(this.linked_object)){
						SearchOption.results.require_genepair.add(this.linked_object);
						this.classList.add("active_filter");
					}else{
						SearchOption.results.require_genepair.delete(this.linked_object);
						this.classList.remove("active_filter");
					}
					if(SearchOption.results.require_genepair.size === 0){
						document.getElementById("search_options_flower_table").classList.remove("filter_enabled");
					}else{
						document.getElementById("search_options_flower_table").classList.add("filter_enabled");
					}
					applySearchOptions();
				});
				flower_group.querySelector(".flower_group_children").append(group_child);
			}
			target.append(flower_group);
		}
	}

	function buildBreedpairHtml(bp){
		var parents = [bp.pair1, bp.pair2].sort(function(a,b){
			if(a.depth > b.depth){
				return 1;
			}
			if(a.depth < b.depth){
				return -1;
			}
			return 0;
		});
		return "<div>"+parents[0].gene1.color+"/"+parents[0].gene2.color+" + "+parents[1].gene1.color+"/"+parents[1].gene2.color+"</div>";
	}

// environment variables
	// last set hashes
		var last_urlhash = {
			mode:"",
			searchoption:"",
			selectedpairs:""
		};

	// active plant
		var activeplant = false;

	// The structure is [ breedpair => [ in_hand_genepair, qty_to_perform ] ]
		var Selection = new Map();

	// Search
		var SearchOption = {
			parents:{
				require_inhand_genepair:false,
				max_inhand_gendepth:0
			},
			results:{
				require_clean:false,
				require_genepair:new Set()
			}
		}
		//new Map();

	// Sort
		var SortOption = {


		};


	// search results
		var search_results = {
			full: new Set(),
			sorted: [],

		}

// core

	function initUI(){
		for(let i = 0; i <= max_seen_depth; i++){
			document.getElementById("max_inhand_gendepth").innerHTML += "<option>"+i+"</option>";
		}

		// generate default colors & gradients
			// explanation:
			//		I do this so that when future flowers get added, if I haven't manually set a 
			//		color for the flower/gene color names in the CSS, it can fall back to
			//		this generated color list and still benefit from visually distinct colors.
			//
			//		It uses the namedColorToColor function from common.js to attempt to draw
			//		pixels to canvas; if a string is a valid color name, it will draw with that
			//		color and then read the pixels back as a hex string. (if it's not valid string,
			//		it uses #000 instead, and we detect that and return false)
			//
			//		This also attempts to make gradients from "hyphenated-color" names.
			//
			//		If it fails to find a color, it picks the next color from "default_color_pool"
			//		and uses it to at least be visually distinct, if not accurately colored.

			var automatic_color_css = "";
			
			// the color pool is a list of standard web colors 
			default_color_pool = [/* Teal */"#008080", /*ForestGreen*/"#228b22", /*Silver*/"#c0c0c0", /*SlateGray*/"#708090", /*SaddleBrown*/"#8b4513", /*LimeGreen*/"#32cd32", /* Aquamarine */"#7fffd4",  /*MediumOrchid*/"#ba55d3", /*OliveDrab*/"#6b8e23", /*MediumVioletRed*/"#C71585"];

			var gene_color_list = new Map();
			var flower_color_list = new Map();

			for(let plant in DB){
				for(let gene of Object.values(DB[plant].gene)){
					if(!gene_color_list.has(gene.color)){
						var colorcode = namedColorToColor(gene.color);
						if(colorcode !== false){
							// if not false, assign color name to colorcode
							gene_color_list.set(gene.color, colorcode);
							if(default_color_pool.indexOf(colorcode) > -1){
								default_color_pool.splice(default_color_pool.indexOf(colorcode), 1);
							}
						}
						else{
							// color indeterminate; use next available default color
							
						}
					}
				}
				for(let flower of Object.values(DB[plant].flower)){
					if(!flower_color_list.has(flower.color)){
						if(gene_color_list.has(flower.color)){
							// if we already assigned this color for genes, use it for flowers too
							flower_color_list.set(flower.color, gene_color_list.get(flower.color));
						}
						else{
							var colorcode = namedColorToColor(flower.color);
							if(colorcode !== false){
								// if not false, assign color name to colorcode
								flower_color_list.set(flower.color, colorcode);
								if(default_color_pool.indexOf(colorcode) > -1){
									default_color_pool.splice(default_color_pool.indexOf(colorcode), 1);
								}
							}
							else if(flower.color.indexOf("-") > -1){
								// if flower color is hyphenated, split it and attempt both colors.
								var split = flower.color.split("-");
								split[0] = namedColorToColor(split[0]);
								split[1] = namedColorToColor(split[1]);
								if(split[0] !== false && split[1] !== false){
									// if both are colors, assign color name to gradient
									//GRADIENT
									flower_color_list.set(flower.color, "linear-gradient(0deg, "+split[0]+" 0%, "+split[1]+" 100%)");
									if(default_color_pool.indexOf(split[0]) > -1){
										default_color_pool.splice(default_color_pool.indexOf(split[0]), 1);
									}
									if(default_color_pool.indexOf(split[1]) > -1){
										default_color_pool.splice(default_color_pool.indexOf(split[1]), 1);
									}
								}
								else{
									// color indeterminate; use next available default color
									console.log("warning: color indeterminate: "+flower.color);
								}
							}
							else if(flower.genepair_list.size === 1){
								// if flower only has one genepair possible, create a gradient of its genes
								//GRADIENT
								flower_color_list.set(flower.color, "linear-gradient(0deg, "+gene_color_list.get([...flower.genepair_list][0].gene1.color)+" 0%, "+gene_color_list.get([...flower.genepair_list][0].gene2.color)+" 100%)");
							}
							else{
								// color indeterminate; use next available default color
								console.log("warning: color indeterminate: "+flower.color);
							}
						}
					}
				}
			}

			var css_output = "";

			for(let [colorname, colorcode] of gene_color_list){
				css_output += ".gene."+colorname+"{color:"+colorcode+"}\n";
			}
			for(let [colorname, bgcolor] of flower_color_list){
				css_output += ".flower."+colorname+"{background:"+bgcolor+"}\n";
			}
			document.getElementById("auto_generated_colors").innerHTML = css_output;
			/*
			for(let [name, hex] of [...gene_color_list,...flower_color_list]){
				console.log("%c"+name, "background:"+hex);
			}
			console.log(document.getElementById("auto_generated_colors").innerHTML);
			*/


		document.getElementById("max_inhand_gendepth").addEventListener("input",function(e){
			SearchOption.parents.max_inhand_gendepth = parseInt(this.value);
			applySearchOptions();
		});

		for(let plant in DB){
			document.getElementById("set_active_plant").innerHTML += "<option>"+plant+"</option>";
		}

		document.getElementById("set_active_plant").addEventListener("input",function(e){
			if(activeplant !== this.value){
				activeplant = this.value;
				setHash(this.value,"","");
				uiReset();
			}
		});

		document.getElementById("require_clean").addEventListener("change",function(e){
			SearchOption.results.require_clean = this.checked;
			applySearchOptions();
		});

		window.addEventListener("hashchange", parseHash);

		parseHash();

		// Render
		uiReset();
		applySearchOptions();


	}

	function uiReset(){
		SearchOptionReset();
		buildSearchOptionHtml();
		applySearchOptions();
	}

	function SearchOptionReset(){
		document.getElementById("search_options_flower_table").classList.remove("filter_enabled");
		SearchOption = {
			parents:{
				require_inhand_genepair:false,
				max_inhand_gendepth:0
			},
			results:{
				require_clean:false,
				require_genepair:new Set()
			}
		}
	}

	function applySearchOptions(){
		runSearch();
	}


	// Apply Search Options
		// This is what does the search and filters down the results.
		function runSearch(){
			search_results.full = new Map();
			for(let bp of DB[activeplant].breedpair){
				if(
					// parent specific genepair
					(
						SearchOption.parents.require_inhand_genepair === false ||
						SearchOption.parents.require_inhand_genepair === bp.pair1 ||
						SearchOption.parents.require_inhand_genepair === bp.pair2
					) &&
					// ensure at least one parent has a depth less than the maximum
					(
						bp.pair1.depth <= SearchOption.parents.max_inhand_gendepth ||
						bp.pair2.depth <= SearchOption.parents.max_inhand_gendepth
					) &&
					// clean results option
					(
						SearchOption.results.require_clean === false || 
						(SearchOption.results.require_clean === true && bp.clean_results === true)
					) &&
					// genepair requirement
					(
						SearchOption.results.require_genepair.size === 0 ||
						checkBPResultMapForSetMatch(bp.genepair_results, SearchOption.results.require_genepair)
					) &&
					// ensure breedpair is not in active selection
					!Selection.has(bp)
				){
					var weight = 0;
					for(let [result, chance] of bp.genepair_results){
						if(SearchOption.results.require_genepair.has(result)){
							weight+=chance;
						}
					}
					search_results.full.set(bp, weight);
				}
			}
			search_results.sorted = [...search_results.full].sort(sort_by_weight);
			document.getElementById("search_results").innerHTML = "";
			for(let [res, weight] of search_results.sorted){
				var row = build_tpl("tpl_bp_row");
				row.querySelector(".parent_1").append(build_tpl("tpl_genepair",{
					flower:activeplant,
					flower_color: res.pair1.color,
					gene_1_color: res.pair1.gene1.color,
					gene_2_color: res.pair1.gene2.color
				}));
				row.querySelector(".parent_2").append(build_tpl("tpl_genepair",{
					flower:activeplant,
					flower_color: res.pair2.color,
					gene_1_color: res.pair2.gene1.color,
					gene_2_color: res.pair2.gene2.color
				}));

				var flowers = new Map();
				for(let [flower, chance] of res.flower_results){
					var percentformat = (Math.round(chance*1000)/10)+"%";
					var flower_bar_dom = build_tpl("tpl_color_result_bar",{
						percent_chance:percentformat,
						width:percentformat,
						colorname:(typeof flower.color !== "undefined" ? flower.color : "destroyed")
					})
					flowers.set(
						flower,
						flower_bar_dom
					);
					row.querySelector(".bp_result_list").append(flower_bar_dom);
				}
				for(let [genepair, chance] of res.genepair_results){
					if(typeof genepair !== "string"){
						var percentformat = (Math.round(chance*1000)/10)+"%";
						flowers.get(genepair.flower).querySelector(".color_result_bar_genepair_wrapper").append(
							build_tpl("tpl_genepair_result_bar",{
								percent_chance:percentformat,
								width:(chance/res.flower_results.get(genepair.flower)*100)+"%",
								colorname:genepair.gene2.color,
								gene_1_color:genepair.gene1.color,
								gene_2_color:genepair.gene2.color,
								gene_1_name:genepair.gene1.name,
								gene_2_name:genepair.gene2.name,
								flower:activeplant,
								flower_color:genepair.color
							})
						);
					}else{
						flowers.get("destroyed").querySelector(".color_result_bar_genepair_wrapper").append(
							build_tpl("tpl_genepair_result_bar",{
								percent_chance:"",
								width:"100%",
								colorname:"destroyed",
								flower:activeplant
							})
						);
					}
				}

				document.getElementById("search_results").append(row);
				// document.getElementById("search_results").innerHTML += buildBreedpairHtml(res);
			}
		}
