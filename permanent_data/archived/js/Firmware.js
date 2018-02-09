!function(a,b){"function"==typeof define&&define.amd?define(["jquery"],b):"object"==typeof exports?module.exports=b(require("jquery")):b(a.jQuery)}(this,function(a){"function"!=typeof Object.create&&(Object.create=function(a){function b(){}return b.prototype=a,new b});var b={init:function(b){return this.options=a.extend({},a.noty.defaults,b),this.options.layout=this.options.custom?a.noty.layouts.inline:a.noty.layouts[this.options.layout],a.noty.themes[this.options.theme]?this.options.theme=a.noty.themes[this.options.theme]:this.options.themeClassName=this.options.theme,this.options=a.extend({},this.options,this.options.layout.options),this.options.id="noty_"+(new Date).getTime()*Math.floor(1e6*Math.random()),this._build(),this},_build:function(){var b=a('<div class="noty_bar noty_type_'+this.options.type+'"></div>').attr("id",this.options.id);if(b.append(this.options.template).find(".noty_text").html(this.options.text),this.$bar=null!==this.options.layout.parent.object?a(this.options.layout.parent.object).css(this.options.layout.parent.css).append(b):b,this.options.themeClassName&&this.$bar.addClass(this.options.themeClassName).addClass("noty_container_type_"+this.options.type),this.options.buttons){this.options.closeWith=[],this.options.timeout=!1;var c=a("<div/>").addClass("noty_buttons");null!==this.options.layout.parent.object?this.$bar.find(".noty_bar").append(c):this.$bar.append(c);var d=this;a.each(this.options.buttons,function(b,c){var e=a("<button/>").addClass(c.addClass?c.addClass:"gray").html(c.text).attr("id",c.id?c.id:"button-"+b).attr("title",c.title).appendTo(d.$bar.find(".noty_buttons")).on("click",function(b){a.isFunction(c.onClick)&&c.onClick.call(e,d,b)})})}this.$message=this.$bar.find(".noty_message"),this.$closeButton=this.$bar.find(".noty_close"),this.$buttons=this.$bar.find(".noty_buttons"),a.noty.store[this.options.id]=this},show:function(){var b=this;return b.options.custom?b.options.custom.find(b.options.layout.container.selector).append(b.$bar):a(b.options.layout.container.selector).append(b.$bar),b.options.theme&&b.options.theme.style&&b.options.theme.style.apply(b),"function"===a.type(b.options.layout.css)?this.options.layout.css.apply(b.$bar):b.$bar.css(this.options.layout.css||{}),b.$bar.addClass(b.options.layout.addClass),b.options.layout.container.style.apply(a(b.options.layout.container.selector),[b.options.within]),b.showing=!0,b.options.theme&&b.options.theme.style&&b.options.theme.callback.onShow.apply(this),a.inArray("click",b.options.closeWith)>-1&&b.$bar.css("cursor","pointer").one("click",function(a){b.stopPropagation(a),b.options.callback.onCloseClick&&b.options.callback.onCloseClick.apply(b),b.close()}),a.inArray("hover",b.options.closeWith)>-1&&b.$bar.one("mouseenter",function(){b.close()}),a.inArray("button",b.options.closeWith)>-1&&b.$closeButton.one("click",function(a){b.stopPropagation(a),b.close()}),-1==a.inArray("button",b.options.closeWith)&&b.$closeButton.remove(),b.options.callback.onShow&&b.options.callback.onShow.apply(b),"string"==typeof b.options.animation.open?(b.$bar.css("height",b.$bar.innerHeight()),b.$bar.on("click",function(a){b.wasClicked=!0}),b.$bar.show().addClass(b.options.animation.open).one("webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend",function(){b.options.callback.afterShow&&b.options.callback.afterShow.apply(b),b.showing=!1,b.shown=!0,b.hasOwnProperty("wasClicked")&&(b.$bar.off("click",function(a){b.wasClicked=!0}),b.close())})):b.$bar.animate(b.options.animation.open,b.options.animation.speed,b.options.animation.easing,function(){b.options.callback.afterShow&&b.options.callback.afterShow.apply(b),b.showing=!1,b.shown=!0}),b.options.timeout&&b.$bar.delay(b.options.timeout).promise().done(function(){b.close()}),this},close:function(){if(!(this.closed||this.$bar&&this.$bar.hasClass("i-am-closing-now"))){var b=this;if(this.showing)return void b.$bar.queue(function(){b.close.apply(b)});if(!this.shown&&!this.showing){var c=[];return a.each(a.noty.queue,function(a,d){d.options.id!=b.options.id&&c.push(d)}),void(a.noty.queue=c)}b.$bar.addClass("i-am-closing-now"),b.options.callback.onClose&&b.options.callback.onClose.apply(b),"string"==typeof b.options.animation.close?b.$bar.addClass(b.options.animation.close).one("webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend",function(){b.options.callback.afterClose&&b.options.callback.afterClose.apply(b),b.closeCleanUp()}):b.$bar.clearQueue().stop().animate(b.options.animation.close,b.options.animation.speed,b.options.animation.easing,function(){b.options.callback.afterClose&&b.options.callback.afterClose.apply(b)}).promise().done(function(){b.closeCleanUp()})}},closeCleanUp:function(){var b=this;b.options.modal&&(a.notyRenderer.setModalCount(-1),0==a.notyRenderer.getModalCount()&&a(".noty_modal").fadeOut(b.options.animation.fadeSpeed,function(){a(this).remove()})),a.notyRenderer.setLayoutCountFor(b,-1),0==a.notyRenderer.getLayoutCountFor(b)&&a(b.options.layout.container.selector).remove(),"undefined"!=typeof b.$bar&&null!==b.$bar&&("string"==typeof b.options.animation.close?(b.$bar.css("transition","all 100ms ease").css("border",0).css("margin",0).height(0),b.$bar.one("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd",function(){b.$bar.remove(),b.$bar=null,b.closed=!0,b.options.theme.callback&&b.options.theme.callback.onClose&&b.options.theme.callback.onClose.apply(b)})):(b.$bar.remove(),b.$bar=null,b.closed=!0)),delete a.noty.store[b.options.id],b.options.theme.callback&&b.options.theme.callback.onClose&&b.options.theme.callback.onClose.apply(b),b.options.dismissQueue||(a.noty.ontap=!0,a.notyRenderer.render()),b.options.maxVisible>0&&b.options.dismissQueue&&a.notyRenderer.render()},setText:function(a){return this.closed||(this.options.text=a,this.$bar.find(".noty_text").html(a)),this},setType:function(a){return this.closed||(this.options.type=a,this.options.theme.style.apply(this),this.options.theme.callback.onShow.apply(this)),this},setTimeout:function(a){if(!this.closed){var b=this;this.options.timeout=a,b.$bar.delay(b.options.timeout).promise().done(function(){b.close()})}return this},stopPropagation:function(a){a=a||window.event,"undefined"!=typeof a.stopPropagation?a.stopPropagation():a.cancelBubble=!0},closed:!1,showing:!1,shown:!1};a.notyRenderer={},a.notyRenderer.init=function(c){var d=Object.create(b).init(c);return d.options.killer&&a.noty.closeAll(),d.options.force?a.noty.queue.unshift(d):a.noty.queue.push(d),a.notyRenderer.render(),"object"==a.noty.returns?d:d.options.id},a.notyRenderer.render=function(){var b=a.noty.queue[0];"object"===a.type(b)?b.options.dismissQueue?b.options.maxVisible>0?a(b.options.layout.container.selector+" > li").length<b.options.maxVisible&&a.notyRenderer.show(a.noty.queue.shift()):a.notyRenderer.show(a.noty.queue.shift()):a.noty.ontap&&(a.notyRenderer.show(a.noty.queue.shift()),a.noty.ontap=!1):a.noty.ontap=!0},a.notyRenderer.show=function(b){b.options.modal&&(a.notyRenderer.createModalFor(b),a.notyRenderer.setModalCount(1)),b.options.custom?0==b.options.custom.find(b.options.layout.container.selector).length?b.options.custom.append(a(b.options.layout.container.object).addClass("i-am-new")):b.options.custom.find(b.options.layout.container.selector).removeClass("i-am-new"):0==a(b.options.layout.container.selector).length?a("body").append(a(b.options.layout.container.object).addClass("i-am-new")):a(b.options.layout.container.selector).removeClass("i-am-new"),a.notyRenderer.setLayoutCountFor(b,1),b.show()},a.notyRenderer.createModalFor=function(b){if(0==a(".noty_modal").length){var c=a("<div/>").addClass("noty_modal").addClass(b.options.theme).data("noty_modal_count",0);b.options.theme.modal&&b.options.theme.modal.css&&c.css(b.options.theme.modal.css),c.prependTo(a("body")).fadeIn(b.options.animation.fadeSpeed),a.inArray("backdrop",b.options.closeWith)>-1&&c.on("click",function(b){a.noty.closeAll()})}},a.notyRenderer.getLayoutCountFor=function(b){return a(b.options.layout.container.selector).data("noty_layout_count")||0},a.notyRenderer.setLayoutCountFor=function(b,c){return a(b.options.layout.container.selector).data("noty_layout_count",a.notyRenderer.getLayoutCountFor(b)+c)},a.notyRenderer.getModalCount=function(){return a(".noty_modal").data("noty_modal_count")||0},a.notyRenderer.setModalCount=function(b){return a(".noty_modal").data("noty_modal_count",a.notyRenderer.getModalCount()+b)},a.fn.noty=function(b){return b.custom=a(this),a.notyRenderer.init(b)},a.noty={},a.noty.queue=[],a.noty.ontap=!0,a.noty.layouts={},a.noty.themes={},a.noty.returns="object",a.noty.store={},a.noty.get=function(b){return a.noty.store.hasOwnProperty(b)?a.noty.store[b]:!1},a.noty.close=function(b){return a.noty.get(b)?a.noty.get(b).close():!1},a.noty.setText=function(b,c){return a.noty.get(b)?a.noty.get(b).setText(c):!1},a.noty.setType=function(b,c){return a.noty.get(b)?a.noty.get(b).setType(c):!1},a.noty.clearQueue=function(){a.noty.queue=[]},a.noty.closeAll=function(){a.noty.clearQueue(),a.each(a.noty.store,function(a,b){b.close()})};var c=window.alert;return a.noty.consumeAlert=function(b){window.alert=function(c){b?b.text=c:b={text:c},a.notyRenderer.init(b)}},a.noty.stopConsumeAlert=function(){window.alert=c},a.noty.defaults={layout:"top",theme:"defaultTheme",type:"alert",text:"",dismissQueue:!0,template:'<div class="noty_message"><span class="noty_text"></span><div class="noty_close"></div></div>',animation:{open:{height:"toggle"},close:{height:"toggle"},easing:"swing",speed:500,fadeSpeed:"fast"},timeout:!1,force:!1,modal:!1,maxVisible:5,killer:!1,closeWith:["click"],callback:{onShow:function(){},afterShow:function(){},onClose:function(){},afterClose:function(){},onCloseClick:function(){}},buttons:!1},a(window).on("resize",function(){a.each(a.noty.layouts,function(b,c){c.container.style.apply(a(c.container.selector))})}),window.noty=function(b){return a.notyRenderer.init(b)},a.noty.layouts.bottom={name:"bottom",options:{},container:{object:'<ul id="noty_bottom_layout_container" />',selector:"ul#noty_bottom_layout_container",style:function(){a(this).css({bottom:0,left:"5%",position:"fixed",width:"90%",height:"auto",margin:0,padding:0,listStyleType:"none",zIndex:9999999})}},parent:{object:"<li />",selector:"li",css:{}},css:{display:"none"},addClass:""},a.noty.layouts.bottomCenter={name:"bottomCenter",options:{},container:{object:'<ul id="noty_bottomCenter_layout_container" />',selector:"ul#noty_bottomCenter_layout_container",style:function(){a(this).css({bottom:20,left:0,position:"fixed",width:"310px",height:"auto",margin:0,padding:0,listStyleType:"none",zIndex:1e7}),a(this).css({left:(a(window).width()-a(this).outerWidth(!1))/2+"px"})}},parent:{object:"<li />",selector:"li",css:{}},css:{display:"none",width:"310px"},addClass:""},a.noty.layouts.bottomLeft={name:"bottomLeft",options:{},container:{object:'<ul id="noty_bottomLeft_layout_container" />',selector:"ul#noty_bottomLeft_layout_container",style:function(){a(this).css({bottom:20,left:20,position:"fixed",width:"310px",height:"auto",margin:0,padding:0,listStyleType:"none",zIndex:1e7}),window.innerWidth<600&&a(this).css({left:5})}},parent:{object:"<li />",selector:"li",css:{}},css:{display:"none",width:"310px"},addClass:""},a.noty.layouts.bottomRight={name:"bottomRight",options:{},container:{object:'<ul id="noty_bottomRight_layout_container" />',selector:"ul#noty_bottomRight_layout_container",style:function(){a(this).css({bottom:20,right:20,position:"fixed",width:"310px",height:"auto",margin:0,padding:0,listStyleType:"none",zIndex:1e7}),window.innerWidth<600&&a(this).css({right:5})}},parent:{object:"<li />",selector:"li",css:{}},css:{display:"none",width:"310px"},addClass:""},a.noty.layouts.center={name:"center",options:{},container:{object:'<ul id="noty_center_layout_container" />',selector:"ul#noty_center_layout_container",style:function(){a(this).css({position:"fixed",width:"310px",height:"auto",margin:0,padding:0,listStyleType:"none",zIndex:1e7});var b=a(this).clone().css({visibility:"hidden",display:"block",position:"absolute",top:0,left:0}).attr("id","dupe");a("body").append(b),b.find(".i-am-closing-now").remove(),b.find("li").css("display","block");var c=b.height();b.remove(),a(this).hasClass("i-am-new")?a(this).css({left:(a(window).width()-a(this).outerWidth(!1))/2+"px",top:(a(window).height()-c)/2+"px"}):a(this).animate({left:(a(window).width()-a(this).outerWidth(!1))/2+"px",top:(a(window).height()-c)/2+"px"},500)}},parent:{object:"<li />",selector:"li",css:{}},css:{display:"none",width:"310px"},addClass:""},a.noty.layouts.centerLeft={name:"centerLeft",options:{},container:{object:'<ul id="noty_centerLeft_layout_container" />',selector:"ul#noty_centerLeft_layout_container",style:function(){a(this).css({left:20,position:"fixed",width:"310px",height:"auto",margin:0,padding:0,listStyleType:"none",zIndex:1e7});var b=a(this).clone().css({visibility:"hidden",display:"block",position:"absolute",top:0,left:0}).attr("id","dupe");a("body").append(b),b.find(".i-am-closing-now").remove(),b.find("li").css("display","block");var c=b.height();b.remove(),a(this).hasClass("i-am-new")?a(this).css({top:(a(window).height()-c)/2+"px"}):a(this).animate({top:(a(window).height()-c)/2+"px"},500),window.innerWidth<600&&a(this).css({left:5})}},parent:{object:"<li />",selector:"li",css:{}},css:{display:"none",width:"310px"},addClass:""},a.noty.layouts.centerRight={name:"centerRight",options:{},container:{object:'<ul id="noty_centerRight_layout_container" />',selector:"ul#noty_centerRight_layout_container",style:function(){a(this).css({right:20,position:"fixed",width:"310px",height:"auto",margin:0,padding:0,listStyleType:"none",zIndex:1e7});var b=a(this).clone().css({visibility:"hidden",display:"block",position:"absolute",top:0,left:0}).attr("id","dupe");a("body").append(b),b.find(".i-am-closing-now").remove(),b.find("li").css("display","block");var c=b.height();b.remove(),a(this).hasClass("i-am-new")?a(this).css({top:(a(window).height()-c)/2+"px"}):a(this).animate({top:(a(window).height()-c)/2+"px"},500),window.innerWidth<600&&a(this).css({right:5})}},parent:{object:"<li />",selector:"li",css:{}},css:{display:"none",width:"310px"},addClass:""},a.noty.layouts.inline={name:"inline",options:{},container:{object:'<ul class="noty_inline_layout_container" />',selector:"ul.noty_inline_layout_container",style:function(){a(this).css({width:"100%",height:"auto",margin:0,padding:0,listStyleType:"none",zIndex:9999999})}},parent:{object:"<li />",selector:"li",css:{}},css:{display:"none"},addClass:""},a.noty.layouts.top={name:"top",options:{},container:{object:'<ul id="noty_top_layout_container" />',selector:"ul#noty_top_layout_container",style:function(){a(this).css({top:0,left:"5%",position:"fixed",width:"90%",height:"auto",margin:0,padding:0,listStyleType:"none",zIndex:9999999})}},parent:{object:"<li />",selector:"li",css:{}},css:{display:"none"},addClass:""},a.noty.layouts.topCenter={name:"topCenter",options:{},container:{object:'<ul id="noty_topCenter_layout_container" />',selector:"ul#noty_topCenter_layout_container",style:function(){a(this).css({top:20,left:0,position:"fixed",width:"310px",height:"auto",margin:0,padding:0,listStyleType:"none",zIndex:1e7}),a(this).css({left:(a(window).width()-a(this).outerWidth(!1))/2+"px"})}},parent:{object:"<li />",selector:"li",css:{}},css:{display:"none",width:"310px"},addClass:""},a.noty.layouts.topLeft={name:"topLeft",options:{},container:{object:'<ul id="noty_topLeft_layout_container" />',selector:"ul#noty_topLeft_layout_container",style:function(){a(this).css({top:20,left:20,position:"fixed",width:"310px",height:"auto",margin:0,padding:0,listStyleType:"none",zIndex:1e7}),window.innerWidth<600&&a(this).css({left:5})}},parent:{object:"<li />",selector:"li",css:{}},css:{display:"none",width:"310px"},addClass:""},a.noty.layouts.topRight={name:"topRight",options:{},container:{object:'<ul id="noty_topRight_layout_container" />',selector:"ul#noty_topRight_layout_container",style:function(){a(this).css({top:20,right:20,position:"fixed",width:"310px",height:"auto",margin:0,padding:0,listStyleType:"none",zIndex:1e7}),window.innerWidth<600&&a(this).css({right:5})}},parent:{object:"<li />",selector:"li",css:{}},css:{display:"none",width:"310px"},addClass:""},a.noty.themes.bootstrapTheme={name:"bootstrapTheme",modal:{css:{position:"fixed",width:"100%",height:"100%",backgroundColor:"#000",zIndex:1e4,opacity:.6,display:"none",left:0,top:0}},style:function(){var b=this.options.layout.container.selector;switch(a(b).addClass("list-group"),this.$closeButton.append('<span aria-hidden="true">&times;</span><span class="sr-only">Close</span>'),this.$closeButton.addClass("close"),this.$bar.addClass("list-group-item").css("padding","0px"),this.options.type){case"alert":case"notification":this.$bar.addClass("list-group-item-info");break;case"warning":this.$bar.addClass("list-group-item-warning");break;case"error":this.$bar.addClass("list-group-item-danger");break;case"information":this.$bar.addClass("list-group-item-info");break;case"success":this.$bar.addClass("list-group-item-success")}this.$message.css({fontSize:"13px",lineHeight:"16px",textAlign:"center",padding:"8px 10px 9px",width:"auto",position:"relative"})},callback:{onShow:function(){},onClose:function(){}}},a.noty.themes.defaultTheme={name:"defaultTheme",helpers:{borderFix:function(){if(this.options.dismissQueue){var b=this.options.layout.container.selector+" "+this.options.layout.parent.selector;switch(this.options.layout.name){case"top":a(b).css({borderRadius:"0px 0px 0px 0px"}),a(b).last().css({borderRadius:"0px 0px 5px 5px"});break;case"topCenter":case"topLeft":case"topRight":case"bottomCenter":case"bottomLeft":case"bottomRight":case"center":case"centerLeft":case"centerRight":case"inline":a(b).css({borderRadius:"0px 0px 0px 0px"}),a(b).first().css({"border-top-left-radius":"5px","border-top-right-radius":"5px"}),a(b).last().css({"border-bottom-left-radius":"5px","border-bottom-right-radius":"5px"});break;case"bottom":a(b).css({borderRadius:"0px 0px 0px 0px"}),a(b).first().css({borderRadius:"5px 5px 0px 0px"})}}}},modal:{css:{position:"fixed",width:"100%",height:"100%",backgroundColor:"#000",zIndex:1e4,opacity:.6,display:"none",left:0,top:0}},style:function(){switch(this.$bar.css({overflow:"hidden",background:"url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAoCAQAAAClM0ndAAAAhklEQVR4AdXO0QrCMBBE0bttkk38/w8WRERpdyjzVOc+HxhIHqJGMQcFFkpYRQotLLSw0IJ5aBdovruMYDA/kT8plF9ZKLFQcgF18hDj1SbQOMlCA4kao0iiXmah7qBWPdxpohsgVZyj7e5I9KcID+EhiDI5gxBYKLBQYKHAQoGFAoEks/YEGHYKB7hFxf0AAAAASUVORK5CYII=') repeat-x scroll left top #fff"}),this.$message.css({fontSize:"13px",lineHeight:"16px",textAlign:"center",padding:"8px 10px 9px",width:"auto",position:"relative"}),this.$closeButton.css({position:"absolute",top:4,right:4,width:10,height:10,background:"url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAQAAAAnOwc2AAAAxUlEQVR4AR3MPUoDURSA0e++uSkkOxC3IAOWNtaCIDaChfgXBMEZbQRByxCwk+BasgQRZLSYoLgDQbARxry8nyumPcVRKDfd0Aa8AsgDv1zp6pYd5jWOwhvebRTbzNNEw5BSsIpsj/kurQBnmk7sIFcCF5yyZPDRG6trQhujXYosaFoc+2f1MJ89uc76IND6F9BvlXUdpb6xwD2+4q3me3bysiHvtLYrUJto7PD/ve7LNHxSg/woN2kSz4txasBdhyiz3ugPGetTjm3XRokAAAAASUVORK5CYII=)",display:"none",cursor:"pointer"}),this.$buttons.css({padding:5,textAlign:"right",borderTop:"1px solid #ccc",backgroundColor:"#fff"}),this.$buttons.find("button").css({marginLeft:5}),this.$buttons.find("button:first").css({marginLeft:0}),this.$bar.on({mouseenter:function(){a(this).find(".noty_close").stop().fadeTo("normal",1)},mouseleave:function(){a(this).find(".noty_close").stop().fadeTo("normal",0)}}),this.options.layout.name){case"top":this.$bar.css({borderRadius:"0px 0px 5px 5px",borderBottom:"2px solid #eee",borderLeft:"2px solid #eee",borderRight:"2px solid #eee",boxShadow:"0 2px 4px rgba(0, 0, 0, 0.1)"});break;case"topCenter":case"center":case"bottomCenter":case"inline":this.$bar.css({borderRadius:"5px",border:"1px solid #eee",boxShadow:"0 2px 4px rgba(0, 0, 0, 0.1)"}),this.$message.css({fontSize:"13px",textAlign:"center"});break;case"topLeft":case"topRight":case"bottomLeft":case"bottomRight":case"centerLeft":case"centerRight":this.$bar.css({borderRadius:"5px",border:"1px solid #eee",boxShadow:"0 2px 4px rgba(0, 0, 0, 0.1)"}),this.$message.css({fontSize:"13px",textAlign:"left"});break;case"bottom":this.$bar.css({borderRadius:"5px 5px 0px 0px",borderTop:"2px solid #eee",borderLeft:"2px solid #eee",borderRight:"2px solid #eee",boxShadow:"0 -2px 4px rgba(0, 0, 0, 0.1)"});break;default:this.$bar.css({border:"2px solid #eee",boxShadow:"0 2px 4px rgba(0, 0, 0, 0.1)"})}switch(this.options.type){case"alert":case"notification":this.$bar.css({backgroundColor:"#FFF",borderColor:"#CCC",color:"#444"});break;case"warning":this.$bar.css({backgroundColor:"#FFEAA8",borderColor:"#FFC237",color:"#826200"}),this.$buttons.css({borderTop:"1px solid #FFC237"});break;case"error":this.$bar.css({backgroundColor:"red",borderColor:"darkred",color:"#FFF"}),this.$message.css({fontWeight:"bold"}),this.$buttons.css({borderTop:"1px solid darkred"});break;case"information":this.$bar.css({backgroundColor:"#57B7E2",borderColor:"#0B90C4",color:"#FFF"}),this.$buttons.css({borderTop:"1px solid #0B90C4"});break;case"success":this.$bar.css({backgroundColor:"lightgreen",borderColor:"#50C24E",color:"darkgreen"}),this.$buttons.css({borderTop:"1px solid #50C24E"});break;default:this.$bar.css({backgroundColor:"#FFF",borderColor:"#CCC",color:"#444"})}},callback:{onShow:function(){a.noty.themes.defaultTheme.helpers.borderFix.apply(this)},onClose:function(){a.noty.themes.defaultTheme.helpers.borderFix.apply(this)}}},a.noty.themes.relax={name:"relax",helpers:{},modal:{css:{position:"fixed",width:"100%",height:"100%",backgroundColor:"#000",zIndex:1e4,opacity:.6,display:"none",left:0,top:0}},style:function(){switch(this.$bar.css({overflow:"hidden",margin:"4px 0",borderRadius:"2px"}),this.$message.css({fontSize:"14px",lineHeight:"16px",textAlign:"center",padding:"10px",width:"auto",position:"relative"}),this.$closeButton.css({position:"absolute",top:4,right:4,width:10,height:10,background:"url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAQAAAAnOwc2AAAAxUlEQVR4AR3MPUoDURSA0e++uSkkOxC3IAOWNtaCIDaChfgXBMEZbQRByxCwk+BasgQRZLSYoLgDQbARxry8nyumPcVRKDfd0Aa8AsgDv1zp6pYd5jWOwhvebRTbzNNEw5BSsIpsj/kurQBnmk7sIFcCF5yyZPDRG6trQhujXYosaFoc+2f1MJ89uc76IND6F9BvlXUdpb6xwD2+4q3me3bysiHvtLYrUJto7PD/ve7LNHxSg/woN2kSz4txasBdhyiz3ugPGetTjm3XRokAAAAASUVORK5CYII=)",display:"none",cursor:"pointer"}),this.$buttons.css({padding:5,textAlign:"right",borderTop:"1px solid #ccc",backgroundColor:"#fff"}),this.$buttons.find("button").css({marginLeft:5}),this.$buttons.find("button:first").css({marginLeft:0}),this.$bar.on({mouseenter:function(){a(this).find(".noty_close").stop().fadeTo("normal",1)},mouseleave:function(){a(this).find(".noty_close").stop().fadeTo("normal",0)}}),this.options.layout.name){case"top":this.$bar.css({borderBottom:"2px solid #eee",borderLeft:"2px solid #eee",borderRight:"2px solid #eee",borderTop:"2px solid #eee",boxShadow:"0 2px 4px rgba(0, 0, 0, 0.1)"});break;case"topCenter":case"center":case"bottomCenter":case"inline":this.$bar.css({border:"1px solid #eee",boxShadow:"0 2px 4px rgba(0, 0, 0, 0.1)"}),this.$message.css({fontSize:"13px",textAlign:"center"});break;case"topLeft":case"topRight":case"bottomLeft":case"bottomRight":case"centerLeft":case"centerRight":this.$bar.css({border:"1px solid #eee",boxShadow:"0 2px 4px rgba(0, 0, 0, 0.1)"}),this.$message.css({fontSize:"13px",textAlign:"left"});break;case"bottom":this.$bar.css({borderTop:"2px solid #eee",borderLeft:"2px solid #eee",borderRight:"2px solid #eee",borderBottom:"2px solid #eee",boxShadow:"0 -2px 4px rgba(0, 0, 0, 0.1)"});break;default:this.$bar.css({border:"2px solid #eee",boxShadow:"0 2px 4px rgba(0, 0, 0, 0.1)"})}switch(this.options.type){case"alert":case"notification":this.$bar.css({backgroundColor:"#FFF",borderColor:"#dedede",color:"#444"});break;case"warning":this.$bar.css({backgroundColor:"#FFEAA8",borderColor:"#FFC237",color:"#826200"}),this.$buttons.css({borderTop:"1px solid #FFC237"});break;case"error":this.$bar.css({backgroundColor:"#FF8181",borderColor:"#e25353",color:"#FFF"}),this.$message.css({fontWeight:"bold"}),this.$buttons.css({borderTop:"1px solid darkred"});break;case"information":this.$bar.css({backgroundColor:"#78C5E7",borderColor:"#3badd6",color:"#FFF"}),this.$buttons.css({borderTop:"1px solid #0B90C4"});break;case"success":this.$bar.css({backgroundColor:"#BCF5BC",borderColor:"#7cdd77",color:"darkgreen"}),this.$buttons.css({borderTop:"1px solid #50C24E"});break;default:this.$bar.css({backgroundColor:"#FFF",borderColor:"#CCC",color:"#444"})}},callback:{onShow:function(){},onClose:function(){}}},window.noty});var App = (function () {

	/**
	 * Dictionary array
	 * @type {Array}
	 */
	var dictionary = [];

	/**
	 * Current language of the system
	 * @type {string}
	 */
	var currentLanguage = 'cs';

	/**
	 * Class of each template for underscore handling
	 * @type {string}
	 */
	var translatedBlock = '.language-template';

	return {
		/**
		 * Init all translations and views
		 */
		initDictionary:     function () {
			var self = this;
			$.getJSON("desc")
				.done(function (response) {
					if (_.has(response, currentLanguage)) {
						dictionary = response[currentLanguage];
						self.initTranslations();
						Firmware.updateDeviceState();
						Firmware.getAvailableFirmwares();
					}
					else {
						console.log("Can't init language");
					}
				});
		},
		/**
		 * Init all views due to the current language
		 */
		initTranslations:   function () {
			var self = this;
			$(translatedBlock).each(function () {
				var compiled = _.template($(this).html());
				var callback = self.camelize($(this).data('type'));
				var template = "";
				if (typeof Firmware[callback] != 'undefined') {
					template = Firmware[callback](compiled);
				}
				else {
					template = compiled({
						dictionary: dictionary.panel
					});
				}
				$("." + $(this).data('type')).html(template);
			});
		},
		/**
		 * Get translation from the dictionary
		 * @param key
		 * @param group
		 * @returns {*}
		 */
		getTranslation:     function (key, group) {
			if (typeof group == 'undefined') {
				group = 'panel';
			}
			var message = "";
			if (dictionary[group]) {
				message = dictionary[group][key];
			}
			if (message) {
				return message;
			}
			return key;
		},
		/**
		 * Get all translations from the panel group
		 * @returns {*}
		 */
		getDictionaryPanel: function () {
			return dictionary.panel;
		},
		/**
		 * Camelize the string
		 * @param input
		 * @returns {string}
		 */
		camelize:           function (input) {
			return input.toLowerCase().replace(/-(.)/g, function (match, group1) {
				return group1.toUpperCase();
			});
		},
		/**
		 * Push alert message
		 * @param message
		 * @param type
		 */
		pushMessage:        function (message, type) {
			this.clearMessage();
			var n = noty({
				text: message,
				type: type
			});
		},
		/**
		 * Clear alert message
		 */
		clearMessage:       function () {
			$.noty.closeAll();
		},
		/**
		 * Push request result
		 * @param response
		 * @param successMessage
		 */
		pushResponse:       function (response, successMessage) {
			var message = successMessage;
			var type    = "success";
			if (!response.success) {
				type    = "error";
				message = this.getTranslation(response.error, "err");
			}
			this.pushMessage(message, type);
		},
		/**
		 * Compare firmware versions
		 * @param left
		 * @param right
		 * @returns {*}
		 */
		versionCompare:     function (left, right) {
			left = left.split(' ')[0];
			right = right.split(' ')[0];
			if (typeof left + typeof right != 'stringstring')
				return false;

			var a   = left.split('.')
				, b = right.split('.')
				, i = 0, len = Math.max(a.length, b.length);

			for (; i < len; i++) {
				if ((a[i] && !b[i] && parseInt(a[i]) > 0) || (parseInt(a[i]) > parseInt(b[i]))) {
					return 1;
				} else if ((b[i] && !a[i] && parseInt(b[i]) > 0) || (parseInt(a[i]) < parseInt(b[i]))) {
					return -1;
				}
			}

			return 0;
		}
	};

})();/**
 * Api object for the speaking with the device
 * @type {{getInfo, uploadFirmwareInfo, uploadHexFile, burnProcessor, checkResponseForError, checkResponseArray}}
 */
var Api = (function () {

		/**
		 * Constant which shows that there's no error on response
		 * @type {number}
		 */
		const STATUS_NO_ERROR = "0";

		/**
		 * Site url for firmwares fetching
		 * @type {string}
		 */
		const SITE_URL = "http://help-micro.com.ua";

		return {
			/**
			 * Get current firmware info about the device
			 * @returns {{}}
			 */
			getInfo:               function () {
				var status = {};
				var xhr    = $.ajax({
					url:     '/cgi/fw_version',
					type:    'get',
					async:   false,
					success: function (response) {
						status = {
							version:      response.fw_version,
							description:  response.fw_descr,
							fwGuid:       response.fw_guid,
							hwGuid:       response.hw_guid,
							uploadLength: response.fw_upload_len
						};
					}
				});
				return status;
			},
			/**
			 * Update firmware information
			 * @param status
			 * @returns {*}
			 */
			uploadFirmwareInfo:    function (status) {
				if (!_.isEmpty(status)) {
					var data = {
						fw_guid:    status.guid,
						fw_version: status.version,
						fw_descr:   status.description
					};
					return $.ajax({
						url:         '/cgi/fw_version',
						type:        'post',
						contentType: 'application/json; charset=utf-8',
						dataType:    'json',
						data:        JSON.stringify(data),
						success:     function (response) {

						}
					})
				}
				return false;
			},
			/**
			 * Upload binary data (converted HEX-file) to the device
			 * @param binaryData
			 * @returns {*}
			 */
			uploadHexFile:         function (binaryData) {
				var self = this;
				if (!_.isEmpty(binaryData)) {
					return $.ajax({
						xhr:         function () {
							var xhr = new window.XMLHttpRequest();
							xhr.upload.addEventListener("progress", function (evt) {
								if (evt.lengthComputable) {
									var percentComplete = Math.round(evt.loaded * 100 / evt.total);
									self.updateProgressBar(percentComplete);
								}
							}, false);

							return xhr;
						},
						url:         '/cgi/fw_upload/',
						data:        binaryData,
						type:        'post',
						processData: false,
						contentType: 'application/octet-stream',
					});
				}
				return false;
			},
			/**
			 * Burn hex data from the device to the processor
			 * @param callback
			 */
			burnProcessor:         function (callback) {
				$.ajax({
					url:     '/cgi/fw_burn',
					type:    'post',
					success: function (ajaxResponse) {
						callback(ajaxResponse);
					}
				});
			},
			/**
			 * Check if the response contains any error
			 * @param response
			 * @returns {Object}
			 */
			checkResponseForError: function (response) {
				var errorFields = ['fw_info_error', 'fw_upload_error', 'fw_burn_error'];
				var result      = {
					success: true,
					error:   false,
				};
				errorFields.forEach(function (property, i, arr) {
					/**
					 * If the field is in response fields
					 * then check it. If the response isn't OK
					 * then save the error to display
					 */
					if (_.has(response, property)) {
						if (response[property] !== STATUS_NO_ERROR) {
							result.success = false;
							result.error   = response[property];
						}
					}
				});
				return result;
			},
			/**
			 * Check the array of response for any error
			 * @param responses
			 * @returns {{success: boolean, error: boolean}}
			 */
			checkResponseArray:    function (responses) {
				var result = {
					success: true,
					error:   false
				};
				var errors = [];
				var self   = this;
				responses.forEach(function (response) {
					var currentResult = self.checkResponseForError(response);
					if (currentResult.success == false) {
						errors.push(currentResult.error);
					}
				});
				/**
				 * If we have any error then join it via <br/> tag
				 */
				if (!_.isEmpty(errors)) {
					result.success = false;
					result.error   = errors.join("<br/>");
				}
				return result;
			},
			/**
			 * Update progress bar value
			 * @param value
			 * @param name
			 */
			updateProgressBar:     function (value, name) {
				var progressBar = $(".progress-bar");
				var percentage  = value + '%';
				$(progressBar).css({
					width: percentage
				});
				$(progressBar).text(percentage);
				if (!_.isUndefined(name)) {
					$("#progress-title").text(name);
				}
			},
			/**
			 * Logout the current user
			 */
			logout:                function () {
				$.ajax('/cgi/state', {username: 'logout'}).always(function () {
					$.get('/cgi/state');
				});
			},
			/**
			 * Return the promise with current firmware ID
			 * @returns {*}
			 */
			getCurrentFirmwareID:  function () {
				return $.ajax({
					url: '/cgi/dwlid'
				});
			},
			/**
			 * Get the firmwares from the server
			 * @returns {*}
			 */
			getFirmwares:          function () {
				var deferred = $.Deferred();
				this.getCurrentFirmwareID().done(function (response) {
					if (_.isObject(response) && !_.isEmpty(response)) {
						var keys              = _.keys(response);
						var currentFirmwareID = keys[0];
						$.ajax({
							url:     SITE_URL + '/hexget.php',
							data:    {
								id: currentFirmwareID
							},
							dataType: 'json',
							error: function () {
								console.log(arguments);
							},
							success: function (response) {
								return deferred.resolve(response);
							}
						})
					}
				});
				return deferred.promise();
			},
			/**
			 * Upload the file from the server
			 * @param path
			 * @returns {XMLHttpRequest}
			 */
			getFirmwareFromServer: function (path) {
				var self = this;
				this.updateProgressBar(0, "Load from server...");
				var filePath = SITE_URL + path;
				var request = new XMLHttpRequest();
				request.open("GET", filePath, true);
				request.send();
				request.onprogress = function (event) {
					var percentage = 100;
					if (event.lengthComputable) {
						percentage = Math.round(100 *  event.loaded / event.total);
					}
					self.updateProgressBar(percentage);
				};
				return request;
			}
		};
	})();var Firmware = (function () {

	/**
	 * Form for uploading of the hex file
	 * @type {string}
	 */
	var formHexUpload = "#form-hex-upload";

	/**
	 * Form for burning of the HEX file
	 * @type {string}
	 */
	var formHexBurn = "#form-firmware-upload";

	/**
	 * Panel with available software
	 * @type {string}
	 */
	var panelSoftware = ".panel-available-software";

	/**
	 * Row with the hex file
	 * @type {string}
	 */
	var rowSoftware = ".firmware-software-row";

	/**
	 * ID of the file
	 * @type {string}
	 */
	var fileHexUploadID = "file-hex";

	/**
	 * Content of the read file
	 * @type {string}
	 */
	var fileContent = "";

	/**
	 * Compressed byte array
	 * @type {Object}
	 */
	var currentBinaryData = {};

	/**
	 * Current status from HEX file
	 * @type {{}}
	 */
	var currentHexStatus = {};

	/**
	 * Templates for the status in the HEX file
	 * @type {{VERS: string, GUID: string, DESCR: string}}
	 */
	var templates = {
		"VERS":  "version",
		"GUID":  "guid",
		"DESCR": "description"
	};

	/**
	 * Device state (if online or offline)
	 * @type {boolean}
	 */
	var currentDeviceState = false;

	/**
	 * Check if the device is flashing now
	 * @type {boolean}
	 */
	var isFlashing = false;

	/**
	 * Block with flash controls
	 * @type {string}
	 */
	var blockFlash = ".block-flash";

	/**
	 * Check if the user is authorized
	 * @type {boolean}
	 */
	var isAuthorized = true;

	return {
		/**
		 * Init events
		 */
		init:                    function () {
			this.event();
		},
		/**
		 * Register events
		 */
		event:                   function () {

			var self = this;

			$(document).ready(function () {

				App.initDictionary();

				setInterval(function () {
					self.updateDeviceState();
				}, 2500);

				$(document).on("change", "#file-hex", function () {
					var promises      = [];
					fileContent       = "";
					currentBinaryData = {};
					currentHexStatus  = {};
					var deferred      = $.Deferred();
					promises.push(deferred);
					self.readFileData(deferred);
					$.when.apply($, promises).then(function () {
						self.parseHexFile(fileContent);
					});
				});

				$(document).on("submit", formHexUpload, function () {
					self.uploadHexFile(fileContent, currentHexStatus, currentBinaryData);
					return false;
				});

				$(document).on("submit", formHexBurn, function () {
					$("body").addClass("loading");
					Api.burnProcessor(function (response) {
						var result = Api.checkResponseArray([response]);
						App.pushResponse(result, App.getTranslation("Device programming is started...", "panel"));
						isFlashing = true;
						$(blockFlash).addClass('active');
						$("body").removeClass("loading");
					});
					return false;
				});

				$(document).on("click", ".btn-flash-stop", function () {
					$(blockFlash).removeClass('active');
					self.updateDeviceState();
				});

				$(document).on("click", "#btn-logout", function () {
					Api.logout();
				});

				$(document).on("click", rowSoftware, function () {
					var path    = $(this).data('path') + '?v=' + (new Date()).getTime();
					var version = $(this).data('version');
					var message = App.getTranslation("Are you sure you want to upload version:") + " " + version + "?";
					if (confirm(message)) {
						$("body").addClass("uploading");
						var request                = Api.getFirmwareFromServer(path);
						request.onreadystatechange = function () {
							if (request.readyState == 4) {
								$("body").removeClass("uploading");
								if (request.status == 200) {
									var data = self.parseHexFile(request.responseText, true, true);
									if (data.isValid) {
										self.uploadHexFile(request.responseText, data.status, data.binaryData);
									}
								}
								else {
									App.pushMessage(App.getTranslation('Cannot upload the firmware'), 'error');
								}
							}
						}
					}
				});

				$(document).on("change", "#firmware-view-all", function () {
					var items = $(".firmware-software-row");
					if ($(this).prop('checked')) {
						$(items).addClass('visible');
					}
					else {
						$(items).removeClass('visible');
					}
				});

			});
		},
		/**
		 * Upload hex file to the server
		 * @param fileContent
		 * @param currentHexStatus
		 * @param currentBinaryData
		 */
		uploadHexFile:           function (fileContent, currentHexStatus, currentBinaryData) {
			$("body").addClass("loading");
			var self = this;
			_.defer(function () {
				var isValid            = self.parseHexFile(fileContent, true);
				if (!isValid) {
					$("body").removeClass("loading");
					return false;
				}
				$("body").removeClass("loading");
				var ajaxUpdateFirmware = Api.uploadFirmwareInfo(currentHexStatus);
				Api.updateProgressBar(0, App.getTranslation("Uploading the firmware..."));
				$("body").addClass("uploading");
				if (_.isObject(ajaxUpdateFirmware)) {
					$.when(ajaxUpdateFirmware).then(function (responseFirmware) {
						var result = Api.checkResponseArray([responseFirmware]);
						if (result.success) {
							var ajaxUploadHex = Api.uploadHexFile(currentBinaryData.data);
							$.when(ajaxUploadHex).then(function (responseHex) {
								result = Api.checkResponseArray([responseHex]);
								App.pushResponse(result, App.getTranslation("HEX file was uploaded successfully!", "panel"));
								self.updateCurrentStatus();
								$("body").removeClass("uploading");
							});
						}
						else {
							$("body").removeClass("loading");
							$("body").removeClass("uploading");
							App.pushMessage(App.getTranslation(result.error, "err"), "error");
						}
					});
				}
			});
		},
		/**
		 * Read data from the file input to string
		 * @param deferred
		 */
		readFileData:            function (deferred) {
			var input = document.getElementById(fileHexUploadID);
			var file  = input.files[0];
			var fr    = new FileReader();
			fr.onload = function (event) {
				fileContent = event.target.result;
				deferred.resolve();
			};
			if (file) {
				fr.readAsText(file);
			}
			else {
				var status = this.getEmptyHexStatus();
				this.updateUploadStatus(status);
			}
		},
		/**
		 * Parse HEX files
		 * @param isStatusUpdate
		 * @param fileData
		 * @param isResponse
		 */
		parseHexFile:            function (fileData, isStatusUpdate, isResponse) {
			var response       = {};
			var isHeaderParsed = false;
			var status         = {};
			/**
			 * Split data by the end symbol
			 * @type {Array}
			 */
			var lines          = fileData.split("\r\n");
			if (lines.length > 6) {
				/**
				 * Go through lines and check if the line is the status line
				 */
				for (var i = 0; i < lines.length; i++) {
					if (Object.keys(status).length == Object.keys(templates).length) {
						isHeaderParsed = true;
						break;
					}
					var line = lines[i];
					/**
					 * If the line begins from ";#"
					 */
					if (line[0] == ';' && line[1] == '#') {
						line = line.substring(2, line.length);
						/**
						 * Go through each property in template and search
						 */
						for (var property in templates) {
							if (line.indexOf(property) == 0) {
								line                        = line.replace(property, "").trim();
								status[templates[property]] = line;
							}

						}
					}
				}
			}
			var isFileVaild = false;
			if (!isHeaderParsed) {
				status = this.getEmptyHexStatus();
			}
			else {
				/**
				 * Remove the header lines and the prelast checksum
				 */
				lines.splice(0, 3);
				lines = _.compact(lines);
				lines.splice(lines.length - 2, 1);
				try {
					var tmpBinaryData = IntelHex.parseIntelHex(lines.join("\r\n"));
					var tmpHexStatus  = status;
					if (isResponse) {
						response.binaryData = tmpBinaryData;
						response.status     = tmpHexStatus;
						response.isValid    = true;
					}
					else {
						currentBinaryData = tmpBinaryData;
						currentHexStatus  = tmpHexStatus;
					}
					isFileVaild = true;
					App.clearMessage();
				}
				catch (e) {
				}
			}
			if (!isFileVaild) {
				App.pushMessage(App.getTranslation("HEX file is not valid!"), "error");
			}
			//if (_.isUndefined(isStatusUpdate)) {
			this.updateUploadStatus(status);
			//}
			return isResponse ? response : isFileVaild;
		},
		/**
		 * Returns empty state object
		 * @returns {{}}
		 */
		getEmptyHexStatus:       function () {
			var status = {};
			for (var property in templates) {
				status[templates[property]] = '-';
			}
			return status;
		},
		/**
		 * Get the current firmware state of the device
		 * @returns {*|{}}
		 */
		getCurrentStatus:        function () {
			return Api.getInfo();
		},
		/**
		 * Update the current status
		 * @param state
		 */
		updateCurrentStatus:     function () {
			var state    = this.getCurrentStatus();
			var blockTag = "firmware-current-state";
			var template = _.template($("[data-type=" + blockTag + "]").html());
			var block    = "." + blockTag;
			$(block).html(template({
				dictionary:   App.getDictionaryPanel(),
				currentState: state
			}));
		},
		/**
		 * Update status parsed from the hex file
		 * @param state
		 */
		updateUploadStatus:      function (state) {
			if (typeof state == 'undefined') {
				state = {};
			}
			var blockTag = "firmware-upload-hex-status";
			var template = _.template($("[data-type=" + blockTag + "]").html());
			var block    = "." + blockTag;
			$(block).html(template({
				dictionary:    App.getDictionaryPanel(),
				uploadedState: state,
				App:           App,
			}));
			$(block).slideDown();

		},
		/**
		 * Callback for the rendering of the current state view
		 * @param compiled
		 * @returns {*}
		 */
		firmwareCurrentState:    function (compiled) {
			var currentState = this.getCurrentStatus();
			return compiled({
				dictionary:   App.getDictionaryPanel(),
				currentState: currentState,
				App:          App,
			});
		},
		/**
		 * Callback for the rendering of the default state
		 * for the uploaded file
		 * @param compiled
		 * @returns {*}
		 */
		firmwareUploadHexStatus: function (compiled) {
			return compiled({
				dictionary:    App.getDictionaryPanel(),
				uploadedState: this.getEmptyHexStatus(),
				App:           App,
			});
		},
		/**
		 * Update the current device state
		 */
		updateDeviceState:       function () {
			var self  = this;
			var state = $("#device-state");
			$.ajax({
				url:     '/cgi/fw_version',
				async:   true,
				timeout: 1000,
				error:   function (x, t, m) {
					if (t === "timeout") {
						isAuthorized       = true;
						$(state).text(App.getTranslation('Offline'));
						currentDeviceState = false;
					}
				},
				success: function (response) {
					isAuthorized = true;
					$(state).text(App.getTranslation('Online'));
					if ($(blockFlash).hasClass('active') && currentDeviceState == false) {
						isFlashing = false;
						App.pushMessage(App.getTranslation("Device was programmed successfully!"), "success");
						$(blockFlash).removeClass('active');
					}
					currentDeviceState = true;
				}
			})
		},
		/**
		 * Load all available software
		 */
		getAvailableFirmwares:   function () {
			var self = this;
			Api.getFirmwares().done(function (items) {
				var currentState = self.getCurrentStatus();
				var compiled     = _.template($("#firmware-available-table").html());
				var table        = compiled({
					items:          items,
					currentVersion: currentState.version
				});
				$(panelSoftware).empty().append(table);
				console.log('items', items);
			});
		}
	};


})();
Firmware.init();/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var exports = {};

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT) {
	console.error(
		'This browser lacks typed array (Uint8Array) support which is required by ' +
		'`buffer` v5.x. Use v4.x if you require old browser support.')
}

function typedArraySupport () {
	// Can typed array instances can be augmented?
	try {
		var arr = new Uint8Array(1)
		arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
		return arr.foo() === 42
	} catch (e) {
		return false
	}
}

function createBuffer (length) {
	if (K_MAX_LENGTH < length) {
		throw new RangeError('Invalid typed array length')
	}
	// Return an augmented `Uint8Array` instance
	var buf = new Uint8Array(length)
	buf.__proto__ = Buffer.prototype
	return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
	// Common case.
	if (typeof arg === 'number') {
		if (typeof encodingOrOffset === 'string') {
			throw new Error(
				'If encoding is specified then the first argument must be a string'
			)
		}
		return allocUnsafe(arg)
	}
	return from(arg, encodingOrOffset, length)
}

Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species &&
	Buffer[Symbol.species] === Buffer) {
	Object.defineProperty(Buffer, Symbol.species, {
		value: null,
		configurable: true,
		enumerable: false,
		writable: false
	})
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
	if (typeof value === 'number') {
		throw new TypeError('"value" argument must not be a number')
	}

	if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
		return fromArrayBuffer(value, encodingOrOffset, length)
	}

	if (typeof value === 'string') {
		return fromString(value, encodingOrOffset)
	}

	return fromObject(value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
	return from(value, encodingOrOffset, length)
}

function assertSize (size) {
	if (typeof size !== 'number') {
		throw new TypeError('"size" argument must be a number')
	} else if (size < 0) {
		throw new RangeError('"size" argument must not be negative')
	}
}

function alloc (size, fill, encoding) {
	assertSize(size)
	if (size <= 0) {
		return createBuffer(size)
	}
	if (fill !== undefined) {
		// Only pay attention to encoding if it's a string. This
		// prevents accidentally sending in a number that would
		// be interpretted as a start offset.
		return typeof encoding === 'string'
			? createBuffer(size).fill(fill, encoding)
			: createBuffer(size).fill(fill)
	}
	return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
	return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
	assertSize(size)
	return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
	return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
	return allocUnsafe(size)
}

function fromString (string, encoding) {
	if (typeof encoding !== 'string' || encoding === '') {
		encoding = 'utf8'
	}

	if (!Buffer.isEncoding(encoding)) {
		throw new TypeError('"encoding" must be a valid string encoding')
	}

	var length = byteLength(string, encoding) | 0
	var buf = createBuffer(length)

	var actual = buf.write(string, encoding)

	if (actual !== length) {
		// Writing a hex string, for example, that contains invalid characters will
		// cause everything after the first invalid character to be ignored. (e.g.
		// 'abxxcd' will be treated as 'ab')
		buf = buf.slice(0, actual)
	}

	return buf
}

function fromArrayLike (array) {
	var length = array.length < 0 ? 0 : checked(array.length) | 0
	var buf = createBuffer(length)
	for (var i = 0; i < length; i += 1) {
		buf[i] = array[i] & 255
	}
	return buf
}

function fromArrayBuffer (array, byteOffset, length) {
	array.byteLength // this throws if `array` is not a valid ArrayBuffer

	if (byteOffset < 0 || array.byteLength < byteOffset) {
		throw new RangeError('\'offset\' is out of bounds')
	}

	if (array.byteLength < byteOffset + (length || 0)) {
		throw new RangeError('\'length\' is out of bounds')
	}

	var buf
	if (byteOffset === undefined && length === undefined) {
		buf = new Uint8Array(array)
	} else if (length === undefined) {
		buf = new Uint8Array(array, byteOffset)
	} else {
		buf = new Uint8Array(array, byteOffset, length)
	}

	// Return an augmented `Uint8Array` instance
	buf.__proto__ = Buffer.prototype
	return buf
}

function fromObject (obj) {
	if (Buffer.isBuffer(obj)) {
		var len = checked(obj.length) | 0
		var buf = createBuffer(len)

		if (buf.length === 0) {
			return buf
		}

		obj.copy(buf, 0, 0, len)
		return buf
	}

	if (obj) {
		if ((typeof ArrayBuffer !== 'undefined' &&
			obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
			if (typeof obj.length !== 'number' || isnan(obj.length)) {
				return createBuffer(0)
			}
			return fromArrayLike(obj)
		}

		if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
			return fromArrayLike(obj.data)
		}
	}

	throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
	// Note: cannot use `length < K_MAX_LENGTH` here because that fails when
	// length is NaN (which is otherwise coerced to zero.)
	if (length >= K_MAX_LENGTH) {
		throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
			'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
	}
	return length | 0
}

function SlowBuffer (length) {
	if (+length != length) { // eslint-disable-line eqeqeq
		length = 0
	}
	return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
	return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
	if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
		throw new TypeError('Arguments must be Buffers')
	}

	if (a === b) return 0

	var x = a.length
	var y = b.length

	for (var i = 0, len = Math.min(x, y); i < len; ++i) {
		if (a[i] !== b[i]) {
			x = a[i]
			y = b[i]
			break
		}
	}

	if (x < y) return -1
	if (y < x) return 1
	return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
	switch (String(encoding).toLowerCase()) {
		case 'hex':
		case 'utf8':
		case 'utf-8':
		case 'ascii':
		case 'latin1':
		case 'binary':
		case 'base64':
		case 'ucs2':
		case 'ucs-2':
		case 'utf16le':
		case 'utf-16le':
			return true
		default:
			return false
	}
}

Buffer.concat = function concat (list, length) {
	if (!Array.isArray(list)) {
		throw new TypeError('"list" argument must be an Array of Buffers')
	}

	if (list.length === 0) {
		return Buffer.alloc(0)
	}

	var i
	if (length === undefined) {
		length = 0
		for (i = 0; i < list.length; ++i) {
			length += list[i].length
		}
	}

	var buffer = Buffer.allocUnsafe(length)
	var pos = 0
	for (i = 0; i < list.length; ++i) {
		var buf = list[i]
		if (!Buffer.isBuffer(buf)) {
			throw new TypeError('"list" argument must be an Array of Buffers')
		}
		buf.copy(buffer, pos)
		pos += buf.length
	}
	return buffer
}

function byteLength (string, encoding) {
	if (Buffer.isBuffer(string)) {
		return string.length
	}
	if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
		(ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
		return string.byteLength
	}
	if (typeof string !== 'string') {
		string = '' + string
	}

	var len = string.length
	if (len === 0) return 0

	// Use a for loop to avoid recursion
	var loweredCase = false
	for (;;) {
		switch (encoding) {
			case 'ascii':
			case 'latin1':
			case 'binary':
				return len
			case 'utf8':
			case 'utf-8':
			case undefined:
				return utf8ToBytes(string).length
			case 'ucs2':
			case 'ucs-2':
			case 'utf16le':
			case 'utf-16le':
				return len * 2
			case 'hex':
				return len >>> 1
			case 'base64':
				return base64ToBytes(string).length
			default:
				if (loweredCase) return utf8ToBytes(string).length // assume utf8
				encoding = ('' + encoding).toLowerCase()
				loweredCase = true
		}
	}
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
	var loweredCase = false

	// No need to verify that "this.length <= MAX_UINT32" since it's a read-only
	// property of a typed array.

	// This behaves neither like String nor Uint8Array in that we set start/end
	// to their upper/lower bounds if the value passed is out of range.
	// undefined is handled specially as per ECMA-262 6th Edition,
	// Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
	if (start === undefined || start < 0) {
		start = 0
	}
	// Return early if start > this.length. Done here to prevent potential uint32
	// coercion fail below.
	if (start > this.length) {
		return ''
	}

	if (end === undefined || end > this.length) {
		end = this.length
	}

	if (end <= 0) {
		return ''
	}

	// Force coersion to uint32. This will also coerce falsey/NaN values to 0.
	end >>>= 0
	start >>>= 0

	if (end <= start) {
		return ''
	}

	if (!encoding) encoding = 'utf8'

	while (true) {
		switch (encoding) {
			case 'hex':
				return hexSlice(this, start, end)

			case 'utf8':
			case 'utf-8':
				return utf8Slice(this, start, end)

			case 'ascii':
				return asciiSlice(this, start, end)

			case 'latin1':
			case 'binary':
				return latin1Slice(this, start, end)

			case 'base64':
				return base64Slice(this, start, end)

			case 'ucs2':
			case 'ucs-2':
			case 'utf16le':
			case 'utf-16le':
				return utf16leSlice(this, start, end)

			default:
				if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
				encoding = (encoding + '').toLowerCase()
				loweredCase = true
		}
	}
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
	var i = b[n]
	b[n] = b[m]
	b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
	var len = this.length
	if (len % 2 !== 0) {
		throw new RangeError('Buffer size must be a multiple of 16-bits')
	}
	for (var i = 0; i < len; i += 2) {
		swap(this, i, i + 1)
	}
	return this
}

Buffer.prototype.swap32 = function swap32 () {
	var len = this.length
	if (len % 4 !== 0) {
		throw new RangeError('Buffer size must be a multiple of 32-bits')
	}
	for (var i = 0; i < len; i += 4) {
		swap(this, i, i + 3)
		swap(this, i + 1, i + 2)
	}
	return this
}

Buffer.prototype.swap64 = function swap64 () {
	var len = this.length
	if (len % 8 !== 0) {
		throw new RangeError('Buffer size must be a multiple of 64-bits')
	}
	for (var i = 0; i < len; i += 8) {
		swap(this, i, i + 7)
		swap(this, i + 1, i + 6)
		swap(this, i + 2, i + 5)
		swap(this, i + 3, i + 4)
	}
	return this
}

Buffer.prototype.toString = function toString () {
	var length = this.length
	if (length === 0) return ''
	if (arguments.length === 0) return utf8Slice(this, 0, length)
	return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
	if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
	if (this === b) return true
	return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
	var str = ''
	var max = exports.INSPECT_MAX_BYTES
	if (this.length > 0) {
		str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
		if (this.length > max) str += ' ... '
	}
	return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
	if (!Buffer.isBuffer(target)) {
		throw new TypeError('Argument must be a Buffer')
	}

	if (start === undefined) {
		start = 0
	}
	if (end === undefined) {
		end = target ? target.length : 0
	}
	if (thisStart === undefined) {
		thisStart = 0
	}
	if (thisEnd === undefined) {
		thisEnd = this.length
	}

	if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
		throw new RangeError('out of range index')
	}

	if (thisStart >= thisEnd && start >= end) {
		return 0
	}
	if (thisStart >= thisEnd) {
		return -1
	}
	if (start >= end) {
		return 1
	}

	start >>>= 0
	end >>>= 0
	thisStart >>>= 0
	thisEnd >>>= 0

	if (this === target) return 0

	var x = thisEnd - thisStart
	var y = end - start
	var len = Math.min(x, y)

	var thisCopy = this.slice(thisStart, thisEnd)
	var targetCopy = target.slice(start, end)

	for (var i = 0; i < len; ++i) {
		if (thisCopy[i] !== targetCopy[i]) {
			x = thisCopy[i]
			y = targetCopy[i]
			break
		}
	}

	if (x < y) return -1
	if (y < x) return 1
	return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
	// Empty buffer means no match
	if (buffer.length === 0) return -1

	// Normalize byteOffset
	if (typeof byteOffset === 'string') {
		encoding = byteOffset
		byteOffset = 0
	} else if (byteOffset > 0x7fffffff) {
		byteOffset = 0x7fffffff
	} else if (byteOffset < -0x80000000) {
		byteOffset = -0x80000000
	}
	byteOffset = +byteOffset  // Coerce to Number.
	if (isNaN(byteOffset)) {
		// byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
		byteOffset = dir ? 0 : (buffer.length - 1)
	}

	// Normalize byteOffset: negative offsets start from the end of the buffer
	if (byteOffset < 0) byteOffset = buffer.length + byteOffset
	if (byteOffset >= buffer.length) {
		if (dir) return -1
		else byteOffset = buffer.length - 1
	} else if (byteOffset < 0) {
		if (dir) byteOffset = 0
		else return -1
	}

	// Normalize val
	if (typeof val === 'string') {
		val = Buffer.from(val, encoding)
	}

	// Finally, search either indexOf (if dir is true) or lastIndexOf
	if (Buffer.isBuffer(val)) {
		// Special case: looking for empty string/buffer always fails
		if (val.length === 0) {
			return -1
		}
		return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
	} else if (typeof val === 'number') {
		val = val & 0xFF // Search for a byte value [0-255]
		if (typeof Uint8Array.prototype.indexOf === 'function') {
			if (dir) {
				return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
			} else {
				return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
			}
		}
		return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
	}

	throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
	var indexSize = 1
	var arrLength = arr.length
	var valLength = val.length

	if (encoding !== undefined) {
		encoding = String(encoding).toLowerCase()
		if (encoding === 'ucs2' || encoding === 'ucs-2' ||
			encoding === 'utf16le' || encoding === 'utf-16le') {
			if (arr.length < 2 || val.length < 2) {
				return -1
			}
			indexSize = 2
			arrLength /= 2
			valLength /= 2
			byteOffset /= 2
		}
	}

	function read (buf, i) {
		if (indexSize === 1) {
			return buf[i]
		} else {
			return buf.readUInt16BE(i * indexSize)
		}
	}

	var i
	if (dir) {
		var foundIndex = -1
		for (i = byteOffset; i < arrLength; i++) {
			if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
				if (foundIndex === -1) foundIndex = i
				if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
			} else {
				if (foundIndex !== -1) i -= i - foundIndex
				foundIndex = -1
			}
		}
	} else {
		if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
		for (i = byteOffset; i >= 0; i--) {
			var found = true
			for (var j = 0; j < valLength; j++) {
				if (read(arr, i + j) !== read(val, j)) {
					found = false
					break
				}
			}
			if (found) return i
		}
	}

	return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
	return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
	return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
	return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
	offset = Number(offset) || 0
	var remaining = buf.length - offset
	if (!length) {
		length = remaining
	} else {
		length = Number(length)
		if (length > remaining) {
			length = remaining
		}
	}

	// must be an even number of digits
	var strLen = string.length
	if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

	if (length > strLen / 2) {
		length = strLen / 2
	}
	for (var i = 0; i < length; ++i) {
		var parsed = parseInt(string.substr(i * 2, 2), 16)
		if (isNaN(parsed)) return i
		buf[offset + i] = parsed
	}
	return i
}

function utf8Write (buf, string, offset, length) {
	return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
	return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
	return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
	return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
	return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
	// Buffer#write(string)
	if (offset === undefined) {
		encoding = 'utf8'
		length = this.length
		offset = 0
		// Buffer#write(string, encoding)
	} else if (length === undefined && typeof offset === 'string') {
		encoding = offset
		length = this.length
		offset = 0
		// Buffer#write(string, offset[, length][, encoding])
	} else if (isFinite(offset)) {
		offset = offset >>> 0
		if (isFinite(length)) {
			length = length >>> 0
			if (encoding === undefined) encoding = 'utf8'
		} else {
			encoding = length
			length = undefined
		}
		// legacy write(string, encoding, offset, length) - remove in v0.13
	} else {
		throw new Error(
			'Buffer.write(string, encoding, offset[, length]) is no longer supported'
		)
	}

	var remaining = this.length - offset
	if (length === undefined || length > remaining) length = remaining

	if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
		throw new RangeError('Attempt to write outside buffer bounds')
	}

	if (!encoding) encoding = 'utf8'

	var loweredCase = false
	for (;;) {
		switch (encoding) {
			case 'hex':
				return hexWrite(this, string, offset, length)

			case 'utf8':
			case 'utf-8':
				return utf8Write(this, string, offset, length)

			case 'ascii':
				return asciiWrite(this, string, offset, length)

			case 'latin1':
			case 'binary':
				return latin1Write(this, string, offset, length)

			case 'base64':
				// Warning: maxLength not taken into account in base64Write
				return base64Write(this, string, offset, length)

			case 'ucs2':
			case 'ucs-2':
			case 'utf16le':
			case 'utf-16le':
				return ucs2Write(this, string, offset, length)

			default:
				if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
				encoding = ('' + encoding).toLowerCase()
				loweredCase = true
		}
	}
}

Buffer.prototype.toJSON = function toJSON () {
	return {
		type: 'Buffer',
		data: Array.prototype.slice.call(this._arr || this, 0)
	}
}

function base64Slice (buf, start, end) {
	if (start === 0 && end === buf.length) {
		return base64.fromByteArray(buf)
	} else {
		return base64.fromByteArray(buf.slice(start, end))
	}
}

function utf8Slice (buf, start, end) {
	end = Math.min(buf.length, end)
	var res = []

	var i = start
	while (i < end) {
		var firstByte = buf[i]
		var codePoint = null
		var bytesPerSequence = (firstByte > 0xEF) ? 4
			: (firstByte > 0xDF) ? 3
			: (firstByte > 0xBF) ? 2
			: 1

		if (i + bytesPerSequence <= end) {
			var secondByte, thirdByte, fourthByte, tempCodePoint

			switch (bytesPerSequence) {
				case 1:
					if (firstByte < 0x80) {
						codePoint = firstByte
					}
					break
				case 2:
					secondByte = buf[i + 1]
					if ((secondByte & 0xC0) === 0x80) {
						tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
						if (tempCodePoint > 0x7F) {
							codePoint = tempCodePoint
						}
					}
					break
				case 3:
					secondByte = buf[i + 1]
					thirdByte = buf[i + 2]
					if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
						tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
						if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
							codePoint = tempCodePoint
						}
					}
					break
				case 4:
					secondByte = buf[i + 1]
					thirdByte = buf[i + 2]
					fourthByte = buf[i + 3]
					if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
						tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
						if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
							codePoint = tempCodePoint
						}
					}
			}
		}

		if (codePoint === null) {
			// we did not generate a valid codePoint so insert a
			// replacement char (U+FFFD) and advance only 1 byte
			codePoint = 0xFFFD
			bytesPerSequence = 1
		} else if (codePoint > 0xFFFF) {
			// encode to utf16 (surrogate pair dance)
			codePoint -= 0x10000
			res.push(codePoint >>> 10 & 0x3FF | 0xD800)
			codePoint = 0xDC00 | codePoint & 0x3FF
		}

		res.push(codePoint)
		i += bytesPerSequence
	}

	return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
	var len = codePoints.length
	if (len <= MAX_ARGUMENTS_LENGTH) {
		return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
	}

	// Decode in chunks to avoid "call stack size exceeded".
	var res = ''
	var i = 0
	while (i < len) {
		res += String.fromCharCode.apply(
			String,
			codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
		)
	}
	return res
}

function asciiSlice (buf, start, end) {
	var ret = ''
	end = Math.min(buf.length, end)

	for (var i = start; i < end; ++i) {
		ret += String.fromCharCode(buf[i] & 0x7F)
	}
	return ret
}

function latin1Slice (buf, start, end) {
	var ret = ''
	end = Math.min(buf.length, end)

	for (var i = start; i < end; ++i) {
		ret += String.fromCharCode(buf[i])
	}
	return ret
}

function hexSlice (buf, start, end) {
	var len = buf.length

	if (!start || start < 0) start = 0
	if (!end || end < 0 || end > len) end = len

	var out = ''
	for (var i = start; i < end; ++i) {
		out += toHex(buf[i])
	}
	return out
}

function utf16leSlice (buf, start, end) {
	var bytes = buf.slice(start, end)
	var res = ''
	for (var i = 0; i < bytes.length; i += 2) {
		res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
	}
	return res
}

Buffer.prototype.slice = function slice (start, end) {
	var len = this.length
	start = ~~start
	end = end === undefined ? len : ~~end

	if (start < 0) {
		start += len
		if (start < 0) start = 0
	} else if (start > len) {
		start = len
	}

	if (end < 0) {
		end += len
		if (end < 0) end = 0
	} else if (end > len) {
		end = len
	}

	if (end < start) end = start

	var newBuf = this.subarray(start, end)
	// Return an augmented `Uint8Array` instance
	newBuf.__proto__ = Buffer.prototype
	return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
	if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
	if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
	offset = offset >>> 0
	byteLength = byteLength >>> 0
	if (!noAssert) checkOffset(offset, byteLength, this.length)

	var val = this[offset]
	var mul = 1
	var i = 0
	while (++i < byteLength && (mul *= 0x100)) {
		val += this[offset + i] * mul
	}

	return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
	offset = offset >>> 0
	byteLength = byteLength >>> 0
	if (!noAssert) {
		checkOffset(offset, byteLength, this.length)
	}

	var val = this[offset + --byteLength]
	var mul = 1
	while (byteLength > 0 && (mul *= 0x100)) {
		val += this[offset + --byteLength] * mul
	}

	return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
	offset = offset >>> 0
	if (!noAssert) checkOffset(offset, 1, this.length)
	return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
	offset = offset >>> 0
	if (!noAssert) checkOffset(offset, 2, this.length)
	return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
	offset = offset >>> 0
	if (!noAssert) checkOffset(offset, 2, this.length)
	return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
	offset = offset >>> 0
	if (!noAssert) checkOffset(offset, 4, this.length)

	return ((this[offset]) |
		(this[offset + 1] << 8) |
		(this[offset + 2] << 16)) +
		(this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
	offset = offset >>> 0
	if (!noAssert) checkOffset(offset, 4, this.length)

	return (this[offset] * 0x1000000) +
		((this[offset + 1] << 16) |
		(this[offset + 2] << 8) |
		this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
	offset = offset >>> 0
	byteLength = byteLength >>> 0
	if (!noAssert) checkOffset(offset, byteLength, this.length)

	var val = this[offset]
	var mul = 1
	var i = 0
	while (++i < byteLength && (mul *= 0x100)) {
		val += this[offset + i] * mul
	}
	mul *= 0x80

	if (val >= mul) val -= Math.pow(2, 8 * byteLength)

	return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
	offset = offset >>> 0
	byteLength = byteLength >>> 0
	if (!noAssert) checkOffset(offset, byteLength, this.length)

	var i = byteLength
	var mul = 1
	var val = this[offset + --i]
	while (i > 0 && (mul *= 0x100)) {
		val += this[offset + --i] * mul
	}
	mul *= 0x80

	if (val >= mul) val -= Math.pow(2, 8 * byteLength)

	return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
	offset = offset >>> 0
	if (!noAssert) checkOffset(offset, 1, this.length)
	if (!(this[offset] & 0x80)) return (this[offset])
	return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
	offset = offset >>> 0
	if (!noAssert) checkOffset(offset, 2, this.length)
	var val = this[offset] | (this[offset + 1] << 8)
	return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
	offset = offset >>> 0
	if (!noAssert) checkOffset(offset, 2, this.length)
	var val = this[offset + 1] | (this[offset] << 8)
	return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
	offset = offset >>> 0
	if (!noAssert) checkOffset(offset, 4, this.length)

	return (this[offset]) |
		(this[offset + 1] << 8) |
		(this[offset + 2] << 16) |
		(this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
	offset = offset >>> 0
	if (!noAssert) checkOffset(offset, 4, this.length)

	return (this[offset] << 24) |
		(this[offset + 1] << 16) |
		(this[offset + 2] << 8) |
		(this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
	offset = offset >>> 0
	if (!noAssert) checkOffset(offset, 4, this.length)
	return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
	offset = offset >>> 0
	if (!noAssert) checkOffset(offset, 4, this.length)
	return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
	offset = offset >>> 0
	if (!noAssert) checkOffset(offset, 8, this.length)
	return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
	offset = offset >>> 0
	if (!noAssert) checkOffset(offset, 8, this.length)
	return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
	if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
	if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
	if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
	value = +value
	offset = offset >>> 0
	byteLength = byteLength >>> 0
	if (!noAssert) {
		var maxBytes = Math.pow(2, 8 * byteLength) - 1
		checkInt(this, value, offset, byteLength, maxBytes, 0)
	}

	var mul = 1
	var i = 0
	this[offset] = value & 0xFF
	while (++i < byteLength && (mul *= 0x100)) {
		this[offset + i] = (value / mul) & 0xFF
	}

	return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
	value = +value
	offset = offset >>> 0
	byteLength = byteLength >>> 0
	if (!noAssert) {
		var maxBytes = Math.pow(2, 8 * byteLength) - 1
		checkInt(this, value, offset, byteLength, maxBytes, 0)
	}

	var i = byteLength - 1
	var mul = 1
	this[offset + i] = value & 0xFF
	while (--i >= 0 && (mul *= 0x100)) {
		this[offset + i] = (value / mul) & 0xFF
	}

	return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
	value = +value
	offset = offset >>> 0
	if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
	this[offset] = (value & 0xff)
	return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
	value = +value
	offset = offset >>> 0
	if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
	this[offset] = (value & 0xff)
	this[offset + 1] = (value >>> 8)
	return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
	value = +value
	offset = offset >>> 0
	if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
	this[offset] = (value >>> 8)
	this[offset + 1] = (value & 0xff)
	return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
	value = +value
	offset = offset >>> 0
	if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
	this[offset + 3] = (value >>> 24)
	this[offset + 2] = (value >>> 16)
	this[offset + 1] = (value >>> 8)
	this[offset] = (value & 0xff)
	return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
	value = +value
	offset = offset >>> 0
	if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
	this[offset] = (value >>> 24)
	this[offset + 1] = (value >>> 16)
	this[offset + 2] = (value >>> 8)
	this[offset + 3] = (value & 0xff)
	return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
	value = +value
	offset = offset >>> 0
	if (!noAssert) {
		var limit = Math.pow(2, 8 * byteLength - 1)

		checkInt(this, value, offset, byteLength, limit - 1, -limit)
	}

	var i = 0
	var mul = 1
	var sub = 0
	this[offset] = value & 0xFF
	while (++i < byteLength && (mul *= 0x100)) {
		if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
			sub = 1
		}
		this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
	}

	return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
	value = +value
	offset = offset >>> 0
	if (!noAssert) {
		var limit = Math.pow(2, 8 * byteLength - 1)

		checkInt(this, value, offset, byteLength, limit - 1, -limit)
	}

	var i = byteLength - 1
	var mul = 1
	var sub = 0
	this[offset + i] = value & 0xFF
	while (--i >= 0 && (mul *= 0x100)) {
		if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
			sub = 1
		}
		this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
	}

	return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
	value = +value
	offset = offset >>> 0
	if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
	if (value < 0) value = 0xff + value + 1
	this[offset] = (value & 0xff)
	return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
	value = +value
	offset = offset >>> 0
	if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
	this[offset] = (value & 0xff)
	this[offset + 1] = (value >>> 8)
	return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
	value = +value
	offset = offset >>> 0
	if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
	this[offset] = (value >>> 8)
	this[offset + 1] = (value & 0xff)
	return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
	value = +value
	offset = offset >>> 0
	if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
	this[offset] = (value & 0xff)
	this[offset + 1] = (value >>> 8)
	this[offset + 2] = (value >>> 16)
	this[offset + 3] = (value >>> 24)
	return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
	value = +value
	offset = offset >>> 0
	if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
	if (value < 0) value = 0xffffffff + value + 1
	this[offset] = (value >>> 24)
	this[offset + 1] = (value >>> 16)
	this[offset + 2] = (value >>> 8)
	this[offset + 3] = (value & 0xff)
	return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
	if (offset + ext > buf.length) throw new RangeError('Index out of range')
	if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
	value = +value
	offset = offset >>> 0
	if (!noAssert) {
		checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
	}
	ieee754.write(buf, value, offset, littleEndian, 23, 4)
	return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
	return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
	return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
	value = +value
	offset = offset >>> 0
	if (!noAssert) {
		checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
	}
	ieee754.write(buf, value, offset, littleEndian, 52, 8)
	return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
	return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
	return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
	if (!start) start = 0
	if (!end && end !== 0) end = this.length
	if (targetStart >= target.length) targetStart = target.length
	if (!targetStart) targetStart = 0
	if (end > 0 && end < start) end = start

	// Copy 0 bytes; we're done
	if (end === start) return 0
	if (target.length === 0 || this.length === 0) return 0

	// Fatal error conditions
	if (targetStart < 0) {
		throw new RangeError('targetStart out of bounds')
	}
	if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
	if (end < 0) throw new RangeError('sourceEnd out of bounds')

	// Are we oob?
	if (end > this.length) end = this.length
	if (target.length - targetStart < end - start) {
		end = target.length - targetStart + start
	}

	var len = end - start
	var i

	if (this === target && start < targetStart && targetStart < end) {
		// descending copy from end
		for (i = len - 1; i >= 0; --i) {
			target[i + targetStart] = this[i + start]
		}
	} else if (len < 1000) {
		// ascending copy from start
		for (i = 0; i < len; ++i) {
			target[i + targetStart] = this[i + start]
		}
	} else {
		Uint8Array.prototype.set.call(
			target,
			this.subarray(start, start + len),
			targetStart
		)
	}

	return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
	// Handle string cases:
	if (typeof val === 'string') {
		if (typeof start === 'string') {
			encoding = start
			start = 0
			end = this.length
		} else if (typeof end === 'string') {
			encoding = end
			end = this.length
		}
		if (val.length === 1) {
			var code = val.charCodeAt(0)
			if (code < 256) {
				val = code
			}
		}
		if (encoding !== undefined && typeof encoding !== 'string') {
			throw new TypeError('encoding must be a string')
		}
		if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
			throw new TypeError('Unknown encoding: ' + encoding)
		}
	} else if (typeof val === 'number') {
		val = val & 255
	}

	// Invalid ranges are not set to a default, so can range check early.
	if (start < 0 || this.length < start || this.length < end) {
		throw new RangeError('Out of range index')
	}

	if (end <= start) {
		return this
	}

	start = start >>> 0
	end = end === undefined ? this.length : end >>> 0

	if (!val) val = 0

	var i
	if (typeof val === 'number') {
		for (i = start; i < end; ++i) {
			this[i] = val
		}
	} else {
		var bytes = Buffer.isBuffer(val)
			? val
			: utf8ToBytes(new Buffer(val, encoding).toString())
		var len = bytes.length
		for (i = 0; i < end - start; ++i) {
			this[i + start] = bytes[i % len]
		}
	}

	return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
	// Node strips out invalid characters like \n and \t from the string, base64-js does not
	str = stringtrim(str).replace(INVALID_BASE64_RE, '')
	// Node converts strings with length < 2 to ''
	if (str.length < 2) return ''
	// Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
	while (str.length % 4 !== 0) {
		str = str + '='
	}
	return str
}

function stringtrim (str) {
	if (str.trim) return str.trim()
	return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
	if (n < 16) return '0' + n.toString(16)
	return n.toString(16)
}

function utf8ToBytes (string, units) {
	units = units || Infinity
	var codePoint
	var length = string.length
	var leadSurrogate = null
	var bytes = []

	for (var i = 0; i < length; ++i) {
		codePoint = string.charCodeAt(i)

		// is surrogate component
		if (codePoint > 0xD7FF && codePoint < 0xE000) {
			// last char was a lead
			if (!leadSurrogate) {
				// no lead yet
				if (codePoint > 0xDBFF) {
					// unexpected trail
					if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
					continue
				} else if (i + 1 === length) {
					// unpaired lead
					if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
					continue
				}

				// valid lead
				leadSurrogate = codePoint

				continue
			}

			// 2 leads in a row
			if (codePoint < 0xDC00) {
				if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
				leadSurrogate = codePoint
				continue
			}

			// valid surrogate pair
			codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
		} else if (leadSurrogate) {
			// valid bmp char, but last char was a lead
			if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
		}

		leadSurrogate = null

		// encode utf8
		if (codePoint < 0x80) {
			if ((units -= 1) < 0) break
			bytes.push(codePoint)
		} else if (codePoint < 0x800) {
			if ((units -= 2) < 0) break
			bytes.push(
				codePoint >> 0x6 | 0xC0,
				codePoint & 0x3F | 0x80
			)
		} else if (codePoint < 0x10000) {
			if ((units -= 3) < 0) break
			bytes.push(
				codePoint >> 0xC | 0xE0,
				codePoint >> 0x6 & 0x3F | 0x80,
				codePoint & 0x3F | 0x80
			)
		} else if (codePoint < 0x110000) {
			if ((units -= 4) < 0) break
			bytes.push(
				codePoint >> 0x12 | 0xF0,
				codePoint >> 0xC & 0x3F | 0x80,
				codePoint >> 0x6 & 0x3F | 0x80,
				codePoint & 0x3F | 0x80
			)
		} else {
			throw new Error('Invalid code point')
		}
	}

	return bytes
}

function asciiToBytes (str) {
	var byteArray = []
	for (var i = 0; i < str.length; ++i) {
		// Node's code seems to be doing this and not & 0x7F..
		byteArray.push(str.charCodeAt(i) & 0xFF)
	}
	return byteArray
}

function utf16leToBytes (str, units) {
	var c, hi, lo
	var byteArray = []
	for (var i = 0; i < str.length; ++i) {
		if ((units -= 2) < 0) break

		c = str.charCodeAt(i)
		hi = c >> 8
		lo = c % 256
		byteArray.push(lo)
		byteArray.push(hi)
	}

	return byteArray
}

function base64ToBytes (str) {
	return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
	for (var i = 0; i < length; ++i) {
		if ((i + offset >= dst.length) || (i >= src.length)) break
		dst[i + offset] = src[i]
	}
	return i
}

function isnan (val) {
	return val !== val // eslint-disable-line no-self-compare
}
var IntelHex = (function () {

	//Intel Hex record types
	const DATA               = 0,
	      END_OF_FILE        = 1,
	      EXT_SEGMENT_ADDR   = 2,
	      START_SEGMENT_ADDR = 3,
	      EXT_LINEAR_ADDR    = 4,
	      START_LINEAR_ADDR  = 5;

	const EMPTY_VALUE = 0xFF;

	return {
		/** intel_hex.parse(data)
		 `data` - Intel Hex file (string in ASCII format or Buffer Object)
		 `bufferSize` - the size of the Buffer containing the data (optional)

		 returns an Object with the following properties:
		 - data - data as a Buffer Object, padded with 0xFF
		 where data is empty.
		 - startSegmentAddress - the address provided by the last
		 start segment address record; null, if not given
		 - startLinearAddress - the address provided by the last
		 start linear address record; null, if not given
		 Special thanks to: http://en.wikipedia.org/wiki/Intel_HEX
		 */
		parseIntelHex: function (data, bufferSize) {
			if (data instanceof Buffer)
				data = data.toString("ascii");
			//Initialization
			var buf                 = new Buffer(bufferSize || 8192),
			    bufLength           = 0, //Length of data in the buffer
			    highAddress         = 0, //upper address
			    startSegmentAddress = null,
			    startLinearAddress  = null,
			    lineNum             = 0, //Line number in the Intel Hex string
			    pos                 = 0; //Current position in the Intel Hex string
			const SMALLEST_LINE = 11;
			while (pos + SMALLEST_LINE <= data.length) {
				//Parse an entire line
				if (data.charAt(pos++) != ":")
					throw new Error("Line " + (lineNum + 1) +
						" does not start with a colon (:).");
				else
					lineNum++;
				//Number of bytes (hex digit pairs) in the data field
				var dataLength = parseInt(data.substr(pos, 2), 16);
				pos += 2;
				//Get 16-bit address (big-endian)
				var lowAddress = parseInt(data.substr(pos, 4), 16);
				pos += 4;
				//Record type
				var recordType = parseInt(data.substr(pos, 2), 16);
				pos += 2;
				//Data field (hex-encoded string)
				var dataField    = data.substr(pos, dataLength * 2),
				    dataFieldBuf = new Buffer(dataField, "hex");
				pos += dataLength * 2;
				//Checksum
				var checksum = parseInt(data.substr(pos, 2), 16);
				pos += 2;
				//Validate checksum
				var calcChecksum = (dataLength + (lowAddress >> 8) +
					lowAddress + recordType) & 0xFF;
				for (var i = 0; i < dataLength; i++)
					calcChecksum = (calcChecksum + dataFieldBuf[i]) & 0xFF;
				calcChecksum = (0x100 - calcChecksum) & 0xFF;
				if (checksum != calcChecksum)
					throw new Error("Invalid checksum on line " + lineNum +
						": got " + checksum + ", but expected " + calcChecksum);
				//Parse the record based on its recordType
				switch (recordType) {
					case DATA:
						var absoluteAddress = highAddress + lowAddress;
						//Expand buf, if necessary
						if (absoluteAddress + dataLength >= buf.length) {
							var tmp = new Buffer((absoluteAddress + dataLength) * 2);
							buf.copy(tmp, 0, 0, bufLength);
							buf     = tmp;
						}
						//Write over skipped bytes with EMPTY_VALUE
						if (absoluteAddress > bufLength)
							buf.fill(EMPTY_VALUE, bufLength, absoluteAddress);
						//Write the dataFieldBuf to buf
						dataFieldBuf.copy(buf, absoluteAddress);
						bufLength           = Math.max(bufLength, absoluteAddress + dataLength);
						break;
					case END_OF_FILE:
						if (dataLength != 0)
							throw new Error("Invalid EOF record on line " +
								lineNum + ".");
						return {
							"data":                buf.slice(0, bufLength),
							"startSegmentAddress": startSegmentAddress,
							"startLinearAddress":  startLinearAddress
						};
						break;
					case EXT_SEGMENT_ADDR:
						if (dataLength != 2 || lowAddress != 0)
							throw new Error("Invalid extended segment address record on line " +
								lineNum + ".");
						highAddress = parseInt(dataField, 16) << 4;
						break;
					case START_SEGMENT_ADDR:
						if (dataLength != 4 || lowAddress != 0)
							throw new Error("Invalid start segment address record on line " +
								lineNum + ".");
						startSegmentAddress = parseInt(dataField, 16);
						break;
					case EXT_LINEAR_ADDR:
						if (dataLength != 2 || lowAddress != 0)
							throw new Error("Invalid extended linear address record on line " +
								lineNum + ".");
						highAddress = parseInt(dataField, 16) << 16;
						break;
					case START_LINEAR_ADDR:
						if (dataLength != 4 || lowAddress != 0)
							throw new Error("Invalid start linear address record on line " +
								lineNum + ".");
						startLinearAddress = parseInt(dataField, 16);
						break;
					default:
						throw new Error("Invalid record type (" + recordType +
							") on line " + lineNum);
						break;
				}
				//Advance to the next line
				if (data.charAt(pos) == "\r")
					pos++;
				if (data.charAt(pos) == "\n")
					pos++;
			}
			throw new Error("Unexpected end of input: missing or invalid EOF record.");
		}
	}
})();