define(["utils/levenshtein","utils/natural-sort","mvc/collection/list-collection-creator","mvc/base-mvc","utils/localization","ui/hoverhighlight"],function(a,b,c,d,e){function f(a){function b(){return c.length||(c=[new RegExp(this.filters[0]),new RegExp(this.filters[1])]),c}a=a||{},a.createPair=a.createPair||function(a){return this.debug("creating pair:",a.listA[a.indexA].name,a.listB[a.indexB].name),a=a||{},this._pair(a.listA.splice(a.indexA,1)[0],a.listB.splice(a.indexB,1)[0],{silent:!0})};var c=[];return a.preprocessMatch=a.preprocessMatch||function(a){var c=b.call(this);return _.extend(a,{matchTo:a.matchTo.name.replace(c[0],""),possible:a.possible.name.replace(c[1],"")})},function(b){this.debug("autopair _strategy ---------------------------"),b=b||{};var c,d=b.listA,e=b.listB,f=0,g={score:0,index:null},h=[];for(this.debug("starting list lens:",d.length,e.length),this.debug("bestMatch (starting):",JSON.stringify(g,null,"  "));f<d.length;){var i=d[f];for(g.score=0,c=0;c<e.length;c++){var j=e[c];if(this.debug(f+":"+i.name),this.debug(c+":"+j.name),d[f]!==e[c]&&(g=a.match.call(this,a.preprocessMatch.call(this,{matchTo:i,possible:j,index:c,bestMatch:g})),this.debug("bestMatch:",JSON.stringify(g,null,"  ")),1===g.score)){this.debug("breaking early due to perfect match");break}}var k=a.scoreThreshold.call(this);if(this.debug("scoreThreshold:",k),this.debug("bestMatch.score:",g.score),g.score>=k?(this.debug("creating pair"),h.push(a.createPair.call(this,{listA:d,indexA:f,listB:e,indexB:g.index})),this.debug("list lens now:",d.length,e.length)):f+=1,!d.length||!e.length)return h}return this.debug("paired:",JSON.stringify(h,null,"  ")),this.debug("autopair _strategy ---------------------------"),h}}function g(a){var b=a.toJSON();return k(b,{historyId:a.historyId})}var h="collections",i=Backbone.View.extend(d.LoggableMixin).extend({_logNamespace:h,tagName:"li",className:"dataset paired",initialize:function(a){this.pair=a.pair||{}},template:_.template(['<span class="forward-dataset-name flex-column"><%= pair.forward.name %></span>','<span class="pair-name-column flex-column">','<span class="pair-name"><%= pair.name %></span>',"</span>",'<span class="reverse-dataset-name flex-column"><%= pair.reverse.name %></span>'].join("")),render:function(){return this.$el.attr("draggable",!0).data("pair",this.pair).html(this.template({pair:this.pair})).addClass("flex-column-container"),this},events:{dragstart:"_dragstart",dragend:"_dragend",dragover:"_sendToParent",drop:"_sendToParent"},_dragstart:function(a){a.currentTarget.style.opacity="0.4",a.originalEvent&&(a=a.originalEvent),a.dataTransfer.effectAllowed="move",a.dataTransfer.setData("text/plain",JSON.stringify(this.pair)),this.$el.parent().trigger("pair.dragstart",[this])},_dragend:function(a){a.currentTarget.style.opacity="1.0",this.$el.parent().trigger("pair.dragend",[this])},_sendToParent:function(a){this.$el.parent().trigger(a)},toString:function(){return"PairView("+this.pair.name+")"}}),j=Backbone.View.extend(d.LoggableMixin).extend({_logNamespace:h,className:"list-of-pairs-collection-creator collection-creator flex-row-container",initialize:function(a){this.metric("PairedCollectionCreator.initialize",a),a=_.defaults(a,{datasets:[],filters:this.DEFAULT_FILTERS,automaticallyPair:!0,strategy:"lcs",matchPercentage:.9,twoPassAutopairing:!0}),this.initialList=a.datasets,this.historyId=a.historyId,this.filters=this.commonFilters[a.filters]||this.commonFilters[this.DEFAULT_FILTERS],_.isArray(a.filters)&&(this.filters=a.filters),this.automaticallyPair=a.automaticallyPair,this.strategy=this.strategies[a.strategy]||this.strategies[this.DEFAULT_STRATEGY],_.isFunction(a.strategy)&&(this.strategy=a.strategy),this.matchPercentage=a.matchPercentage,this.twoPassAutopairing=a.twoPassAutopairing,this.removeExtensions=!0,this.oncancel=a.oncancel,this.oncreate=a.oncreate,this.autoscrollDist=a.autoscrollDist||24,this.unpairedPanelHidden=!1,this.pairedPanelHidden=!1,this.$dragging=null,this.blocking=!1,this._setUpBehaviors(),this._dataSetUp()},commonFilters:{illumina:["_1","_2"],Rs:["_R1","_R2"]},DEFAULT_FILTERS:"illumina",strategies:{simple:"autopairSimple",lcs:"autopairLCS",levenshtein:"autopairLevenshtein"},DEFAULT_STRATEGY:"lcs",_dataSetUp:function(){this.paired=[],this.unpaired=[],this.selectedIds=[],this._sortInitialList(),this._ensureIds(),this.unpaired=this.initialList.slice(0),this.automaticallyPair&&(this.autoPair(),this.once("rendered:initial",function(){this.trigger("autopair")}))},_sortInitialList:function(){this._sortDatasetList(this.initialList)},_sortDatasetList:function(a){return a.sort(function(a,c){return b(a.name,c.name)}),a},_ensureIds:function(){return this.initialList.forEach(function(a){a.hasOwnProperty("id")||(a.id=_.uniqueId())}),this.initialList},_splitByFilters:function(){function a(a,b){return b.test(a.name)}var b=this.filters.map(function(a){return new RegExp(a)}),c=[[],[]];return this.unpaired.forEach(function(d){b.forEach(function(b,e){a(d,b)&&c[e].push(d)})}),c},_addToUnpaired:function(a){var c=function(d,e){if(d===e)return d;var f=Math.floor((e-d)/2)+d,g=b(a.name,this.unpaired[f].name);if(0>g)return c(d,f);if(g>0)return c(f+1,e);for(;this.unpaired[f]&&this.unpaired[f].name===a.name;)f++;return f}.bind(this);this.unpaired.splice(c(0,this.unpaired.length),0,a)},autoPair:function(a){var b=this._splitByFilters(),c=[];return this.twoPassAutopairing&&(c=this.autopairSimple({listA:b[0],listB:b[1]}),b=this._splitByFilters()),a=a||this.strategy,b=this._splitByFilters(),c=c.concat(this[a].call(this,{listA:b[0],listB:b[1]}))},autopairSimple:f({scoreThreshold:function(){return 1},match:function(a){return a=a||{},a.matchTo===a.possible?{index:a.index,score:1}:a.bestMatch}}),autopairLevenshtein:f({scoreThreshold:function(){return this.matchPercentage},match:function(b){b=b||{};var c=a(b.matchTo,b.possible),d=1-c/Math.max(b.matchTo.length,b.possible.length);return d>b.bestMatch.score?{index:b.index,score:d}:b.bestMatch}}),autopairLCS:f({scoreThreshold:function(){return this.matchPercentage},match:function(a){a=a||{};var b=this._naiveStartingAndEndingLCS(a.matchTo,a.possible).length,c=b/Math.max(a.matchTo.length,a.possible.length);return c>a.bestMatch.score?{index:a.index,score:c}:a.bestMatch}}),_naiveStartingAndEndingLCS:function(a,b){for(var c="",d="",e=0,f=0;e<a.length&&e<b.length&&a[e]===b[e];)c+=a[e],e+=1;if(e===a.length)return a;if(e===b.length)return b;for(e=a.length-1,f=b.length-1;e>=0&&f>=0&&a[e]===b[f];)d=[a[e],d].join(""),e-=1,f-=1;return c+d},_pair:function(a,b,c){c=c||{};var d=this._createPair(a,b,c.name);return this.paired.push(d),this.unpaired=_.without(this.unpaired,a,b),c.silent||this.trigger("pair:new",d),d},_createPair:function(a,b,c){if(!a||!b||a===b)throw new Error("Bad pairing: "+[JSON.stringify(a),JSON.stringify(b)]);return c=c||this._guessNameForPair(a,b),{forward:a,name:c,reverse:b}},_guessNameForPair:function(a,b,c){c=void 0!==c?c:this.removeExtensions;var d=a.name,e=b.name,f=this._naiveStartingAndEndingLCS(d.replace(this.filters[0],""),e.replace(this.filters[1],""));if(c){var g=f.lastIndexOf(".");if(g>0){var h=f.slice(g,f.length);f=f.replace(h,""),d=d.replace(h,""),e=e.replace(h,"")}}return f||d+" & "+e},_unpair:function(a,b){if(b=b||{},!a)throw new Error("Bad pair: "+JSON.stringify(a));return this.paired=_.without(this.paired,a),this._addToUnpaired(a.forward),this._addToUnpaired(a.reverse),b.silent||this.trigger("pair:unpair",[a]),a},unpairAll:function(){for(var a=[];this.paired.length;)a.push(this._unpair(this.paired[0],{silent:!0}));this.trigger("pair:unpair",a)},_pairToJSON:function(a,b){return b=b||"hda",{collection_type:"paired",src:"new_collection",name:a.name,element_identifiers:[{name:"forward",id:a.forward.id,src:b},{name:"reverse",id:a.reverse.id,src:b}]}},createList:function(a){var b=this,c=window.Galaxy&&Galaxy.options.root?Galaxy.options.root:"/",d=c+"api/histories/"+this.historyId+"/contents/dataset_collections",e={type:"dataset_collection",collection_type:"list:paired",name:_.escape(a||b.$(".collection-name").val()),element_identifiers:b.paired.map(function(a){return b._pairToJSON(a)})};return b.blocking=!0,jQuery.ajax(d,{type:"POST",contentType:"application/json",dataType:"json",data:JSON.stringify(e)}).always(function(){b.blocking=!1}).fail(function(a,c,d){b._ajaxErrHandler(a,c,d)}).done(function(a,c,d){b.trigger("collection:created",a,c,d),b.metric("collection:created",a),"function"==typeof b.oncreate&&b.oncreate.call(this,a,c,d)})},_ajaxErrHandler:function(a,b,c){this.error(a,b,c);var d=e("An error occurred while creating this collection");a&&(d+=0===a.readyState&&0===a.status?": "+e("Galaxy could not be reached and may be updating.")+e(" Try again in a few minutes."):a.responseJSON?"<br /><pre>"+JSON.stringify(a.responseJSON)+"</pre>":": "+c),creator._showAlert(d,"alert-danger")},render:function(a){return this.$el.empty().html(j.templates.main()),this._renderHeader(a),this._renderMiddle(a),this._renderFooter(a),this._addPluginComponents(),this.trigger("rendered",this),this},_renderHeader:function(){var a=this.$(".header").empty().html(j.templates.header()).find(".help-content").prepend($(j.templates.helpContent()));return this._renderFilters(),a},_renderFilters:function(){return this.$(".forward-column .column-header input").val(this.filters[0]).add(this.$(".reverse-column .column-header input").val(this.filters[1]))},_renderMiddle:function(){var a=this.$(".middle").empty().html(j.templates.middle());return this.unpairedPanelHidden?this.$(".unpaired-columns").hide():this.pairedPanelHidden&&this.$(".paired-columns").hide(),this._renderUnpaired(),this._renderPaired(),a},_renderUnpaired:function(){var a,b,c=this,d=[],f=this._splitByFilters();return this.$(".forward-column .title").text([f[0].length,e("unpaired forward")].join(" ")),this.$(".forward-column .unpaired-info").text(this._renderUnpairedDisplayStr(this.unpaired.length-f[0].length)),this.$(".reverse-column .title").text([f[1].length,e("unpaired reverse")].join(" ")),this.$(".reverse-column .unpaired-info").text(this._renderUnpairedDisplayStr(this.unpaired.length-f[1].length)),this.$(".unpaired-columns .column-datasets").empty(),this.$(".autopair-link").toggle(0!==this.unpaired.length),0===this.unpaired.length?void this._renderUnpairedEmpty():(b=f[1].map(function(a,b){return void 0!==f[0][b]&&f[0][b]!==a&&d.push(c._renderPairButton()),c._renderUnpairedDataset(a)}),a=f[0].map(function(a){return c._renderUnpairedDataset(a)}),a.length||b.length?(this.$(".unpaired-columns .forward-column .column-datasets").append(a).add(this.$(".unpaired-columns .paired-column .column-datasets").append(d)).add(this.$(".unpaired-columns .reverse-column .column-datasets").append(b)),void this._adjUnpairedOnScrollbar()):void this._renderUnpairedNotShown())},_renderUnpairedDisplayStr:function(a){return["(",a," ",e("filtered out"),")"].join("")},_renderUnpairedDataset:function(a){return $("<li/>").attr("id","dataset-"+a.id).addClass("dataset unpaired").attr("draggable",!0).addClass(a.selected?"selected":"").append($("<span/>").addClass("dataset-name").text(a.name)).data("dataset",a)},_renderPairButton:function(){return $("<li/>").addClass("dataset unpaired").append($("<span/>").addClass("dataset-name").text(e("Pair these datasets")))},_renderUnpairedEmpty:function(){var a=$('<div class="empty-message"></div>').text("("+e("no remaining unpaired datasets")+")");return this.$(".unpaired-columns .paired-column .column-datasets").empty().prepend(a),a},_renderUnpairedNotShown:function(){var a=$('<div class="empty-message"></div>').text("("+e("no datasets were found matching the current filters")+")");return this.$(".unpaired-columns .paired-column .column-datasets").empty().prepend(a),a},_adjUnpairedOnScrollbar:function(){var a=this.$(".unpaired-columns").last(),b=this.$(".unpaired-columns .reverse-column .dataset").first();if(b.size()){var c=a.offset().left+a.outerWidth(),d=b.offset().left+b.outerWidth(),e=Math.floor(c)-Math.floor(d);this.$(".unpaired-columns .forward-column").css("margin-left",e>0?e:0)}},_renderPaired:function(){if(this.$(".paired-column-title .title").text([this.paired.length,e("paired")].join(" ")),this.$(".unpair-all-link").toggle(0!==this.paired.length),0===this.paired.length)return void this._renderPairedEmpty();this.$(".remove-extensions-link").show(),this.$(".paired-columns .column-datasets").empty();var a=this;this.paired.forEach(function(b){var c=new i({pair:b});a.$(".paired-columns .column-datasets").append(c.render().$el).append(['<button class="unpair-btn">','<span class="fa fa-unlink" title="',e("Unpair"),'"></span>',"</button>"].join(""))})},_renderPairedEmpty:function(){var a=$('<div class="empty-message"></div>').text("("+e("no paired datasets yet")+")");return this.$(".paired-columns .column-datasets").empty().prepend(a),a},_renderFooter:function(){var a=this.$(".footer").empty().html(j.templates.footer());return this.$(".remove-extensions").prop("checked",this.removeExtensions),"function"==typeof this.oncancel&&this.$(".cancel-create.btn").show(),a},_addPluginComponents:function(){this._chooseFiltersPopover(".choose-filters-link"),this.$(".help-content i").hoverhighlight(".collection-creator","rgba( 64, 255, 255, 1.0 )")},_chooseFiltersPopover:function(a){function b(a,b){return['<button class="filter-choice btn" ','data-forward="',a,'" data-reverse="',b,'">',e("Forward"),": ",a,", ",e("Reverse"),": ",b,"</button>"].join("")}var c=$(_.template(['<div class="choose-filters">','<div class="help">',e("Choose from the following filters to change which unpaired reads are shown in the display"),":</div>",_.values(this.commonFilters).map(function(a){return b(a[0],a[1])}).join(""),"</div>"].join(""))({}));return this.$(a).popover({container:".collection-creator",placement:"bottom",html:!0,content:c})},_validationWarning:function(a,b){var c="validation-warning";"name"===a&&(a=this.$(".collection-name").add(this.$(".collection-name-prompt")),this.$(".collection-name").focus().select()),b?(a=a||this.$("."+c),a.removeClass(c)):a.addClass(c)},_setUpBehaviors:function(){return this.once("rendered",function(){this.trigger("rendered:initial",this)}),this.on("pair:new",function(){this._renderUnpaired(),this._renderPaired(),this.$(".paired-columns").scrollTop(8e6)}),this.on("pair:unpair",function(){this._renderUnpaired(),this._renderPaired(),this.splitView()}),this.on("filter-change",function(){this.filters=[this.$(".forward-unpaired-filter input").val(),this.$(".reverse-unpaired-filter input").val()],this.metric("filter-change",this.filters),this._renderFilters(),this._renderUnpaired()}),this.on("autopair",function(){this._renderUnpaired(),this._renderPaired();var a,b=null;this.paired.length?(b="alert-success",a=this.paired.length+" "+e("pairs created"),this.unpaired.length||(a+=": "+e("all datasets have been successfully paired"),this.hideUnpaired(),this.$(".collection-name").focus())):a=e("Could not automatically create any pairs from the given dataset names"),this._showAlert(a,b)}),this},events:{"click .more-help":"_clickMoreHelp","click .less-help":"_clickLessHelp","click .header .alert button":"_hideAlert","click .forward-column .column-title":"_clickShowOnlyUnpaired","click .reverse-column .column-title":"_clickShowOnlyUnpaired","click .unpair-all-link":"_clickUnpairAll","change .forward-unpaired-filter input":function(){this.trigger("filter-change")},"focus .forward-unpaired-filter input":function(a){$(a.currentTarget).select()},"click .autopair-link":"_clickAutopair","click .choose-filters .filter-choice":"_clickFilterChoice","click .clear-filters-link":"_clearFilters","change .reverse-unpaired-filter input":function(){this.trigger("filter-change")},"focus .reverse-unpaired-filter input":function(a){$(a.currentTarget).select()},"click .forward-column .dataset.unpaired":"_clickUnpairedDataset","click .reverse-column .dataset.unpaired":"_clickUnpairedDataset","click .paired-column .dataset.unpaired":"_clickPairRow","click .unpaired-columns":"clearSelectedUnpaired","mousedown .unpaired-columns .dataset":"_mousedownUnpaired","click .paired-column-title":"_clickShowOnlyPaired","mousedown .flexible-partition-drag":"_startPartitionDrag","click .paired-columns .dataset.paired":"selectPair","click .paired-columns":"clearSelectedPaired","click .paired-columns .pair-name":"_clickPairName","click .unpair-btn":"_clickUnpair","dragover .paired-columns .column-datasets":"_dragoverPairedColumns","drop .paired-columns .column-datasets":"_dropPairedColumns","pair.dragstart .paired-columns .column-datasets":"_pairDragstart","pair.dragend   .paired-columns .column-datasets":"_pairDragend","change .remove-extensions":function(){this.toggleExtensions()},"change .collection-name":"_changeName","keydown .collection-name":"_nameCheckForEnter","click .cancel-create":function(){"function"==typeof this.oncancel&&this.oncancel.call(this)},"click .create-collection":"_clickCreate"},_clickMoreHelp:function(){this.$(".main-help").addClass("expanded"),this.$(".more-help").hide()},_clickLessHelp:function(){this.$(".main-help").removeClass("expanded"),this.$(".more-help").show()},_showAlert:function(a,b){b=b||"alert-danger",this.$(".main-help").hide(),this.$(".header .alert").attr("class","alert alert-dismissable").addClass(b).show().find(".alert-message").html(a)},_hideAlert:function(){this.$(".main-help").show(),this.$(".header .alert").hide()},_clickShowOnlyUnpaired:function(){this.$(".paired-columns").is(":visible")?this.hidePaired():this.splitView()},_clickShowOnlyPaired:function(){this.$(".unpaired-columns").is(":visible")?this.hideUnpaired():this.splitView()},hideUnpaired:function(a,b){this.unpairedPanelHidden=!0,this.pairedPanelHidden=!1,this._renderMiddle(a,b)},hidePaired:function(a,b){this.unpairedPanelHidden=!1,this.pairedPanelHidden=!0,this._renderMiddle(a,b)},splitView:function(a,b){return this.unpairedPanelHidden=this.pairedPanelHidden=!1,this._renderMiddle(a,b),this},_clickUnpairAll:function(){this.metric("unpairAll"),this.unpairAll()},_clickAutopair:function(){var a=this.autoPair();this.metric("autopair",a.length,this.unpaired.length),this.trigger("autopair")},_clickFilterChoice:function(a){var b=$(a.currentTarget);this.$(".forward-unpaired-filter input").val(b.data("forward")),this.$(".reverse-unpaired-filter input").val(b.data("reverse")),this._hideChooseFilters(),this.trigger("filter-change")},_hideChooseFilters:function(){this.$(".choose-filters-link").popover("hide"),this.$(".popover").css("display","none")},_clearFilters:function(){this.$(".forward-unpaired-filter input").val(""),this.$(".reverse-unpaired-filter input").val(""),this.trigger("filter-change")},_clickUnpairedDataset:function(a){return a.stopPropagation(),this.toggleSelectUnpaired($(a.currentTarget))},toggleSelectUnpaired:function(a,b){b=b||{};var c=a.data("dataset"),d=void 0!==b.force?b.force:!a.hasClass("selected");return a.size()&&void 0!==c?(d?(a.addClass("selected"),b.waitToPair||this.pairAllSelected()):a.removeClass("selected"),a):a},pairAllSelected:function(a){a=a||{};var b=this,c=[],d=[],e=[];return b.$(".unpaired-columns .forward-column .dataset.selected").each(function(){c.push($(this).data("dataset"))}),b.$(".unpaired-columns .reverse-column .dataset.selected").each(function(){d.push($(this).data("dataset"))}),c.length=d.length=Math.min(c.length,d.length),c.forEach(function(a,c){try{e.push(b._pair(a,d[c],{silent:!0}))}catch(f){b.error(f)}}),e.length&&!a.silent&&this.trigger("pair:new",e),e},clearSelectedUnpaired:function(){this.$(".unpaired-columns .dataset.selected").removeClass("selected")},_mousedownUnpaired:function(a){if(a.shiftKey){var b=this,c=$(a.target).addClass("selected"),d=function(a){b.$(a.target).filter(".dataset").addClass("selected")};c.parent().on("mousemove",d),$(document).one("mouseup",function(){c.parent().off("mousemove",d),b.pairAllSelected()})}},_clickPairRow:function(a){var b=$(a.currentTarget).index(),c=$(".unpaired-columns .forward-column .dataset").eq(b).data("dataset"),d=$(".unpaired-columns .reverse-column .dataset").eq(b).data("dataset");this._pair(c,d)},_startPartitionDrag:function(a){function b(){d.$(".flexible-partition-drag").css("color",""),$("body").css("cursor","").unbind("mousemove",c)}function c(a){var b=a.pageY-e;d.adjPartition(b)||$("body").trigger("mouseup"),d._adjUnpairedOnScrollbar(),e+=b}var d=this,e=a.pageY;$("body").css("cursor","ns-resize"),d.$(".flexible-partition-drag").css("color","black"),$("body").mousemove(c),$("body").one("mouseup",b)},adjPartition:function(a){var b=this.$(".unpaired-columns"),c=this.$(".paired-columns"),d=parseInt(b.css("height"),10),e=parseInt(c.css("height"),10);d=Math.max(10,d+a),e-=a;var f=0>a;if(f){if(this.unpairedPanelHidden)return!1;if(10>=d)return this.hideUnpaired(),!1}else this.unpairedPanelHidden&&(b.show(),this.unpairedPanelHidden=!1);if(f)this.pairedPanelHidden&&(c.show(),this.pairedPanelHidden=!1);else{if(this.pairedPanelHidden)return!1;if(15>=e)return this.hidePaired(),!1}return b.css({height:d+"px",flex:"0 0 auto"}),!0},selectPair:function(a){a.stopPropagation(),$(a.currentTarget).toggleClass("selected")},clearSelectedPaired:function(){this.$(".paired-columns .dataset.selected").removeClass("selected")},_clickPairName:function(a){a.stopPropagation();var b=$(a.currentTarget),c=b.parent().parent(),d=c.index(".dataset.paired"),e=this.paired[d],f=prompt("Enter a new name for the pair:",e.name);f&&(e.name=f,e.customizedName=!0,b.text(e.name))},_clickUnpair:function(a){var b=Math.floor($(a.currentTarget).index(".unpair-btn"));this._unpair(this.paired[b])},_dragoverPairedColumns:function(a){a.preventDefault();var b=this.$(".paired-columns .column-datasets");this._checkForAutoscroll(b,a.originalEvent.clientY);var c=this._getNearestPairedDatasetLi(a.originalEvent.clientY);$(".element-drop-placeholder").remove();var d=$('<div class="element-drop-placeholder"></div>');c.size()?c.before(d):b.append(d)},_checkForAutoscroll:function(a,b){var c=2,d=a.offset(),e=a.scrollTop(),f=b-d.top,g=d.top+a.outerHeight()-b;f>=0&&f<this.autoscrollDist?a.scrollTop(e-c):g>=0&&g<this.autoscrollDist&&a.scrollTop(e+c)},_getNearestPairedDatasetLi:function(a){for(var b=4,c=this.$(".paired-columns .column-datasets li").toArray(),d=0;d<c.length;d++){var e=$(c[d]),f=e.offset().top,g=Math.floor(e.outerHeight()/2)+b;if(f+g>a&&a>f-g)return e}return $()},_dropPairedColumns:function(a){a.preventDefault(),a.dataTransfer.dropEffect="move";var b=this._getNearestPairedDatasetLi(a.originalEvent.clientY);return b.size()?this.$dragging.insertBefore(b):this.$dragging.insertAfter(this.$(".paired-columns .unpair-btn").last()),this._syncPairsToDom(),!1},_syncPairsToDom:function(){var a=[];this.$(".paired-columns .dataset.paired").each(function(){a.push($(this).data("pair"))}),this.paired=a,this._renderPaired()},_pairDragstart:function(a,b){b.$el.addClass("selected");var c=this.$(".paired-columns .dataset.selected");this.$dragging=c},_pairDragend:function(){$(".element-drop-placeholder").remove(),this.$dragging=null},toggleExtensions:function(a){var b=this;b.removeExtensions=void 0!==a?a:!b.removeExtensions,_.each(b.paired,function(a){a.customizedName||(a.name=b._guessNameForPair(a.forward,a.reverse))}),b._renderPaired(),b._renderFooter()},_changeName:function(){this._validationWarning("name",!!this._getName())},_nameCheckForEnter:function(a){13!==a.keyCode||this.blocking||this._clickCreate()},_getName:function(){return _.escape(this.$(".collection-name").val())},_clickCreate:function(){var a=this._getName();a?this.blocking||this.createList():this._validationWarning("name")},_printList:function(a){var b=this;_.each(a,function(c){a===b.paired&&b._printPair(c)})},_printPair:function(a){this.debug(a.forward.name,a.reverse.name,": ->",a.name)},toString:function(){return"PairedCollectionCreator"}});j.templates=j.templates||{main:_.template(['<div class="header flex-row no-flex"></div>','<div class="middle flex-row flex-row-container"></div>','<div class="footer flex-row no-flex">'].join("")),header:_.template(['<div class="main-help well clear">','<a class="more-help" href="javascript:void(0);">',e("More help"),"</a>",'<div class="help-content">','<a class="less-help" href="javascript:void(0);">',e("Less"),"</a>","</div>","</div>",'<div class="alert alert-dismissable">','<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>','<span class="alert-message"></span>',"</div>",'<div class="column-headers vertically-spaced flex-column-container">','<div class="forward-column flex-column column">','<div class="column-header">','<div class="column-title">','<span class="title">',e("Unpaired forward"),"</span>",'<span class="title-info unpaired-info"></span>',"</div>",'<div class="unpaired-filter forward-unpaired-filter pull-left">','<input class="search-query" placeholder="',e("Filter this list"),'" />',"</div>","</div>","</div>",'<div class="paired-column flex-column no-flex column">','<div class="column-header">','<a class="choose-filters-link" href="javascript:void(0)">',e("Choose filters"),"</a>",'<a class="clear-filters-link" href="javascript:void(0);">',e("Clear filters"),"</a><br />",'<a class="autopair-link" href="javascript:void(0);">',e("Auto-pair"),"</a>","</div>","</div>",'<div class="reverse-column flex-column column">','<div class="column-header">','<div class="column-title">','<span class="title">',e("Unpaired reverse"),"</span>",'<span class="title-info unpaired-info"></span>',"</div>",'<div class="unpaired-filter reverse-unpaired-filter pull-left">','<input class="search-query" placeholder="',e("Filter this list"),'" />',"</div>","</div>","</div>","</div>"].join("")),middle:_.template(['<div class="unpaired-columns flex-column-container scroll-container flex-row">','<div class="forward-column flex-column column">','<ol class="column-datasets"></ol>',"</div>",'<div class="paired-column flex-column no-flex column">','<ol class="column-datasets"></ol>',"</div>",'<div class="reverse-column flex-column column">','<ol class="column-datasets"></ol>',"</div>","</div>",'<div class="flexible-partition">','<div class="flexible-partition-drag" title="',e("Drag to change"),'"></div>','<div class="column-header">','<div class="column-title paired-column-title">','<span class="title"></span>',"</div>",'<a class="unpair-all-link" href="javascript:void(0);">',e("Unpair all"),"</a>","</div>","</div>",'<div class="paired-columns flex-column-container scroll-container flex-row">','<ol class="column-datasets"></ol>',"</div>"].join("")),footer:_.template(['<div class="attributes clear">','<div class="clear">','<label class="remove-extensions-prompt pull-right">',e("Remove file extensions from pair names"),"?",'<input class="remove-extensions pull-right" type="checkbox" />',"</label>","</div>",'<div class="clear">','<input class="collection-name form-control pull-right" ','placeholder="',e("Enter a name for your new list"),'" />','<div class="collection-name-prompt pull-right">',e("Name"),":</div>","</div>","</div>",'<div class="actions clear vertically-spaced">','<div class="other-options pull-left">','<button class="cancel-create btn" tabindex="-1">',e("Cancel"),"</button>",'<div class="create-other btn-group dropup">','<button class="btn btn-default dropdown-toggle" data-toggle="dropdown">',e("Create a different kind of collection"),' <span class="caret"></span>',"</button>",'<ul class="dropdown-menu" role="menu">','<li><a href="#">',e("Create a <i>single</i> pair"),"</a></li>",'<li><a href="#">',e("Create a list of <i>unpaired</i> datasets"),"</a></li>","</ul>","</div>","</div>",'<div class="main-options pull-right">','<button class="create-collection btn btn-primary">',e("Create list"),"</button>","</div>","</div>"].join("")),helpContent:_.template(["<p>",e(["Collections of paired datasets are ordered lists of dataset pairs (often forward and reverse reads). ","These collections can be passed to tools and workflows in order to have analyses done on each member of ","the entire group. This interface allows you to create a collection, choose which datasets are paired, ","and re-order the final collection."].join("")),"</p>","<p>",e(['Unpaired datasets are shown in the <i data-target=".unpaired-columns">unpaired section</i> ',"(hover over the underlined words to highlight below). ",'Paired datasets are shown in the <i data-target=".paired-columns">paired section</i>.',"<ul>To pair datasets, you can:","<li>Click a dataset in the ",'<i data-target=".unpaired-columns .forward-column .column-datasets,','.unpaired-columns .forward-column">forward column</i> ',"to select it then click a dataset in the ",'<i data-target=".unpaired-columns .reverse-column .column-datasets,','.unpaired-columns .reverse-column">reverse column</i>.',"</li>",'<li>Click one of the "Pair these datasets" buttons in the ','<i data-target=".unpaired-columns .paired-column .column-datasets,','.unpaired-columns .paired-column">middle column</i> ',"to pair the datasets in a particular row.","</li>",'<li>Click <i data-target=".autopair-link">"Auto-pair"</i> ',"to have your datasets automatically paired based on name.","</li>","</ul>"].join("")),"</p>","<p>",e(["<ul>You can filter what is shown in the unpaired sections by:","<li>Entering partial dataset names in either the ",'<i data-target=".forward-unpaired-filter input">forward filter</i> or ','<i data-target=".reverse-unpaired-filter input">reverse filter</i>.',"</li>","<li>Choosing from a list of preset filters by clicking the ",'<i data-target=".choose-filters-link">"Choose filters" link</i>.',"</li>","<li>Entering regular expressions to match dataset names. See: ",'<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions"',' target="_blank">MDN\'s JavaScript Regular Expression Tutorial</a>. ',"Note: forward slashes (\\) are not needed.","</li>","<li>Clearing the filters by clicking the ",'<i data-target=".clear-filters-link">"Clear filters" link</i>.',"</li>","</ul>"].join("")),"</p>","<p>",e(["To unpair individual dataset pairs, click the ",'<i data-target=".unpair-btn">unpair buttons ( <span class="fa fa-unlink"></span> )</i>. ','Click the <i data-target=".unpair-all-link">"Unpair all" link</i> to unpair all pairs.'].join("")),"</p>","<p>",e(['You can include or remove the file extensions (e.g. ".fastq") from your pair names by toggling the ','<i data-target=".remove-extensions-prompt">"Remove file extensions from pair names?"</i> control.'].join("")),"</p>","<p>",e(['Once your collection is complete, enter a <i data-target=".collection-name">name</i> and ','click <i data-target=".create-collection">"Create list"</i>. ',"(Note: you do not have to pair all unpaired datasets to finish.)"].join("")),"</p>"].join(""))};var k=function(a,b){var c,d=jQuery.Deferred();if(b=_.defaults(b||{},{datasets:a,oncancel:function(){Galaxy.modal.hide(),d.reject("cancelled")},oncreate:function(a,b){Galaxy.modal.hide(),d.resolve(b)}}),!window.Galaxy||!Galaxy.modal)throw new Error("Galaxy or Galaxy.modal not found");return c=new j(b),Galaxy.modal.show({title:"Create a collection of paired datasets",body:c.$el,width:"80%",height:"800px",closing_events:!0}),c.render(),window.creator=c,d};return{PairedCollectionCreator:j,pairedCollectionCreatorModal:k,createListOfPairsCollection:g}});
//# sourceMappingURL=../../../maps/mvc/collection/list-of-pairs-collection-creator.js.map