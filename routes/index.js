var svnBase = "https://192.168.40.82/svn/vueDemo/";
var svnTrunk = svnBase + 'trunk/';
var svnTags = svnBase + 'tags/';
var express = require('express'),
    path = require('path'),
    child_process = require('child_process'),
    utils = require('../lib/utils');
var router = express.Router();
var repoDir = path.join(path.resolve(__dirname, '../'), 'svn-versions');


//首页
router.get('/', function(req, res, next) {
    res.render('index');
});

/* build页面 */
router.post('/build', function(req, res, next) {
    res.header('Content-Type','text/html;charset=utf-8');
    if(req.body.trunkVersion &&
        req.body.tagVersion &&
        req.body.tagRefs &&
        req.body.svnUserName &&
        req.body.svnPassWord) {

        var time = Date.now().toString();//当前时间戳
        var currentVPath = path.join(repoDir, time);//checkout目录

        //svn相关
        var version = req.body.trunkVersion;
        var refs = 'refs ' + req.body.tagRefs + '<'+time+'>';
        var svnAuth = ' --non-interactive ' +
            '--no-auth-cache --username=' +
            req.body.svnUserName +
            ' --password=' + req.body.svnPassWord;

        //每次打包创建新的文件夹
        utils.mkdirs(currentVPath, '0755', function() {
            console.log('done');
        });
        res.write('<p style="color:green">创建目录成功' + currentVPath + '</p></br>');

        //佛祖保佑
        res.write('<img src="https://ss0.bdstatic.com/94oJfD_bAAcT8t7mm9GUKT-xh_/timg?image&quality=100&size=b4000_4000&sec=1481863614&di=bd2a44804d423bf1a16a876035544159&src=http://android-artworks.25pp.com/209/5830353_1400054277.png"/><br/>' , 'utf-8');

        //checkout
        var co = child_process.exec('svn co ' + svnTrunk + ' ' + currentVPath + ' ' + '-r' + ' ' + version + svnAuth)
        co.stdout.on('data', function(data) {
            res.write(data + '</br>', 'utf-8');
        });
        co.stderr.on('data', function(data) {
            res.write('<p style="color:red">' + data + '</p>' + '</br>', 'utf-8');
            res.write('<script type="text/javascript">alert("打包失败")</script>');
            res.status(200).end();
        });
        co.on('exit', function(code) {
            if(code) {
                res.write('<p style="color:red">代码检出错误！</p></br>', 'utf-8');
                res.write('<script type="text/javascript">alert("打包失败")</script>');
                res.status(200).end();
            } else {
                res.write('<p style="color:green">=========svn 版本r' + version + '检出成功=========</p>');

                //npm安装依赖
                var npmInstall = child_process.exec('ln -s /opt/vue/node_modules ' + currentVPath);
                npmInstall.stdout.on('data', function (data) {
                    res.write(data.replace(/\n/g, "<br />") + '<br>', 'utf-8');
                });
                npmInstall.stderr.on('data', function (data) {
                    res.write('<p style="color:red">' + data + '</p>' + '</br>', 'utf-8');
                });
                npmInstall.on('exit', function (code) {
                    if (code) {
                        res.write('<p style="color:red">安装依赖包时候出错</p></br>', 'utf-8');
                        res.write('<script type="text/javascript">alert("打包失败")</script>');
                        res.status(200).end();
                    } else {
                        res.write('<p style="color:green">=========安装依赖包成功=========</p>' + '</br>', 'utf-8');

                        //开始打包
                        var build = child_process.exec('cd ' + currentVPath + ' && npm run build')
                        build.stdout.on('data', function (data) {
                            res.write(data.replace(/\n/g, "<br />") + '</br>', 'utf-8');
                        });
                        build.stderr.on('data', function (data) {
                            res.write('<p style="color:red">' + data + '</p>' + '</br>', 'utf-8');
                        });
                        build.on('exit', function (code) {
                            if (code) {
                                res.write('<p style="color:red">wepack打包时候出错</p></br>', 'utf-8');
                                res.write('<script type="text/javascript">alert("打包失败")</script>');
                                res.status(200).end();
                            } else {
                                res.write('<p style="color:green">=========build done=========</p></br>');

                                //tag
                                var makeTag = child_process.exec('cd ' +
                                    currentVPath + ' && svn add dist ' +
                                    svnAuth +
                                    ' && svn copy dist ' +
                                    svnTags + '/release-' + req.body.tagVersion +
                                    ' -m "' + refs + '"' +
                                    svnAuth)
                                makeTag.stdout.on('data', function (data) {
                                    if(data !== '.') {
                                        res.write(data + '</br>', 'utf-8');
                                    }
                                });
                                makeTag.stderr.on('data', function (data) {
                                    res.write(data + '</br>', 'utf-8');
                                });
                                makeTag.on('exit', function (code) {
                                    if (code) {
                                        res.write('<p style="color:red">=========tag失败=========<</p>/br>');
                                        res.write('<script type="text/javascript">alert("打包失败")</script>');
                                        res.status(200).end();
                                    } else {
                                        res.write('<p style="color:green">=========tag包提交成功=========</p></br>');
                                        res.write('<script type="text/javascript">alert("打包成功")</script>');
                                        res.status(200).end();
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    } else {
        res.send('输入参数错误！！');
    }
});



module.exports = router;
