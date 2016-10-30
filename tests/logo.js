/**
 * Created by Andrew on 28.04.2015.
 */
// sRGB luminance(Y) values
rY = 0.212655;
gY = 0.715158;
bY = 0.072187;

// Inverse of sRGB "gamma" function. (approx 2.2)
function inv_gam_sRGB(ic) {
    var c = ic/255.0;
    if ( c <= 0.04045 ) return c/12.92;
    else                return Math.pow(((c+0.055)/(1.055)),2.4);
}

// sRGB "gamma" function (approx 2.2)
function gam_sRGB(v) {
    if(v<=0.0031308) v *= 12.92;
    else             v = 1.055*Math.pow(v,1.0/2.4)-0.055;
    return Math.round(v*255);
}

// GRAY VALUE ("brightness")
function gray(r, g, b) {
    return gam_sRGB(rY*inv_gam_sRGB(r) + gY*inv_gam_sRGB(g) + bY*inv_gam_sRGB(b));
}

(function($){
    var LogoView = Backbone.View.extend({
        el: "#content",
        img:new Image(),
        imgX:0,
        imgY:0,
        width:0,
        height:0,
        mX:-1,
        mY:-1,
        events:{
            'click #ld':'loadECR',
            'click #lf': 'clickFile',
            'change #picFile':'loadFile',
            'click #sd':'save',
            'click #clr':'clear',
            'click #gr':'grayscale',
            'click #bw':'blackWhite',
            'mousedown canvas': 'mdown',
            'mouseup canvas': 'mup',
            'mousemove canvas': 'mmove',
            'change #edge': 'changeBW'
        },

        changeBW: function(e) {
            e.preventDefault();
            this.toBW(this.$('#edge').val());
            return false;
        },
        toBW: function(c) {
            var pixels = this.context.getImageData(0,0,this.width,this.height);
            for (var i = 0, n = this.grpix.data.length; i < n;   i += 4) {
                var gr = (c>this.grpix.data[i])?0:255;
                pixels.data[i+0] = gr;
                pixels.data[i+1] = gr;
                pixels.data[i+2] = gr;
            }
            this.context.putImageData(pixels, 0, 0);
        },

        mdown: function(e) {
            e.preventDefault();
            this.mX = e.pageX;
            this.mY = e.pageY;
            return false;
        },
        mup: function(e) {
            e.preventDefault();
            this.mX = -1;
            this.mY = -1;
            this.edittype = this.imgtype;
            this.updateWarning();
            return false;
        },
        mmove: function(e) {
            e.preventDefault();
            if (this.mX==-1) return;
            this.imgX+= e.pageX-this.mX;
            this.imgY+= e.pageY-this.mY;
            this.mX = e.pageX;
            this.mY = e.pageY;
            this.context.fillRect(0,0,this.width,this.height);
            this.context.drawImage(this.img, this.imgX, this.imgY);
            return false;
        },
        loadECR: function(e) {
            e.preventDefault();
            if (this.img.src != '/tests/logo.bmp') {
                this.clicked = $(e.target);
                this.clicked.button('loading');
                this.img.src = '/tests/logo.bmp';
            }
            return false;
        },
        clickFile: function(e) {
            e.preventDefault();
            this.$('#picFile').click();
            return false;
        },
        loadFile: function(e) {
            e.preventDefault();
            this.clicked = $('#lf');
            this.clicked.button('loading');
            var selectedFile = e.target.files[0];
            var reader = new FileReader();
            this.img.title = selectedFile.name;
            var $this = this;
            reader.onload = function(event) { $this.img.src = event.target.result; };
            reader.readAsDataURL(selectedFile);
            return false;
        },
        save: function(e) {
            e.preventDefault();
            if (this.width % 8) {
                this.error("BMP width not supported");
                return;
            }
            var bmpInBytes = Math.floor(this.width/8);
            var bmpRowWidth = bmpInBytes;
            if (bmpInBytes%4) bmpRowWidth = 4*(Math.floor(bmpInBytes/4) + 1);
            var data = new ArrayBuffer(0x3E+bmpRowWidth*this.height);
            var view = new DataView(data);
            var bytes = new Uint8Array(data);
            view.setUint16(0,0x4D42, true);
            view.setUint32(2,0x3E+bmpRowWidth*this.height,true);
            view.setUint32(6,0,true);
            view.setUint32(0x0A,0x3E,true);
            view.setUint32(0x0E,40,true);
            view.setUint32(0x12,this.width,true);
            view.setInt32(0x16,-this.height,true);
            view.setUint16(0x1A,1,true);
            view.setUint16(0x1C,1,true);
            view.setUint32(0x1E,0,true);
            view.setUint32(0x22,bmpRowWidth*this.height,true);
            view.setUint32(0x26,3708,true);
            view.setUint32(0x2A,3708,true);
            view.setUint32(0x2E,0,true);
            view.setUint32(0x32,0,true);
            view.setUint32(0x36,0,true);
            view.setUint32(0x3A,0xFFFFFF,true);
            var pixels = this.context.getImageData(0,0,this.width,this.height);
            for (var row = 0; row<this.height; row++) {
                for (var b = 0; b<bmpRowWidth; b++) {
                    var bt = 0;
                    if (b<bmpInBytes) {
                        for (var i = 0; i<8; i++) {
                            var offs = (row*this.width+b*8+i)*4;
                            var val = pixels.data[offs];
                            if ((val!=pixels.data[offs+1]) || (val!=pixels.data[offs+2])) {
                                this.error("The image is not monochrome");
                                return;
                            }
                            if ((val!=0) && (val!=255)) {
                                //console.log('bit value ', val);
                                this.error("The image is not monochrome");
                                return;
                            }
                            if (val == 255) bt |= 1<<(7-i);
                        }
                    } else bt = 0xFF;
                    view.setUint8(0x3E+row*bmpRowWidth+b,bt);
                }
            }
            $.ajax({
                method:'POST',
                url:'/tests/logo.bmp',
                contentType:'image/bmp',
                processData:false,
                data:bytes
            }).done(function(resp){
                if (resp.err) { console.log('error',resp.err);
                } else console.log('success');
            }).fail(function(){console.log('error');});
            //console.log(bytes);
            return false;
        },
        clear: function(e) {
            e.preventDefault();
            this.img.src = '';
            this.context.fillRect(0,0,this.width,this.height);
            this.edittype="none";
            this.imgtype="none";
            return false;
        },
        grayscale: function(e) {
            e.preventDefault();
            var pixels = this.context.getImageData(0,0,this.width,this.height);
            for (var i = 0, n = pixels.data.length; i < n;   i += 4) {
                var gr = gray(pixels.data[i],pixels.data[i+1],pixels.data[i+2]);
                pixels.data[i]   = gr;
                pixels.data[i+1] = gr;
                pixels.data[i+2] = gr;
            }
            this.context.putImageData(pixels, 0, 0);
            this.edittype="gray";
            this.updateWarning();
            return false;
        },
        blackWhite: function(e) {
            e.preventDefault();
            this.grpix = this.context.getImageData(0,0,this.width,this.height);
            var tbl = new Array();
            for (var i=0;i<256;i++) tbl.push(0);
            for (var i = 0, n = this.grpix.data.length; i < n;   i += 4) tbl[this.grpix.data[i]]+=1;
            var min = 1;
            var max = 255;
            var s = 0;
            while(min<max) {
                if (s>0) {
                    s-=min*tbl[min];
                    min++;
                } else {
                    s+=(255-max)*tbl[max];
                    max--;
                }
            }
            this.toBW(min);
            this.edittype="bw";
            this.updateWarning();
            this.$('#edge').val(min);
            return false;
        },
        error: function(msg) {
            this.$('.alert-warning').remove();
            var err = this.$(".alert");
            if (err.length==0) {
                err = $('<div class="alert alert-danger" role="alert"></div>');
                this.$el.append(err);
            }
            err.html(msg);
        },
        updateWarning: function() {
            this.$('.alert-danger').remove();
            if (this.edittype=="bw") {
                this.$(".alert").remove();
                return;
            }
            var warn = this.$(".alert");
            if (warn.length==0) {
                warn = $('<div class="alert alert-warning" role="alert"></div>');
                this.$el.append(warn);
            }
            var msg = "<b>This is color image.</b> Convert it to grayscale before save to device.";
            if (this.edittype=="gray") {
                msg = "<b>This is grayscale image.</b> Convert it to black&white before save to device and adjust the white point if nessesary.";
                this.$('#gr').tooltip('hide');
                this.$('#bw').tooltip('show');
            } else {
                this.$('#bw').tooltip('hide');
                this.$('#gr').tooltip('show');
            }
            warn.html(msg);
        },
        initialize: function(){
            _.bindAll(this, 'render','imageInit','imageLoad','mdown','mup','mmove');
            this.img.onload=this.imageInit;
            this.img.src = '/tests/logo.bmp';
        },
        imageInit: function() {
            this.width  = this.img.width;
            this.height = this.img.height;
            this.img.onload=this.imageLoad;
            this.render();
        },
        imageLoad: function() {
            this.imgX=0;
            this.imgY=0;
            this.context.drawImage(this.img, 0, 0);
            if (this.clicked) {
                this.clicked = this.clicked.button('reset');
                this.clicked = false;
            }
            this.edittype=this.imageType();
            this.imgtype = this.edittype;
            this.updateWarning();
        },
        imageType: function() {
            var ret = "bw";
            var pixels = this.context.getImageData(0,0,this.width,this.height);
            for (var i = 0, n = pixels.data.length; i < n;   i += 4) {
                if ((pixels.data[i]!=pixels.data[i+1])||(pixels.data[i]!=pixels.data[i+2])) return "color";
                if ((pixels.data[i]!=0)&&(pixels.data[i]!=255)) {
                    console.log(pixels.data[i]);
                    ret = "gray";
                }
            }
            return ret;
        },
        render: function(){
            var root = $('<div class="row"></div>');
            this.$el.html("");
            this.$el.append(root);
            var canvas = $('<canvas>').attr({width:this.width,height:this.height})
                .addClass('img-thumbnail').css("margin","10px");
            root.append($('<div class=" col-md-3"></div>').append(canvas));
            this.context = canvas[0].getContext('2d');
            this.context.fillStyle="white";
            this.imageLoad();
            var tmpl = ['<button type="button" id="','" class="btn btn-','" data-loading-text="',
                '" data-toggle="tooltip" title="','"><span class="glyphicon glyphicon-','" aria-hidden="true"></span> ','</button>'];
            var cnt = 0;
            root.append(
                _.reduce([
                    ['ld','default','Wait...','Load logo from ECR','open','Load ECR'],
                    ['lf','default','Wait...','Import logo from file','open-file','Load File'],
                    ['sd','default','Wait...','Save logo to ECR','save','Save'],
                    ['clr','default','Wait...','Clear logo content','remove','Clear'],
                    ['gr','default','Wait...','Grayscale colorful logo','picture','Gray'],
                    ['bw','default','Wait...','Black&white grayscale logo','adjust','B&W']],
                function(memo,el) {
                    var txt="";
                    if ((cnt%2)==0) txt = '<div class="btn-group col-md-3" role="group">';
                    txt+=_.flatten(_.zip(tmpl,el)).join('');
                    if (cnt%2) txt += '</div>';
                    cnt++;
                    return memo + txt;
                },""
                )
            );
            var inpf = $('<input id="picFile" type="file"/>').css('display',"none");
            root.append(inpf);
            this.$el.append('<div class="row"><div class="col-md-12"><input id="edge" type="range" min="1" max="254" data-toggle="tooltip" title="Adjust white point of image"/></div></div>');
            this.$('button').css("margin-top",'15px');
            this.$('[data-toggle="tooltip"]').tooltip({placement:'bottom'});
            return this;
        }
    });

    new LogoView();
})(jQuery);