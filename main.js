var http = require("http"); // node js 모듈
var fs = require("fs"); // node js 모듈
var url = require("url"); // node js 모듈
var qs = require("querystring");
var template = require("./lib/template.js");
var path = require("path");
var sanitizeHtml = require("sanitize-html");

var app = http.createServer(function(request, response) {
    var _url = request.url;
    var queryData = url.parse(_url, true).query; // 쿼리스트링 오브젝트
    var pathname = url.parse(_url, true).pathname;

    if (pathname === "/") {
        if (queryData.id === undefined) {
            fs.readdir("./data", function(err, filelist) {
                var title = "Welcome";
                var description = "Hello, Node.js";
                var list = template.list(filelist);
                var html = template.html(
                    title,
                    list,
                    `<h2>${title}</h2>${description}`,
                    `<a href="/create">create</a>`
                );

                response.writeHead(200);
                response.end(html);
            });
        } else {
            fs.readdir("./data", function(err, filelist) {
                var filteredId = path.parse(queryData.id).base; // .. 차단 base는 file 이름
                fs.readFile(`data/${filteredId}`, "utf8", function(
                    err,
                    description
                ) {
                    var title = queryData.id;
                    var sanitizedTitle = sanitizeHtml(title);
                    var sanitizedDescription = sanitizeHtml(description);
                    var list = template.list(filelist);
                    var html = template.html(
                        title,
                        list,
                        `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
                        `<a href="/create">create</a> 
                        <a href="/update?id=${sanitizedTitle}">update</a>
                        <form action="delete_process" method="post">
                            <input type="hidden" name="id" value="${sanitizedTitle}">
                            <input type="submit" value="delete">
                        </form>`
                    );

                    response.writeHead(200);
                    response.end(html);
                });
            });
        }
    } else if (pathname === "/create") {
        fs.readdir("./data", function(err, filelist) {
            var title = "WEB - create";
            var list = template.list(filelist);
            var html = template.html(
                title,
                list,
                `
                <form action="/create_process" method="post">
                    <p><input type="text" name="title" placeholder="title"></p>
                    <p>
                        <textarea name="description" placeholder="description"></textarea>
                    </p>
                    <p>
                        <input type="submit">
                    </p>
                </form>
                `,
                ""
            );

            response.writeHead(200);
            response.end(html);
        });
    } else if (pathname === "/create_process") {
        var body = "";

        // data 수신시에는 on data
        request.on("data", function(data) {
            body += data;

            if (body.length > 1e6) {
                request.connection.destroy();
            }
        });

        // data 수신이 끝나면 end 콜백 함수가 실행
        request.on("end", function() {
            var post = qs.parse(body); // qs는 query string 모듈
            var title = post.title;
            var description = post.description;
            var sanitizedTitle = sanitizeHtml(title);
            var sanitizedDescription = sanitizeHtml(description);
            fs.writeFile(
                `data/${sanitizedTitle}`,
                sanitizedDescription,
                "utf8",
                function(err) {
                    if (err) throw err;
                    response.writeHead(302, {
                        Location: `/?id=${sanitizedTitle}`
                    }); // 302 redirection
                    response.end();
                }
            );
        });
    } else if (pathname === "/update") {
        fs.readdir("./data", function(err, filelist) {
            var filteredId = path.parse(queryData.id).base; // .. 차단 base는 file 이름
            fs.readFile(`data/${filteredId}`, "utf8", function(
                err,
                description
            ) {
                var title = queryData.id;
                var sanitizedTitle = sanitizeHtml(title);
                var sanitizedDescription = sanitizeHtml(description);
                var list = template.list(filelist);
                var html = template.html(
                    title,
                    list,
                    `
                    <form action="/update_process" method="post">
                        <input type="hidden" name="id" value="${sanitizedTitle}">
                        <p><input type="text" name="title" placeholder="title" value="${sanitizedTitle}"></p>
                        <p>
                            <textarea name="description" placeholder="description">${sanitizedDescription}</textarea>
                        </p>
                        <p>
                            <input type="submit">
                        </p>
                    </form>
                    `,
                    `<a href="/create">create</a> <a href="/update?id=${sanitizedTitle}">update</a>`
                );

                response.writeHead(200);
                response.end(html);
            });
        });
    } else if (pathname === "/update_process") {
        var body = "";

        // data 수신시에는 on data
        request.on("data", function(data) {
            body += data;

            if (body.length > 1e6) {
                request.connection.destroy();
            }
        });

        // data 수신이 끝나면 end 콜백 함수가 실행
        request.on("end", function() {
            var post = qs.parse(body); // qs는 query string 모듈
            var title = post.title;
            var id = post.id;
            var description = post.description;
            var sanitizedTitle = sanitizeHtml(title);
            var sanitizedDescription = sanitizeHtml(description);
            fs.rename(`data/${id}`, `data/${sanitizedTitle}`, function(err) {
                if (err) throw err;
                fs.writeFile(
                    `data/${sanitizedTitle}`,
                    sanitizedDescription,
                    "utf8",
                    function(err) {
                        if (err) throw err;
                        response.writeHead(302, { Location: `/?id=${title}` }); // 302 redirection
                        response.end();
                    }
                );
            });
        });
    } else if (pathname === "/delete_process") {
        var body = "";
        // data 수신시에는 on data
        request.on("data", function(data) {
            body += data;

            if (body.length > 1e6) {
                request.connection.destroy();
            }
        });

        // data 수신이 끝나면 end 콜백 함수가 실행
        request.on("end", function() {
            var post = qs.parse(body); // qs는 query string 모듈
            var id = post.id;
            var filteredId = path.parse(id).base;
            fs.unlink(`data/${filteredId}`, function(err) {
                if (err) throw err;
                response.writeHead(302, { Location: `/` }); // 302 redirection
                response.end();
            });
        });
    } else {
        response.writeHead(404);
        response.end("Not found");
    }
});

app.listen(3000);
