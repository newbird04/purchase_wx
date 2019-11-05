//index.js
//获取应用实例
const app = getApp()
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
        if (operation == '0') url = '../addInvoice/addInvoice?preinvoice=' + utils.base64_decode(res.result); 
        if (operation == '1') url = '../ocrInvoice/ocrInvoice?preinvoice=' + utils.base64_decode(res.result); 
        wx.navigateTo({
          url: url
        })
      }
    })
  },
  checkInvoice: function (invoice) {
    try{
      invoice = JSON.parse(invoice);
      if (!(invoice && invoice.sessionid && invoice.customerId && invoice.billNo && invoice.merid)) {
        wx.showToast({
          title: '请扫描正确有效的预发票信息!',
          icon: 'none',
          duration: 3000
        });
        return false;
      }
    } catch(error){
      wx.showToast({
        title: '扫描预发票信息异常!',
        icon: 'none',
        duration: 3000
      });
      return false;
    }
    return true;
  }
})
