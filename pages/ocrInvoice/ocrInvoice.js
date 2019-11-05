Page({

  /**
   * 页面的初始数据
   */
  data: {
    filePath:"",
    sessionid: '',
    customerId: '',
    preInvoiceNo: '',
    merid: '',
    invoiceList: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var jsonStr = options.preinvoice.replace(" ", "");
    if (typeof jsonStr != 'object') {
      jsonStr = jsonStr.replace(/\ufeff/g, "");
    }
    var list = JSON.parse(jsonStr);
    console.log(list);
    this.setData({
      sessionid: list.sessionid,
      customerId: list.customerId,
      preInvoiceNo: list.billNo,
      merid: list.merid,
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  
  /**
   * 拍照进行orc识别发票
   */
  ocrPurchase: function () {
    const invoiceList = this.data.invoiceList;
    if(invoiceList.length>=10){
      wx.showToast({
        title: '一批最多只能扫描十条票据',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    wx.showLoading({
      title: '识别中,请稍等...',
    })
    var that = this;
    wx.chooseImage({
      count:1,  //最多可以选择的图片张数，1张
      sizeType: [ 'original'],// original 原图，compressed 压缩图，默认二者都有
      sourceType: ['camera','album'], // album 从相册选图，camera 使用相机，默认二者都有
      success: function (res) {
        console.log(res);
        var filePathstr = res.tempFilePaths[0];
        wx.compressImage({
          src: filePathstr, // 图片路径
          quality: 20, // 压缩质量
          success: function (res) {
            console.log(res.tempFilePath)
            wx.uploadFile({
              url: "https://gyj1.dccnet.com.cn/purchase/~main/ocrRequest.php", //此处为实际接口地址
              filePath: res.tempFilePath, //获取图片路径      
              name: 'file',
              success: function (res) {
                wx.hideLoading();
                var data = JSON.parse(res.data);
                if (data.retCode == '200') {
                  const invoice = {
                    certificateCode: data.certificateCode,
                    purchaseNo: data.purchaseNo,
                    excludTaxAmount: data.excludTaxAmount,
                    purchaseDate: data.purchaseDate,
                    filePath: data.filePath,
                    img: filePathstr
                  }
                  var invoiceList = that.data.invoiceList;
                  for (var i = 0; i < invoiceList.length; i++) {
                    if (invoiceList[i].purchaseNo == invoice.purchaseNo) {
                      wx.showToast({
                        title: '该票据已扫描,请勿重复扫描!',
                        icon: 'none',
                        duration: 2000
                      });
                      return false;
                    }
                  }
                  var invoiceList = that.data.invoiceList;
                  invoiceList.push(invoice);

                  that.setData({
                    invoiceList: invoiceList
                  })

                } else {
                  wx.showToast({
                    title: data.retMsg,
                    icon: 'none',
                    duration: 2000
                  })
                }
              },
              fail: function (res) {
                console.log(res.errMsg);
                wx.hideLoading()
                wx.showToast({
                  title: 'ocr识别失败，请重新拍照',
                  icon: 'none',
                  duration: 2000
                })
              },
            })
          }
        })
        

    
      }, fail: function () {
        wx.hideLoading();
      },
      complete: function () {
        
      }
    })
  },
  previewImg: function (e) {
    console.log(e.currentTarget.dataset.index);
    var imgArr = [];
    var index = e.currentTarget.dataset.index;
    var invoiceList = this.data.invoiceList;
    for (var i = 0; i < invoiceList.length; i++) {
      imgArr.push(invoiceList[i].img);
    }
    wx.previewImage({
      current: invoiceList[index].img,     //当前图片地址
      urls: imgArr,               //所有要预览的图片的地址集合 数组形式
      success: function (res) { },
      fail: function (res) { },
      complete: function (res) { },
    })
  },

  /**
   * 票据真伪初步校验
   */
  verifyInvoice: function (invoiceInfo){
    return true;
  },

  /**
   * 删除已扫描票据信息
   */
  delPurchase: function (event) {
    var that = this;
    var purchaseNo = event.currentTarget.dataset.purchaseno;
    wx.showModal({
      title: '确定删除',
     
      success: function (res) {
        if (res.confirm) {
          var invoiceList = that.data.invoiceList;
          for(var i=0;i<invoiceList.length;i++){
            if (invoiceList[i].purchaseNo==purchaseNo){
              invoiceList.splice(i, 1);
            }
            that.setData({
              invoiceList: invoiceList
            })
          }
        }
      }
    })
  },

  /**
   * 保存已扫描票据信息
   */
  savePurchase: function (event) {
    var that = this;
    var invoiceList = that.data.invoiceList;
    if(invoiceList.length<=0){
      wx.showToast({
        title: '请先扫描添加票据信息',
        icon: 'none',
        duration: 2000
      });
      return false;
    }

    var operation = event.currentTarget.dataset.operation;
    that.setData({
      operation: operation
    });
    var warMsg = '';
    if (operation == '0') warMsg = '确认保存已识别的票据信息到该预发票?';
    if (operation == '1') warMsg = '将提交该票据信息至核心企业,提交后已识别的票据信息无法修改,是否确认提交?';
    wx.showModal({
      title: '温馨提示',
      content: warMsg,
      success: function (res) {
        if (res.confirm) {
          var utils = require('../../utils/util.js');
          var jsonStr = utils.base64_encode(JSON.stringify(that.data));
          // var jsonStr = JSON.stringify(that.data);
          wx.request({
            url: 'https://gyj1.dccnet.com.cn/purchase/~main/wxRequest.php',
            data: {
              jsonStr: jsonStr,
              sessionid: that.data.sessionid
            },
            header: {

              'content-type': 'application/json'
            },
            success(res) {
              // res = JSON.parse(res);
              console.log(res.data);
              if (res.data.retCode == '200') {
                wx.showModal({
                  title: '操作成功',
                  content: '请刷新电脑端页面查看最终操作结果',
                  showCancel: false,
                  success: function (res) {
                    if (res.confirm) {
                      wx.navigateTo({
                        url: '../index/index'
                      })
                    }

                  } 
                });
              } else {
                wx.showToast({
                  title: res.data.retMsg||'票据信息提交后台失败!',
                  icon: 'none',
                  duration: 4000
                })
              }
            },
            fail() {
              wx.showToast({
                title: '请求失败,请联系管理员!',
                icon: 'none',
                duration: 2000
              })
            }
          })
        } else if (res.cancel) {
          return;
        }
      }
    })
    
  }
})