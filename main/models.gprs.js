/**
 * Created by Andrew on 12.02.2015.
 */
var GPRSStatus = Backbone.Model.extend({
    url:'/cgi/mdm_info',
    timer:false,
    cancelTimer: function() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = false;
        }
    },
    refresh: function() {
        this.cancelTimer();
        var $this = this;
        return this.fetch().always(function(x,txt) { $this.fetched.call($this,txt=='success')});
    },
    initialize: function() { this.refresh(); },
    fetched: function(success) {
        this.timer = setTimeout(_.bind(this.refresh,this),this.get('state')==2?3000:120000);
    },
    parse: function(resp,options) {
        switch (resp.state) {
            case 0: resp.stateTxt=t('Off'); break;
            case 1: {
                resp.stateTxt=t('On');
                if (resp.sign==99) {
                    resp.sign = 0;
                    resp.signTxt = t("Not detect");
                } else resp.signTxt = "" + (-113 + 2 * resp.sign) + " dBm";
                if (resp.err==99) {
                    resp.err = 0;
                    resp.errTxt =  t("Not detect");
                } else {
                    var prefix = "";
                    if (resp.err == 0) { prefix = "<";
                    } else if (resp.err==7) { prefix=">" }
                    resp.errTxt = prefix + Math.pow(2,resp.err+1)/10 + "%";
                }
                resp.oper = resp.oper || t('Unknown');
                resp.num  = resp.num  || t('Unknown');
            } break;
            case 2: resp.stateTxt=t('Switching on ...'); break;
            case 3: resp.stateTxt=t('Power on error. Power off.'); break;
            default:resp.stateTxt=t('Unknown state.');
        }
        return resp;
    }
});
