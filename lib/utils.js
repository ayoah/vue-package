var path = require('path');
var fs = require('fs');

var utils = new function () {
    var base = this;
    base.mkdirs = function (dirpath, mode, callback) {
        fs.exists(dirpath, function(exists) {
            if(exists) {
                callback(dirpath);
            } else {
                //尝试创建父目录，然后再创建当前目录
                base.mkdirs(path.dirname(dirpath), mode, function(){
                    fs.mkdir(dirpath, mode, callback);
                });
            }
        });
    };
};

exports.mkdirs  = utils.mkdirs;
