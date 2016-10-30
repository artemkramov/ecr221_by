/**
 * Created by Andrew on 12.02.2015.
 */
var ModemStatus = Backbone.Model.extend({
    url:'/cgi/status',
    fetch_ok:false,
    fetch_set:false,
    refresh: function() {
        var $this = this;
        this.fetch().always(function(x,txt) { $this.fetched.call($this,txt=='success')});
    },
    initialize: function() {
        this.refresh();
        events.on('tick',this.tick,this);
    },
    fetched: function(success) {
        this.fetch_ok = success;
        setTimeout(_.bind(this.refresh,this),15000);
    },
    tick: function() {
        if (!this.fetch_ok) return;
        if (this.fetch_set) {
            this.fetch_set = false;
            return;
        }
        var t = this.get('ct')-1;
        this.set('ct',(t>0)?t:0);
        var t = this.get('bt')-1;
        this.set('bt',(t>0)?t:0);
    }
});
