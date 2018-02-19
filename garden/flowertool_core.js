// Classes

	class Flower{
		constructor(plant_object){
			this.plant = plant_object._PlantKey;
			this.name = plant_object._Key;
			this.color = this.name.substr(0, this.name.indexOf(" "));

			this.bells = plant_object._BellRate;

			this.growth_seconds = plant_object._SecToComplete;
			this.breed_success_rate = plant_object._BreedPosibility;

			find_seed_name:{
				for(let seed of GameDB.Seed){
					if(seed._PlantKey === this.name){
						this.seed_name = seed._Key;
						this.seed_bells = seed._BellRate;
						break find_seed_name;
					}
				}
				this.seed_name = false;
				this.seed_bells = false;
			}

			this.genepair_list = new Set();
		}
	}

	class FlowerGene{
		constructor(fg_object){
			this.plant = fg_object._FlowerKey;
			this.name = fg_object._GeneKey;
			this.color = this.name.substr(0, this.name.indexOf(" "));

			this.dominance = fg_object._Dominance;
			this.weight = fg_object._InheritPriority;

			this.id = fg_object.ID;
		}
	}

	class FlowerGenePair{
		constructor(plant, gene1, gene2, flower){
			this.genes = [gene1, gene2];
			this.gene1 = gene1;
			this.gene2 = gene2;

			this.plant = gene1.plant;
			this.flower = flower;
			this.color = flower.color;

			this.total_weight = gene1.weight + gene2.weight;

			this.depth = null;
		}
	}

	class FlowerMutation{
		constructor(original, result, chance){
			this.original_genepair = original;
			this.mutation_genepair = result;
			this.mutation_chance = chance/100; // expects value of 70 for 70% chance
		}
	}


	class FlowerBreedPair{
		constructor(genepair1, genepair2){
			this.pairs = [genepair1, genepair2];
			this.pair1 = genepair1;
			this.pair2 = genepair2;
			this.genepair_results = new Map();
			this.flower_results = new Map();

			var plant = genepair1.plant;
			// ASSUMPTION: The success/failure rate is equal to the lowest of the two parents' _BreedPosibility
			var success_rate = Math.min(genepair1.flower.breed_success_rate, genepair2.flower.breed_success_rate);

			this.genepair_results.set("destroyed", 1-success_rate);
			this.flower_results.set("destroyed", 1-success_rate);

			this.clean_results = true;

			for(let i of [[0,0],[0,1],[1,0],[1,1]]){

				var pair1gene = genepair1.genes[i[0]];
				var pair2gene = genepair2.genes[i[1]];

				var result_genepair = DB[plant].genepair_lookup.get(pair1gene).get(pair2gene);

				// ASSUMPTION: _InheritPriority value is a "weight" value
				var local_chance = success_rate*(pair1gene.weight/genepair1.total_weight)*(pair2gene.weight/genepair2.total_weight);

				if(DB[plant].mutation.has(result_genepair)){
					var mutation_chance = local_chance * DB[plant].mutation.get(result_genepair).mutation_chance;
					local_chance = local_chance - mutation_chance;

					var mutation_result = DB[plant].mutation.get(result_genepair).mutation_genepair;


					if(!this.genepair_results.has(mutation_result)){
						this.genepair_results.set(mutation_result, mutation_chance);
					}else{
						this.genepair_results.set(mutation_result, mutation_chance + this.genepair_results.get(mutation_result));
					}
				}


				if(!this.genepair_results.has(result_genepair)){
					this.genepair_results.set(result_genepair, local_chance);
				}else{
					this.genepair_results.set(result_genepair, local_chance + this.genepair_results.get(result_genepair));
				}

			}

			for(let [result, chance] of this.genepair_results){
				if(typeof result !== "string"){
					if(!this.flower_results.has(result.flower)){
						this.flower_results.set( result.flower, chance);
					}else{
						this.flower_results.set( result.flower, this.flower_results.get(result.flower) + chance);
						this.clean_results = false;
					}
				}
			}

			this.pair1_color_refund_rate = (this.flower_results.has(this.pair1.color) ? this.flower_results.get(this.pair1.color) : 0);
			this.pair1_genepair_refund_rate = (this.genepair_results.has(this.pair1) ? this.genepair_results.get(this.pair1) : 0);
			this.pair2_color_refund_rate = (this.flower_results.has(this.pair2.color) ? this.flower_results.get(this.pair2.color) : 0);
			this.pair2_genepair_refund_rate = (this.genepair_results.has(this.pair2) ? this.genepair_results.get(this.pair2) : 0);
		}
	}

// Parse/Reformat Game Data

	var DB = {};
	var max_seen_depth = 0;

	function populateDB(){

		// Plants; Flowers

			for(let plantvariant of GameDB.Plant){
				// ASSUMPTION: Plant._PlantType value indicates whether breeding is possible.
				// REASON: Pansies and Tulips are set to 1. Dahlias is set to 2. Plant._Route has additional meaning beyond breeding potential.
				//
				// only add to local DB if breeding is possible.
					if(plantvariant._PlantType === 1){

						// (_PlantKey == pansy, tulip, dahlia...)
							var pkey = plantvariant._PlantKey;

						// create DB category for _PlantKey if doesn't exist
							if(!DB.hasOwnProperty(pkey)){
								DB[pkey] = {
									flower:{},
									flower_color_lookup: new Map(),
									gene:{},
									gene_color_lookup: new Map(),
									shop: new Map(),
									genepair: new Set(),
									genepair_lookup: new Map(),
									mutation: new Map(),
									breedpair: new Set(),
									breedpair_lookup: new Map()
								};
							}

						// add entry for this plant variant
							var flower = new Flower(plantvariant);
							DB[pkey].flower[plantvariant._Key] = flower;
							DB[pkey].flower_color_lookup.set(flower.color, flower);

					}

			}

		// Genes

			for(let flowergene of GameDB.FlowerGene){
				// add entry for this gene
					var gene = new FlowerGene(flowergene);
					DB[flowergene._FlowerKey].gene[flowergene._GeneKey] = gene;
					DB[flowergene._FlowerKey].gene_color_lookup.set(gene.color, gene);
			}

		// Gene Pairs

			for(let fgcolor of GameDB.FlowerGeneColor){

				var plant = fgcolor._FlowerType;
				var flower = DB[plant].flower[fgcolor._PlantKey];
				// ASSUMPTION: _RecordType == 1 always means a consistent pair of two exact genes.
				if(fgcolor.hasOwnProperty("_RecordType") && fgcolor._RecordType === 1){

					var tempgene1 = DB[plant].gene[fgcolor._GeneKey1];
					var tempgene2 = DB[plant].gene[fgcolor._GeneKey2];
					// sort genes by ID, lowest gene id first
					if(tempgene1.ID <= tempgene2.ID){
						var gene1 = tempgene1;
						var gene2 = tempgene2;
					}else{
						var gene1 = tempgene2;
						var gene2 = tempgene1;
					}

					for(let gene of [gene1, gene2]){
						if(!DB[plant].genepair_lookup.has(gene)){
							DB[plant].genepair_lookup.set(gene, new Map());
						}
					}

					var pair = new FlowerGenePair(plant, gene1, gene2, flower);

					DB[plant].genepair.add(pair);
					DB[plant].genepair_lookup.get(gene1).set(gene2, pair);
					DB[plant].genepair_lookup.get(gene2).set(gene1, pair);
					DB[plant].flower[flower.name].genepair_list.add(pair);

				}else{
					// standard gene dominance

					var gene1 = DB[plant].gene[fgcolor._GeneKey1];

					for(let gene2 in DB[fgcolor._FlowerType].gene){
						gene2 = DB[plant].gene[gene2];

						// only assign if dominance is ordered correctly or the genes are the same
						if(gene1.dominance > gene2.dominance || gene1 === gene2){

							for(let gene of [gene1, gene2]){
								if(!DB[plant].genepair_lookup.has(gene)){
									DB[plant].genepair_lookup.set(gene, new Map());
								}
							}

							var pair = new FlowerGenePair(plant, gene1, gene2, flower);
							
							DB[plant].genepair.add(pair);
							DB[plant].genepair_lookup.get(gene1).set(gene2, pair);
							DB[plant].genepair_lookup.get(gene2).set(gene1, pair);
							DB[plant].flower[flower.name].genepair_list.add(pair);
						}
					}

				}
			}

		// Shop

			for(let storeseed of GameDB.Shop){

				// ASSUMPTION: _Category marks seasonal items
				if(!storeseed.hasOwnProperty("_Category")){
					// identify seed
					identify_plant:{

						for(let plant in DB){
							for(let flower in DB[plant].flower){

								if(storeseed._SeedKey === DB[plant].flower[flower].seed_name){
									DB[plant].shop.set(
										DB[plant].genepair_lookup.get(DB[plant].gene[storeseed._Gene1Key]).get(DB[plant].gene[storeseed._Gene2Key]), 
									storeseed._BellRate);
									break identify_plant;
								}
							}
						}
					}

				}
			}

		// Mutations

			for(let fmutation of GameDB.FlowerMutations){
				var plant = fmutation._FlowerKey;

				var original = DB[plant].genepair_lookup.get(
					DB[plant].gene[fmutation._Gene1Key]
				).get(
					DB[plant].gene[fmutation._Gene2Key]
				);

				var result = DB[plant].genepair_lookup.get(
					DB[plant].gene[fmutation._FinalGene1Key]
				).get(
					DB[plant].gene[fmutation._FinalGene2Key]
				);

				DB[plant].mutation.set(original, new FlowerMutation(original, result, fmutation._MutationProbability));
			}

		// BreedMaps

			for(let plant in DB){
				var remaining_pairs = new Set([...DB[plant].genepair]);

				for(let pair1 of DB[plant].genepair){

					for(let pair2 of remaining_pairs){
						var fbpair = new FlowerBreedPair(pair1, pair2);
						DB[plant].breedpair.add(fbpair);


						for(let pair of [pair1, pair2]){
							if(!DB[plant].breedpair_lookup.has(pair)){
								DB[plant].breedpair_lookup.set(pair, new Map());
							}
						}

						DB[plant].breedpair_lookup.get(pair1).set(pair2, fbpair);
						DB[plant].breedpair_lookup.get(pair2).set(pair1, fbpair);
					}

					// remove after so that we pair it against itself
					remaining_pairs.delete(pair1);
				} 
			}

	// Breed Depths

		max_seen_depth = 0;

		for(let plant in DB){

			var unassigned = new Set([...DB[plant].genepair]);
			var batch = new Set();

			for(let [shopgenepair, price] of DB[plant].shop){
				shopgenepair.depth = 0;
				batch.add(shopgenepair);
				unassigned.delete(shopgenepair);

			}

			var max_depth = 10;
			var depth = 1;

			while(unassigned.size > 0 && depth <= max_depth){
				var new_batch = new Set();

				for(let gp1 of batch){
					for(let gp2 of DB[plant].genepair){
						for(let [result, chance] of DB[plant].breedpair_lookup.get(gp1).get(gp2).genepair_results){
							if(typeof result !== "string" && unassigned.has(result)){
								result.depth = depth;
								new_batch.add(result);
								unassigned.delete(result);
							}
						}
					}
				}
				max_seen_depth = depth;

				depth++;

				batch = new_batch;

			}

		}
	}

// Helper Funcs

	var color_to_max = new Map([
		["b","black"],
		["c","coral"],
		["d","gold"],
		["i","purple"],
		["o","orange"],
		["p","pink"],
		["r","red"],
		["u","blue"],
		["w","white"],
		["x","rainbow"],
		["y","yellow"]
	]);

	var color_to_min = new Map();

	for(let c of color_to_max){
		color_to_min.set(c[1], c[0]);
	}

	function parseColor(str){
		if(str.length === 1){
			if(color_to_max.has(str)){
				return color_to_max.get(str);
			}
		}
		else if(str.length === 3 && str.indexOf("-") === 1){
			var split = str.split("-");
			if(color_to_max.has(split[0]) && color_to_max.has(split[1])){
				return color_to_max.get(split[0])+"-"+color_to_max.get(split[1]);
			}
		}
		return str;
	}

	function shortenColor(str){
		if(color_to_min.has(str)){
			return color_to_min.get(str);
		}
		else if(str.indexOf("-") > -1){
			var split = str.split("-");
			if(color_to_min.has(split[0]) && color_to_min.has(split[1])){
				return color_to_min.get(split[0])+"-"+color_to_min.get(split[1]);
			}
		}
		return str;
	}

	function flower(g){
		// expects string
		if(g.indexOf(" ") === -1){
			// color
			return DB[activeplant].flower_color_lookup.get(g);
		}else{
			// flower name
			return DB[activeplant].flower[g];
		}
	}

	function gene(g){
		// expects string
		if(g.indexOf("gene") === -1){
			// color
			return DB[activeplant].gene_color_lookup.get(g);
		}else{
			// gene name
			return DB[activeplant].gene[g];
		}
	}

	function genepair(a, b){
		// expects strings or FlowerGene objects
		if(typeof a === "string"){
			a = gene(a);
		}
		if(typeof b === "string"){
			b = gene(b);
		}
		return DB[activeplant].genepair_lookup.get(a).get(b);
	}

	function breedpair(a, b){
		// expects arrays or FlowerGenePair objects
		if(Array.isArray(a)){
			a = genepair(a[0],a[1]);
		}
		if(Array.isArray(b)){
			b = genepair(b[0],b[1]);
		}
		return DB[activeplant].breedpair_lookup.get(a).get(b);
	}

