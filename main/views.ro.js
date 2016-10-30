/**
 * Created by Andrew on 11.02.2015.
 */

//<editor-fold desc="----------------------Fiscal Page--------------------------------">

var GetDateTime = Backbone.View.extend({
    template: _.template($('#date-time').html()),
    render: function() {
        this.$el.html(this.template());
        var $this=this;
        $this.$('#date-group').hide();
        this.$("input[type=checkbox]").on("click",function(e){
            if ($this.$("input:checked").length) { $this.$('#date-group').hide();
            } else { $this.$('#date-group').show();
            }
        });
        return this;
    },
    getDate: function() {
        if (this.$("input:checked").length) return new Date();
        if (is_type['datetime-local'])
        //return this.$('#d')[0].valueAsDate; Chrome do not set valueAsDate for this type of input.
            var dt = new Date();
        return new Date(this.$('#d')[0].valueAsNumber+ dt.getTimezoneOffset()*60000);
        var d = getDate(this.$('#d')[0]);
        var t = getTime(this.$('#t')[0]);
        if (d && t) {
            d.setDate(d.getDate()+ t.getDate());
            return d;
        }
        return false;
    },
    getISODate: function() {
        var t = this.getDate();
        return t.getFullYear() +
            '-' + pad( t.getMonth() + 1 ) +
            '-' + pad( t.getDate() ) +
            'T' + pad( t.getHours() ) +
            ':' + pad( t.getMinutes() ) +
            ':' + pad( t.getSeconds() ) ;
    }
});

var FiscalPage = PageScreen.extend({
    initialize: function(args) {
        this.leftCol = new LeftColumn({ model:{modelIdx:args.no,
                models:[
                    {lnk:'#fm/fisc',name:'Fiscalization'},
                    {lnk:'#fm/time',name:'Time'},
                    {lnk:'#fm/reset',name:'Reset'}
                ]}}
        );
        this.page = args.page;
    }
});

var FiscDo = Backbone.View.extend({
    tagName:'div',
    className:'col-md-10',
    events:{
        'click #hd':'saveHdr',
        'click #tx':'saveTax',
        'click #fsc':'fiscalize'
    },
    render: function() {
        if (!this.header) this.header = new TableContainer({
            model: schema.get('Hdr'),
            tblMode:true,
            show:true
        });
        if (!this.taxes) this.taxes = new TableContainer({
            model: schema.get('Tax'),
            tblMode:true,
            show:true
        });
        this.$el.append(this.header.render().$el);
        this.$el.append(this.taxes.render().$el);
        var tmpl = "<button type='button' id='%s' class='btn btn-%s' data-loading-text='%s'>%s</button>\n";
        this.$el.append(_.reduce([
                ['hd','default',t('Wait...'),'Save Headers'],
                ['tx','default',t('Wait...'),'Save Taxes'],
                ['fsc','primary',t('Wait...'),'Fiscalize']],
            function(memo,el) {
                el[2] = t(el[2]);
                return memo+vsprintf(tmpl,el);
            },""
        ));
        return this;
    },
    checkTime: function(proc,e) {
        var ecrDate = ecrStatus.getTime();
        var currDate = new Date();
        ecrDate.setHours(0,0,0,0);
        currDate.setHours(0,0,0,0);
        if (ecrDate.valueOf()==currDate.valueOf()) {
            proc(e);
            return;
        }
        var modal = new Modal();
        modal.set({
            header:t('Date Warning!!!'),
            body: sprintf(t('<p>This operation will create fiscal record with date <b>%s</b></p>')+
                t('<p>So, ECR can not be used until this date. </p>')+
                t('<p>Are you sure to continue?</p>'),toStringDate(ecrDate))
        });
        modal.show();
        modal.waitClick({
            next:['Continue','danger'],
            cancel:'Close'
        }).always(function(btn){
            if (btn=='next') proc(e);
            modal.hide();
        });
    },
    saveHdr:function(e) {
        e.preventDefault();
        this.checkTime(this.doHdr,e);
        return false;
    },
    saveTax:function(e) {
        e.preventDefault();
        this.checkTime(this.doTax,e);
        return false;
    },
    fiscalize:function(e) {
        e.preventDefault();
        this.checkTime(this.doFisc,e);
        return false;
    },
    doHdr:function(e) {
        callProc({addr:'/cgi/proc/puthdrfm',btn: e.target/*'#hd'*/});
        //console.log('Save Hdr');
    },
    doTax:function(e) {
        callProc({addr:'/cgi/proc/puttaxfm',btn: e.target/*'#tx'*/});
        //console.log('Save Tax');
    },
    doFisc:function(e) {
        callProc({addr:'/cgi/proc/fiscalization',btn: e.target/*'#fsc'*/});
        //console.log('Fiscalize');
    }
});

var TimeForm = Backbone.View.extend({
    tagName:'div',
    className:'col-md-10',
    render: function() {
        if (this.timeView) {
            this.timeView.remove();
            delete this.timeView;
        }
        var eltxt = this.template();
        this.$el.html(eltxt);
        this.timeView = new GetDateTime();
        this.$('form').prepend(this.timeView.render().$el);
        return this;
    },
    remove: function() {
        Backbone.View.prototype.remove.apply(this, arguments);
        if (this.timeView) {
            this.timeView.remove();
            delete this.timeView;
        }
    }
});

var FiscTime = TimeForm.extend({
    template: _.template($('#fisc-time').html()),
    events: {
        'click button.btn-primary': 'setTime'
    },
    setTime: function(e) {
        e.preventDefault();
        console.log('setTime',this.timeView.getDate());
        callProc({addr:'/cgi/proc/setclock',btn: e.target},this.timeView.getISODate());
        return false;
    }
});

var FiscReset = TimeForm.extend({
    template: _.template($('#fisc-reset').html()),
    events: {
        'click button.btn-primary': 'doReset',
        'click button.btn-default': 'resetSD'
    },
    render: function() {
        TimeForm.prototype.render.apply(this, arguments);
        this.$('#receiptNo').val(ecrStatus.get('chkId'));
        this.$('#diNo').val(ecrStatus.get('CurrDI'));
        return this;
    },
    doReset: function(e) {
        e.preventDefault();
        //console.log('doReset',this.timeView.getDate(),this.$('#receiptNo').val(),this.$('#diNo').val());
        callProc({addr:'/cgi/proc/resetram',btn: e.target},this.$('#receiptNo').val(),this.timeView.getISODate(),this.$('#diNo').val());
        return false;
    },
    resetSD: function(e) {
        e.preventDefault();
        console.log('resetSD');
        callProc({addr:'/cgi/proc/resetmmc',btn: e.target});
        return false;
    }
});
//</editor-fold>
