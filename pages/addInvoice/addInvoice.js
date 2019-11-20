import {JSEncrypt} from '../../utils/jsencrypt.js'
const app = getApp();
Page({
  /**
   * 页面的初始数据
   */
  data: {
    show: 0,
    hidden: true,
    // sessionid: '',
    // entryWay: '',
    // merid: '',
    // customerId: '',
    // preInvoiceNo: '',
    invoiceList: [
      // {
      //   certificateCode: '123',
      //   purchaseNo: '222',
      //   totalAmount: '22.34',
      //   purchaseDate: '2019.10.16'
      // },{
      //   certificateCode: '456',
      //   purchaseNo: '333',
      //   totalAmount: '16.778',
      //   purchaseDate: '2019.12.12'
      // }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    var jsonStr = options.preinvoice.replace(" ", "");
    if (typeof jsonStr != 'object') {
      jsonStr = jsonStr.replace(/\ufeff/g, "");
    }
    var list = JSON.parse(jsonStr);
    console.log(list);
    var invoiceEntryType = list.invoiceEntryType;
    if (invoiceEntryType == '1') {  //预发票补录模式
      this.setData({
        preInvoiceNo: list.preInvoiceNo,
        show: "1"
      })
    }
    this.setData({
      sessionid: list.sessionid,
      invoiceEntryType: list.invoiceEntryType,
      customerId: list.customerId,
      customerName: list.customerName,
      merid: list.merid,
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  },

  /**
   * 扫描二维码添加票据信息
   */
  addPurchase: function() {
    const invoiceList = this.data.invoiceList;
    if (invoiceList.length >= 10) {
      wx.showToast({
        title: '一批最多只能扫描十条票据',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    var that = this;
    wx.scanCode({
      success: function(res) {
        console.log(res.result);
        var invoiceInfo = res.result.split(",");
        if (!that.verifyInvoice(invoiceInfo)) {
          return false;
        }
        const invoice = {
          certificateCode: invoiceInfo[2],
          purchaseNo: invoiceInfo[3],
          excludTaxAmount: invoiceInfo[4],
          purchaseDate: invoiceInfo[5]
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
      }
    })
  },

  /**
   * 票据真伪初步校验
   */
  verifyInvoice: function(invoiceInfo) {
    if (!(invoiceInfo[2] && invoiceInfo[3] && invoiceInfo[4] && invoiceInfo[5] && invoiceInfo[5].length != 6)) {
      wx.showToast({
        title: '请确认是否为票据',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    return true;
  },

  /**
   * 删除已扫描票据信息
   */
  delPurchase: function(event) {
    var that = this;
    var purchaseNo = event.currentTarget.dataset.purchaseno;
    wx.showModal({
      title: '确定删除',

      success: function(res) {
        if (res.confirm) {
          var invoiceList = that.data.invoiceList;
          for (var i = 0; i < invoiceList.length; i++) {
            if (invoiceList[i].purchaseNo == purchaseNo) {
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
  savePurchase: function(event) {
    var that = this;
    var invoiceList = that.data.invoiceList;
    if (invoiceList.length <= 0) {
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

    var publicKey_pkcs1 = app.globalData.publicKey_pkcs1;

    var warMsg = '';
    if (operation == '0') warMsg = '确认保存已扫描的票据信息?';
    if (operation == '1') warMsg = '将提交已扫描的票据信息,提交后无法修改,是否确认提交?';
    wx.showModal({
      title: '温馨提示',
      content: warMsg,
      success: function(res) {
        that.setData({
          hidden: false
        });
        if (res.confirm) {
          //RSA加密处理
          var encryptor = new JSEncrypt();
          encryptor.setPublicKey(publicKey_pkcs1);
          let jsonStr = encryptor.encryptLong(JSON.stringify(that.data));
          console.log("加密结果：" + jsonStr);

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
              that.setData({
                hidden: true
              });
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
                  title: res.data.retMsg || '票据信息提交后台失败!',
                  icon: 'none',
                  duration: 2000
                })
              }
            },
            fail() {
              that.setData({
                hidden: true
              });
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

  },

})