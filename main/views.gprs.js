/**
 * Created by Andrew on 21.04.2015.
 */
//<editor-fold desc="----------------------Modem  Page--------------------------------">

var GPRSState = Backbone.View.extend({
    tagName:'div',
    template: _.template($('#gprs-state').html()),
    events:{
        'click #pwr':'pwr',
        'click #refr':'refr',
        'click #ussd':'ussd'
    },
    initialize: function() {
        this.model = new GPRSStatus();
        this.model.on('change',this.render,this);
    },
    remove: function() {
        this.$el.remove();
        this.stopListening();
        this.model.off('change',this.render,this);
        this.model.cancelTimer();
        delete this.model;
        return this;
    },
    render: function() {
        if(!_.isEmpty(this.model.attributes)) {
            var e = this.model.toJSON();
            e = this.template(e);
            this.$el.html(e);
        }
        return this;
    },
    pwr:function(e) {
        e.preventDefault();
        var btn = this.$('#pwr');
        btn.children('span').addClass('loading');
        btn.attr("disabled","disabled");
        var $this = this;
        $.getJSON('cgi/mdm_pwr')
            .always(function(){
                btn.children('span').removeClass('loading');
                btn.removeAttr("disabled");
            })
            .done(function(data){ $this.model.set($this.model.parse(data)); });
        return false;
    },
    refr:function(e) {
        e.preventDefault();
        var btn = this.$('#refr');
        btn.children('span').addClass('loading');
        this.model.refresh().always(function(){
            btn.children('span').removeClass('loading');
            btn.removeAttr("disabled");
        });
        return false;
    },
    ussd:function(e) {
        e.preventDefault();
        var $btn = this.$('#ussd').button('loading');
        var res = this.$('#ussd_res');
        res.text('');
        $.getJSON('cgi/mdm_ussd',{p:this.$('#gprs_txt').val()})
            .always(function(){$btn.button('reset');})
            .done(function(data){res.text(t(data.ussd_res))});
        return false;
    }
});

//</editor-fold>
