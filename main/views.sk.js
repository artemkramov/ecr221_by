/**
 * Created by Andrew on 13.02.2015.
 */
var FiscalPage = Backbone.View.extend({
    events:{
        'blur #from':'validateInput',
        'blur #to':'validateInput',
        'change #query-type':'change',
        'click button':'click'
    },
    template: _.template($('#fiscal-view').html()),
    render: function() {
        this.$el.html( this.template() );
        this.switchFields(this.$('#query-type').is(':checked'));
        return this;
    },
    initFT:function() {
        if (!('from' in this)) {
            this.from = fiscalCell.get('firstRep');
            this.to = fiscalCell.get('lastRep');
            this.fromDate = fiscalCell.get('firstTime');
            this.toDate = fiscalCell.get('lastTime');
        }
    },
    setDateFields:function () {
        this.initFT();
        var attr = is_type['date']?{type:'date'}:{type:'text',pattern:"\\d{2}-\\d{2}-\\d{4}"}
        setDate(this.$('#from').attr(attr)[0],this.fromDate);
        setDate(this.$('#to').attr(attr)[0],this.toDate);
    },
    setNumberFields:function () {
        this.initFT();
        var attr = is_type['number']?{type:'number',min:fiscalCell.get('firstRep'),max:fiscalCell.get('lastRep')}:{type:'text',pattern:"\\d{4}"};
        this.$('#from').attr(attr).val(this.from);
        this.$('#to').attr(attr).val(this.to);
    },
    change: function(ev) { this.switchFields(ev.target.checked);},
    switchFields: function(isD) {
        if (isD) { this.setDateFields();
        } else { this.setNumberFields();
        }
    },
    getDate:function (e) {
        var val = getDate(e);
        var zMinDate = fiscalCell.get('firstTime');
        var zMaxDate = fiscalCell.get('lastTime');
        if (val) {
            if (val<zMinDate) {
                val=zMinDate;
                if (is_type['date']) { e.valueAsDate = zMinDate;
                } else {e.value=toStringDate(zMinDate);
                }
            }
            if (val>zMaxDate) {
                val=zMaxDate;
                if (is_type['date']) { e.valueAsDate = zMaxDate;
                } else {e.value=toStringDate(zMaxDate);
                }
            }
        }
        return val;
    },
    getNumber: function (e) {
        var value=getNumber(e);
        var zMin=fiscalCell.get('firstRep');
        var zMax=fiscalCell.get('lastRep');
        if (value) {
            if (value<zMin) {value=e.valueAsNumber=zMin;}
            if (value>zMax) {value=e.valueAsNumber=zMax;}
        }
        return value;
    },
    validateInput:function(e){
        var elem = e.target;
        var isFrom = elem.id=='from';
        var elemNext = this.$(isFrom?'#to':'#from')[0];
        var value=false;
        var date_format = elem.type;
        if (date_format=="text") {
            date_format = this.$('#query-type').is(':checked');
        } else date_format = date_format=="date";
        var valid = (!('validity' in elem)) || elem.checkValidity();
        if (valid) {
            var valueNext = false;
            if (date_format) {
                value = this.getDate(elem);
                valueNext = this.getDate(elemNext);
            } else {
                value = this.getNumber(elem);
                valueNext = this.getNumber(elemNext);
            }
            valid = value;
        }
        if (valid) {
            if (isFrom) {
                if (value>valueNext) {
                    elem.value=elemNext.value;
                }
                if (date_format) {this.fromDate=this.getDate(elem);
                } else {this.from=this.getNumber(elem);
                }
            } else {
                if (value<valueNext) {
                    elem.value=elemNext.value;
                }
                if (date_format) {this.toDate=this.getDate(elem);
                } else {this.to=this.getNumber(elem);
                }
            }
            $(elem).parents('.form-group').addClass('has-success').removeClass('has-error');
        } else {
            $(elem).parents('.form-group').removeClass('has-success').addClass('has-error');
        }
    },
    click:function(ev) {
        var e = $(ev.target).data('ev');
        ev.preventDefault();
        if ((e=='full')||(e=='short')) {
            var addr = '/cgi/fiscmem?';
            if (this.$('#query-type').is(':checked')) { // send date
                addr+='fd='+toStringDate(getDate(this.$('#from')[0]),'ymd')+'&td='+toStringDate(getDate(this.$('#to')[0]),'ymd');
            } else { //send numbers
                addr+='fn='+this.$('#from').val()+'&tn='+this.$('#to').val();
            }
            if (e=='short') addr+='&short';
            var $this = this;
            $.get(addr).done(function(resp,status,xhr){
                $this.$('#fmrep').text(resp);
                $this.$('.alert').remove();
                $this.$('#save').prop('disabled',false);
            }).fail(function(xhr,status,resp){
                $this.$('#save').prop('disabled',true);
                $this.$('#fmrep').empty();
                if (xhr.status==406) {
                    $this.$el.append(formatAlert(t('Enter the FM reading mode')));
                } else {
                    $this.$el.append(formatAlert(xhrError(xhr)));
                }
            });
        } else if (e=='save') {
            this.$('#dwl').attr('href',window.URL.createObjectURL(new Blob([this.$("#fmrep").html()])))[0].click();
        }
        return false;
    }
});
