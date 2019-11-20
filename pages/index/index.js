Page({
  data: {
        
  },
  scan:function(e){
    var that = this;
  var operation = e.currentTarget.dataset.operation;
    wx.scanCode({
      success:function(res){
        if (!res || res == ''){
          wx.showToast({
            title: '未扫描到正常的预发票信息,请重新扫描!',
            icon: 'none',
            duration: 2000
          });
          return false;
        }
        var utils = require('../../utils/util.js');        
        var invoice = utils.base64_decode(res.result);
        if (!that.checkInvoice(invoice)) {
          return false;
        }
        var url = '';
        if (operation == '0') url = '../addInvoice/addInvoice?preinvoice=' + invoice; 
        if (operation == '1') url = '../ocrInvoice/ocrInvoice?preinvoice=' + invoice; 
        wx.navigateTo({
          url: url
        })
      }
    })
  },
  checkInvoice: function (invoice) {
    try{
      invoice = JSON.parse(invoice);
      if (!(invoice && invoice.sessionid && invoice.customerId && invoice.invoiceEntryType && invoice.merid)) {
        wx.showToast({
          title: '请确认扫描的二维码是否正确!',
          icon: 'none',
          duration: 3000
        });
        return false;
      }
    } catch(error){
      wx.showToast({
        title: '扫描二维码信息异常!',
        icon: 'none',
        duration: 3000
      });
      return false;
    }
    return true;
  }
})
