//index.js
//获取应用实例
const app = getApp()
Page({
  data: {
        
  },
  scan:function(e){
    wx.scanCode({
      success:function(res){
        console.log(res);
        wx.navigateTo({
          url: 'pages/addInvoice/addInvoice'
        })
      }
    })
  }
})
